const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/SAM/Documents/Antigravity/Englabs Projects/src';
const baseDir = 'c:/Users/SAM/Documents/Antigravity/Englabs Projects';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Match all import and export ... from '...'
    const importRegex = /(import|export)\s+([^'"]*)\s+from\s+['"](\.[^'"]+)['"]/g;
    
    content = content.replace(importRegex, (match, type, importsStr, relPath) => {
        const absoluteImportPath = path.resolve(path.dirname(file), relPath);
        
        let newImportPath = relPath;
        const relativeToBase = path.relative(baseDir, absoluteImportPath).replace(/\\/g, '/');
        
        const aliases = [
            { prefix: 'src/lib/services/', alias: '@services/' },
            { prefix: 'src/lib/domain/', alias: '@domain/' },
            { prefix: 'src/lib/config/', alias: '@config/' },
            { prefix: 'src/lib/', alias: '@lib/' },
            { prefix: 'src/components/common/', alias: '@common/' },
            { prefix: 'src/components/features/', alias: '@features/' },
            { prefix: 'src/components/', alias: '@components/' },
            { prefix: 'src/', alias: '@/' },
            { prefix: 'data/', alias: '@data/' }
        ];

        for (const {prefix, alias} of aliases) {
            if (relativeToBase.startsWith(prefix)) {
                newImportPath = alias + relativeToBase.slice(prefix.length);
                break;
            } else if (relativeToBase === prefix.slice(0, -1)) {
                newImportPath = alias.slice(0, -1);
                break;
            }
        }

        if (newImportPath !== relPath) {
            return match.replace(/from\s+['"](\.[^'"]+)['"]/, 'from \'' + newImportPath + '\'');
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
});

console.log('Refactored imports in ' + changedFiles + ' files.');

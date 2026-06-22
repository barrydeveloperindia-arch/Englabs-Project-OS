const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Define new architecture
const newDirs = [
    'app/router', 'app/providers', 'app/layouts', 'app/guards',
    'modules/dashboard', 'modules/projects', 'modules/survey', 'modules/inventory', 
    'modules/hr', 'modules/finance', 'modules/settings',
    'shared/components', 'shared/hooks', 'shared/utils', 'shared/services', 'shared/types'
];

// Create new directories
newDirs.forEach(dir => {
    fs.mkdirSync(path.join(srcDir, dir), { recursive: true });
});

// Move map
const moveMap = {
    'features/dashboard': 'modules/dashboard/main',
    'features/projects': 'modules/projects/main',
    'features/accounts': 'modules/finance/main',
    'features/hr': 'modules/hr/main',
    'features/settings': 'modules/settings/main',
    'features/store': 'modules/inventory/store',
    'features/food': 'modules/inventory/food',
    'features/porter': 'modules/inventory/porter',
    'features/reports': 'modules/inventory/reports', // reports are mostly inventory
    'components': 'shared/components',
    'lib/domain': 'shared/services',
    'lib/config': 'shared/utils/config',
};

for (const [oldPath, newPath] of Object.entries(moveMap)) {
    const source = path.join(srcDir, oldPath);
    const target = path.join(srcDir, newPath);
    if (fs.existsSync(source)) {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(path.dirname(target), { recursive: true });
        }
        try {
            fs.renameSync(source, target);
            console.log(`Moved ${oldPath} to ${newPath}`);
        } catch (e) {
            console.log(`Fallback for ${oldPath}: ` + e.message);
        }
    }
}

// Any remaining files in lib go to shared/utils
const libDir = path.join(srcDir, 'lib');
if (fs.existsSync(libDir)) {
    const files = fs.readdirSync(libDir);
    files.forEach(file => {
        const fullPath = path.join(libDir, file);
        if (fs.statSync(fullPath).isFile()) {
            fs.renameSync(fullPath, path.join(srcDir, 'shared', 'utils', file));
        }
    });
}

// Clean up empty directories
['features', 'lib'].forEach(dir => {
    const fullPath = path.join(srcDir, dir);
    if (fs.existsSync(fullPath)) {
        try {
            fs.rmdirSync(fullPath, { recursive: true });
        } catch (e) {}
    }
});

// Update imports
function replaceImports(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace @features
    content = content.replace(/@features\/dashboard/g, '@modules/dashboard/main');
    content = content.replace(/@features\/projects/g, '@modules/projects/main');
    content = content.replace(/@features\/accounts/g, '@modules/finance/main');
    content = content.replace(/@features\/hr/g, '@modules/hr/main');
    content = content.replace(/@features\/settings/g, '@modules/settings/main');
    content = content.replace(/@features\/store/g, '@modules/inventory/store');
    content = content.replace(/@features\/food/g, '@modules/inventory/food');
    content = content.replace(/@features\/porter/g, '@modules/inventory/porter');
    content = content.replace(/@features\/reports/g, '@modules/inventory/reports');
    content = content.replace(/@features\//g, '@modules/');

    // Replace @components
    content = content.replace(/@components\//g, '@shared/components/');
    content = content.replace(/@common\//g, '@shared/components/common/');

    // Replace @lib
    content = content.replace(/@domain\//g, '@shared/services/');
    content = content.replace(/@config\//g, '@shared/utils/config/');
    content = content.replace(/@lib\/domain/g, '@shared/services');
    content = content.replace(/@lib\//g, '@shared/utils/');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            replaceImports(fullPath);
        }
    });
}

processDirectory(srcDir);
console.log("Migration complete.");

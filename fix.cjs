const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            if (content.includes("from '../ERPBetaLayout'")) {
                content = content.replace(/from '\.\.\/ERPBetaLayout'/g, "from '../context/ERPContext'");
                changed = true;
            }
            if (content.includes("from '../../ERPBetaLayout'")) {
                content = content.replace(/from '\.\.\/\.\.\/ERPBetaLayout'/g, "from '../../context/ERPContext'");
                changed = true;
            }

            if (content.includes("from '../../../lib/services/firebase'")) {
                content = content.replace(/from '\.\.\/\.\.\/\.\.\/lib\/services\/firebase'/g, "from '../../../../lib/services/firebase'");
                changed = true;
            }

            if (content.includes("from '../../../lib/domain/erp_beta_types'")) {
                content = content.replace(/from '\.\.\/\.\.\/\.\.\/lib\/domain\/erp_beta_types'/g, "from '../../../../lib/domain/erp_beta_types'");
                changed = true;
            }
            if (fullPath.includes('modules\\projects') || fullPath.includes('modules/projects')) {
                if (content.includes("from '../../../../lib/domain/erp_beta_types'")) {
                    content = content.replace(/from '\.\.\/\.\.\/\.\.\/\.\.\/lib\/domain\/erp_beta_types'/g, "from '../../../../../lib/domain/erp_beta_types'");
                    changed = true;
                }
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed:', fullPath);
            }
        }
    }
}
processDir(path.join(process.cwd(), 'src', 'components', 'features', 'erp', 'modules'));

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('PlaceholderModule')) {
    code = code.replace("import { DesktopSidebar }", "import { PlaceholderModule } from '@components/common/PlaceholderModule';\nimport { DesktopSidebar }");
}

if (code.includes(') : null}')) {
    code = code.replace(') : null}', ') : (\n                    <PlaceholderModule title={currentView} />\n                )}');
} else if (code.includes('</MobileLayout>\n                )}')) {
    // sometimes it ends without null, like `) : (\n <div className="md:hidden`
    // Let's replace the final `)}` of the main container if it doesn't have a catch-all
    console.log('App.tsx does not end with ) : null}');
}

fs.writeFileSync('src/App.tsx', code);
console.log('Updated App.tsx placeholder');

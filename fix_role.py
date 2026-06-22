import re

app_file = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\App.tsx"
sidebar_file = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\shared\components\layout\DesktopSidebar.tsx"
auth_file = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\shared\services\auth_service.ts"

with open(sidebar_file, 'r', encoding='utf-8') as f:
    sidebar_content = f.read()

sidebar_content = sidebar_content.replace("userRole === 'ADMIN'", "['ADMIN', 'Super Admin', 'Admin'].includes(userRole)")
with open(sidebar_file, 'w', encoding='utf-8') as f:
    f.write(sidebar_content)

with open(auth_file, 'r', encoding='utf-8') as f:
    auth_content = f.read()

auth_content = auth_content.replace("'Super Admin'", "'ADMIN'")
with open(auth_file, 'w', encoding='utf-8') as f:
    f.write(auth_content)

print("Roles fixed.")

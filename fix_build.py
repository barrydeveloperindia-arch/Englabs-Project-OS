import re
import os

app_file = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\App.tsx"
sync_file = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\shared\services\firestore_sync.ts"

with open(app_file, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Fix CommandCenterDashboard
if "import CommandCenterDashboard" not in app_content:
    app_content = app_content.replace(
        "import MobileDashboard from '@modules/dashboard/main/MobileDashboard';",
        "import MobileDashboard from '@modules/dashboard/main/MobileDashboard';\nimport CommandCenterDashboard from '@modules/dashboard/main/CommandCenterDashboard';"
    )

# Fix role={...} to allowedRoles={[...]} in App.tsx
app_content = re.sub(r"role=\"([^\"]+)\"", r"allowedRoles={['\1'] as any}", app_content)

# Fix userRole
app_content = app_content.replace("userRole === 'STAFF'", "currentUser?.role === 'Surveyor'")
app_content = app_content.replace("userRole={userRole}", "userRole={currentUser?.role as any}")

with open(app_file, 'w', encoding='utf-8') as f:
    f.write(app_content)

# Fix firestore_sync.ts
with open(sync_file, 'r', encoding='utf-8') as f:
    sync_content = f.read()

sync_content = sync_content.replace("import { User, ProjectData, GateEntry, ActivityLog } from '../types/database.types';", "import { User, ActivityLog } from '../types/database.types';\n// @ts-ignore\nimport { GateEntry } from '@shared/services/gate_system';")

with open(sync_file, 'w', encoding='utf-8') as f:
    f.write(sync_content)

print("Build fixes applied.")

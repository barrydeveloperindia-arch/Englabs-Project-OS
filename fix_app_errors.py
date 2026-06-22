import re

filepath = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix @features/ to @modules/
content = content.replace("@features/", "@modules/")

# Fix RequireRole import
content = content.replace("import { RequireRole } from './components/auth/RequireRole';", "import { RequireRole } from '@shared/components/auth/RequireRole';")

# Add missing CommandCenterDashboard import
if "import CommandCenterDashboard" not in content:
    content = content.replace(
        "import MobileDashboard from '@modules/dashboard/main/MobileDashboard';",
        "import MobileDashboard from '@modules/dashboard/main/MobileDashboard';\nimport CommandCenterDashboard from '@modules/dashboard/main/CommandCenterDashboard';"
    )

# Fix userRole state removal if it still exists
user_role_pattern = r"const \[userRole, setUserRole\] = useState<'ADMIN' \| 'STAFF' \| null>\(\(\) => \{.*?\n\s*\}\);"
content = re.sub(user_role_pattern, "", content, flags=re.DOTALL)

# Fix any stray `userRole` references
content = content.replace("setUserRole(null);", "")
content = content.replace("userRole={userRole}", "userRole={currentUser?.role}")
content = content.replace("userRole === 'STAFF'", "currentUser?.role === 'Surveyor'")

# Fix implicit any parameters
content = re.sub(r"const updateStage = \(stageName, newStatus\) =>", "const updateStage = (stageName: string, newStatus: string) =>", content)
content = re.sub(r"\(log\)", "(log: any)", content)
content = re.sub(r"\(newProj\)", "(newProj: any)", content)
content = re.sub(r"\(trip\)", "(trip: any)", content)
content = re.sub(r"\(updated\)", "(updated: any)", content)
content = re.sub(r"\(action\)", "(action: any)", content)

# Remove the old App component parameter definition if it causes issues
# Replace implicit 'any' with explicit 'any' for simple handlers
content = content.replace("const handleNewGateEntry = async (entry) => {", "const handleNewGateEntry = async (entry: any) => {")
content = content.replace("const handleUpdateGateEntry = async (entry) => {", "const handleUpdateGateEntry = async (entry: any) => {")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx compilation errors patched.")

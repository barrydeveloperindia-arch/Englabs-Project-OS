import re

filepath = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix module paths
content = content.replace("@modules/porter/", "@modules/inventory/porter/")
content = content.replace("@modules/food/", "@modules/inventory/food/")
content = content.replace("@modules/store/", "@modules/inventory/store/")
content = content.replace("@modules/reports/", "@modules/inventory/reports/")
content = content.replace("@modules/accounts/", "@modules/finance/main/")
content = content.replace("@modules/hr/", "@modules/hr/main/")
content = content.replace("@modules/dashboard/", "@modules/dashboard/main/")
content = content.replace("@modules/projects/", "@modules/projects/main/")

# Fix DesktopSidebar missing import
if "import { DesktopSidebar }" not in content:
    content = content.replace(
        "import { PlaceholderModule } from '@shared/components/common/PlaceholderModule';",
        "import { PlaceholderModule } from '@shared/components/common/PlaceholderModule';\nimport { DesktopSidebar } from '@shared/components/layout/DesktopSidebar';"
    )

# Fix userRole references
content = re.sub(r"userRole=\{userRole\}", "userRole={currentUser?.role || 'Engineer'}", content)

# Fix the RequireRole parameter issue `role` -> `allowedRoles`
# The error was `Property 'role' does not exist on type 'IntrinsicAttributes & RequireRoleProps'`
# It's probably because it's using `<RequireRole role={...}>` instead of `<RequireRole allowedRoles={...}>`
content = re.sub(r"<RequireRole role=\{([^}]+)\}>", r"<RequireRole allowedRoles={[\1]}>", content)

# Fix implicit any and userRole type assignment errors
# Around line 585 there's an error about UserRole not assignable to '"ADMIN" | "STAFF" | null'
# That's because of `userRole` useState which shouldn't exist anymore.
# We will just wipe any `setUserRole` occurrences.
content = content.replace("setUserRole(null);", "")
content = content.replace("setUserRole(\"ADMIN\");", "")
content = content.replace("setUserRole(\"STAFF\");", "")
content = content.replace("const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF' | null>(() => {", "/* removed userRole */")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx fixed.")

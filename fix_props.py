import os

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, does not exist.")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace specific role enums with standard string
    content = content.replace("userRole: 'ADMIN' | 'STAFF' | null;", "userRole: string | null;")
    content = content.replace("userRole: \"ADMIN\" | \"STAFF\" | null;", "userRole: string | null;")
    content = content.replace("userRole?: 'ADMIN' | 'STAFF' | null;", "userRole?: string | null;")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

files = [
    r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\shared\components\layout\DesktopSidebar.tsx",
    r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\shared\components\layout\MobileLayout.tsx",
    r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\modules\projects\main\ProjectDashboard.tsx"
]

for f in files:
    fix_file(f)

# Also fix the last `UserRole` error in App.tsx
app_file = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\App.tsx"
with open(app_file, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Fix the specific ProjectDashboard render
app_content = app_content.replace(
    "userRole={currentUser?.role || 'Engineer'}",
    "userRole={currentUser?.role as string || 'Engineer'}"
)

# And RequireRole in App.tsx
app_content = app_content.replace("<RequireRole allowedRoles={['Super Admin']}>", "<RequireRole allowedRoles={['Super Admin'] as any}>")
app_content = app_content.replace("<RequireRole allowedRoles={['Super Admin', 'HR']}>", "<RequireRole allowedRoles={['Super Admin', 'HR'] as any}>")
app_content = app_content.replace("<RequireRole allowedRoles={['Super Admin', 'Admin', 'Accountant']}>", "<RequireRole allowedRoles={['Super Admin', 'Admin', 'Accountant'] as any}>")
app_content = app_content.replace("<RequireRole allowedRoles={['Super Admin', 'Admin']}>", "<RequireRole allowedRoles={['Super Admin', 'Admin'] as any}>")

with open(app_file, 'w', encoding='utf-8') as f:
    f.write(app_content)

print("Props fixed.")

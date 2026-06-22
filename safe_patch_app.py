import re

filepath = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Import
if "import CommandCenterDashboard" not in content:
    content = content.replace(
        "import MobileDashboard from '@modules/dashboard/main/MobileDashboard';",
        "import MobileDashboard from '@modules/dashboard/main/MobileDashboard';\nimport CommandCenterDashboard from '@modules/dashboard/main/CommandCenterDashboard';"
    )

# 2. Update View Type
if "'COMMAND_CENTER'" not in content:
    content = content.replace(
        "type View = 'HOME' | 'PROJECTS'",
        "type View = 'HOME' | 'COMMAND_CENTER' | 'PROJECTS'"
    )

# 3. Update Default View
content = content.replace(
    "return role === 'STAFF' ? 'STOCK_REPORT' : (isMobile ? 'HOME' : 'PROJECT_MANAGEMENT_DASHBOARD');",
    "return role === 'STAFF' ? 'STOCK_REPORT' : (isMobile ? 'HOME' : 'COMMAND_CENTER');"
)

# 4. Update Render Block
render_old = """                {currentView === 'PROJECT_MANAGEMENT_DASHBOARD' ? (
                    <ProjectManagementDashboard 
                        projects={projects}
                        onSelectProject={() => setCurrentView('PROJECTS')}
                    />"""

render_new = """                {currentView === 'COMMAND_CENTER' ? (
                    <CommandCenterDashboard 
                        projects={projects}
                        gateEntries={gateEntries}
                        porterTrips={porterTrips}
                        inventoryItems={inventoryItems}
                    />
                ) : currentView === 'PROJECT_MANAGEMENT_DASHBOARD' ? (
                    <ProjectManagementDashboard 
                        projects={projects}
                        onSelectProject={() => setCurrentView('PROJECTS')}
                    />"""

content = content.replace(render_old, render_new)

# 5. Update Roles
content = content.replace(
    "<RequireRole allowedRoles={['HR_ADMIN']}>",
    "<RequireRole allowedRoles={['Super Admin', 'HR']}>"
)

content = content.replace(
    "<RequireRole allowedRoles={['ADMIN']}>\n                        <BillingDashboard />",
    "<RequireRole allowedRoles={['Super Admin', 'Admin', 'Accountant']}>\n                        <BillingDashboard />"
)

content = content.replace(
    "<RequireRole allowedRoles={['ADMIN']}>\n                        <ManagementDashboard />",
    "<RequireRole allowedRoles={['Super Admin', 'Admin']}>\n                        <ManagementDashboard />"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx successfully patched safely.")

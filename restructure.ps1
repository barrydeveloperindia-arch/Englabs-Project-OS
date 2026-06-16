$ErrorActionPreference = "Stop"
$src = "c:\Users\SAM\Documents\Antigravity\Englabs Projects\src"

$features = "$src\features"
New-Item -ItemType Directory -Force -Path "$features\dashboard"
New-Item -ItemType Directory -Force -Path "$features\hr"
New-Item -ItemType Directory -Force -Path "$features\accounts"
New-Item -ItemType Directory -Force -Path "$features\projects"
New-Item -ItemType Directory -Force -Path "$features\store"
New-Item -ItemType Directory -Force -Path "$features\porter"
New-Item -ItemType Directory -Force -Path "$features\reports"
New-Item -ItemType Directory -Force -Path "$features\food"
New-Item -ItemType Directory -Force -Path "$features\settings"

$oldFeat = "$src\components\features"

# Dashboard
Move-Item -Path "$oldFeat\system\MobileDashboard.tsx" -Destination "$features\dashboard\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "$oldFeat\system\SystemGuardDashboard.tsx" -Destination "$features\dashboard\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "$oldFeat\system\Sky5Terminal.tsx" -Destination "$features\dashboard\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "$oldFeat\system\DigitalEvidence.tsx" -Destination "$features\dashboard\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "$oldFeat\system\Showroom.tsx" -Destination "$features\dashboard\" -Force -ErrorAction SilentlyContinue

# HR
Move-Item -Path "$oldFeat\system\UserManagement.tsx" -Destination "$features\hr\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "$oldFeat\erp\modules\hr\AttendanceRegisterForm.tsx" -Destination "$features\hr\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "$oldFeat\erp\modules\hr\PayrollTerminal.tsx" -Destination "$features\hr\" -Force -ErrorAction SilentlyContinue

# Accounts
Move-Item -Path "$oldFeat\accounting\*" -Destination "$features\accounts\" -Force -ErrorAction SilentlyContinue

# Projects
Move-Item -Path "$oldFeat\project\*" -Destination "$features\projects\" -Force -ErrorAction SilentlyContinue

# Store
Move-Item -Path "$oldFeat\inventory\InventoryManager.tsx" -Destination "$features\store\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "$oldFeat\inventory\StoreGuardianDashboard.tsx" -Destination "$features\store\" -Force -ErrorAction SilentlyContinue

# Porter
Move-Item -Path "$oldFeat\porter\*" -Destination "$features\porter\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "$oldFeat\logistics\*" -Destination "$features\porter\" -Force -ErrorAction SilentlyContinue

# Reports
Move-Item -Path "$oldFeat\inventory\StoreStockReport.tsx" -Destination "$features\reports\" -Force -ErrorAction SilentlyContinue

# Food
Move-Item -Path "$oldFeat\food\*" -Destination "$features\food\" -Force -ErrorAction SilentlyContinue

# Delete old features directory
Remove-Item -Path "$oldFeat" -Recurse -Force

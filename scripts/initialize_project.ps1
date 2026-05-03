param (
    [Parameter(Mandatory=$true)]
    [string]$ProjectId
)

$BaseDir = "c:\Users\SAM\Documents\Antigravity\Englabs Projects"
$ProjectDir = Join-Path $BaseDir "projects\$ProjectId"

# Define standard OneDrive-ready structure
$Folders = @(
    "01_Quotation",
    "02_Purchase_Order",
    "03_Engineering_Design",
    "04_Production_Logs",
    "05_Finishing_Photos",
    "06_Delivery_Documents"
)

Write-Host "🚀 Initializing Antigravity Project: $ProjectId" -ForegroundColor Cyan

# Create Project Directory
if (!(Test-Path $ProjectDir)) {
    New-Item -ItemType Directory -Path $ProjectDir | Out-Null
    Write-Host "✅ Created project directory: $ProjectId"
}

# Create subfolders
foreach ($Folder in $Folders) {
    $Path = Join-Path $ProjectDir $Folder
    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
        Write-Host "  - Created folder: $Folder"
    }
}

# Create Data JSON Template
$DataPath = Join-Path $BaseDir "data\$ProjectId.json"
if (!(Test-Path $DataPath)) {
    $Template = @{
        projectId = $ProjectId
        client = "TBD"
        planning = @{
            value = 0
            budget = 0
            deliveryTerms = "ToPay"
            poConfirmed = $false
            startDate = (Get-Date -Format "yyyy-MM-dd")
        }
        production = @{
            currentStage = "Engineering Design"
            stages = @(
                @{ name = "Engineering Design"; status = "Pending" },
                @{ name = "Machine Processing"; status = "Pending" },
                @{ name = "Workshop Fabrication"; status = "Pending" },
                @{ name = "Sanding"; status = "Pending" },
                @{ name = "Painting"; status = "Pending" },
                @{ name = "Drying"; status = "Pending" },
                @{ name = "Finishing"; status = "Pending" },
                @{ name = "Final Packaging"; status = "Pending" }
            )
        }
        metrics = @{
            totalComponents = 0
            materialConsumption = ""
            workforce = @()
        }
    }
    $Template | ConvertTo-Json -Depth 10 | Out-File $DataPath -Encoding utf8
    Write-Host "✅ Created data ledger: data\$ProjectId.json"
}

Write-Host "✨ Project $ProjectId is ready for tracking." -ForegroundColor Green

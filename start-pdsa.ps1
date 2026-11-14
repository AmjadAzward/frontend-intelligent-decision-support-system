$ErrorActionPreference = "Stop"

$FrontendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $FrontendRoot
$BackendRoot = Join-Path $ProjectRoot "Backend-Intelligent-Decision-Support-System"

$services = @(
    @{ Name = "Task 1 Route Service"; Folder = "task1-route-service"; Port = 8001 },
    @{ Name = "Task 2 Resource Service"; Folder = "task2-resource-service"; Port = 8002 },
    @{ Name = "Task 3 Network Service"; Folder = "task3-network-service"; Port = 8003 },
    @{ Name = "Task 4 Decision Service"; Folder = "task4-decision-service"; Port = 8004 },
    @{ Name = "Task 5 Waste Service"; Folder = "task5-optimization-service"; Port = 8005 }
)

Write-Host "Starting Smart City IDSS services..." -ForegroundColor Cyan

foreach ($service in $services) {
    $serviceRoot = Join-Path $BackendRoot $service.Folder
    $python = Join-Path $serviceRoot ".venv\Scripts\python.exe"

    if (-not (Test-Path $serviceRoot)) {
        Write-Warning "$($service.Name) folder was not found: $serviceRoot"
        continue
    }

    if (-not (Test-Path $python)) {
        Write-Warning "$($service.Name) virtual environment was not found: $python"
        continue
    }

    $command = "Set-Location -LiteralPath '$serviceRoot'; & '$python' -m uvicorn app.main:app --reload --port $($service.Port)"
    Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command", $command
    )
    Write-Host "$($service.Name) -> http://127.0.0.1:$($service.Port)" -ForegroundColor Green
}

if (-not (Test-Path (Join-Path $FrontendRoot "package.json"))) {
    throw "Frontend package.json was not found: $FrontendRoot"
}

Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", "Set-Location -LiteralPath '$FrontendRoot'; npm run dev"
)

Write-Host "Frontend -> http://localhost:5173" -ForegroundColor Green
Write-Host "Open http://localhost:5173 in your browser." -ForegroundColor Cyan

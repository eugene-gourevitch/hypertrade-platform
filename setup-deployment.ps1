# PowerShell script to set up deployment prerequisites
# Run this with: powershell -ExecutionPolicy Bypass -File setup-deployment.ps1

Write-Host "🚀 Setting up Google Cloud deployment prerequisites..." -ForegroundColor Green
Write-Host ""

# Check if Python is installed
Write-Host "📋 Checking Python installation..." -ForegroundColor Yellow
$pythonInstalled = $false

# Check common Python installation paths
$pythonPaths = @(
    "C:\Python311\python.exe",
    "C:\Python310\python.exe",
    "C:\Python39\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe"
)

foreach ($path in $pythonPaths) {
    if (Test-Path $path) {
        Write-Host "✅ Found Python at: $path" -ForegroundColor Green
        $pythonInstalled = $true
        $pythonExe = $path
        break
    }
}

if (-not $pythonInstalled) {
    Write-Host "❌ Python not found. Installing Python 3.11..." -ForegroundColor Red
    Write-Host "   Downloading Python installer..." -ForegroundColor Yellow

    $pythonUrl = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe"
    $pythonInstaller = "$env:TEMP\python-installer.exe"

    Invoke-WebRequest -Uri $pythonUrl -OutFile $pythonInstaller

    Write-Host "   Installing Python (this may take a minute)..." -ForegroundColor Yellow
    Start-Process -FilePath $pythonInstaller -Args "/quiet InstallAllUsers=0 PrependPath=1 Include_test=0" -Wait

    Write-Host "✅ Python installed!" -ForegroundColor Green

    # Refresh PATH
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path","Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path","User")
    $env:Path = $machinePath + ";" + $userPath
}

Write-Host ""
Write-Host "📋 Checking gcloud CLI..." -ForegroundColor Yellow

# Test gcloud
$gcloudPath = "C:\Users\egour\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

if (Test-Path $gcloudPath) {
    Write-Host "✅ gcloud CLI found!" -ForegroundColor Green

    # Test if it works
    Write-Host "   Testing gcloud..." -ForegroundColor Yellow
    $output = & $gcloudPath version 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ gcloud CLI is working!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  gcloud CLI found but not working. You may need to reinstall." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ gcloud CLI not found" -ForegroundColor Red
    Write-Host "   Please install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "✅ Prerequisites check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Close and reopen this terminal (to refresh PATH)" -ForegroundColor White
Write-Host "  2. Run: gcloud auth login" -ForegroundColor White
Write-Host "  3. Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor White
Write-Host "  4. Run: .\deploy-to-google-cloud.ps1" -ForegroundColor White
Write-Host "=" * 80 -ForegroundColor Cyan

# ColabCanvas Startup Script for PowerShell

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🎨 ColabCanvas - Starting Application...         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check MongoDB
Write-Host "[1/3] Checking MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "⚠️ MongoDB is not running. Please start MongoDB manually." -ForegroundColor Red
    Write-Host "   Run: net start MongoDB" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/3] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\server'; npm run dev"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[3/3] Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\client'; npm start"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ ColabCanvas is starting up!              ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Two terminal windows have been opened:" -ForegroundColor Cyan
Write-Host "   • Backend Server (auto-detects IP address)" -ForegroundColor White
Write-Host "   • Frontend Application" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Please wait for both servers to start..." -ForegroundColor Yellow
Write-Host "🌐 The application will open automatically in your browser" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To share with other devices:" -ForegroundColor Magenta
Write-Host "   1. Wait for the backend to display the Network URL" -ForegroundColor White
Write-Host "   2. Use the Share button in the app to get the link" -ForegroundColor White
Write-Host "   3. Open that link on any device on your network!" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

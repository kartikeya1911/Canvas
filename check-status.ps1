# ColabCanvas - Status Check Script

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  ColabCanvas Status Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check MongoDB
Write-Host "`nChecking MongoDB (port 27017)..." -NoNewline
$mongoRunning = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($mongoRunning) {
    Write-Host " ✅ Running" -ForegroundColor Green
} else {
    Write-Host " ❌ Not Running" -ForegroundColor Red
}

# Check Backend Server
Write-Host "Checking Backend Server (port 5000)..." -NoNewline
$backendRunning = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($backendRunning) {
    Write-Host " ✅ Running" -ForegroundColor Green
    
    # Test API health
    try {
        $response = Invoke-WebRequest -Uri "http://192.168.1.19:5000/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  API Health Check: ✅ OK" -ForegroundColor Green
    } catch {
        Write-Host "  API Health Check: ⚠️ Error" -ForegroundColor Yellow
    }
} else {
    Write-Host " ❌ Not Running" -ForegroundColor Red
}

# Check Frontend Server
Write-Host "Checking Frontend Server (port 3000)..." -NoNewline
$frontendRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($frontendRunning) {
    Write-Host " ✅ Running" -ForegroundColor Green
} else {
    Write-Host " ❌ Not Running" -ForegroundColor Red
}

# Get Network IP
Write-Host "`nNetwork Configuration:" -ForegroundColor Cyan
$networkIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
Write-Host "  Local IP: $networkIP" -ForegroundColor White

Write-Host "`nAccess URLs:" -ForegroundColor Cyan
if ($frontendRunning) {
    Write-Host "  Frontend: http://$networkIP:3000" -ForegroundColor Green
} else {
    Write-Host "  Frontend: ❌ Not accessible" -ForegroundColor Red
}

if ($backendRunning) {
    Write-Host "  Backend:  http://$networkIP:5000" -ForegroundColor Green
} else {
    Write-Host "  Backend:  ❌ Not accessible" -ForegroundColor Red
}

Write-Host "`n=====================================" -ForegroundColor Cyan

# Overall status
if ($mongoRunning -and $backendRunning -and $frontendRunning) {
    Write-Host "  Status: All Systems Operational ✅" -ForegroundColor Green
} else {
    Write-Host "  Status: Some Services Down ⚠️" -ForegroundColor Yellow
    Write-Host "`nTo start services, run: .\start-servers.bat" -ForegroundColor Yellow
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

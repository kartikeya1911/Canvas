# ColabCanvas - Firewall Configuration Script
# Run this script as Administrator to allow network access

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  ColabCanvas Firewall Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click on PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Setting up firewall rules..." -ForegroundColor Green
Write-Host ""

# Remove existing rules if they exist
Write-Host "Removing old rules (if any)..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "ColabCanvas Frontend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "ColabCanvas Backend" -ErrorAction SilentlyContinue

# Create new firewall rules
Write-Host "Creating firewall rule for Frontend (Port 3000)..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "ColabCanvas Frontend" `
                     -Direction Inbound `
                     -LocalPort 3000 `
                     -Protocol TCP `
                     -Action Allow `
                     -Profile Any `
                     -Enabled True

Write-Host "Creating firewall rule for Backend (Port 5000)..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "ColabCanvas Backend" `
                     -Direction Inbound `
                     -LocalPort 5000 `
                     -Protocol TCP `
                     -Action Allow `
                     -Profile Any `
                     -Enabled True

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  Firewall Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ports 3000 and 5000 are now accessible from other devices." -ForegroundColor Cyan
Write-Host ""
Write-Host "Your network IP: " -NoNewline -ForegroundColor Yellow
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
Write-Host ""
Write-Host "You can now access ColabCanvas from other devices at:" -ForegroundColor Cyan
Write-Host "http://192.168.1.19:3000" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to close"

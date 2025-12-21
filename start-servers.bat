@echo off
echo ====================================
echo    ColabCanvas - Starting Servers
echo ====================================
echo.

echo Checking network configuration...
ipconfig | findstr /C:"IPv4 Address"
echo.

echo Starting MongoDB (if not already running)...
net start MongoDB 2>nul
if errorlevel 1 (
    echo MongoDB service not found or already running
)
echo.

echo Starting Backend Server...
start "ColabCanvas Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend Application...
start "ColabCanvas Frontend" cmd /k "cd /d %~dp0client && npm start"

echo.
echo ====================================
echo    Servers Starting...
echo ====================================
echo.
echo Backend will be available at:
echo   - Local:   http://localhost:5000
echo   - Network: http://192.168.1.19:5000
echo.
echo Frontend will be available at:
echo   - Local:   http://localhost:3000
echo   - Network: http://192.168.1.19:3000
echo.
echo Share http://192.168.1.19:3000 with other devices!
echo.
echo Press any key to exit this window (servers will continue running)...
pause > nul

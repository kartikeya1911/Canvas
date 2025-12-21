@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         🎨 ColabCanvas - Starting Application...         ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Get current directory
set ROOT_DIR=%~dp0

echo [1/3] Starting MongoDB...
REM Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MongoDB is already running
) else (
    echo ⚠️ MongoDB is not running. Please start MongoDB manually.
    echo    Run: net start MongoDB
)

echo.
echo [2/3] Starting Backend Server...
start "ColabCanvas Backend" cmd /k "cd /d %ROOT_DIR%server && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting Frontend...
start "ColabCanvas Frontend" cmd /k "cd /d %ROOT_DIR%client && npm start"

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              ✅ ColabCanvas is starting up!              ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📝 Two terminal windows have been opened:
echo    • Backend Server (auto-detects IP address)
echo    • Frontend Application
echo.
echo ⏳ Please wait for both servers to start...
echo 🌐 The application will open automatically in your browser
echo.
echo 💡 To share with other devices:
echo    1. Wait for the backend to display the Network URL
echo    2. Use the Share button in the app to get the link
echo    3. Open that link on any device on your network!
echo.
pause

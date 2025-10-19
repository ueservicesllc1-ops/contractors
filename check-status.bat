@echo off
echo Checking ContractorApp Status...
echo.
echo 1. Checking if server is running...
netstat -an | findstr :3000
echo.
echo 2. Checking for any Node.js processes...
tasklist | findstr node.exe
echo.
echo 3. If you see the server running, open http://localhost:3000
echo.
pause

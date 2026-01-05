@echo off
echo ==========================================
echo      MySQL Port Blocker Detector
echo ==========================================

echo Checking for processes using Port 3306...
netstat -ano | findstr :3306

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [WARNING] Port 3306 is BUSY!
    echo The PID (Process ID) is the number at the end of the lines above.
    echo.
    echo Attempting to find the program name...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3306') do (
        tasklist /fi "pid eq %%a"
    )
    echo.
    set /p KILL="Do you want to force kill these processes? (y/n): "
    if /i "%KILL%"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3306') do (
            taskkill /F /PID %%a
            echo Killed PID %%a
        )
        echo.
        echo Done! Try starting XAMPP MySQL now.
    )
) else (
    echo.
    echo [OK] Port 3306 appears to be FREE.
    echo If XAMPP still fails, try running XAMPP as Administrator.
)

pause

@echo off
setlocal EnableDelayedExpansion

REM -- CONFIGURATION --
set "MYSQL_PATH=C:\xampp\mysql"

echo ==========================================
echo      XAMPP MySQL Auto-Repair Tool
echo ==========================================

if not exist "%MYSQL_PATH%" (
    echo [ERROR] Could not find XAMPP folder at: %MYSQL_PATH%
    echo Please edit this script if your XAMPP is installed elsewhere.
    pause
    exit /b
)

cd /d "%MYSQL_PATH%"

echo [1/5] Stopping any running MySQL processes...
taskkill /F /IM mysqld.exe >nul 2>&1

echo [2/5] Backing up current 'data' folder...
set "TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_NAME=data_corrupted_%TIMESTAMP%"

if exist "data" (
    ren "data" "%BACKUP_NAME%"
    echo      Renamed 'data' to '%BACKUP_NAME%'
) else (
    echo [ERROR] No 'data' folder found to fix!
    pause
    exit /b
)

echo [3/5] Restoring fresh data from 'backup'...
if exist "backup" (
    xcopy /E /I /Q "backup" "data" >nul
    echo      Fresh files copied.
) else (
    echo [ERROR] No 'backup' folder found in XAMPP! Cannot restore.
    pause
    exit /b
)

echo [4/5] Restoring your databases and ibdata1...
REM Copy the critical identity file
copy /Y "%BACKUP_NAME%\ibdata1" "data\" >nul
echo      Restored ibdata1

REM Loop through old folders and copy user databases
for /d %%D in ("%BACKUP_NAME%\*") do (
    set "FOLDER_NAME=%%~nXD"
    
    REM Skip system folders that were just generated from backup
    if /I not "!FOLDER_NAME!"=="mysql" (
        if /I not "!FOLDER_NAME!"=="performance_schema" (
            if /I not "!FOLDER_NAME!"=="phpmyadmin" (
                if /I not "!FOLDER_NAME!"=="test" (
                    echo      Restoring database: !FOLDER_NAME!
                    xcopy /E /I /Q "%%D" "data\!FOLDER_NAME!" >nul
                )
            )
        )
    )
)

echo [5/5] Repair Complete!
echo ==========================================
echo Now try starting MySQL in XAMPP Control Panel.
echo ==========================================
pause

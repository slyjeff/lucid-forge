@echo off
REM Build the LucidForge JetBrains plugin.
REM Output: build\distributions\lucidforge-jetbrains-<version>.zip
REM Install in any JetBrains IDE via Settings > Plugins > gear icon > Install Plugin from Disk

setlocal
cd /d "%~dp0"

call .\gradlew.bat buildPlugin %*
if errorlevel 1 (
    echo.
    echo BUILD FAILED
    exit /b 1
)

echo.
echo BUILD SUCCESSFUL
echo Plugin zip:
dir /b build\distributions\*.zip 2>nul
endlocal

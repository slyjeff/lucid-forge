@echo off
REM Build the LucidForge JetBrains plugin.
REM Output: build\distributions\lucidforge-jetbrains-<version>.zip
REM Install in any JetBrains IDE via Settings > Plugins > gear icon > Install Plugin from Disk

setlocal
cd /d "%~dp0"

REM Always clean before building. Gradle's incremental compile keeps stale .class
REM files in build/classes/ for source files that have been deleted or renamed,
REM and they get packaged into the plugin jar — silently shipping old code.
call .\gradlew.bat clean buildPlugin %*
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

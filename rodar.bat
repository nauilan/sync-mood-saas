@echo off
cd /d "%~dp0apps\web"
echo ================================================
echo  Sync Mood SaaS
echo ================================================
echo.
echo Pasta atual:
cd
echo.

if not exist "node_modules" (
    echo Instalando node_modules...
    call npm install
    if errorlevel 1 (
        echo ERRO no npm install
        pause
        exit /b 1
    )
)

echo Iniciando next dev...
echo.
call npm run dev

echo.
echo ===== Servidor encerrado =====
pause

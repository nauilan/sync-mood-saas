@echo off
chcp 65001 >nul
title Sync Mood - Migrations 045 e 046

echo.
echo ================================================
echo   SYNC MOOD - MIGRATIONS 045 e 046
echo ================================================
echo.
echo  Migration 045: contratos - assinantes_d4sign + obras_json
echo  Migration 046: titulares - campo sexo
echo.
echo  Instrucoes:
echo    1. Cole o SQL no editor (Ctrl+V)
echo    2. Clique em RUN (ou Ctrl+Enter)
echo    3. Aguarde "Success"
echo    4. Pressione Enter aqui para continuar
echo.

set BASE=%~dp0migrations\

echo [1/2] Migration 045 - contratos extras (assinantes_d4sign, obras_json)
powershell -Command "Get-Content '%BASE%045_contratos_assinantes_extras.sql' -Raw | Set-Clipboard"
start chrome https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/editor
echo.
echo  Migration 045 copiada! No SQL Editor: Ctrl+V, depois Ctrl+Enter
echo  Aguarde "Success" antes de continuar.
echo.
pause

echo [2/2] Migration 046 - titulares (campo sexo)
powershell -Command "Get-Content '%BASE%046_titulares_sexo.sql' -Raw | Set-Clipboard"
echo.
echo  Migration 046 copiada! Ctrl+V e Ctrl+Enter.
echo  Aguarde "Success".
echo.
pause

echo.
echo ================================================
echo   MIGRATIONS CONCLUIDAS!
echo   Proximos passos:
echo    1. npm run build (ja validado - 143 paginas)
echo    2. vercel deploy --prod
echo    3. Validar login + titulares + contrato
echo ================================================
pause

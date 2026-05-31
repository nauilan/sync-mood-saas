@echo off
chcp 65001 >nul
title Sync Mood - Migration Supabase

echo.
echo ================================================
echo   SYNC MOOD - MIGRATION SUPABASE
echo   Executa os 4 blocos SQL no Supabase
echo ================================================
echo.
echo Vou copiar cada bloco para a area de transferencia.
echo Voce so precisa: Ctrl+V, Run, confirmar e Enter.
echo.

set BASE=%~dp0

echo [1/4] BLOCO 1 - DROP + ENUMs + Tenants + Editoras
powershell -Command "Get-Content '%BASE%BLOCO_1_DROP_ENUMS_TENANT_EDITORAS.sql' -Raw | Set-Clipboard"
start chrome https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/editor
echo.
echo  BLOCO 1 copiado! No SQL Editor: Ctrl+V, depois Ctrl+Enter
echo  Aguarde "Success" antes de continuar.
echo.
pause

echo [2/4] BLOCO 2 - Titulares + Contratos + Obras
powershell -Command "Get-Content '%BASE%BLOCO_2_TITULARES_CONTRATOS_OBRAS.sql' -Raw | Set-Clipboard"
echo  BLOCO 2 copiado! Ctrl+V e Ctrl+Enter.
pause

echo [3/4] BLOCO 3 - Recebimentos + Distribuicao
powershell -Command "Get-Content '%BASE%BLOCO_3_RECEBIMENTOS_DISTRIBUICAO.sql' -Raw | Set-Clipboard"
echo  BLOCO 3 copiado! Ctrl+V e Ctrl+Enter.
pause

echo [4/4] BLOCO 4 - RLS + Seed
powershell -Command "Get-Content '%BASE%BLOCO_4_RLS_SEED.sql' -Raw | Set-Clipboard"
echo  BLOCO 4 copiado! Ctrl+V e Ctrl+Enter.
pause

echo.
echo ================================================
echo   MIGRATION CONCLUIDA!
echo   Login: CPF 04730581970 / senha: admin123
echo   URL: https://sync-mood-saas.vercel.app
echo ================================================
pause

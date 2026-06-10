@echo off
chcp 65001 >nul
title Sync Mood - Migration 048 D4Sign

echo.
echo ================================================
echo   SYNC MOOD - MIGRATION 048
echo   Adiciona d4sign_uuid e d4sign_status
echo   na tabela contratos
echo ================================================
echo.

set SQL=%~dp0migrations\048_contratos_d4sign.sql

powershell -Command "Get-Content '%SQL%' -Raw | Set-Clipboard"
echo Migration 048 copiada para a area de transferencia!
echo.

start chrome https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/sql/new
echo.
echo  Cole o SQL no editor (Ctrl+V)
echo  Execute (Ctrl+Enter)
echo  Aguarde "Success"
echo.
pause

echo.
echo ================================================
echo   MIGRATION 048 CONCLUIDA!
echo   Botao "Enviar para Assinatura" agora funciona.
echo ================================================
pause

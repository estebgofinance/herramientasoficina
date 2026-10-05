@echo off
cd /d "%~dp0"
where node >nul 2>nul || ( echo. & echo   No encuentro Node.js. Instalalo desde https://nodejs.org ^(boton LTS^), & echo   cierra esta ventana y vuelve a abrir este archivo. & echo. & pause & exit /b 1 )
node configurar.js
echo.
pause

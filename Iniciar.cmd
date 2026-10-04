@echo off
title Forja de Cartas
cd /d "%~dp0"
echo Abriendo Forja de Cartas en http://localhost:3420
start "" http://localhost:3420
node servidor.js
pause

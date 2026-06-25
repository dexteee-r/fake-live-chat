@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Fake Chat

if not exist "node_modules" (
  echo Premiere utilisation : installation... (cela peut prendre quelques minutes)
  call npm install
  if errorlevel 1 (
    echo.
    echo ECHEC de l'installation. Verifiez que Node.js est installe.
    pause
    exit /b 1
  )
)

echo.
echo Demarrage de Fake Chat...
echo La fenetre de l'application va s'ouvrir dans un instant.
echo (Vous pouvez reduire cette fenetre noire ; ne la fermez pas.)
echo.
call npm run gui

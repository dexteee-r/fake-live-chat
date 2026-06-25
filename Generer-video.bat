@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Fake Chat - Generation video

if not exist "node_modules" (
  echo Premiere utilisation : installation des dependances...
  call npm install
  if errorlevel 1 (
    echo.
    echo ECHEC de l'installation. Verifiez que Node.js est installe.
    pause
    exit /b 1
  )
)

echo.
echo Generation de la video transparente ^(ProRes 4444 alpha^)...
echo Cela peut prendre un moment.
echo.
call npm run render
if errorlevel 1 (
  echo.
  echo ECHEC du rendu. Voir les messages ci-dessus.
  pause
  exit /b 1
)

echo.
echo TERMINE. Fichier genere dans votre dossier Telechargements : fake-chat.mov
echo Importez-le dans Premiere Pro, au-dessus de votre video.
echo.
pause

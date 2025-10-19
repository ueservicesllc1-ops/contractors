@echo off
REM Script para desplegar reglas de Firestore a Firebase en Windows
REM Requiere Firebase CLI instalado: npm install -g firebase-tools

echo 🔥 Desplegando reglas de Firestore a Firebase...

REM Verificar si Firebase CLI está instalado
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI no está instalado.
    echo 📦 Instálalo con: npm install -g firebase-tools
    pause
    exit /b 1
)

REM Verificar si el usuario está autenticado
firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo 🔐 Iniciando sesión en Firebase...
    firebase login
)

REM Desplegar reglas de Firestore
echo 📋 Desplegando reglas de Firestore...
firebase deploy --only firestore:rules

echo ✅ Reglas desplegadas exitosamente!
echo 🌐 Ve a Firebase Console para verificar: https://console.firebase.google.com/
pause

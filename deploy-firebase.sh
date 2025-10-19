#!/bin/bash

# Script para desplegar reglas de Firestore a Firebase
# Requiere Firebase CLI instalado: npm install -g firebase-tools

echo "🔥 Desplegando reglas de Firestore a Firebase..."

# Verificar si Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado."
    echo "📦 Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar si el usuario está autenticado
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Iniciando sesión en Firebase..."
    firebase login
fi

# Desplegar reglas de Firestore
echo "📋 Desplegando reglas de Firestore..."
firebase deploy --only firestore:rules

echo "✅ Reglas desplegadas exitosamente!"
echo "🌐 Ve a Firebase Console para verificar: https://console.firebase.google.com/"

@echo off
echo Deploying Firestore Rules...
cd /d "%~dp0"
firebase deploy --only firestore:rules
pause

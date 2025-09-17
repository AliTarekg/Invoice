@echo off
echo ========================================
echo Firebase Firestore Rules Deployment
echo ========================================
echo.
echo Option 1: Deploy via Firebase Console (Recommended)
echo 1. Go to: https://console.firebase.google.com/
echo 2. Select project: invoice-2b451
echo 3. Go to Firestore Database → Rules tab
echo 4. Replace rules with the content from firestore.rules
echo 5. Click Publish
echo.
echo Option 2: Try Firebase CLI (if login works)
echo.
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Firebase CLI not found. Installing...
    npm install -g firebase-tools
)

echo Attempting Firebase CLI deployment...
firebase deploy --only firestore:rules --project invoice-2b451

if %errorlevel% neq 0 (
    echo.
    echo CLI deployment failed. Please use the Firebase Console method above.
    echo.
    echo Press any key to open the Firebase Console...
    start https://console.firebase.google.com/project/invoice-2b451/firestore/rules
)

pause

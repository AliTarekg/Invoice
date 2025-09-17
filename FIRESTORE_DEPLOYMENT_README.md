# Firebase Firestore Security Rules

## Deploy Rules via Firebase Console (Web Interface)

Since CLI login is having issues, here's how to deploy the rules manually:

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project: `invoice-2b451`

### Step 2: Go to Firestore Database
1. Click on "Firestore Database" in the left sidebar
2. Click on the "Rules" tab

### Step 3: Update Security Rules
Replace the existing rules with this simplified version:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write all documents
    // This is a permissive rule for development - you may want to restrict this later
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 4: Publish the Rules
1. Click the "Publish" button
2. Wait for the rules to deploy (usually takes 30-60 seconds)

### Step 5: Test Your App
After the rules are published, restart your development server and try accessing the app again.

## Alternative: Use Firebase CLI with Manual Login

If you prefer using CLI, you can:

1. Go to https://console.firebase.google.com/
2. Go to Project Settings → Service Accounts
3. Generate a new private key
4. Use that key with Firebase CLI

But the web interface method above should work fine for now.

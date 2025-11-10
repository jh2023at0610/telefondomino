# 🔐 Environment Variables Setup

Your app needs Firebase configuration for both client and server.

## 📋 Required Variables

### **Client-Side (Public)** - Already in `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=telefon-domino.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=telefon-domino
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=telefon-domino.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### **Server-Side (Optional for enhanced security)**:

For API routes to work with enhanced security on Vercel, you can optionally add these:

```bash
FIREBASE_PROJECT_ID=telefon-domino
FIREBASE_CLIENT_EMAIL=your-service-account-email@telefon-domino.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 🎯 How to Get Service Account Credentials (Optional)

**Note:** For basic functionality, you DON'T need these! The app will work with just the client variables.

But if you want enhanced security:

1. Go to [Firebase Console](https://console.firebase.google.com/project/telefon-domino/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

## 🚀 For Local Development

Your current `.env.local` is already set up! ✅

The app will use your Firebase project ID for authentication.

## ☁️ For Vercel Deployment

When deploying to Vercel:

1. Go to your Vercel project settings
2. **Environment Variables** tab
3. Add all the `NEXT_PUBLIC_*` variables
4. (Optional) Add `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

**That's it!** Your API routes will work on Vercel's free tier.

## ⚡ Quick Test

To verify everything works:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create a room!

---

**Important:** The app works WITHOUT service account credentials. Firebase Admin SDK will use the project ID for basic operations, which is sufficient for this game!


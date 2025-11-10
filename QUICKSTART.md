# ⚡ Quick Start Guide

Get up and running in 5 minutes!

## 🎯 Prerequisites

- Node.js 18+
- A Google account (for Firebase - free)

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (takes ~30 seconds)
3. Click the **</>** Web icon
4. Register app and copy the config values
5. Enable **Firestore Database** (production mode)

### 3. Configure Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Deploy Firestore Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init
# Select: Firestore, Functions
# Use existing project → select your project

# Deploy rules
firebase deploy --only firestore
```

### 5. You're Done! 🎉

**No Cloud Functions needed!**

Your game logic runs as Next.js API Routes (already in `app/api/` folder).

These will work automatically on Vercel's free tier when you deploy!

### 6. Create PWA Icons

Create two images and save in `public/`:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

Use [this tool](https://www.pwabuilder.com/imageGenerator) to generate them.

### 7. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**That's it!** Your multiplayer domino game is ready! 🎉

## 🎮 Test It Out

1. Open the app in 2 browser windows
2. Create a room in one window
3. Copy the room code
4. Join from the other window
5. Mark both players ready
6. Start the game!

## ❓ Troubleshooting

### "Room not found"
→ Check that you ran both migration files

### Edge functions return errors
→ Make sure you deployed them and set the secrets

### Realtime not working
→ Enable replication for all tables in Supabase dashboard

### More help
→ See the full [README.md](./README.md) or [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**That's it! You're ready to play! 🎲**




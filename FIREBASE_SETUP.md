# 🔥 Firebase Setup Guide - Telefon Domino

Complete guide to setting up Firebase for your multiplayer domino game.

## 📋 Prerequisites

- Google account (free)
- Node.js 18+ installed
- Firebase CLI: `npm install -g firebase-tools`

## 🚀 Step-by-Step Setup

### 1. Create Firebase Project (5 min)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: "Telefon Domino"
4. Disable Google Analytics (optional, not needed)
5. Click "Create Project"
6. Wait ~30 seconds for project creation

### 2. Register Web App

1. In Firebase Console, click the **</>** (Web) icon
2. Register app:
   - App nickname: "Telefon Domino Web"
   - Check "Also set up Firebase Hosting"
   - Click "Register app"
3. **Copy the Firebase config** (firebaseConfig object)
4. Click "Continue to console"

### 3. Configure Environment Variables

Create `.env.local` in your project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Paste the values from step 2.

### 4. Enable Firestore Database

1. In Firebase Console sidebar, click **Firestore Database**
2. Click "Create database"
3. Choose **"Start in production mode"** (we have security rules)
4. Select a location (choose closest to your users)
5. Click "Enable"
6. Wait ~1 minute for setup

### 5. Deploy Firestore Rules & Indexes

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Select:
# - Firestore (rules and indexes)
# - Functions
# - Hosting (optional)

# Use existing project → select your project

# Deploy rules and indexes
firebase deploy --only firestore
```

This deploys:
- Security rules (`firestore.rules`)
- Database indexes (`firestore.indexes.json`)

### 6. Game Logic (Next.js API Routes)

**Good news!** Your game logic runs as Next.js API Routes on Vercel's free tier.

**No Cloud Functions needed!** ✅

The 4 API routes are already in your `app/api/` folder:
- `/api/start-game` - Initialize game
- `/api/play-move` - Process moves
- `/api/draw-tile` - Draw from stock
- `/api/pass-turn` - Pass turn

These will automatically deploy when you push to Vercel!

### 7. Test Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and test:
1. Create a room
2. Open another browser window
3. Join with the room code
4. Play!

### 8. Enable Anonymous Authentication (Optional)

For enhanced user tracking:

1. In Firebase Console → **Authentication**
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Anonymous"
5. Save

### 9. Deploy to Vercel (Optional)

See `README.md` for deployment instructions!

## 📊 Firebase Free Tier Limits

Your game can handle:

- **Firestore:**
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
  - 1 GB storage

- **Cloud Functions:**
  - 2,000,000 invocations/month
  - 400,000 GB-seconds/month
  - 200,000 CPU-seconds/month

**Estimate:** ~1,000 active players/month on free tier! 🎉

## 🔒 Security

Your Firebase security is configured with:

✅ **Firestore Rules** - Players can only see their room data
✅ **Server-side validation** - All game logic in Cloud Functions
✅ **Sanitized state** - Players can't see others' hands
✅ **Anonymous users** - No password storage needed

## 🐛 Troubleshooting

### "Permission denied" errors
→ Make sure you deployed Firestore rules: `firebase deploy --only firestore`

### Cloud Functions not working
→ Check deployment: `firebase functions:log`
→ Verify project ID in `.firebaserc`

### Real-time not updating
→ Check Firestore rules allow reads
→ Verify you're using correct collection names

### Environment variables not loading
→ Restart dev server after changing `.env.local`
→ Make sure file is named exactly `.env.local`

## 📚 Useful Commands

```bash
# View Firebase projects
firebase projects:list

# Check deployed functions
firebase functions:list

# View function logs
firebase functions:log

# Run local emulators
firebase emulators:start

# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore
```

## 🎯 Next Steps

1. ✅ Set up Firebase project
2. ✅ Configure environment
3. ✅ Deploy rules & functions
4. ✅ Test locally
5. 🚀 **Deploy to production** (see DEPLOYMENT_GUIDE.md)

## 💡 Tips

- **Development:** Use Firebase emulators for offline development
- **Testing:** Free tier is generous - test freely!
- **Monitoring:** Check Firebase Console for usage stats
- **Logs:** Use `firebase functions:log` to debug Cloud Functions

---

**Need help?** Check [Firebase Documentation](https://firebase.google.com/docs) or open an issue!

🔥 **Happy coding with Firebase!**


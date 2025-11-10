# 🎲 Telefon Domino - Multiplayer Online Game

A real-time multiplayer domino game built with Next.js, TypeScript, and Supabase. Play the classic "Telefon" domino variant online with 2-4 players!

## ✨ Features

- **🎮 Real-time Multiplayer** - Play with 2-4 players online with instant state synchronization
- **🔒 Server-Authoritative** - All game logic runs on Supabase Edge Functions for anti-cheat
- **📱 PWA Support** - Installable as a Progressive Web App on mobile and desktop
- **🎯 Telefon Scoring** - Classic scoring system: multiples of 5 from open ends
- **🌐 Offline Support** - Graceful offline handling with reconnection
- **🎨 Beautiful UI** - Dark theme with smooth animations using Tailwind CSS
- **⚡ Fast & Responsive** - Built with Next.js 14 App Router and optimized performance

## 🎯 Game Rules

### Objective
Be the first player to reach 200 points (configurable).

### Scoring
- After each move, the open ends are summed
- If the sum is a multiple of 5 (5, 10, 15, 20, 25...), the player scores that amount
- When a round ends (player finishes or table blocked), sum all opponents' remaining tiles, round down to nearest 5, and award to winner

### Gameplay
1. Each player gets 7 tiles (2 players) or 5 tiles (3-4 players)
2. Player with highest double starts, or first player if no doubles
3. Players take turns placing tiles that match an open end
4. If no valid move, draw from "bazar" (stock) or pass
5. Round ends when a player has no tiles or table is blocked

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with dark theme
- **Zustand** - Lightweight state management
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons

### Backend
- **Firebase** - Backend-as-a-Service by Google
  - **Firestore** - NoSQL database for rooms, players, game states, moves
  - **Realtime** - Real-time document listeners for live updates
  - **Cloud Functions** - Server-side game logic (Node.js)
  - **Security Rules** - Database-level security

### PWA
- **Service Worker** - Offline support and caching
- **Web App Manifest** - Installable app metadata

## 📋 Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Google Account** (for Firebase - free tier works!)
- **Firebase CLI** (for deployment): `npm install -g firebase-tools`

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd telefon-domino
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Firebase

**Quick Setup (5 minutes):**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a Web app to your project
4. Copy the Firebase config values
5. Create `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**For detailed setup, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

### 4. Enable Firestore & Deploy Rules

```bash
# Login to Firebase
firebase login

# Initialize (select Firestore, Functions, Hosting)
firebase init

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

### 5. Deploy Cloud Functions

```bash
# Install function dependencies
cd functions && npm install && cd ..

# Deploy all Cloud Functions
firebase deploy --only functions
```

This deploys:
- `startGame` - Initialize game
- `playMove` - Process moves
- `drawTile` - Draw from stock
- `passTurn` - Pass turn

### 6. Create PWA Icons

Create two icon files in the `public/` directory:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

You can use [PWA Builder's Image Generator](https://www.pwabuilder.com/imageGenerator) or create them manually.

### 7. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Deploy Edge Functions to Supabase

```bash
supabase functions deploy --project-ref your-project-ref
```

### Set Production Environment Variables

In Vercel:
1. Go to **Settings** → **Environment Variables**
2. Add your Supabase production URL and keys
3. Redeploy

## 🧪 Testing

### Test PWA Locally

1. Build the production version:
```bash
npm run build
npm start
```

2. Open Chrome DevTools → **Application** → **Service Workers**
3. Verify service worker is registered
4. Test offline mode by checking **Offline** in Network tab

### Test Lighthouse Score

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view
```

Target: PWA score ≥ 90

### Test Multiplayer

1. Open the app in 2+ browser windows/devices
2. Create a room in one window
3. Join with the room code in other windows
4. Mark all players as ready
5. Host starts the game
6. Play tiles and verify real-time sync

## 📁 Project Structure

```
telefon-domino/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Home (create/join room)
│   ├── room/[code]/         # Lobby page
│   └── play/[code]/         # Game page
├── components/              # React components
│   ├── DominoTile.tsx      # Tile display component
│   ├── Toast.tsx           # Notification component
│   └── ReconnectOverlay.tsx # Offline overlay
├── lib/                     # Utilities
│   ├── supabase.ts         # Supabase client
│   └── domino-utils.ts     # Game helper functions
├── store/                   # State management
│   └── game-store.ts       # Zustand store
├── types/                   # TypeScript types
│   └── game.ts             # Game type definitions
├── supabase/               # Supabase config
│   ├── migrations/         # SQL migrations
│   └── functions/          # Edge Functions
│       ├── _shared/        # Shared game logic
│       ├── start-game/     # Initialize game
│       ├── play-move/      # Play a tile
│       ├── draw-tile/      # Draw from stock
│       └── pass-turn/      # Pass turn
├── public/                 # Static assets
│   ├── manifest.json       # PWA manifest
│   ├── sw.js              # Service worker
│   ├── offline.html       # Offline fallback
│   └── icon-*.png         # PWA icons
└── README.md              # This file
```

## 🎮 How to Play

### Create a Game
1. Enter your nickname
2. Click **Create New Room**
3. Share the 6-character room code with friends

### Join a Game
1. Enter your nickname
2. Enter the room code
3. Click **Join Room**

### In the Lobby
1. Wait for 2-4 players to join
2. All players click **Ready**
3. Host clicks **Start Game**

### During the Game
1. **Your Turn**: Click a tile to play it on the board
2. **Can't Play?**: Click **Draw from Bazar** to get a new tile
3. **No Moves?**: Click **Pass Turn** to skip
4. **Scoring**: Watch for "Telefon!" notifications when you score
5. **Win**: First to 200 points wins!

## 🐛 Troubleshooting

### Service Worker Not Registering
- Make sure you're on HTTPS or localhost
- Check browser console for errors
- Clear cache and reload

### Realtime Not Working
- Verify Supabase Realtime is enabled in project settings
- Check browser console for WebSocket errors
- Ensure RLS policies are correct

### Edge Functions Failing
- Check function logs: `supabase functions logs <function-name>`
- Verify environment variables are set
- Ensure service role key is correct

### Game State Not Syncing
- Check database permissions (RLS policies)
- Verify all players are in same room
- Check network tab for failed requests

## 📊 Database Schema

### Tables

**rooms**
- `id` (uuid) - Primary key
- `code` (text) - 6-char room code
- `status` (text) - lobby | running | finished
- `target_score` (int) - Win condition (default 200)

**room_members**
- `room_id` (uuid) - Foreign key to rooms
- `user_id` (text) - Player UUID
- `nickname` (text) - Display name
- `seat` (int) - Player position (0-3)
- `ready` (boolean) - Ready status

**game_states**
- `room_id` (uuid) - Primary key
- `board` (jsonb) - Played tiles
- `hands` (jsonb) - Per-player tile arrays
- `scores` (jsonb) - Per-player scores
- `turn` (int) - Current player seat
- `stock` (jsonb) - Remaining tiles

**moves**
- `room_id` (uuid) - Foreign key to rooms
- `type` (text) - play | draw | pass
- `payload` (jsonb) - Move details

## 🔐 Security Features

- **Server-Authoritative**: All game logic runs server-side
- **Row Level Security**: Players can only see their own data
- **Sanitized States**: Other players' hands are hidden
- **Move Validation**: Server validates every move
- **Anti-Cheat**: Client can't manipulate game state

## 🎨 Customization

### Change Theme Colors
Edit `tailwind.config.ts` and `app/globals.css`

### Change Target Score
Modify default in `supabase/migrations/001_initial_schema.sql` or update via UI

### Add More Tile Sets
Extend `components/DominoTile.tsx` with different designs

### Custom Sounds
Add audio files and play on events in game page

## 📄 License

MIT License - feel free to use this project for learning or production!

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check Supabase documentation
- Review Next.js documentation

## 🎉 Acknowledgments

- Domino rules based on classic "Telefon" variant
- Built with amazing open-source tools
- Inspired by traditional domino games

---

**Enjoy playing Telefon Domino! 🎲**




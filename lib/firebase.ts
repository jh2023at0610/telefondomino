// Firebase Configuration and Initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
  
  if (useEmulators) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('🔧 Connected to Firebase emulators');
    } catch (error) {
      console.log('⚠️ Already connected to emulators');
    }
  }
}

// Helper: Get or create anonymous user ID
export function getOrCreatePlayerId(): { userId: string; nickname: string } {
  if (typeof window === 'undefined') {
    return { userId: '', nickname: '' };
  }

  let userId = localStorage.getItem('telefon_user_id');
  let nickname = localStorage.getItem('telefon_nickname');

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('telefon_user_id', userId);
  }

  if (!nickname) {
    nickname = `Player_${Math.floor(Math.random() * 9999)}`;
    localStorage.setItem('telefon_nickname', nickname);
  }

  return { userId, nickname };
}

export function updateNickname(newNickname: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('telefon_nickname', newNickname);
}

// Helper: Generate short room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Note: Cloud Functions replaced with Next.js API Routes
// See lib/api-client.ts for API calls

export default app;


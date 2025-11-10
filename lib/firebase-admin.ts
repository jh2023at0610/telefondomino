// Firebase Client SDK for API Routes (works with Firestore security rules)
// We use the client SDK instead of Admin SDK to avoid credential issues in development
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firestore: Firestore;

// Get Firestore instance (works in API routes with proper security rules)
export function getAdminDb(): Firestore {
  if (!firestore) {
    // Initialize Firebase if not already done
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig, 'server');
    firestore = getFirestore(app);
  }
  return firestore;
}


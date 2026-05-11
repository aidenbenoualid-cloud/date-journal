import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 🔑 Replace with your Firebase project config
// Firebase Console → Project Settings → Your apps → Web app
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApps()[0];

// persistentLocalCache writes to IndexedDB before server sync,
// so data survives page navigation even before server acknowledges.
// Only call initializeFirestore on first init — subsequent calls use getFirestore.
export const db = isFirstInit
  ? initializeFirestore(app, { localCache: persistentLocalCache() })
  : getFirestore(app);

export const storage = getStorage(app);

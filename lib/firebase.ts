import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDy0Vat1oIZsCuAeGcAcv2UutCniAjs3ow",
  authDomain: "datejournal-d246a.firebaseapp.com",
  projectId: "datejournal-d246a",
  messagingSenderId: "733245542362",
  appId: "1:733245542362:web:66f59279144232ff813ae3",
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApps()[0];

export const db = isFirstInit
  ? initializeFirestore(app, { localCache: persistentLocalCache() })
  : getFirestore(app);

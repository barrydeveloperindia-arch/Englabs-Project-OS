import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// load JSON
const trips = JSON.parse(fs.readFileSync('data/porter_missions_forensic.json', 'utf8'));

(async () => {
  console.log(`Syncing ${trips.length} trips to Firestore porter_ledger...`);
  let count = 0;
  for (const trip of trips) {
    try {
      const docRef = doc(db, 'porter_ledger', trip.id);
      await setDoc(docRef, {
        ...trip,
        timestamp: trip.timestamp || new Date().toISOString(),
        migratedAt: new Date().toISOString()
      }, { merge: true });
      count++;
    } catch (e) {
      console.error(`Failed to sync ${trip.id}:`, e);
    }
  }
  console.log(`Successfully synced ${count} trips to Firestore`);
  process.exit(0);
})();

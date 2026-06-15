import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

(async () => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  try {
    await signInWithEmailAndPassword(auth, 'englabscivilteam@gmail.com', 'Ram@2026');
    console.log('Auth successful.');
  } catch (e) {
    console.error('Auth failed:', e.message);
    process.exit(1);
  }
  
  const collections = ['inventory_ledger', 'vendor_ledger', 'finance_ledger', 'porter_ledger', 'food_ledger'];
  let totalDeleted = 0;
  
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`${col} count: ${snap.size}`);
      
      for (const d of snap.docs) {
          const data = d.data();
          if (data.createdBy === 'englabscivilteam@gmail.com') {
              console.log(`Found test doc in ${col}:`, data);
              // Do NOT delete yet, just report
          }
      }
    } catch (e) {
      console.error(`Error reading ${col}:`, e.message);
    }
  }
  
  process.exit(0);
})();

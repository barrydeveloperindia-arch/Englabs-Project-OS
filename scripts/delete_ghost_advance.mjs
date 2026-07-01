import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

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

const jsonPath = path.join(__dirname, '../data/porter_advances_forensic.json');

(async () => {
  try {
    // 1. Update local JSON file
    console.log("Reading local advances JSON file...");
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`Original advances count: ${data.length}`);
    const filteredData = data.filter(item => item.id !== 'ADV-2026-0001');
    console.log(`Filtered advances count: ${filteredData.length}`);
    
    fs.writeFileSync(jsonPath, JSON.stringify(filteredData, null, 2), 'utf8');
    console.log("Local advances JSON file successfully updated!");

    // 2. Delete from Firestore
    console.log("Deleting ADV-2026-0001 from Firestore porter_ledger collection...");
    const docRef = doc(db, 'porter_ledger', 'ADV-2026-0001');
    await deleteDoc(docRef);
    console.log("Successfully deleted ADV-2026-0001 from Firestore!");

  } catch (error) {
    console.error("An error occurred during cleanup:", error);
  }
  process.exit(0);
})();

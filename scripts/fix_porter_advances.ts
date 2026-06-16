import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try both .env.local and .env
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

async function fixAdvances() {
    const ids = ['PTR-2026-0020', 'PTR-2026-0021'];
    
    for (const id of ids) {
        try {
            const docRef = doc(db, 'porter_ledger', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log(`Found ${id}, current advance: ${data.advanceAmount}`);
                
                const remainingBalance = data.grossAmount - 0; // advance becomes 0
                
                await updateDoc(docRef, {
                    advanceAmount: 0,
                    remainingBalance: remainingBalance
                });
                console.log(`Successfully removed advance for ${id}. New balance: ${remainingBalance}`);
            } else {
                console.log(`Document ${id} not found in porter_ledger`);
            }
        } catch (error) {
            console.error(`Error updating ${id}:`, error);
        }
    }
}

fixAdvances().then(() => {
    console.log("Done");
    process.exit(0);
});

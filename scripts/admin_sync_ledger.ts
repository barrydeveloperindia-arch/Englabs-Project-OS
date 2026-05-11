import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📂 LOAD CONFIG
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

async function syncLedger() {
    console.log("🚀 STARTING CLOUD SYNC: Englabs Gate Registry...");
    
    try {
        const dataPath = path.join(__dirname, '../data/forensic_gate_registry.json');
        if (!fs.existsSync(dataPath)) {
            console.error("❌ ERROR: forensic_gate_registry.json not found!");
            return;
        }

        const entries = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`📊 Found ${entries.length} local entries.`);

        for (const entry of entries) {
            console.log(`  -> Syncing [${entry.id}]: ${entry.materialName}`);
            const docRef = doc(db, "gate_entries", entry.id);
            await setDoc(docRef, {
                ...entry,
                syncedAt: new Date().toISOString(),
                syncSource: 'CLI_ADMIN_TOOL'
            });
        }

        console.log("✅ SUCCESS: All data synchronized to Firebase Firestore.");
    } catch (e) {
        console.error("❌ CRITICAL SYNC FAILURE:", e);
    }
}

syncLedger();

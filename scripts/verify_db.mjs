import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    console.log("Querying Firebase for latest transaction...");
    const q = query(collection(db, "master_register"), orderBy("timestamp", "desc"), limit(1));
    const snapshot = await getDocs(q);
    
    const output = [];
    snapshot.forEach(doc => {
        output.push({ id: doc.id, ...doc.data() });
    });
    
    fs.writeFileSync("C:/Users/SAM/.gemini/antigravity-ide/brain/c3287138-1f18-4313-a7ad-c84526af4e61/scratch/firebase_db.json", JSON.stringify(output, null, 2));
    console.log("Database evidence saved.");
    process.exit(0);
}

run();

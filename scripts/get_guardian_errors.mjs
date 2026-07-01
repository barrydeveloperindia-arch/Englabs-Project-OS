import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import dotenv from "dotenv";

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
    console.log("Fetching latest guardian errors...");
    const q = query(collection(db, "guardian_errors"), orderBy("timestamp", "desc"), limit(20));
    const snapshot = await getDocs(q);
    
    const errors = [];
    snapshot.forEach(doc => {
        errors.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("=== RECENT GUARDIAN ERRORS ===");
    console.log(JSON.stringify(errors, null, 2));
    process.exit(0);
}

run();

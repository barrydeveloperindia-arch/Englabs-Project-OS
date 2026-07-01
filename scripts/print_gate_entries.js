import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import dotenv from "dotenv";

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
const auth = getAuth(app);

async function test() {
    try {
        await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("Authenticated!");
        
        console.log("Fetching gate entries...");
        const snap = await getDocs(query(collection(db, "gate_entries"), limit(5)));
        console.log(`Fetched ${snap.size} entries.`);
        snap.forEach(doc => {
            console.log(`Entry ID: ${doc.id}`);
            console.log(JSON.stringify(doc.data(), null, 2));
            console.log("-----------------------------------------");
        });
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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
        console.log("Authenticating...");
        await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("Authenticated!");
        
        console.log("Fetching projects...");
        const snap = await getDocs(collection(db, "projects"));
        console.log(`Success! Fetched ${snap.size} projects.`);
        
        console.log("Fetching porter_ledger...");
        const snap2 = await getDocs(collection(db, "porter_ledger"));
        console.log(`Success! Fetched ${snap2.size} porter entries.`);
        
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();

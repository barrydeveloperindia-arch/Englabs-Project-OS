import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
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
const auth = getAuth(app);

async function run() {
    try {
        console.log("🔐 Authenticating as Admin...");
        const credential = await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("✅ Authenticated successfully!");

        console.log("\n🔍 Fetching all items from 'current_stock' collection...");
        const q = query(collection(db, "current_stock"));
        const snapshot = await getDocs(q);

        console.log(`\n📦 Total Items in Stock: ${snapshot.size}`);
        console.log(`--------------------------------------------------------------------------------`);
        console.log(String("ITEM CODE").padEnd(30) + " | " + String("ITEM NAME").padEnd(30) + " | " + String("STOCK").padStart(10) + " | " + String("UNIT"));
        console.log(`--------------------------------------------------------------------------------`);
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            if (id === 'Eng-099' || id === 'JK_CEMENT' || id === 'PAINT_40_LTR' || id === 'BLUE_PAINT_1_LTR' || id === 'Eng-079') {
                console.log(`\n📄 Raw data for [${id}]:`, JSON.stringify(data, null, 2));
            }
        });
        console.log(`--------------------------------------------------------------------------------\n`);
        process.exit(0);
    } catch (e) {
        console.error("❌ Verification failed:", e);
        process.exit(1);
    }
}

run();

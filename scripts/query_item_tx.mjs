import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
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
        console.log("🔐 Authenticating...");
        await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("✅ Authenticated!");

        console.log("\n🔍 Fetching transactions for 'Eng-099'...");
        const q = query(collection(db, "master_register"), where("itemCode", "==", "Eng-099"));
        const snapshot = await getDocs(q);

        console.log(`\n📋 Found ${snapshot.size} Transactions:`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`----------------------------------------`);
            console.log(`Doc ID   : ${doc.id}`);
            console.log(`Timestamp: ${data.timestamp}`);
            console.log(`Type     : ${data.type}`);
            console.log(`Qty      : ${data.quantity}`);
            console.log(`Project  : ${data.projectId}`);
            console.log(`Balance  : ${data.balanceStockAfterIssue}`);
        });
        console.log(`----------------------------------------\n`);
        process.exit(0);
    } catch (e) {
        console.error("❌ Failed:", e);
        process.exit(1);
    }
}

run();

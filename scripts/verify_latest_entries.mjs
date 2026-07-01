import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
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
        console.log("✅ Authenticated successfully! Admin Email:", credential.user.email);

        console.log("\n🔍 Fetching latest entries from 'master_register' collection...");
        const q = query(collection(db, "master_register"), orderBy("timestamp", "desc"), limit(5));
        const snapshot = await getDocs(q);

        console.log(`\n📋 Latest ${snapshot.size} Entries Saved in Firebase:`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`----------------------------------------`);
            console.log(`Document ID: ${doc.id}`);
            console.log(`Timestamp  : ${data.timestamp}`);
            console.log(`Type       : ${data.type}`);
            console.log(`Material   : ${data.materialName || 'N/A'}`);
            console.log(`Quantity   : ${data.quantity} ${data.unit || ''}`);
            console.log(`Project ID : ${data.projectId || 'N/A'}`);
            console.log(`Issued By  : ${data.issuedBy || 'N/A'}`);
            console.log(`Party      : ${data.partyName || 'N/A'}`);
            if (data.items && Array.isArray(data.items)) {
                console.log(`Items      :`);
                data.items.forEach(item => {
                    console.log(`  - ${item.name}: ${item.quantity} ${item.unit || ''}`);
                });
            }
        });
        console.log(`----------------------------------------\n`);
        process.exit(0);
    } catch (e) {
        console.error("❌ Verification failed:", e);
        process.exit(1);
    }
}

run();

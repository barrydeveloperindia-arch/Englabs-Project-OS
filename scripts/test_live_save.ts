import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
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
        console.log("🔐 Authenticating with Staff/Admin account...");
        // Authenticating as Staff
        const credential = await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("✅ Authenticated successfully! User Email:", credential.user.email);

        // 1. Try writing to master_register
        console.log("\n🧪 Testing write to 'master_register'...");
        const testDocRef = await addDoc(collection(db, "master_register"), {
            timestamp: new Date().toISOString(),
            projectId: 'GENERAL',
            materialName: 'Test Material (AI Agent)',
            itemCode: 'TEST_AI_123',
            category: 'GENERAL',
            quantity: 1,
            unit: 'Nos',
            staffName: 'Test Staff',
            issuedBy: 'AI Agent Test',
            balanceStockAfterIssue: 10,
            remarks: 'Verify Write Permission Success',
            type: 'INWARD'
        });
        console.log("✅ SUCCESS! Written doc ID:", testDocRef.id);

        // 2. Query the doc back
        console.log("\n🔍 Verifying if document is persisted in database...");
        const q = query(collection(db, "master_register"), orderBy("timestamp", "desc"), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
            console.log("❌ ERROR: No documents found in master_register!");
        } else {
            const doc = snap.docs[0];
            const data = doc.data();
            console.log("✅ SUCCESS! Retrieved latest doc from Firebase:");
            console.log("   - ID:", doc.id);
            console.log("   - Material Name:", data.materialName);
            console.log("   - Timestamp:", data.timestamp);
        }
        process.exit(0);
    } catch (e: any) {
        console.error("\n❌ FAILED: Write test failed due to permission or connection issues!");
        console.error("   Error Message:", e.message);
        process.exit(1);
    }
}

run();

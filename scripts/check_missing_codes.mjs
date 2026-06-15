import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

async function run() {
    console.log("Fetching material catalog...");
    const snap = await getDocs(collection(db, "material_catalog"));
    const items = snap.docs.map(d => ({ itemCode: d.id, ...d.data() }));

    const searchNames = ["Kitchen Pocha", "Garbage bag Big", "Hardener", "Harpic", "Acid", "Phenyle"];

    for (const item of items) {
        for (const sn of searchNames) {
            if (item.name && item.name.toLowerCase().includes(sn.toLowerCase())) {
                console.log(`Found matching catalog item: ${item.name} -> Code: ${item.itemCode}`);
            }
        }
    }
    
    // Also let's find all unique bad codes in the transactions
    console.log("\nFetching bad codes in transactions...");
    const badCodes = new Set();
    const badItems = {};
    
    const txSnap = await getDocs(collection(db, "master_register"));
    txSnap.docs.forEach(d => {
        const t = d.data();
        if (t.itemCode && !t.itemCode.toUpperCase().startsWith('ENG')) {
            badCodes.add(t.itemCode);
            badItems[t.itemCode] = t.materialName;
        }
    });

    const mSnap = await getDocs(collection(db, "monthly_registers", "June", "entries"));
    mSnap.docs.forEach(d => {
        const t = d.data();
        if (t.itemCode && !t.itemCode.toUpperCase().startsWith('ENG')) {
            badCodes.add(t.itemCode);
            badItems[t.itemCode] = t.materialName;
        }
    });

    console.log("Remaining bad codes in transactions:");
    for (const code of badCodes) {
        console.log(`${code} (${badItems[code]})`);
    }

    process.exit(0);
}

run().catch(console.error);

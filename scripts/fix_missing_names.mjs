import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
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

async function fixMissingNames() {
    console.log("Fetching material_catalog to build name map...");
    const catalogSnap = await getDocs(collection(db, "material_catalog"));
    const nameMap = {};
    catalogSnap.docs.forEach(d => {
        const data = d.data();
        if (data.name) {
            nameMap[d.id] = data.name;
        }
    });

    console.log("Fetching current_stock to check for missing names...");
    const stockSnap = await getDocs(collection(db, "current_stock"));
    let updateCount = 0;

    for (const d of stockSnap.docs) {
        const data = d.data();
        
        // If name is completely missing or empty string
        if (!data.name || data.name.trim() === '') {
            let correctName = nameMap[d.id];
            
            // Fallback: If it's missing from catalog too, try to derive from something else or just put 'Unknown'
            if (!correctName) {
                correctName = data.materialName || data.itemCode || `Unknown Material ${d.id}`;
            }

            console.log(`Fixing missing name for ${d.id}: -> '${correctName}'`);
            
            try {
                await updateDoc(doc(db, "current_stock", d.id), { name: correctName });
                updateCount++;
            } catch (e) {
                console.error(`Failed to update ${d.id}`, e);
            }
        }
    }

    console.log(`Finished! Restored missing names for ${updateCount} items in current_stock.`);
    process.exit(0);
}

fixMissingNames().catch(console.error);

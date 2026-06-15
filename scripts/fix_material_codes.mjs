import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
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

function removeUndefined(obj) {
    const newObj = {};
    Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
            newObj[key] = obj[key];
        }
    });
    return newObj;
}

async function fixCodes() {
    console.log("Fetching current stock...");
    const snap = await getDocs(collection(db, "current_stock"));
    if (snap.empty) {
        console.log("No data found.");
        process.exit(0);
    }

    const items = snap.docs.map(d => ({ itemCode: d.id, ...d.data() }));
    console.log(`Found ${items.length} total items.`);

    let maxEng = 0;
    items.forEach(i => {
        const match = i.itemCode?.match(/ENG-?(\d+)/i);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxEng) maxEng = num;
        }
    });

    const badItems = items.filter(i => i.itemCode && !i.itemCode.toUpperCase().startsWith('ENG'));
    console.log(`Found ${badItems.length} items to fix.`);

    if (badItems.length === 0) {
        console.log("No bad items left! All fixed.");
        process.exit(0);
    }

    for (const oldItem of badItems) {
        maxEng++;
        const newCode = `ENG-${String(maxEng).padStart(4, '0')}`;
        console.log(`Migrating ${oldItem.itemCode} -> ${newCode}...`);

        const newItem = removeUndefined({ ...oldItem, itemCode: newCode });
        if (newItem.id) delete newItem.id;

        try {
            await setDoc(doc(db, "inventory_stock", newCode), newItem);
            await setDoc(doc(db, "current_stock", newCode), removeUndefined({
                ...newItem,
                openingStock: oldItem.availableStock || 0,
                availableStock: oldItem.availableStock || 0,
            }));
            await setDoc(doc(db, "material_catalog", newCode), removeUndefined({
                itemCode: newCode,
                name: oldItem.name || oldItem.itemCode,
                category: oldItem.category || 'GENERAL',
                unit: oldItem.unit || 'Nos',
                location: oldItem.location || 'MAIN STORE',
                minThreshold: oldItem.minThreshold || 5,
                unitPrice: oldItem.unitPrice || 0
            }));

            await deleteDoc(doc(db, "inventory_stock", oldItem.itemCode));
            await deleteDoc(doc(db, "current_stock", oldItem.itemCode));
            await deleteDoc(doc(db, "material_catalog", oldItem.itemCode));

            console.log(`Successfully migrated ${oldItem.itemCode}`);
        } catch (e) {
            console.error(`Failed to migrate ${oldItem.itemCode}:`, e);
        }
    }

    console.log("Migration complete!");
    process.exit(0);
}

fixCodes().catch(console.error);

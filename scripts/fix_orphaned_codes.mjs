import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
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
    console.log("Fetching material catalog to find max ENG- code...");
    const snap = await getDocs(collection(db, "material_catalog"));
    let maxEng = 0;
    
    snap.docs.forEach(d => {
        const itemCode = d.id;
        const match = itemCode?.match(/ENG-?(\d+)/i);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxEng) maxEng = num;
        }
    });

    console.log(`Max ENG code found: ENG-${maxEng}`);

    const badMap = {}; // { 'MIS-617': { name: 'Kitchen Pocha', unit: 'Nos', newCode: 'ENG-0212' } }

    const processTxList = async (colRef) => {
        const txSnap = await getDocs(colRef);
        for (const d of txSnap.docs) {
            const t = d.data();
            if (t.itemCode && !t.itemCode.toUpperCase().startsWith('ENG')) {
                if (!badMap[t.itemCode]) {
                    maxEng++;
                    const newCode = `ENG-${String(maxEng).padStart(4, '0')}`;
                    badMap[t.itemCode] = {
                        name: t.materialName || t.itemCode,
                        unit: t.unit || 'Nos',
                        newCode: newCode
                    };
                    console.log(`Assigned new code: ${t.itemCode} -> ${newCode}`);
                }

                // Update the transaction
                try {
                    await updateDoc(doc(colRef, d.id), { itemCode: badMap[t.itemCode].newCode });
                    console.log(`Updated transaction ${d.id}`);
                } catch (e) {
                    console.error(`Failed to update transaction ${d.id}`, e);
                }
            }
        }
    };

    console.log("\nProcessing master_register...");
    await processTxList(collection(db, "master_register"));

    console.log("\nProcessing monthly_registers/June/entries...");
    await processTxList(collection(db, "monthly_registers", "June", "entries"));

    console.log("\nAdding newly assigned codes to material_catalog...");
    for (const [oldCode, info] of Object.entries(badMap)) {
        try {
            await setDoc(doc(db, "material_catalog", info.newCode), {
                itemCode: info.newCode,
                name: info.name,
                category: 'GENERAL',
                unit: info.unit,
                location: 'MAIN STORE',
                minThreshold: 5,
                unitPrice: 0
            });
            console.log(`Added ${info.name} (${info.newCode}) to catalog`);
        } catch (e) {
            console.error(`Failed to add ${info.newCode} to catalog`, e);
        }
    }

    console.log("Completely finished orphaned item fix!");
    process.exit(0);
}

run().catch(console.error);

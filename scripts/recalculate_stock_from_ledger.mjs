import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
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

const mapping = {
  "100_ML_UNIVERSAL_STAINER": "ENG-0162",
  "100_ML_UNIVERSAL_STAINER_YELLOW": "ENG-0163",
  "18W_LED_ROD": "ENG-0164",
  "200_ML_UNIVERSAL_STAINER_RED": "ENG-0165",
  "22W_LED_BULB": "ENG-0166",
  "2_INCH_PAINT_BRUSH": "ENG-0167",
  "BIRLA_WALL_PAINTS": "ENG-0168",
  "BLUE_PAINT_1_LTR": "ENG-0169",
  "BOARD_ELECTRIC": "ENG-0196",
  "BULB": "ENG-0171",
  "FAN_CASE_SHEET_BIG": "ENG-0197",
  "FAN_CASE_SHEET_SMALL": "ENG-0198",
  "FAN_SHEET_BIG": "ENG-0174",
  "FAN_SHEET_SMALL": "ENG-0175",
  "GITTE_10MM": "ENG-0199",
  "GITTE_7MM": "ENG-0200",
  "GITTE_7X35_FLAT": "ENG-0201",
  "JK_CEMENT": "ENG-0179",
  "LED_22W": "ENG-0202",
  "LED_8W": "ENG-0203",
  "LED_BULB": "ENG-0204",
  "LED_ROD_36W": "ENG-0205",
  "MCB": "ENG-0184",
  "MOBE": "ENG-0206",
  "NOSE_PLIER": "ENG-0186",
  "PAINT_40_LTR": "ENG-0187",
  "ROFF_TILE_CLEANER_5_LTR": "ENG-0188",
  "SCREW_DRIVER": "ENG-0207",
  "SCREW_GITTE": "ENG-0208",
  "TIE_BIG": "ENG-0209",
  "TIE_SMALL": "ENG-0210",
  "WATER_BOTTLE_250ML_VIRASAT": "ENG-0193",
  "WIRE_CASING": "ENG-0194",
  "WIRE_CASING_7MM": "ENG-0211"
};

async function run() {
    try {
        console.log("🔐 Authenticating...");
        await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("✅ Authenticated!");

        // 1. Update incorrect item codes in master_register
        console.log("\n🛠️ [STEP 1] Scanning and correcting item codes in 'master_register'...");
        const masterSnap = await getDocs(collection(db, "master_register"));
        console.log(`Found ${masterSnap.size} total master transactions.`);
        
        let masterUpdates = 0;
        for (const docSnap of masterSnap.docs) {
            const data = docSnap.data();
            const badCode = data.itemCode;
            if (badCode && mapping[badCode]) {
                const goodCode = mapping[badCode];
                await updateDoc(docSnap.ref, { itemCode: goodCode });
                console.log(`  -> Updated master transaction ${docSnap.id}: ${badCode} -> ${goodCode}`);
                masterUpdates++;
            }
        }
        console.log(`Finished master_register update. Total updated: ${masterUpdates}`);

        // 2. Update monthly_registers June entries
        console.log("\n🛠️ [STEP 2] Scanning monthly_registers/June/entries...");
        const JuneSnap = await getDocs(collection(db, "monthly_registers", "June", "entries"));
        let monthlyUpdates = 0;
        for (const docSnap of JuneSnap.docs) {
            const data = docSnap.data();
            const badCode = data.itemCode;
            if (badCode && mapping[badCode]) {
                const goodCode = mapping[badCode];
                await updateDoc(docSnap.ref, { itemCode: goodCode });
                console.log(`  -> Updated monthly transaction ${docSnap.id}: ${badCode} -> ${goodCode}`);
                monthlyUpdates++;
            }
        }
        console.log(`Finished monthly_registers update. Total updated: ${monthlyUpdates}`);

        // 3. Delete bad codes from current_stock, material_catalog, inventory_stock
        console.log("\n🛠️ [STEP 3] Deleting bad code documents from collections...");
        for (const badCode of Object.keys(mapping)) {
            console.log(`  -> Deleting bad code documents for: ${badCode}`);
            await deleteDoc(doc(db, "current_stock", badCode)).catch(() => null);
            await deleteDoc(doc(db, "material_catalog", badCode)).catch(() => null);
            await deleteDoc(doc(db, "inventory_stock", badCode)).catch(() => null);
        }
        console.log("Deletion complete.");

        // 4. Fetch all master register transactions again to compute stock
        console.log("\n🛠️ [STEP 4] Recalculating stock levels from master_register...");
        const freshMasterSnap = await getDocs(collection(db, "master_register"));
        const txns = freshMasterSnap.docs.map(d => d.data());

        // Map of itemCode -> { totalInward, totalOutward }
        const stockTotals = {};
        txns.forEach(tx => {
            const code = tx.itemCode;
            if (!code) return;
            if (!stockTotals[code]) {
                stockTotals[code] = { totalInward: 0, totalOutward: 0 };
            }
            const qty = parseFloat(tx.quantity) || 0;
            if (tx.type === 'INWARD') {
                stockTotals[code].totalInward += qty;
            } else if (tx.type === 'OUTWARD') {
                stockTotals[code].totalOutward += qty;
            }
        });

        // 5. Update current_stock with recalculated totals
        console.log("\n🛠️ [STEP 5] Updating current_stock database documents...");
        const currentStockSnap = await getDocs(collection(db, "current_stock"));
        let updatedDocs = 0;

        for (const docSnap of currentStockSnap.docs) {
            const data = docSnap.data();
            const itemCode = docSnap.id;
            const totals = stockTotals[itemCode] || { totalInward: 0, totalOutward: 0 };
            
            const newInward = totals.totalInward;
            const newOutward = totals.totalOutward;
            const openingStock = data.openingStock || 0;
            const availableStock = openingStock + newInward - newOutward;

            // Only update if values changed
            if (data.totalInward !== newInward || data.totalOutward !== newOutward || data.availableStock !== availableStock) {
                await updateDoc(docSnap.ref, {
                    totalInward: newInward,
                    totalOutward: newOutward,
                    availableStock: availableStock,
                    lastUpdated: new Date().toISOString()
                });
                console.log(`  -> Updated [${itemCode}]: In=${newInward}, Out=${newOutward}, Available=${availableStock}`);
                updatedDocs++;
            }
        }
        console.log(`Reconciliation finished! Updated ${updatedDocs} stock items.`);
        process.exit(0);
    } catch (e) {
        console.error("❌ Failed:", e);
        process.exit(1);
    }
}

run();

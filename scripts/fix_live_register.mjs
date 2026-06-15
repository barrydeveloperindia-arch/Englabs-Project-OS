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

async function fixCollection(colName, subPath = null) {
    console.log(`\n--- Fixing Codes in ${colName} ${subPath ? '(' + subPath + ')' : ''} ---`);
    let colRef = subPath ? collection(db, colName, subPath[0], subPath[1]) : collection(db, colName);

    const snap = await getDocs(colRef);
    if (snap.empty) {
        console.log(`No transactions found.`);
        return;
    }

    const txns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    let updateCount = 0;

    for (const t of txns) {
        if (t.itemCode && !t.itemCode.toUpperCase().startsWith('ENG')) {
            const correctCode = mapping[t.itemCode];
            if (correctCode) {
                try {
                    await updateDoc(doc(colRef, t.id), { itemCode: correctCode });
                    console.log(`Fixed exact code for ${t.itemCode} -> ${correctCode} (ID: ${t.id})`);
                    updateCount++;
                } catch (e) {
                    console.error(`Failed to update ${t.id}:`, e);
                }
            } else {
                console.log(`WARNING: Could not find mapping for ${t.itemCode}`);
            }
        }
    }

    console.log(`Fixed ${updateCount} leftover material codes.`);
}

async function run() {
    await fixCollection("master_register");
    await fixCollection("monthly_registers", ["June", "entries"]);
    process.exit(0);
}

run().catch(console.error);

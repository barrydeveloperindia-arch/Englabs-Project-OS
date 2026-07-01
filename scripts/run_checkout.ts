import { processInventoryUpdate } from '../src/shared/services/inventory_service';
import { auth } from '../src/shared/services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';
dotenv.config();
globalThis.import = { meta: { env: { DEV: false, VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID } } } as any;


const entry = {
    id: `INV_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'OUTWARD',
    materialName: 'Dhoti', // Material name
    quantity: 1, // checkout 1 qty
    unit: 'Pcs',
    partyName: 'SITE TEAM', // who it was issued to
    invoiceNumber: 'TEST-CHECKOUT',
    issuedBy: 'Test Admin',
    fromLocation: 'MAIN STORE',
    toLocation: 'SITE',
    projectId: 'MAA_MANSA_STORE',
    items: [
        { name: "Dhoti", quantity: 1, unit: "Pcs", hsnCode: "PPE" }
    ]
};

async function run() {
    console.log("🔐 Authenticating with Staff/Admin account...");
    try {
        await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("✅ Authenticated successfully!");
        console.log("Checking out items:", entry.items);
        const results = await processInventoryUpdate(entry as any);
        console.log("Result:", results);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

run();

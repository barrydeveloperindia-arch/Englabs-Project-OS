import { processInventoryUpdate } from '../src/shared/services/inventory_service';
import { auth } from '../src/shared/services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';
dotenv.config();

const entry = {
    id: `INV_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'INWARD',
    materialName: 'MULTI',
    quantity: 1,
    unit: 'LOT',
    partyName: 'Maa Mansa Devi Sanitary And Hardware Store',
    invoiceNumber: '15-06-2026',
    issuedBy: 'Arjun Tiwari',
    toLocation: 'MAIN STORE',
    projectId: 'MAA_MANSA_STORE',
    items: [
        { name: "Paint 40 LTR", quantity: 2, unit: "Balti", hsnCode: "PAINT" },
        { name: "Blue Paint 1 LTR", quantity: 1, unit: "Nos", hsnCode: "PAINT" },
        { name: "100 ML Universal Stainer", quantity: 1, unit: "Nos", hsnCode: "PAINT" },
        { name: "200 ML Universal Stainer Red", quantity: 1, unit: "Nos", hsnCode: "PAINT" },
        { name: "100 ML Universal Stainer Yellow", quantity: 1, unit: "Nos", hsnCode: "PAINT" },
        { name: "2 Inch Paint Brush", quantity: 2, unit: "Pcs", hsnCode: "TOOL" },
        { name: "Roff Tile Cleaner 5 LTR", quantity: 1, unit: "Nos", hsnCode: "CHEMICAL" },
        { name: "Dhoti", quantity: 5, unit: "Pcs", hsnCode: "PPE" },
        { name: "JK Cement", quantity: 1, unit: "Bag", hsnCode: "GENERAL" }
    ]
};

async function run() {
    console.log("🔐 Authenticating with Staff/Admin account...");
    try {
        await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("✅ Authenticated successfully!");
        console.log("Checking in items:", entry.items);
        const results = await processInventoryUpdate(entry as any);
        console.log("Result:", results);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

run();

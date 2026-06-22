import { config } from 'dotenv';
config();

// Mock import.meta for Node.js
(globalThis as any).import = { meta: { env: { DEV: true } } };

import { processInventoryUpdate } from '../src/shared/services/inventory_service';
import { saveGateEntry } from '../src/shared/services/database_service';
import forensicRegistry from '../data/forensic_gate_registry.json';

async function run() {
    try {
        console.log("Loading invoice gate entry IN-1531...");
        const entry = forensicRegistry.find((e: any) => e.id === 'IN-1531');
        if (!entry) {
            console.error("Entry IN-1531 not found in local registry!");
            process.exit(1);
        }

        console.log("Saving gate entry to Firestore...");
        const gateRes = await saveGateEntry(entry as any);
        console.log("Gate entry save result:", gateRes);

        console.log("Processing inventory update for items...");
        const invRes = await processInventoryUpdate(entry as any);
        console.log("Inventory update result:", invRes);

        console.log("Sync complete!");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

run();

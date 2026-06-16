import { config } from 'dotenv';
config(); // Load .env into process.env

// Mock import.meta for Node.js
(globalThis as any).import = { meta: { env: { DEV: true } } };

import { processInventoryUpdate } from './src/lib/domain/inventory_service';
import type { StockTransaction } from './src/lib/types/models';

async function run() {
    try {
        console.log("Checking in Fevikwik directly to Firebase...");
        
        const timestamp = new Date().toISOString();
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const tx: StockTransaction = {
            id: txId,
            referenceId: txId,
            itemCode: 'Eng-079',
            materialName: 'Fevikwik',
            category: 'Consumable',
            type: 'Check-In',
            quantity: 100,
            unit: 'NOS',
            party: 'SUMEER SANITARY AND HARDWARE STORE',
            timestamp: timestamp,
            issuedBy: 'Arjun Tiwari',
            remarks: 'FEVIKWIK 203 [20GM] - Invoice 10 dated 15-Jun-26',
            balanceStockAfterIssue: 100 // Approximation, since processInventoryUpdate usually calculates this if not present or updates it
        };

        const result = await processInventoryUpdate(tx, 'General Store / None');
        console.log("Check-in result:", result);
    } catch (e) {
        console.error("Error:", e);
    }
}

run();

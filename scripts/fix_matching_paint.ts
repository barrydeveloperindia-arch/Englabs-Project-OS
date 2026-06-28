import { config } from 'dotenv';
config();

// Mock import.meta for Node.js
(globalThis as any).import = { meta: { env: { DEV: true, ...process.env } } };

import { db, auth } from '../src/shared/services/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { processInventoryUpdate } from '../src/shared/services/inventory_service';
import { saveGateEntry } from '../src/shared/services/database_service';
import * as fs from 'fs';
import * as path from 'path';

const registryPath = path.resolve(process.cwd(), 'data', 'forensic_gate_registry.json');

async function run() {
    try {
        if (auth) {
            console.log("Authenticating anonymously...");
            await signInAnonymously(auth);
            console.log("Authenticated successfully!");
        }

        console.log("Loading forensic gate registry...");
        const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

        console.log("Finding and updating entry IN-2556...");
        const entryIndex = registry.findIndex((e: any) => e.id === 'IN-2556');
        if (entryIndex === -1) {
            console.error("Entry IN-2556 not found in registry!");
            process.exit(1);
        }

        const oldEntry = registry[entryIndex];
        console.log("Old Entry details:", JSON.stringify(oldEntry, null, 2));

        // Create the corrected entry
        const correctedEntry = {
            ...oldEntry,
            materialName: "Seven Black Gloss Paint & H.C. Robotic Aircraft Gray Paint",
            items: [
                {
                    id: 1,
                    name: "Seven Black Gloss Paint",
                    hsnCode: "32081010",
                    quantity: 4,
                    unit: "LTR",
                    rate: 900.00,
                    amount: 3600.00
                },
                {
                    id: 2,
                    name: "H.C. Robotic Aircraft Gray Paint",
                    hsnCode: "32081010",
                    quantity: 4,
                    unit: "LTR",
                    rate: 900.00,
                    amount: 3600.00
                }
            ],
            remarks: "CORRECTED INWARD PAINT FROM CHANDIGARH PAINT STORES - WRITTEN WITH PEN BY LANDOWNER"
        };

        // Update local file
        registry[entryIndex] = correctedEntry;
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
        console.log("Updated local registry file successfully.");

        if (db) {
            console.log("Connected to Firestore. Cleaning up old incorrect entry references...");

            const batch = writeBatch(db);

            // Delete old sync lock
            const oldLockRef = doc(db, "inventory_sync_locks", "IN-2556_C_SEVEN_PU_MATCHING_PAINT");
            batch.delete(oldLockRef);

            // Delete old current_stock and inventory_stock docs
            const oldStockRef = doc(db, "current_stock", "C_SEVEN_PU_MATCHING_PAINT");
            batch.delete(oldStockRef);

            const oldLegacyStockRef = doc(db, "inventory_stock", "C_SEVEN_PU_MATCHING_PAINT");
            batch.delete(oldLegacyStockRef);

            const oldCatalogRef = doc(db, "material_catalog", "C_SEVEN_PU_MATCHING_PAINT");
            batch.delete(oldCatalogRef);

            // Delete gate entry to prevent merge issues
            const gateEntryRef = doc(db, "gate_entries", "IN-2556");
            batch.delete(gateEntryRef);

            await batch.commit();
            console.log("Cleared old collections successfully.");

            // Delete any transactions in master_register/monthly_registers/inventory_logs for old itemCode
            console.log("Deleting old transaction logs from master_register and monthly_registers...");
            const collectionsToDelete = ["master_register", "inventory_logs"];
            for (const colName of collectionsToDelete) {
                const q = query(collection(db, colName), where("itemCode", "==", "C_SEVEN_PU_MATCHING_PAINT"));
                const snap = await getDocs(q);
                for (const docSnap of snap.docs) {
                    await deleteDoc(doc(db, colName, docSnap.id));
                }
            }

            // Monthly registers
            const months = ["June"]; // Current month is June 2026
            for (const month of months) {
                const q = query(collection(db, "monthly_registers", month, "entries"), where("itemCode", "==", "C_SEVEN_PU_MATCHING_PAINT"));
                const snap = await getDocs(q);
                for (const docSnap of snap.docs) {
                    await deleteDoc(doc(db, "monthly_registers", month, "entries", docSnap.id));
                }
            }
            console.log("Old transaction logs cleared.");

            // Sync the new corrected entry
            console.log("Saving new corrected gate entry to Firestore...");
            const gateRes = await saveGateEntry(correctedEntry as any);
            console.log("Gate entry save result:", gateRes);

            console.log("Processing inventory update for correct items...");
            const invRes = await processInventoryUpdate(correctedEntry as any);
            console.log("Inventory update result:", invRes);

            console.log("Database sync and update complete!");
        } else {
            console.log("No DB connection (test/offline mode).");
        }

        process.exit(0);
    } catch (e) {
        console.error("Error during execution:", e);
        process.exit(1);
    }
}

run();

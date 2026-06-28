import 'dotenv/config';

// Mock import.meta for Node.js
(globalThis as any).import = { meta: { env: { DEV: true } } };

import { processInventoryUpdate } from '../src/shared/services/inventory_service';
import { saveGateEntry } from '../src/shared/services/database_service';
import * as fs from 'fs';
import * as path from 'path';

const registryPath = path.resolve(process.cwd(), 'data', 'forensic_gate_registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const entry = {
  "id": "IN-2314",
  "timestamp": "2026-06-24T10:00:00Z",
  "type": "INWARD",
  "materialName": "Hand Gloves & Surgical Blade",
  "quantity": 52,
  "items": [
    {
      "id": 1,
      "name": "Hand Gloves",
      "hsnCode": "4015",
      "quantity": 50,
      "unit": "BOX",
      "rate": 255.00,
      "amount": 12750.00
    },
    {
      "id": 2,
      "name": "Surgical Blade",
      "hsnCode": "90189022",
      "quantity": 2,
      "unit": "PKT",
      "rate": 450.00,
      "amount": 900.00
    }
  ],
  "partyName": "JAIN SONS",
  "invoiceNumber": "2314",
  "vehicleNumber": "HAND-CARRY",
  "fromLocation": "MANIMAJRA, CHANDIGARH",
  "toLocation": "MAIN STORE",
  "amount": 13650.00,
  "billType": "GST",
  "paidAmount": 0,
  "remainingAmount": 16107.00,
  "paymentStatus": "UNPAID",
  "paymentMode": "CREDIT",
  "employeeName": "Gurpreet",
  "supervisorName": "Gaurav Panchal",
  "remarks": "STATIONERY INWARD - GLOVES & SURGICAL BLADES",
  "isLocked": true,
  "status": "VERIFIED",
  "version": 1
};

async function run() {
    try {
        console.log("Checking if IN-2314 is already in the registry...");
        const exists = registry.some((e: any) => e.id === 'IN-2314');
        if (exists) {
            console.log("Entry IN-2314 already exists in local registry. Skipping append.");
        } else {
            console.log("Appending new entry to local registry...");
            registry.push(entry);
            fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
            console.log("Appended successfully.");
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

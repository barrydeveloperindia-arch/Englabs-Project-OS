import fs from 'fs';
import path from 'path';

const masterPath = './data/master_inventory_may_2026.json';
const gatePath = './data/forensic_gate_registry.json';

// 1. Update master inventory JSON
const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
// Find SR-20260604-MASTER report
const latestReport = masterData.find(r => r.report_id === 'SR-20260604-MASTER');
if (latestReport) {
    // Check if Eng-145 already exists
    if (!latestReport.items.some(i => i.itemCode === 'Eng-145')) {
        latestReport.items.push({
            name: "Toilet Roll",
            itemCode: "Eng-145",
            category: "General",
            currentStock: 1,
            unit: "Box",
            location: "MAIN STORE",
            totalInward: 1,
            totalOutward: 0,
            minThreshold: 2,
            lastUpdated: "2026-06-18T11:00:00Z"
        });
        console.log("Added Toilet Roll to master inventory JSON.");
    }
    // Check if Eng-146 already exists
    if (!latestReport.items.some(i => i.itemCode === 'Eng-146')) {
        latestReport.items.push({
            name: "Naphthalene balls",
            itemCode: "Eng-146",
            category: "Chemicals",
            currentStock: 1,
            unit: "Kg",
            location: "MAIN STORE",
            totalInward: 1,
            totalOutward: 0,
            minThreshold: 1,
            lastUpdated: "2026-06-18T11:00:00Z"
        });
        console.log("Added Naphthalene balls to master inventory JSON.");
    }
    fs.writeFileSync(masterPath, JSON.stringify(masterData, null, 2), 'utf8');
} else {
    console.error("Latest report SR-20260604-MASTER not found!");
}

// 2. Update gate registry JSON
const gateData = JSON.parse(fs.readFileSync(gatePath, 'utf8'));
if (!gateData.some(e => e.id === 'IN-1531')) {
    gateData.push({
        id: "IN-1531",
        timestamp: "2026-06-18T11:00:00Z",
        type: "INWARD",
        materialName: "Toilet Roll & Naphthalene balls",
        quantity: 2,
        items: [
            {
                id: 1,
                name: "Toilet Roll",
                hsnCode: "GENERAL",
                quantity: 1,
                unit: "Box",
                rate: 2280,
                amount: 2280
            },
            {
                id: 2,
                name: "Naphthalene balls",
                hsnCode: "GENERAL",
                quantity: 1,
                unit: "Kg",
                rate: 260,
                amount: 260
            }
        ],
        partyName: "Sh. Lakshmi Chemical's",
        invoiceNumber: "852",
        vehicleNumber: "LOCAL",
        fromLocation: "Kalka, Hry.",
        toLocation: "MAIN STORE",
        amount: 2540,
        paidAmount: 2540,
        remainingAmount: 0,
        paymentStatus: "PAID",
        paymentMode: "CASH",
        employeeName: "SAM",
        supervisorName: "Gaurav Panchal",
        remarks: "INWARD MATERIAL - TOILET ROLL & NAPHTHALENE BALLS",
        isLocked: true,
        status: "VERIFIED",
        version: 1
    });
    console.log("Added Gate Entry IN-1531 to gate registry JSON.");
    fs.writeFileSync(gatePath, JSON.stringify(gateData, null, 2), 'utf8');
}

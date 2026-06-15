import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const data = [
  { "S.No": 1, "Item Name": "Floor Cleaner (10 LTR)", "Qty": 1, "Unit": "Nos", "Old Rate (INR)": "1400", "Market Rate (INR)": 1500, "Remarks": "" },
  { "S.No": 2, "Item Name": "AA Cell", "Qty": 15, "Unit": "Pcs", "Old Rate (INR)": "18", "Market Rate (INR)": 20, "Remarks": "Sky 5 (Refresher)" },
  { "S.No": 3, "Item Name": "AAA Cell", "Qty": 20, "Unit": "Pcs", "Old Rate (INR)": "18", "Market Rate (INR)": 20, "Remarks": "Disha / Sky 5" },
  { "S.No": 4, "Item Name": "Surf Excel", "Qty": 5, "Unit": "Kg", "Old Rate (INR)": "600", "Market Rate (INR)": 650, "Remarks": "" },
  { "S.No": 5, "Item Name": "Harpic", "Qty": 5, "Unit": "LTR", "Old Rate (INR)": "800", "Market Rate (INR)": 850, "Remarks": "10 LTR - 2 Com." },
  { "S.No": 6, "Item Name": "A4 Envelope", "Qty": 50, "Unit": "Pcs", "Old Rate (INR)": "4", "Market Rate (INR)": 5, "Remarks": "100 Envelopes" },
  { "S.No": 7, "Item Name": "Keyring [Slip]", "Qty": 50, "Unit": "Pcs", "Old Rate (INR)": "8", "Market Rate (INR)": 10, "Remarks": "100 Slip" },
  { "S.No": 8, "Item Name": "SBL Black Matt Paint", "Qty": 8, "Unit": "LTR", "Old Rate (INR)": "320", "Market Rate (INR)": 350, "Remarks": "" },
  { "S.No": 9, "Item Name": "Zip tie", "Qty": 1, "Unit": "Pack", "Old Rate (INR)": "130", "Market Rate (INR)": 150, "Remarks": "1- Midian (1-Pack)" },
  { "S.No": 10, "Item Name": "Dhoti (Cleaning Cloth)", "Qty": 50, "Unit": "Pcs", "Old Rate (INR)": "40", "Market Rate (INR)": 45, "Remarks": "100 Pcs" },
  { "S.No": 11, "Item Name": "Tissue Roll", "Qty": 50, "Unit": "Pcs", "Old Rate (INR)": "22", "Market Rate (INR)": 25, "Remarks": "1-Box (Patty)" },
  { "S.No": 12, "Item Name": "Scotch Brite", "Qty": 10, "Unit": "Pcs", "Old Rate (INR)": "15", "Market Rate (INR)": 20, "Remarks": "" },
  { "S.No": 13, "Item Name": "Note Pad", "Qty": 20, "Unit": "Pcs", "Old Rate (INR)": "20", "Market Rate (INR)": 25, "Remarks": "20-Pad" },
  { "S.No": 14, "Item Name": "A4 Paper Rim", "Qty": 10, "Unit": "Pcs", "Old Rate (INR)": "200", "Market Rate (INR)": 220, "Remarks": "Patty - C A&A (Sky 5)" },
  { "S.No": 15, "Item Name": "Pencil", "Qty": 10, "Unit": "Pcs", "Old Rate (INR)": "45", "Market Rate (INR)": 50, "Remarks": "1-Box" },
  { "S.No": 16, "Item Name": "Gloves", "Qty": 100, "Unit": "Box", "Old Rate (INR)": "220", "Market Rate (INR)": 250, "Remarks": "1 time year" },
  { "S.No": 17, "Item Name": "Surgical Blade Stand", "Qty": 10, "Unit": "Pcs", "Old Rate (INR)": "70", "Market Rate (INR)": 80, "Remarks": "" },
  { "S.No": 18, "Item Name": "OHP Marker", "Qty": 10, "Unit": "Pcs", "Old Rate (INR)": "100", "Market Rate (INR)": 120, "Remarks": "1-Box" },
  { "S.No": 19, "Item Name": "Double Sided Tape", "Qty": 10, "Unit": "Pcs", "Old Rate (INR)": "35", "Market Rate (INR)": 40, "Remarks": "LABAT ASIA" },
  { "S.No": 20, "Item Name": "Sevens Black Gloss Paint", "Qty": 4, "Unit": "LTR", "Old Rate (INR)": "1100", "Market Rate (INR)": 1200, "Remarks": "1" }
];

const ws = xlsx.utils.json_to_sheet(data);

// Auto-size columns
const wscols = [
  {wch: 6}, // S.No
  {wch: 30}, // Item Name
  {wch: 10}, // Qty
  {wch: 10}, // Unit
  {wch: 15}, // Old Rate
  {wch: 18}, // Market Rate
  {wch: 30}  // Remarks
];
ws['!cols'] = wscols;

const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Requirements_June_2026");

const targetDir = "G:/HR Team Managements/Englabs Projects APK/Material Requirment List/June-2026";
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const targetPath = path.join(targetDir, "Requirement_List_June_2026.xlsx");
xlsx.writeFile(wb, targetPath);
console.log("Created excel file at " + targetPath);

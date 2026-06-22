const XLSX = require('xlsx');
const workbook = XLSX.readFile('G:/HR Team Managements/Englabs Projects APK/Projects/Current Projects  DETAISL.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log("Data Rows starting from 4:");
for (let i = 3; i < Math.min(json.length, 10); i++) {
    console.log(`Row ${i}:`, json[i]);
}

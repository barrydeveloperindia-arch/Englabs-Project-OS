const XLSX = require('xlsx');
const workbook = XLSX.readFile('G:/HR Team Managements/Englabs Projects APK/Projects/Current Projects  DETAISL.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log("Headers:");
console.log(json[0]);
console.log("Data:");
console.log(json.slice(1, 4));

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Usage: node import_stock_report.mjs <pdf-path>
const API_KEY = "AIzaSyB4Fqw7MM1ROCjCqlFytsgAe6xSjGr-mlg";
const genAI = new GoogleGenerativeAI(API_KEY);

async function parseStockReport(filePath) {
    if (!fs.existsSync(filePath)) throw new Error("File not found");

    console.log(`[FORENSIC IMPORT] Reading: ${filePath}`);
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
        Analyze this Englabs Store Stock Report. Extract ALL itemized stock details for the Inventory Management System.
        
        CRITICAL RULES:
        1. Capture Item Name, Code, Category, Current Available Stock, Unit, and Location.
        2. Calculate Current Available Stock = Opening + Inward - Outward (if columns exist, otherwise just take 'Current Stock').
        3. Ensure no duplicates.
        
        Return pure JSON:
        {
          "report_id": "SR-YYYYMMDD",
          "report_date": "YYYY-MM-DD",
          "items": [
            {
              "name": "string",
              "itemCode": "string",
              "category": "string",
              "currentStock": 0,
              "unit": "string",
              "minThreshold": 10,
              "location": "string",
              "totalInward": 0,
              "totalOutward": 0
            }
          ]
        }
    `;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: base64Data,
                mimeType: "application/pdf"
            }
        }
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    
    return JSON.parse(jsonMatch[0]);
}

const target = process.argv[2];
if (target) {
    parseStockReport(target).then(data => {
        // Save to a local forensic ledger for the application to pick up
        const ledgerPath = path.join(process.cwd(), 'src', 'data', 'store_stock_ledger.json');
        const ledgerDir = path.dirname(ledgerPath);
        
        if (!fs.existsSync(ledgerDir)) {
            fs.mkdirSync(ledgerDir, { recursive: true });
        }
        
        let existing = [];
        if (fs.existsSync(ledgerPath)) {
            existing = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
        }
        
        // Check for duplicate report
        const isDuplicate = existing.some(r => r.report_id === data.report_id);
        if (!isDuplicate) {
            existing.push(data);
            fs.writeFileSync(ledgerPath, JSON.stringify(existing, null, 2));
            console.log(`[SUCCESS] Imported ${data.items.length} items to ${ledgerPath}`);
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(`[SKIP] Report ${data.report_id} already exists in ledger.`);
        }
    }).catch(err => {
        console.error("[ERROR]", err);
        process.exit(1);
    });
}

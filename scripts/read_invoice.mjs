import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import 'dotenv/config';

const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function parseInvoice(filePath) {
    if (!fs.existsSync(filePath)) throw new Error("File not found");

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const isPdf = filePath.toLowerCase().endsWith('.pdf');
    const mimeType = isPdf ? 'application/pdf' : 'image/jpeg';

    const prompt = `
    Analyze this supplier invoice. Extract structured data including line items, costs, and totals.
    
    CRITICAL RULES:
    1. Distinguish between 'Net Value' (Cost) and 'RRP' (Re-sale Price). Ignore RRP.
    2. If 'Line Total' is missing, calculate it: Case Qty * Case Price.
    3. Extract 'Pack Size' (e.g. from "24x330ml" -> 24).
    
    Return pure JSON:
    {
      "supplier": "string",
      "date": "YYYY-MM-DD",
      "invoice_ref": "string",
      "total_net": 0.00,
      "total_vat": 0.00,
      "total_gross": 0.00,
      "items": [
        {
          "code": "string",
          "description": "string",
          "qty_cases": 0,
          "pack_size": 1,
          "unit_cost": 0.00,
          "case_cost": 0.00,
          "line_total": 0.00,
          "vat_code": "string"
        }
      ]
    }`;

    console.log(`Analyzing ${filePath}...`);
    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType } }
    ]);
    
    const text = result.response.text();
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
}

const targetFile = process.argv[2];
if (targetFile) {
    parseInvoice(targetFile).then(data => {
        console.log(JSON.stringify(data, null, 2));
    }).catch(console.error);
} else {
    console.log("Please provide a file path.");
}

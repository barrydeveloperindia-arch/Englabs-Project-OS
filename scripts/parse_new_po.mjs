import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Verified working key and model
const API_KEY = "AIzaSyAmHfgdurUtcsl341EQgKTPsQeCUxsLyCY";
const MODEL_NAME = "gemini-2.5-flash";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

async function parsePOWithRetry(filePath, retries = 5, delay = 2000) {
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = 'image/jpeg';

    const prompt = `
    Analyze this purchase order (PO) or vendor order release document.
    Extract the following structured fields:
    1. project_id: Look for any ID starting with C followed by digits (e.g. C5230, C5251, C5283).
    2. vendor_name: The company or vendor name the purchase order is issued to.
    3. vendor_location: The city or location of the vendor (e.g., Delhi, Noida, Pune).
    4. po_number: The reference or PO number of the document (released vendor PO).
    5. cost: The total cost or gross value of the PO in INR (digits only).
    6. date: The date of the PO (in YYYY-MM-DD format).

    Return pure JSON format:
    {
      "project_id": "string",
      "vendor_name": "string",
      "vendor_location": "string",
      "po_number": "string",
      "cost": 0.00,
      "date": "YYYY-MM-DD"
    }`;

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Analyzing Vendor PO (Attempt ${i + 1}/${retries}): ${filePath}...`);
            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType } }
            ]);
            
            const text = result.response.text();
            const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
        } catch (err) {
            console.error(`Attempt ${i + 1} failed:`, err.message);
            if (i < retries - 1) {
                console.log(`Waiting ${delay}ms before retrying...`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw err;
            }
        }
    }
}

async function main() {
    const targetFile = process.argv[2] || "G:\\HR Team Managements\\Englabs Projects APK\\Projects\\Vendor PO\\23-06-2026.jpg";
    
    try {
        const parsed = await parsePOWithRetry(targetFile);
        console.log("EXTRACTED_DATA_START");
        console.log(JSON.stringify(parsed, null, 2));
        console.log("EXTRACTED_DATA_END");

        const pid = parsed.project_id;
        if (!pid) {
            console.error("No project ID found in parsed details");
            return;
        }

        // Target JSON path
        const dataDir = './data';
        const projectFile = path.join(dataDir, `${pid}.json`);

        if (!fs.existsSync(projectFile)) {
            console.error(`Project file not found: ${projectFile}`);
            return;
        }

        const projectData = JSON.parse(fs.readFileSync(projectFile, 'utf8'));

        // Normalize Excel name
        const normalizedVendorName = parsed.vendor_name.trim();

        // 1. Update poRelease
        if (!projectData.poRelease) {
            projectData.poRelease = {};
        }
        projectData.poRelease.vendorName = normalizedVendorName;
        projectData.poRelease.vendorLocation = parsed.vendor_location;
        projectData.poRelease.poVendorSent = parsed.po_number;
        projectData.poRelease.vendorCost = parsed.cost;
        projectData.poRelease.releaseDate = parsed.date;

        // 2. Update financials
        if (!projectData.financials) {
            projectData.financials = {};
        }
        projectData.financials.vendorName = normalizedVendorName;
        projectData.financials.vendorLocation = parsed.vendor_location;
        projectData.financials.poNumber = parsed.po_number;
        projectData.financials.totalCost = parsed.cost;

        fs.writeFileSync(projectFile, JSON.stringify(projectData, null, 4), 'utf8');
        console.log(`Successfully updated project file: ${projectFile}`);

    } catch (e) {
        console.error("Processing failed:", e);
    }
}

main();

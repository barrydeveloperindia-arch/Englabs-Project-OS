import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_FIREBASE_API_KEY || "";
if (!API_KEY) {
    console.error("Firebase API Key is missing in env!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

async function extract() {
    try {
        const brainDir = "C:\\Users\\SAM\\.gemini\\antigravity\\brain\\560692c7-d696-4d5c-b099-8b5478cc2bd5";
        const page1Path = path.join(brainDir, "page_1.png");
        const page2Path = path.join(brainDir, "page_2.png");
        const page3Path = path.join(brainDir, "page_3.png");
        
        console.log("Loading page images...");
        const image1 = await fileToGenerativePart(page1Path, "image/png");
        const image2 = await fileToGenerativePart(page2Path, "image/png");
        const image3 = await fileToGenerativePart(page3Path, "image/png");

        const prompt = `
            Analyze these 3 pages of the Englabs Store Stock Report.
            For each item in the table, extract the Item Code and the corresponding Rack Location.
            
            Look at the columns:
            1. Item Code: (e.g. PAI-001, THI-002, HAR-002, ADH-015, PAP-101)
            2. Rack Location: (e.g. Rack No. 1, Rack-2, Rack-3, Rack No. 4, Rack-5, Rack-6)
            
            Extract the Item Code and Rack Location for ALL items listed on the pages.
            Ensure you go through all three pages.
            
            Return the output strictly in a single clean JSON object mapping Item Code to Rack Location:
            {
              "PAI-001": "Rack No. 1",
              "ADH-015": "Rack No. 1",
              "PAP-101": "Rack-2"
            }
            Do not include any formatting, markdown, backticks, or extra text. Output ONLY the raw JSON.
        `;

        console.log("Calling Gemini to extract Rack locations...");
        const result = await model.generateContent([
            prompt,
            image1,
            image2,
            image3
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("Raw Response received. Parsing JSON...");
        
        // Clean markdown JSON wrapper if any
        let cleanText = text.trim();
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.substring(7);
        }
        if (cleanText.endsWith("```")) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();

        // Validate JSON
        const mapping = JSON.parse(cleanText);
        console.log(`Extracted mapping for ${Object.keys(mapping).length} items.`);
        
        // Save to scratch
        const outputPath = path.join(brainDir, "extracted_racks.json");
        fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
        console.log(`Saved mapping to ${outputPath}`);
    } catch (err) {
        console.error("Extraction error:", err);
    }
}

extract();

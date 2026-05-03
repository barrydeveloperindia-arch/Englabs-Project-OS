/* scripts/read_timesheet.mjs */
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import 'dotenv/config';

// Usage: node scripts/read_timesheet.mjs <path-to-file>

const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function parseTimesheet(filePath) {
    if (!fs.existsSync(filePath)) throw new Error("File not found");

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = 'application/pdf';

    const prompt = `
    Analyze this employee timesheet document for April 2026. 
    It contains attendance records for multiple employees.
    
    Extract the following for EACH employee:
    1. Employee Name
    2. Date-wise attendance (Date, In Time, Out Time)
    3. Daily working hours
    4. Records of absence or half-days
    
    Return pure JSON in this structure:
    [
      {
        "employee_name": "string",
        "month": "April 2026",
        "records": [
          {
            "date": "YYYY-MM-DD",
            "in_time": "HH:MM",
            "out_time": "HH:MM",
            "status": "Present/Absent/Half-day"
          }
        ]
      }
    ]
    
    CRITICAL: 
    - If a day is blank, mark as "Absent".
    - Standard shift is 9 hours.
    - Be precise with times.
    `;

    console.log(`Analyzing timesheet: ${filePath}...`);
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
    parseTimesheet(targetFile).then(data => {
        fs.writeFileSync('scripts/extracted_timesheets.json', JSON.stringify(data, null, 2));
        console.log("Data extracted to scripts/extracted_timesheets.json");
    }).catch(console.error);
} else {
    console.log("Please provide a file path.");
}

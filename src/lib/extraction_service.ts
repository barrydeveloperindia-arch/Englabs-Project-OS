import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ExtractedInvoice {
    type: 'INWARD' | 'OUTWARD';
    partyName: string;
    invoiceNumber: string;
    date: string;
    vehicleNumber: string;
    fromLocation: string;
    toLocation: string;
    materialName: string;
    amount: number;
    items: Array<{
        name: string;
        hsnCode: string;
        quantity: number;
        unit: string;
        rate: number;
        amount: number;
    }>;
}

export async function extractInvoiceData(fileDataUrl: string): Promise<ExtractedInvoice> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Convert Data URL to base64
        const base64Data = fileDataUrl.split(",")[1];
        const mimeType = fileDataUrl.split(";")[0].split(":")[1];

        const prompt = `
            Extract all details from this industrial tax invoice for an ERP system. 
            Return the data strictly in JSON format with the following keys:
            {
                "type": "INWARD",
                "partyName": "Vendor/Supplier Name",
                "invoiceNumber": "Invoice/Bill Number",
                "date": "YYYY-MM-DD",
                "vehicleNumber": "Vehicle number if present, else 'LOCAL'",
                "fromLocation": "Origin city/address",
                "toLocation": "Destination (usually ENGLABS MDC)",
                "materialName": "A short summary of main items",
                "amount": total taxable value (number),
                "items": [
                    {
                        "name": "Item description",
                        "hsnCode": "HSN/SAC code",
                        "quantity": number,
                        "unit": "Nos/Kg/Ltr/etc",
                        "rate": unit price,
                        "amount": item total
                    }
                ]
            }
            Ensure absolute accuracy for Ridhan and Englabs invoices. 
            Capture itemized tables fully.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from the response text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in AI response");
        
        const extracted = JSON.parse(jsonMatch[0]);
        return extracted as ExtractedInvoice;
    } catch (error) {
        console.error("Forensic Extraction Failure:", error);
        throw error;
    }
}

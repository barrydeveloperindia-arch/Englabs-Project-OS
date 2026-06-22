import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { ExtractedDocumentData } from "@shared/services/accounting_schema";

// Ensure this environment variable is set in your .env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const genAI = new GoogleGenerativeAI(apiKey);

// We define a strict schema to force Gemini to return structured JSON
const extractionSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    documentType: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["PURCHASE_ORDER", "INVOICE", "QUOTATION", "DELIVERY_CHALLAN", "EXPENSE_RECEIPT", "UNKNOWN"],
      description: "Classify the document type."
    },
    projectInfo: {
      type: SchemaType.OBJECT,
      properties: {
        projectName: { type: SchemaType.STRING },
        clientId: { type: SchemaType.STRING, description: "Client Name or ID" },
        siteLocation: { type: SchemaType.STRING },
        poNumber: { type: SchemaType.STRING },
        poDate: { type: SchemaType.STRING, description: "ISO 8601 string if possible" },
        deliveryDate: { type: SchemaType.STRING },
        poAmount: { type: SchemaType.NUMBER }
      }
    },
    financialInfo: {
      type: SchemaType.OBJECT,
      properties: {
        invoiceNumber: { type: SchemaType.STRING },
        invoiceAmount: { type: SchemaType.NUMBER },
        gstAmount: { type: SchemaType.NUMBER },
        totalAmount: { type: SchemaType.NUMBER },
        paymentTerms: { type: SchemaType.STRING }
      }
    },
    vendorInfo: {
      type: SchemaType.OBJECT,
      properties: {
        vendorName: { type: SchemaType.STRING },
        gstNumber: { type: SchemaType.STRING },
        address: { type: SchemaType.STRING },
        contactDetails: { type: SchemaType.STRING }
      }
    },
    ledgerEntry: {
      type: SchemaType.OBJECT,
      properties: {
        description: { type: SchemaType.STRING },
        category: {
          type: SchemaType.STRING,
          format: "enum",
          enum: ["Material", "Labour", "Logistics", "Site Expenses", "Miscellaneous"]
        },
        subcategory: { type: SchemaType.STRING, description: "e.g., ACP, Hotel, Driver, Sanding" },
        debit: { type: SchemaType.NUMBER, description: "Expense amount" },
        materialName: { type: SchemaType.STRING },
        quantity: { type: SchemaType.NUMBER },
        unit: { type: SchemaType.STRING },
        rate: { type: SchemaType.NUMBER }
      }
    },
    confidenceScore: {
      type: SchemaType.NUMBER,
      description: "Confidence from 0 to 1 that the extraction is accurate."
    }
  },
  required: ["documentType", "confidenceScore"]
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: extractionSchema,
  }
});

export const processDocumentText = async (rawText: string): Promise<ExtractedDocumentData | null> => {
  try {
    const prompt = `
      You are an expert AI accountant for Englabs.
      Extract project, financial, vendor, and material information from the following raw document text.
      Classify the document type carefully. If it is a Purchase Order from a client, populate projectInfo.
      If it is a vendor bill or expense receipt, populate ledgerEntry and vendorInfo.

      Raw Document Text:
      ---
      ${rawText}
      ---
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // The response is guaranteed to be a JSON string matching the schema
    const parsedData: ExtractedDocumentData = JSON.parse(text);
    return parsedData;

  } catch (e) {
    console.error("AI Extraction Error:", e);
    return null;
  }
};

/**
 * Used for processing images (PDFs converted to images or native JPG/PNG)
 */
export const processDocumentImage = async (mimeType: string, base64Data: string): Promise<ExtractedDocumentData | null> => {
  try {
    const prompt = `
      You are an expert AI accountant for Englabs.
      Extract project, financial, vendor, and material information from the provided document image.
      Classify the document type carefully. If it is a Purchase Order from a client, populate projectInfo.
      If it is a vendor bill or expense receipt, populate ledgerEntry and vendorInfo.
    `;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    const parsedData: ExtractedDocumentData = JSON.parse(text);
    return parsedData;
  } catch (e) {
    console.error("AI Image Extraction Error:", e);
    return null;
  }
};

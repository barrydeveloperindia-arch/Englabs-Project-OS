/**
 * Email Ingestion Service (Outlook / Gmail)
 * 
 * Note: Simulates fetching new emails and attachments.
 * In production, this interfaces with Firebase Cloud Functions that receive
 * Push Pub/Sub events from Gmail API or Outlook Webhooks.
 */

import { IngestedFile } from "./onedrive_service";

export interface IngestedEmail {
    id: string;
    subject: string;
    bodyText: string;
    sender: string;
    receivedAt: string;
    attachments: IngestedFile[];
}

export const fetchRecentEmails = async (): Promise<IngestedEmail[]> => {
    console.log("Mock: Polling Emails via Backend API...");
    return [
        {
            id: `EMAIL_${Date.now()}_1`,
            subject: "Invoice for Paint Materials",
            bodyText: "Please find attached the invoice for the paint materials delivered to site.",
            sender: "billing@vendor-paint.com",
            receivedAt: new Date().toISOString(),
            attachments: [
                {
                    id: `ATT_${Date.now()}_1`,
                    fileName: "Invoice_9921.pdf",
                    mimeType: "application/pdf",
                    downloadUrl: "https://mock-email.com/download/Invoice_9921",
                    source: 'EMAIL',
                    createdAt: new Date().toISOString()
                }
            ]
        }
    ];
};

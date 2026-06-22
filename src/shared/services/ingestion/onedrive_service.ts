/**
 * OneDrive Ingestion Service
 * 
 * Note: Since this is a frontend React app, direct polling of Microsoft Graph API
 * without an intermediate backend requires implicit OAuth flows which can be insecure
 * for background polling.
 * 
 * In a production scenario, this will call our Node.js/Firebase Cloud Functions backend
 * which handles the webhook subscriptions from Microsoft Graph.
 */

export interface IngestedFile {
    id: string;
    fileName: string;
    mimeType: string;
    downloadUrl: string;
    source: 'ONEDRIVE' | 'EMAIL';
    createdAt: string;
}

export const fetchRecentOneDriveFiles = async (): Promise<IngestedFile[]> => {
    console.log("Mock: Polling OneDrive via Backend API...");
    // Mock response
    return [
        {
            id: `OD_${Date.now()}_1`,
            fileName: "PO_C001_Client_A.pdf",
            mimeType: "application/pdf",
            downloadUrl: "https://mock-onedrive.com/download/PO_C001",
            source: 'ONEDRIVE',
            createdAt: new Date().toISOString()
        }
    ];
};

export const subscribeToOneDriveFolder = async (folderId: string): Promise<boolean> => {
    console.log(`Subscribing to webhook for folder: ${folderId}`);
    // Call backend to setup MS Graph Webhook
    return true;
};

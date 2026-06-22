/**
 * Background Synchronization Daemon
 * Note: To run this standalone, it must be executed in a Node environment.
 * E.g., `node -r dotenv/config src/lib/services/daemon/sync_daemon.ts`
 */
import { fetchRecentOneDriveFiles } from '@services/ingestion/onedrive_service';
import { fetchRecentEmails } from '@services/ingestion/email_service';

// Mock config for SharePoint target
const SHAREPOINT_TENANT = "exartfabriek-my.sharepoint.com";
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export const startSyncDaemon = () => {
    console.log(`[DAEMON] Starting background sync daemon. Interval: 15m.`);
    console.log(`[DAEMON] Targeted SharePoint: ${SHAREPOINT_TENANT}`);

    const runSyncCycle = async () => {
        console.log(`\n[DAEMON] --- Running Sync Cycle at ${new Date().toISOString()} ---`);
        try {
            // 1. Scan OneDrive & SharePoint
            console.log(`[DAEMON] Scanning OneDrive and SharePoint for new Excel/PDF files...`);
            const driveFiles = await fetchRecentOneDriveFiles();
            console.log(`[DAEMON] Found ${driveFiles.length} new files in Drives.`);

            // 2. Scan Outlook
            console.log(`[DAEMON] Scanning Outlook for new emails and attachments...`);
            const emails = await fetchRecentEmails();
            console.log(`[DAEMON] Found ${emails.length} new emails.`);

            // 3. Document Processing (Mocked)
            console.log(`[DAEMON] Passing files to Gemini 1.5 Document Processor...`);
            // In reality, we would map over driveFiles and emails and call `processDocumentText`
            
            console.log(`[DAEMON] Sync Cycle Complete. Sleeping for 15 minutes...`);
        } catch (e) {
            console.error(`[DAEMON] Error during sync cycle:`, e);
        }
    };

    // Run immediately on start
    runSyncCycle();

    // Schedule every 15 minutes
    setInterval(runSyncCycle, SYNC_INTERVAL_MS);
};

// If run directly from CLI
if (typeof require !== 'undefined' && require.main === module) {
    startSyncDaemon();
}

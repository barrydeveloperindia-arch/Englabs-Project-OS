import * as XLSX from 'xlsx';
import { ProjectRecord, ExpenseLedgerEntry } from '@shared/services/accounting_schema';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from "@services/firebase";

const PROJECTS_COLLECTION = "accounting_projects";
const LEDGER_COLLECTION = "accounting_ledger";

/**
 * Parses the Master Excel sheet and imports data into Firebase
 */
export const importFromMasterExcel = async (fileBuffer: ArrayBuffer) => {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // 1. Process Material Purchase
    if (workbook.Sheets['Material Purchase']) {
        const materialData = XLSX.utils.sheet_to_json(workbook.Sheets['Material Purchase']);
        console.log(`Extracted ${materialData.length} Material records. Importing...`);
        // Logic to push to Firebase would go here
    }

    // 2. Process Staff Expenses / Labour
    if (workbook.Sheets['Staff Expenses']) {
        const staffData = XLSX.utils.sheet_to_json(workbook.Sheets['Staff Expenses']);
        console.log(`Extracted ${staffData.length} Staff records. Importing...`);
    }

    // 3. Process Delivery & Logistics
    if (workbook.Sheets['Delivery & Logistics']) {
        const logisticsData = XLSX.utils.sheet_to_json(workbook.Sheets['Delivery & Logistics']);
        console.log(`Extracted ${logisticsData.length} Logistics records. Importing...`);
    }
};

/**
 * Exports current Firebase state back to the Master Excel template format
 */
export const exportToMasterExcel = async (): Promise<XLSX.WorkBook | null> => {
    if (!db) return null;
    try {
        const pDocs = await getDocs(query(collection(db, PROJECTS_COLLECTION)));
        const projects = pDocs.docs.map(d => d.data() as ProjectRecord);

        const lDocs = await getDocs(query(collection(db, LEDGER_COLLECTION)));
        const ledgers = lDocs.docs.map(d => d.data() as ExpenseLedgerEntry);

        const workbook = XLSX.utils.book_new();

        // Sheet: Project Master
        const masterData = projects.map(p => ({
            'Project ID': p.id,
            'Project Name': p.projectName,
            'Client Name': p.clientId,
            'PO No.': p.poNumber,
            'PO Amount': p.poAmount,
            'Status': p.status
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(masterData), "Project Master");

        // Sheet: Material Purchase
        const materialLedger = ledgers.filter(l => l.category === 'Material');
        const materialData = materialLedger.map(l => ({
            'Date': l.date,
            'Project ID': l.projectId,
            'Vendor Name': l.vendorId || 'N/A',
            'Material Name': l.materialName || l.description,
            'Amount': l.debit
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(materialData), "Material Purchase");

        // Sheet: Project P&L
        const pnlData = projects.map(p => ({
            'Project ID': p.id,
            'Revenue': p.poAmount,
            'Total Cost': p.totalCost,
            'Profit/Loss': p.netProfit,
            'Profit %': p.profitPercentage.toFixed(2)
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(pnlData), "Project P&L");

        return workbook;
    } catch (e) {
        console.error("Error exporting to Excel", e);
        return null;
    }
};

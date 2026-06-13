import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, writeBatch, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ERPProjectData, ERPLedgerEntry, ERPProjectStatus, ERPExpenseCategory, ERPLedgerSummary } from '../domain/erp_types';

export class ERPService {
    static PROJECTS_COLLECTION = 'erp_projects';
    static LEDGERS_COLLECTION = 'erp_ledgers';

    /**
     * Creates a new ERP Project and initializes its financial state
     */
    static async createProject(project: Omit<ERPProjectData, 'createdAt' | 'updatedAt'>): Promise<string> {
        const docRef = doc(collection(db, this.PROJECTS_COLLECTION), project.projectId);
        
        const newProject: ERPProjectData = {
            ...project,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await setDoc(docRef, newProject);
        return project.projectId;
    }

    /**
     * Records a financial ledger entry against a project
     */
    static async recordLedgerEntry(entry: Omit<ERPLedgerEntry, 'entryId' | 'timestamp' | 'date'>): Promise<string> {
        const ledgerRef = doc(collection(db, this.LEDGERS_COLLECTION));
        
        const newEntry: ERPLedgerEntry = {
            ...entry,
            entryId: ledgerRef.id,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        await setDoc(ledgerRef, newEntry);
        
        // Also trigger a recalculation of the Project's aggregated finances if needed
        return ledgerRef.id;
    }

    /**
     * Aggregates all ledger entries to compute the live Profit & Loss metrics for a project
     */
    static async getProjectFinancialSummary(projectId: string): Promise<ERPLedgerSummary> {
        const q = query(
            collection(db, this.LEDGERS_COLLECTION),
            where('projectId', '==', projectId)
        );

        const snapshot = await getDocs(q);
        
        const summary: ERPLedgerSummary = {
            totalRevenue: 0,
            vendorCost: 0,
            materialCost: 0,
            porterCost: 0,
            foodCost: 0,
            logisticsCost: 0,
            totalExpenses: 0,
            profit: 0,
            loss: 0,
            pendingClientPayment: 0,
            pendingVendorPayment: 0
        };

        snapshot.docs.forEach(docSnap => {
            const entry = docSnap.data() as ERPLedgerEntry;
            
            if (entry.type === 'CREDIT') {
                summary.totalRevenue += entry.amount;
            } else if (entry.type === 'DEBIT') {
                summary.totalExpenses += entry.amount;

                // Bucket classification based on exact string enums requested by User
                switch (entry.category) {
                    case ERPExpenseCategory.RAW_MATERIALS:
                        summary.materialCost += entry.amount;
                        break;
                    case ERPExpenseCategory.VENDOR_COST:
                        summary.vendorCost += entry.amount;
                        break;
                    case ERPExpenseCategory.PORTER_CHARGES:
                    case ERPExpenseCategory.MATERIAL_SHIFTING_COST:
                        summary.porterCost += entry.amount;
                        break;
                    case ERPExpenseCategory.TEA_EXPENSES:
                    case ERPExpenseCategory.PANTRY_EXPENSES:
                    case ERPExpenseCategory.STAFF_MEALS:
                    case ERPExpenseCategory.SITE_FOOD_EXPENSES:
                    case ERPExpenseCategory.DRIVER_FOOD_EXPENSES:
                    case ERPExpenseCategory.PORTER_FOOD_EXPENSES:
                    case ERPExpenseCategory.GUEST_HOSPITALITY:
                        summary.foodCost += entry.amount;
                        break;
                    case ERPExpenseCategory.DRIVER_CHARGES:
                    case ERPExpenseCategory.FUEL:
                    case ERPExpenseCategory.TOLL_TAX:
                    case ERPExpenseCategory.TRANSPORTATION:
                    case ERPExpenseCategory.LOADING_CHARGES:
                    case ERPExpenseCategory.UNLOADING_CHARGES:
                    case ERPExpenseCategory.COURIER:
                        summary.logisticsCost += entry.amount;
                        break;
                    default:
                        break;
                }
            }
        });

        // Compute overarching metrics
        const netDifference = summary.totalRevenue - summary.totalExpenses;
        if (netDifference > 0) {
            summary.profit = netDifference;
            summary.loss = 0;
        } else {
            summary.profit = 0;
            summary.loss = Math.abs(netDifference);
        }

        return summary;
    }
}

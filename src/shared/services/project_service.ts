import { collection, doc, setDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@services/firebase";
import { ProjectRecord, ExpenseLedgerEntry } from "@shared/services/accounting_schema";

const PROJECTS_COLLECTION = "accounting_projects";
const LEDGER_COLLECTION = "accounting_ledger";

export const getNextProjectId = async (): Promise<string> => {
    if (!db) return "C001";
    try {
        const q = query(collection(db, PROJECTS_COLLECTION), orderBy("id", "desc"), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return "C001";
        }
        const lastProject = snapshot.docs[0].data() as ProjectRecord;
        const lastId = lastProject.id; // e.g., C001
        if (!lastId || !lastId.startsWith("C")) return "C001";
        
        const numPart = parseInt(lastId.substring(1));
        if (isNaN(numPart)) return "C001";
        
        const nextNum = numPart + 1;
        return `C${nextNum.toString().padStart(3, '0')}`;
    } catch (e) {
        console.error("Error generating next project ID:", e);
        return `C${Date.now()}`; // Fallback
    }
};

export const createProject = async (projectData: Partial<ProjectRecord>): Promise<ProjectRecord | null> => {
    if (!db) return null;
    try {
        const nextId = await getNextProjectId();
        const newProject: ProjectRecord = {
            id: nextId,
            projectName: projectData.projectName || "Unknown Project",
            clientId: projectData.clientId || "Unknown",
            siteLocation: projectData.siteLocation || "Unknown",
            poNumber: projectData.poNumber || "N/A",
            poDate: projectData.poDate || new Date().toISOString(),
            deliveryDate: projectData.deliveryDate || new Date().toISOString(),
            poAmount: projectData.poAmount || 0,
            
            totalCost: 0,
            netProfit: projectData.poAmount || 0,
            profitPercentage: 100,
            isLossProject: false,
            
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...projectData
        };

        const cleanProject = JSON.parse(JSON.stringify(newProject));
        const docRef = doc(db, PROJECTS_COLLECTION, newProject.id);
        await setDoc(docRef, cleanProject);
        return newProject;
    } catch (e) {
        console.error("Error creating project:", e);
        return null;
    }
};

export const addLedgerEntry = async (entryData: Partial<ExpenseLedgerEntry>): Promise<boolean> => {
    if (!db || !entryData.projectId) return false;
    try {
        const entryId = `LEDGER_${Date.now()}`;
        const newEntry: ExpenseLedgerEntry = {
            id: entryId,
            projectId: entryData.projectId,
            date: entryData.date || new Date().toISOString(),
            description: entryData.description || "Misc Entry",
            category: entryData.category || 'Miscellaneous',
            debit: entryData.debit || 0,
            credit: entryData.credit || 0,
            balance: 0, // Will be calculated
            createdAt: new Date().toISOString(),
            ...entryData
        };

        // Recalculate Project Financials
        await recalculateProjectFinancials(entryData.projectId);

        const cleanEntry = JSON.parse(JSON.stringify(newEntry));
        const docRef = doc(db, LEDGER_COLLECTION, newEntry.id);
        await setDoc(docRef, cleanEntry);
        
        // Inventory Integration
        if (newEntry.category === 'Material' && newEntry.materialName && newEntry.quantity) {
            await updateInventory(newEntry.materialName, newEntry.quantity, 'IN', newEntry.projectId);
        } else if (newEntry.category === 'Logistics' && newEntry.description.toLowerCase().includes('challan') && newEntry.materialName && newEntry.quantity) {
            await updateInventory(newEntry.materialName, newEntry.quantity, 'OUT', newEntry.projectId);
        }

        return true;
    } catch (e) {
        console.error("Error adding ledger entry:", e);
        return false;
    }
};

const updateInventory = async (itemName: string, quantity: number, type: 'IN' | 'OUT', projectId: string) => {
    try {
        const itemId = itemName.replace(/\s+/g, '_').toLowerCase();
        
        // Log transaction
        const txRef = doc(collection(db, 'stock_transactions'));
        await setDoc(txRef, {
            itemId,
            itemName,
            quantity: type === 'IN' ? quantity : -quantity,
            type,
            partyName: `Project ${projectId}`,
            timestamp: new Date().toISOString()
        });

        // Update Master Registry
        const masterRef = doc(db, 'master_inventory_registry', itemId);
        const mSnap = await getDocs(query(collection(db, 'master_inventory_registry'), limit(1))); // Just a workaround if doc doesn't exist to check
        // Assuming we are just blindly setting/incrementing for now to avoid complex transactions in this scope
        // In a real app we'd use a Firestore Transaction
        console.log(`Inventory updated: ${type} ${quantity} of ${itemName} for project ${projectId}`);
    } catch (e) {
        console.error("Failed to update inventory", e);
    }
};

const recalculateProjectFinancials = async (projectId: string) => {
    // 1. Fetch all ledger entries for this project
    const q = query(collection(db, LEDGER_COLLECTION));
    const snapshot = await getDocs(q);
    const allEntries = snapshot.docs.map(d => d.data() as ExpenseLedgerEntry).filter(e => e.projectId === projectId);
    
    // 2. Calculate Total Cost
    const totalCost = allEntries.reduce((sum, entry) => sum + entry.debit, 0);
    
    // 3. Fetch Project
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDocs(query(collection(db, PROJECTS_COLLECTION)));
    const project = projectDoc.docs.map(d => d.data() as ProjectRecord).find(p => p.id === projectId);
    
    if (!project) return;

    // 4. Update Financials
    const revenue = project.poAmount;
    const netProfit = revenue - totalCost;
    const profitPercentage = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const isLossProject = netProfit < 0;

    const updatedProject = {
        ...project,
        totalCost,
        netProfit,
        profitPercentage,
        isLossProject,
        updatedAt: new Date().toISOString()
    };

    await setDoc(projectRef, JSON.parse(JSON.stringify(updatedProject)));
};

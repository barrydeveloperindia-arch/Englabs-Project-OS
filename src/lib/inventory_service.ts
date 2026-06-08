import { GateEntry, InventoryItem, StockTransaction } from './gate_system';
import { db } from './firebase';
import { 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    query, 
    getDocs, 
    orderBy, 
    runTransaction,
    writeBatch,
    limit
} from 'firebase/firestore';
import masterInventory from '../../data/master_inventory_may_2026.json';

// Interfaces for the Store Stock Report Management System
export interface MasterRegisterEntry {
    id: string;
    timestamp: string;
    projectId: string;
    materialName: string;
    itemCode: string;
    category: string;
    quantity: number;
    unit: string;
    staffName: string;
    issuedBy: string;
    balanceStockAfterIssue: number;
    remarks: string;
    type: 'INWARD' | 'OUTWARD';
    photoUrl?: string;
}

export interface CurrentStockItem {
    itemCode: string;
    name: string;
    category: string;
    openingStock: number;
    totalInward: number;
    totalOutward: number;
    availableStock: number;
    lastUpdated: string;
    unit: string;
    location?: string;
    minThreshold?: number;
    unitPrice?: number;
}

// Build a name -> itemCode mapping from master inventory
const nameToCodeMap = new Map<string, string>();
if (Array.isArray(masterInventory)) {
    masterInventory.forEach((report: any) => {
        if (report && Array.isArray(report.items)) {
            report.items.forEach((item: any) => {
                if (item && item.name && item.itemCode) {
                    nameToCodeMap.set(item.name.trim().toLowerCase(), item.itemCode.trim());
                }
            });
        }
    });
}

const STOCK_COLLECTION = "inventory_stock";
const LOG_COLLECTION = "inventory_logs";

export function getEstimatedPrice(category: string): number {
    const cat = category.trim().toLowerCase();
    if (cat.includes('paint')) return 450;
    if (cat.includes('chemical')) return 250;
    if (cat.includes('stationery')) return 35;
    if (cat.includes('general')) return 120;
    if (cat.includes('it')) return 1200;
    if (cat.includes('ppe')) return 80;
    if (cat.includes('tool')) return 750;
    return 100;
}

function cleanUndefined(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const clean: any = {};
    for (const key in obj) {
        if (obj[key] !== undefined) {
            clean[key] = obj[key];
        }
    }
    return clean;
}

// Automated seeding for new collections if they are empty
export async function seedStoreStockReport() {
    if (!db) return;
    try {
        const catalogSnap = await getDocs(query(collection(db, "material_catalog"), limit(1)));
        if (!catalogSnap.empty) return; // Already seeded

        console.log("Seeding material_catalog and current_stock collections...");
        const uniqueItems = new Map<string, any>();
        if (Array.isArray(masterInventory)) {
            masterInventory.forEach((report: any) => {
                if (report && Array.isArray(report.items)) {
                    report.items.forEach((item: any) => {
                        if (item && item.itemCode) {
                            uniqueItems.set(item.itemCode, item);
                        }
                    });
                }
            });
        }

        const batch = writeBatch(db);
        for (const item of uniqueItems.values()) {
            const itemCode = item.itemCode;
            const price = getEstimatedPrice(item.category || 'GENERAL');

            const catalogRef = doc(db, "material_catalog", itemCode);
            batch.set(catalogRef, {
                itemCode,
                name: item.name,
                category: item.category || 'GENERAL',
                unit: item.unit || 'Nos',
                location: item.location || 'MAIN STORE',
                minThreshold: item.minThreshold || 5,
                unitPrice: price,
                lastUpdated: new Date().toISOString()
            });

            const stockRef = doc(db, "current_stock", itemCode);
            batch.set(stockRef, {
                itemCode,
                name: item.name,
                category: item.category || 'GENERAL',
                unit: item.unit || 'Nos',
                openingStock: item.currentStock || 0,
                totalInward: 0,
                totalOutward: 0,
                availableStock: item.currentStock || 0,
                lastUpdated: new Date().toISOString()
            });
        }
        await batch.commit();
        console.log("Seeding complete!");
    } catch (err) {
        console.error("Seeding error:", err);
    }
}

export async function processInventoryUpdate(entry: GateEntry) {
    const isInwardToMainStore = entry.type === 'INWARD' && entry.toLocation?.toUpperCase().trim() === 'MAIN STORE';
    const isOutwardFromMainStore = entry.type === 'OUTWARD' && entry.fromLocation?.toUpperCase().trim() === 'MAIN STORE';

    if (!isInwardToMainStore && !isOutwardFromMainStore) {
        if (import.meta.env.DEV) {
            console.log(`Skipping inventory update for Entry ${entry.id}: Route does not target MAIN STORE`);
        }
        return { success: true, message: "Skipped: not MAIN STORE" };
    }

    if (!entry.items || entry.items.length === 0) {
        return updateStock(
            entry.materialName,
            entry.quantity,
            entry.unit,
            entry.type,
            entry.id,
            entry.partyName,
            entry.invoiceNumber,
            undefined,
            undefined,
            (entry as any).projectId
        );
    }

    const results = [];
    for (const item of entry.items) {
        const res = await updateStock(
            item.name,
            item.quantity,
            item.unit,
            entry.type,
            entry.id,
            entry.partyName,
            entry.invoiceNumber,
            item.hsnCode,
            undefined,
            (entry as any).projectId
        );
        results.push(res);
    }
    return results;
}

function saveLocalStockFallback(
    itemCode: string,
    type: 'INWARD' | 'OUTWARD',
    qty: number,
    refId: string,
    party: string,
    invoice: string,
    photoUrl?: string,
    projectId?: string,
    name?: string,
    unit?: string,
    category?: string
) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const localTxSaved = window.localStorage.getItem('local_stock_transactions');
            const localTxList: StockTransaction[] = localTxSaved ? JSON.parse(localTxSaved) : [];
            
            const isAlreadyLogged = localTxList.some((t: any) => t.referenceId === refId && t.itemId === itemCode);
            if (!isAlreadyLogged) {
                const localOverridesSaved = window.localStorage.getItem('local_stock_overrides');
                const localOverrides: Record<string, Partial<InventoryItem>> = localOverridesSaved ? JSON.parse(localOverridesSaved) : {};
                
                let currentStock = 0;
                let totalInward = 0;
                let totalOutward = 0;
                
                if (localOverrides[itemCode]) {
                    currentStock = localOverrides[itemCode].currentStock || 0;
                    totalInward = localOverrides[itemCode].totalInward || 0;
                    totalOutward = localOverrides[itemCode].totalOutward || 0;
                } else {
                    if (Array.isArray(masterInventory)) {
                        for (const report of masterInventory) {
                            if (report && Array.isArray(report.items)) {
                                const match = report.items.find((i: any) => i.itemCode === itemCode);
                                if (match) {
                                    currentStock = match.currentStock || 0;
                                    totalInward = match.totalInward || 0;
                                    totalOutward = match.totalOutward || 0;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                const prevStock = currentStock;
                const nextStock = type === 'INWARD' ? prevStock + qty : prevStock - qty;
                
                const newLocalTx: StockTransaction = {
                    id: `LOCAL_TX_${Date.now()}_${itemCode}`,
                    itemId: itemCode,
                    type,
                    quantity: qty,
                    previousStock: prevStock,
                    newStock: nextStock,
                    timestamp: new Date().toISOString(),
                    referenceId: refId,
                    partyName: party,
                    invoiceNumber: invoice,
                    photoUrl: photoUrl || undefined,
                    projectId: projectId || undefined
                };
                
                localTxList.unshift(newLocalTx);
                window.localStorage.setItem('local_stock_transactions', JSON.stringify(localTxList));
                
                localOverrides[itemCode] = {
                    currentStock: nextStock,
                    totalInward: type === 'INWARD' ? totalInward + qty : totalInward,
                    totalOutward: type === 'OUTWARD' ? totalOutward + qty : totalOutward,
                    lastUpdated: new Date().toISOString()
                };
                window.localStorage.setItem('local_stock_overrides', JSON.stringify(localOverrides));

                // Master, Current Stock, and Monthly local storage updates
                const timestamp = new Date().toISOString();
                const months = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                const monthName = months[new Date().getMonth()];

                const localMasterSaved = window.localStorage.getItem('local_master_register');
                const localMasterList: MasterRegisterEntry[] = localMasterSaved ? JSON.parse(localMasterSaved) : [];
                const newMasterEntry: MasterRegisterEntry = {
                    id: `LOCAL_MASTER_TX_${Date.now()}`,
                    timestamp,
                    projectId: projectId || 'GENERAL',
                    materialName: name || itemCode.replace(/_/g, ' '),
                    itemCode,
                    category: category || 'GENERAL',
                    quantity: qty,
                    unit: unit || 'Nos',
                    staffName: party,
                    issuedBy: type === 'OUTWARD' ? 'Gate Operator' : 'Store Manager',
                    balanceStockAfterIssue: nextStock,
                    remarks: invoice,
                    type,
                    photoUrl: photoUrl || undefined
                };
                localMasterList.unshift(newMasterEntry);
                window.localStorage.setItem('local_master_register', JSON.stringify(localMasterList));

                const localCurrentStockSaved = window.localStorage.getItem('local_current_stock');
                const localCurrentStock: Record<string, CurrentStockItem> = localCurrentStockSaved ? JSON.parse(localCurrentStockSaved) : {};
                
                const prevLocalItem = localCurrentStock[itemCode];
                const localItem: CurrentStockItem = {
                    itemCode,
                    name: name || prevLocalItem?.name || itemCode.replace(/_/g, ' '),
                    category: category || prevLocalItem?.category || 'GENERAL',
                    openingStock: prevLocalItem ? prevLocalItem.openingStock : currentStock,
                    totalInward: prevLocalItem ? (type === 'INWARD' ? prevLocalItem.totalInward + qty : prevLocalItem.totalInward) : (type === 'INWARD' ? qty : 0),
                    totalOutward: prevLocalItem ? (type === 'OUTWARD' ? prevLocalItem.totalOutward + qty : prevLocalItem.totalOutward) : (type === 'OUTWARD' ? qty : 0),
                    availableStock: nextStock,
                    lastUpdated: timestamp,
                    unit: unit || prevLocalItem?.unit || 'Nos',
                    unitPrice: getEstimatedPrice(category || prevLocalItem?.category || 'GENERAL')
                };
                localCurrentStock[itemCode] = localItem;
                window.localStorage.setItem('local_current_stock', JSON.stringify(localCurrentStock));

                const localMonthlySaved = window.localStorage.getItem('local_monthly_registers');
                const localMonthly: Record<string, MasterRegisterEntry[]> = localMonthlySaved ? JSON.parse(localMonthlySaved) : {};
                if (!localMonthly[monthName]) {
                    localMonthly[monthName] = [];
                }
                localMonthly[monthName].unshift(newMasterEntry);
                window.localStorage.setItem('local_monthly_registers', JSON.stringify(localMonthly));
            }
        }
    } catch (localErr) {
        console.error("Local persistence fallback failed:", localErr);
    }
}

async function updateStock(
    name: string, 
    qty: number, 
    unit: string, 
    type: 'INWARD' | 'OUTWARD',
    refId: string,
    party: string,
    invoice: string,
    hsn?: string,
    photoUrl?: string,
    projectId?: string
) {
    const itemCode = nameToCodeMap.get(name.trim().toLowerCase()) || name.toUpperCase().replace(/\s+/g, '_');

    if (!db) {
        saveLocalStockFallback(itemCode, type, qty, refId, party, invoice, photoUrl, projectId, name, unit, hsn);
        return { success: false, error: "Database offline" };
    }
    
    try {
        await seedStoreStockReport(); // Ensure collections are seeded

        const result = await runTransaction(db, async (transaction) => {
            const lockDocRef = doc(db, "inventory_sync_locks", `${refId}_${itemCode}`);
            const legacyDocRef = doc(db, STOCK_COLLECTION, itemCode);
            const currentStockRef = doc(db, "current_stock", itemCode);
            const catalogRef = doc(db, "material_catalog", itemCode);

            // --- ALL READS MUST BE FIRST ---
            const lockSnap = await transaction.get(lockDocRef);
            if (lockSnap.exists()) {
                return { success: true, message: "Already synced" };
            }

            const legacySnap = await transaction.get(legacyDocRef);
            const currentStockSnap = await transaction.get(currentStockRef);
            const catalogSnap = await transaction.get(catalogRef);

            // --- LEGACY STOCK UPDATE LOGIC ---
            let legacyItem: InventoryItem;
            if (legacySnap.exists()) {
                legacyItem = legacySnap.data() as InventoryItem;
            } else {
                legacyItem = {
                    itemCode,
                    name,
                    category: hsn || 'GENERAL',
                    unit,
                    currentStock: 0,
                    totalInward: 0,
                    totalOutward: 0,
                    minThreshold: 10,
                    lastUpdated: new Date().toISOString()
                };
            }

            const prevStock = legacyItem.currentStock;
            
            if (type === 'INWARD') {
                legacyItem.currentStock += qty;
                legacyItem.totalInward += qty;
            } else {
                if (legacyItem.currentStock < qty) {
                    throw new Error(`Insufficient stock for ${name}. Available: ${legacyItem.currentStock}`);
                }
                legacyItem.currentStock -= qty;
                legacyItem.totalOutward += qty;
            }
            legacyItem.lastUpdated = new Date().toISOString();

            // --- current_stock UPDATE LOGIC ---
            let currentStockItem: CurrentStockItem;
            if (currentStockSnap.exists()) {
                currentStockItem = currentStockSnap.data() as CurrentStockItem;
            } else {
                currentStockItem = {
                    itemCode,
                    name,
                    category: hsn || 'GENERAL',
                    openingStock: 0,
                    totalInward: 0,
                    totalOutward: 0,
                    availableStock: 0,
                    lastUpdated: new Date().toISOString(),
                    unit
                };
            }

            if (type === 'INWARD') {
                currentStockItem.totalInward += qty;
            } else {
                currentStockItem.totalOutward += qty;
            }
            currentStockItem.availableStock = currentStockItem.openingStock + currentStockItem.totalInward - currentStockItem.totalOutward;
            currentStockItem.lastUpdated = new Date().toISOString();

            // --- PREPARE master_register ENTRY ---
            const timestamp = new Date().toISOString();
            const masterTxRef = doc(collection(db, "master_register"));
            
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            const txDate = new Date();
            const monthName = months[txDate.getMonth()];

            const masterEntry: MasterRegisterEntry = {
                id: masterTxRef.id,
                timestamp,
                projectId: projectId || 'GENERAL',
                materialName: name,
                itemCode,
                category: hsn || currentStockItem.category || 'GENERAL',
                quantity: qty,
                unit,
                staffName: party || 'UNKNOWN',
                issuedBy: type === 'OUTWARD' ? 'Gate Operator' : 'Store Manager',
                balanceStockAfterIssue: currentStockItem.availableStock,
                remarks: invoice || '',
                type,
                photoUrl: photoUrl || undefined
            };

            const monthlyTxRef = doc(collection(db, "monthly_registers", monthName, "entries"));
            const monthlyEntry = { ...masterEntry, id: monthlyTxRef.id };

            // --- WRITES START HERE ---
            transaction.set(legacyDocRef, cleanUndefined(legacyItem));
            transaction.set(currentStockRef, cleanUndefined(currentStockItem));

            if (!catalogSnap.exists()) {
                transaction.set(catalogRef, cleanUndefined({
                    itemCode,
                    name,
                    category: hsn || 'GENERAL',
                    unit,
                    location: 'MAIN STORE',
                    minThreshold: 5,
                    unitPrice: getEstimatedPrice(hsn || 'GENERAL'),
                    lastUpdated: new Date().toISOString()
                }));
            }

            transaction.set(masterTxRef, cleanUndefined(masterEntry));
            transaction.set(monthlyTxRef, cleanUndefined(monthlyEntry));
            transaction.set(lockDocRef, cleanUndefined({
                timestamp,
                referenceId: refId,
                itemId: itemCode
            }));

            // --- 7. LEGACY LOGS UPDATE ---
            const logRef = doc(collection(db, LOG_COLLECTION));
            const stockTx: StockTransaction = {
                id: logRef.id,
                itemId: itemCode,
                type,
                quantity: qty,
                previousStock: prevStock,
                newStock: legacyItem.currentStock,
                timestamp,
                referenceId: refId,
                partyName: party,
                invoiceNumber: invoice,
                photoUrl: photoUrl,
                projectId: projectId
            };
            transaction.set(logRef, cleanUndefined(stockTx));

            return { success: true, itemCode };
        });

        // Clear local overrides on success
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const localOverridesSaved = window.localStorage.getItem('local_stock_overrides');
                if (localOverridesSaved) {
                    const localOverrides = JSON.parse(localOverridesSaved);
                    if (localOverrides[itemCode]) {
                        delete localOverrides[itemCode];
                        window.localStorage.setItem('local_stock_overrides', JSON.stringify(localOverrides));
                    }
                }
            }
        } catch (clearErr) {
            console.error("Failed to clear local override on success:", clearErr);
        }

        return result;
    } catch (e: any) {
        console.error("Stock update failure, checking for offline fallback:", e);
        const errMsg = e.message || String(e);
        if (errMsg.includes("Insufficient stock")) {
            return { success: false, error: errMsg };
        }

        // If it's a network/connection error (or any other Firestore transaction failure that is not a validation error)
        try {
            console.log("Attempting offline Firestore batch update fallback...");
            const currentStockRef = doc(db, "current_stock", itemCode);
            const catalogRef = doc(db, "material_catalog", itemCode);
            const legacyDocRef = doc(db, STOCK_COLLECTION, itemCode);
            const lockDocRef = doc(db, "inventory_sync_locks", `${refId}_${itemCode}`);

            // Fetch current documents from Firestore local cache
            const lockSnap = await getDoc(lockDocRef);
            if (lockSnap.exists()) {
                return { success: true, message: "Already synced offline", itemCode };
            }

            const legacySnap = await getDoc(legacyDocRef);
            const currentStockSnap = await getDoc(currentStockRef);
            const catalogSnap = await getDoc(catalogRef);

            // Compute legacy stock
            let legacyItem: InventoryItem;
            if (legacySnap.exists()) {
                legacyItem = legacySnap.data() as InventoryItem;
            } else {
                legacyItem = {
                    itemCode,
                    name,
                    category: hsn || 'GENERAL',
                    unit,
                    currentStock: 0,
                    totalInward: 0,
                    totalOutward: 0,
                    minThreshold: 10,
                    lastUpdated: new Date().toISOString()
                };
            }

            const prevStock = legacyItem.currentStock;
            if (type === 'INWARD') {
                legacyItem.currentStock += qty;
                legacyItem.totalInward += qty;
            } else {
                if (legacyItem.currentStock < qty) {
                    return { success: false, error: `Insufficient stock for ${name}. Available: ${legacyItem.currentStock}` };
                }
                legacyItem.currentStock -= qty;
                legacyItem.totalOutward += qty;
            }
            legacyItem.lastUpdated = new Date().toISOString();

            // Compute current stock item
            let currentStockItem: CurrentStockItem;
            if (currentStockSnap.exists()) {
                currentStockItem = currentStockSnap.data() as CurrentStockItem;
            } else {
                currentStockItem = {
                    itemCode,
                    name,
                    category: hsn || 'GENERAL',
                    openingStock: 0,
                    totalInward: 0,
                    totalOutward: 0,
                    availableStock: 0,
                    lastUpdated: new Date().toISOString(),
                    unit
                };
            }

            if (type === 'INWARD') {
                currentStockItem.totalInward += qty;
            } else {
                currentStockItem.totalOutward += qty;
            }
            currentStockItem.availableStock = currentStockItem.openingStock + currentStockItem.totalInward - currentStockItem.totalOutward;
            currentStockItem.lastUpdated = new Date().toISOString();

            // Prepare master register entry
            const timestamp = new Date().toISOString();
            const masterTxRef = doc(collection(db, "master_register"));
            
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            const txDate = new Date();
            const monthName = months[txDate.getMonth()];

            const masterEntry: MasterRegisterEntry = {
                id: masterTxRef.id,
                timestamp,
                projectId: projectId || 'GENERAL',
                materialName: name,
                itemCode,
                category: hsn || currentStockItem.category || 'GENERAL',
                quantity: qty,
                unit,
                staffName: party || 'UNKNOWN',
                issuedBy: type === 'OUTWARD' ? 'Gate Operator' : 'Store Manager',
                balanceStockAfterIssue: currentStockItem.availableStock,
                remarks: invoice || '',
                type,
                photoUrl: photoUrl || undefined
            };

            const monthlyTxRef = doc(collection(db, "monthly_registers", monthName, "entries"));
            const monthlyEntry = { ...masterEntry, id: monthlyTxRef.id };

            // Perform batch write
            const batch = writeBatch(db);
            batch.set(legacyDocRef, cleanUndefined(legacyItem));
            batch.set(currentStockRef, cleanUndefined(currentStockItem));

            if (!catalogSnap.exists()) {
                batch.set(catalogRef, cleanUndefined({
                    itemCode,
                    name,
                    category: hsn || 'GENERAL',
                    unit,
                    location: 'MAIN STORE',
                    minThreshold: 5,
                    unitPrice: getEstimatedPrice(hsn || 'GENERAL'),
                    lastUpdated: new Date().toISOString()
                }));
            }

            batch.set(masterTxRef, cleanUndefined(masterEntry));
            batch.set(monthlyTxRef, cleanUndefined(monthlyEntry));
            batch.set(lockDocRef, cleanUndefined({
                timestamp,
                referenceId: refId,
                itemId: itemCode
            }));

            // Legacy logs update
            const logRef = doc(collection(db, LOG_COLLECTION));
            const stockTx: StockTransaction = {
                id: logRef.id,
                itemId: itemCode,
                type,
                quantity: qty,
                previousStock: prevStock,
                newStock: legacyItem.currentStock,
                timestamp,
                referenceId: refId,
                partyName: party,
                invoiceNumber: invoice,
                photoUrl: photoUrl,
                projectId: projectId
            };
            batch.set(logRef, cleanUndefined(stockTx));

            await batch.commit();
            console.log("Offline batch update succeeded locally!");

            // Run local storage fallback just in case
            saveLocalStockFallback(itemCode, type, qty, refId, party, invoice, photoUrl, projectId, name, unit, hsn);

            return { success: true, offline: true, itemCode };

        } catch (fallbackErr: any) {
            console.error("Offline batch fallback also failed:", fallbackErr);
            saveLocalStockFallback(itemCode, type, qty, refId, party, invoice, photoUrl, projectId, name, unit, hsn);
            return { success: false, error: `Offline write failed: ${fallbackErr.message || fallbackErr}` };
        }
    }
}

// Fetch all materials from current_stock
export async function fetchCurrentStock(): Promise<CurrentStockItem[]> {
    if (!db) return [];
    await seedStoreStockReport();
    const q = query(collection(db, "current_stock"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as CurrentStockItem);
}

// Fetch master register transaction entries
export async function fetchMasterRegister(): Promise<MasterRegisterEntry[]> {
    if (!db) return [];
    const q = query(collection(db, "master_register"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as MasterRegisterEntry);
}

// Fetch specific monthly register transaction entries
export async function fetchMonthlyRegister(month: string): Promise<MasterRegisterEntry[]> {
    if (!db) return [];
    const q = query(collection(db, "monthly_registers", month, "entries"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as MasterRegisterEntry);
}

export async function fetchInventoryMaster(): Promise<InventoryItem[]> {
    if (!db) return [];
    await seedStoreStockReport();
    const q = query(collection(db, "current_stock"));
    const snap = await getDocs(q);
    if (snap.empty) {
        const qOld = query(collection(db, STOCK_COLLECTION));
        const snapOld = await getDocs(qOld);
        return snapOld.docs.map(d => d.data() as InventoryItem);
    }
    return snap.docs.map(d => {
        const data = d.data() as CurrentStockItem;
        return {
            itemCode: data.itemCode,
            name: data.name,
            category: data.category,
            unit: data.unit,
            currentStock: data.availableStock,
            totalInward: data.totalInward,
            totalOutward: data.totalOutward,
            minThreshold: data.minThreshold || 5,
            lastUpdated: data.lastUpdated,
            location: data.location || 'MAIN STORE'
        } as InventoryItem;
    });
}

export async function fetchStockMovement(): Promise<StockTransaction[]> {
    if (!db) return [];
    const q = query(collection(db, "master_register"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
        const qOld = query(collection(db, LOG_COLLECTION), orderBy("timestamp", "desc"));
        const snapOld = await getDocs(qOld);
        return snapOld.docs.map(d => d.data() as StockTransaction);
    }
    return snap.docs.map(d => {
        const data = d.data() as MasterRegisterEntry;
        return {
            id: data.id,
            itemId: data.itemCode,
            type: data.type,
            quantity: data.quantity,
            previousStock: data.balanceStockAfterIssue + (data.type === 'OUTWARD' ? data.quantity : -data.quantity),
            newStock: data.balanceStockAfterIssue,
            timestamp: data.timestamp,
            referenceId: data.id,
            partyName: data.staffName,
            invoiceNumber: data.remarks,
            photoUrl: data.photoUrl,
            projectId: data.projectId
        } as StockTransaction;
    });
}

export async function seedInventoryMaster(items: InventoryItem[]) {
    if (!db) return;
    for (const item of items) {
        const itemCode = item.itemCode;
        const docRef = doc(db, STOCK_COLLECTION, itemCode);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
            await setDoc(docRef, item);
        }
    }
}

export async function updateInventoryItemStock(itemCode: string, currentStock: number) {
    if (!db) return;
    const docRef = doc(db, STOCK_COLLECTION, itemCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const item = snap.data() as InventoryItem;
        const prevStock = item.currentStock;
        item.currentStock = currentStock;
        item.lastUpdated = new Date().toISOString();
        await setDoc(docRef, item);

        // Also update new current_stock collection!
        const newRef = doc(db, "current_stock", itemCode);
        const newSnap = await getDoc(newRef);
        if (newSnap.exists()) {
            const newItem = newSnap.data() as CurrentStockItem;
            const diff = currentStock - newItem.availableStock;
            if (diff > 0) {
                newItem.totalInward += diff;
            } else {
                newItem.totalOutward += Math.abs(diff);
            }
            newItem.availableStock = currentStock;
            newItem.lastUpdated = new Date().toISOString();
            await setDoc(newRef, newItem);
        }

        const logRef = doc(collection(db, LOG_COLLECTION));
        const stockTx: StockTransaction = {
            id: logRef.id,
            itemId: itemCode,
            type: currentStock >= prevStock ? 'INWARD' : 'OUTWARD',
            quantity: Math.abs(currentStock - prevStock),
            previousStock: prevStock,
            newStock: currentStock,
            timestamp: new Date().toISOString(),
            referenceId: 'MANUAL_ADJUSTMENT',
            partyName: 'STORE_AUDITOR',
            invoiceNumber: 'AUDIT_CORRECTION'
        };
        await setDoc(logRef, stockTx);

        // Save in master_register
        const masterRef = doc(collection(db, "master_register"));
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthName = months[new Date().getMonth()];
        const masterEntry: MasterRegisterEntry = {
            id: masterRef.id,
            timestamp: new Date().toISOString(),
            projectId: 'GENERAL',
            materialName: item.name,
            itemCode,
            category: item.category || 'GENERAL',
            quantity: Math.abs(currentStock - prevStock),
            unit: item.unit || 'Nos',
            staffName: 'STORE_AUDITOR',
            issuedBy: 'Store Auditor',
            balanceStockAfterIssue: currentStock,
            remarks: 'AUDIT_CORRECTION',
            type: currentStock >= prevStock ? 'INWARD' : 'OUTWARD'
        };
        await setDoc(masterRef, masterEntry);

        // Save in monthly_registers/{month}/entries
        const monthlyRef = doc(collection(db, "monthly_registers", monthName, "entries"));
        await setDoc(monthlyRef, { ...masterEntry, id: monthlyRef.id });
    }
}

export async function deleteInventoryItem(itemCode: string) {
    if (!db) return;
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, STOCK_COLLECTION, itemCode));
    await deleteDoc(doc(db, "current_stock", itemCode));
    await deleteDoc(doc(db, "material_catalog", itemCode));
}

export async function addInventoryItem(item: InventoryItem) {
    if (!db) return;
    const docRef = doc(db, STOCK_COLLECTION, item.itemCode);
    await setDoc(docRef, item);

    // Also add to new collections!
    const catalogRef = doc(db, "material_catalog", item.itemCode);
    await setDoc(catalogRef, {
        itemCode: item.itemCode,
        name: item.name,
        category: item.category || 'GENERAL',
        unit: item.unit || 'Nos',
        location: item.location || 'MAIN STORE',
        minThreshold: item.minThreshold || 5,
        unitPrice: getEstimatedPrice(item.category || 'GENERAL'),
        lastUpdated: new Date().toISOString()
    });

    const stockRef = doc(db, "current_stock", item.itemCode);
    await setDoc(stockRef, {
        itemCode: item.itemCode,
        name: item.name,
        category: item.category || 'GENERAL',
        unit: item.unit || 'Nos',
        openingStock: item.currentStock || 0,
        totalInward: 0,
        totalOutward: 0,
        availableStock: item.currentStock || 0,
        lastUpdated: new Date().toISOString()
    });
}

export async function recordManualTransaction(
    name: string,
    qty: number,
    unit: string,
    type: 'INWARD' | 'OUTWARD',
    party: string,
    invoice: string,
    hsn?: string,
    photoUrl?: string,
    projectId?: string
) {
    const refId = `MANUAL_TX_${Date.now()}`;
    return updateStock(name, qty, unit, type, refId, party, invoice, hsn, photoUrl, projectId);
}

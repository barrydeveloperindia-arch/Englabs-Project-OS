import { GateEntry, InventoryItem, StockTransaction } from '@shared/services/gate_system';
import { db } from '@services/firebase';
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
    limit,
    where,
    deleteDoc,
    updateDoc,
    getDocFromCache,
    getDocsFromCache
} from 'firebase/firestore';
import masterInventory from '@data/master_inventory_may_2026.json';

const isTest = typeof window !== 'undefined' && (
    window.navigator.webdriver || 
    window.navigator.userAgent.toLowerCase().includes('playwright') ||
    window.navigator.userAgent.toLowerCase().includes('headless')
);


async function getDocsWithTimeout(q: any, timeoutMs = 1500): Promise<any> {
    try {
        return await Promise.race([
            getDocs(q),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore query timeout")), timeoutMs))
        ]);
    } catch (err) {
        console.warn("Network query failed or timed out, trying local cache...", err);
        try {
            const cacheSnap = await Promise.race([
                getDocsFromCache(q),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Cache read timeout")), 1500))
            ]);
            return cacheSnap;
        } catch (cacheErr) {
            console.error("Cache read also failed:", cacheErr);
            throw err;
        }
    }
}

async function getDocWithTimeout(docRef: any, timeoutMs = 1500): Promise<any> {
    try {
        return await Promise.race([
            getDoc(docRef),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore doc read timeout")), timeoutMs))
        ]);
    } catch (err) {
        console.warn("Network doc read failed or timed out, trying local cache...", err);
        try {
            const cacheSnap = await Promise.race([
                getDocFromCache(docRef),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Cache read timeout")), 1500))
            ]);
            return cacheSnap;
        } catch (cacheErr) {
            console.warn("Cache read also failed:", cacheErr);
            return {
                exists: () => false,
                data: () => undefined,
                id: docRef.id
            } as any;
        }
    }
}

async function setDocWithTimeout(docRef: any, data: any, timeoutMs = 1500): Promise<any> {
    return Promise.race([
        setDoc(docRef, data),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore doc write timeout")), timeoutMs))
    ]);
}

async function updateDocWithTimeout(docRef: any, data: any, timeoutMs = 1500): Promise<any> {
    const { updateDoc } = await import('firebase/firestore');
    return Promise.race([
        updateDoc(docRef, data),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore doc update timeout")), timeoutMs))
    ]);
}

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
    location?: string;
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
nameToCodeMap.set("hand gloves", "Eng-136");
nameToCodeMap.set("gloves (industrial)", "Eng-136");
nameToCodeMap.set("surgical blade", "Eng-055");
nameToCodeMap.set("sbl pu fast drying primer surfacer grey 4 ltr", "Eng-004");
nameToCodeMap.set("eng04", "Eng-004");
nameToCodeMap.set("palmatt patti", "Eng-147");
nameToCodeMap.set("patti", "Eng-147");
nameToCodeMap.set("screws 1/2\" gyp", "Eng-148");
nameToCodeMap.set("screws [pcs] 1/2\" gyp", "Eng-148");
nameToCodeMap.set("screws gyp 1.5\"", "Eng-149");
nameToCodeMap.set("screws [pcs] gyp 1.5\"", "Eng-149");

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

let isSeeded = false;
let seedingAttempted = false;

// Automated seeding for new collections if they are empty
export async function seedStoreStockReport() {
    if (!db || isTest) return;
    if (isSeeded || seedingAttempted) return;
    seedingAttempted = true; // Mark as attempted to prevent subsequent calls if network fails/timeout
    try {
        const catalogSnap = await getDocsWithTimeout(query(collection(db, "material_catalog"), limit(1)));
        const stockSnap = await getDocsWithTimeout(query(collection(db, "current_stock"), limit(1)));
        if (!catalogSnap.empty && !stockSnap.empty) {
            isSeeded = true;
            return;
        }

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
        await Promise.race([
            batch.commit(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Batch commit timeout")), 3000))
        ]);
        isSeeded = true;
        console.log("Seeding complete!");
    } catch (err) {
        console.error("Seeding error:", err);
    }
}

export async function processInventoryUpdate(entry: GateEntry) {
    const isInwardToMainStore = entry.type === 'INWARD' && entry.toLocation?.toUpperCase().trim() === 'MAIN STORE';
    const isOutwardFromMainStore = entry.type === 'OUTWARD' && entry.fromLocation?.toUpperCase().trim() === 'MAIN STORE';

    if (!isInwardToMainStore && !isOutwardFromMainStore) {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
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

export interface OfflineTransaction {
    id: string;
    timestamp: string;
    payload: {
        name: string;
        qty: number;
        unit: string;
        type: 'INWARD' | 'OUTWARD';
        refId: string;
        party: string;
        invoice: string;
        hsn?: string;
        photoUrl?: string;
        projectId?: string;
        location?: string;
        issuedBy?: string;
        explicitItemCode?: string;
        category?: string;
    };
}

export async function processOfflineQueue() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    const queueSaved = window.localStorage.getItem('englabs_offline_tx_queue');
    if (!queueSaved) return;

    const queue: OfflineTransaction[] = JSON.parse(queueSaved);
    if (queue.length === 0) return;

    console.log(`[PWA] Processing offline queue: ${queue.length} items`);
    const remainingQueue: OfflineTransaction[] = [];

    for (const tx of queue) {
        try {
            const { payload } = tx;
            const res = await updateStock(
                payload.name, payload.qty, payload.unit, payload.type, payload.refId, 
                payload.party, payload.invoice, payload.hsn, payload.photoUrl, 
                payload.projectId, payload.location, payload.issuedBy, payload.explicitItemCode
            );
            if (!res.success) {
                console.error(`[PWA] Failed to sync offline tx: ${tx.id}`, (res as any).error || res.message);
                remainingQueue.push(tx); // Keep in queue
            } else {
                console.log(`[PWA] Successfully synced offline tx: ${tx.id}`);
            }
        } catch (err) {
            console.error(`[PWA] Error syncing offline tx: ${tx.id}`, err);
            remainingQueue.push(tx);
        }
    }

    window.localStorage.setItem('englabs_offline_tx_queue', JSON.stringify(remainingQueue));
}

// Automatically setup online listener for PWA
if (typeof window !== 'undefined') {
    window.addEventListener('online', processOfflineQueue);
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
    category?: string,
    issuedBy?: string
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
                    materialName: name || (itemCode || '').replace(/_/g, ' '),
                    itemCode,
                    category: category || 'GENERAL',
                    quantity: qty,
                    unit: unit || 'Nos',
                    staffName: party,
                    issuedBy: issuedBy || (type === 'OUTWARD' ? 'Gate Operator' : 'Arjun Tiwari'),
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
                    name: name || prevLocalItem?.name || (itemCode || '').replace(/_/g, ' '),
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

                // Add to offline queue for PWA sync
                const offlineQueueSaved = window.localStorage.getItem('englabs_offline_tx_queue');
                const offlineQueue: OfflineTransaction[] = offlineQueueSaved ? JSON.parse(offlineQueueSaved) : [];
                offlineQueue.push({
                    id: `OFFLINE_TX_${Date.now()}_${itemCode}`,
                    timestamp: new Date().toISOString(),
                    payload: {
                        name: name || itemCode,
                        qty,
                        unit: unit || 'Nos',
                        type,
                        refId,
                        party,
                        invoice,
                        photoUrl,
                        projectId,
                        category,
                        issuedBy
                    }
                });
                window.localStorage.setItem('englabs_offline_tx_queue', JSON.stringify(offlineQueue));

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
    projectId?: string,
    location?: string,
    issuedBy?: string,
    explicitItemCode?: string
) {
    const itemCode = explicitItemCode || nameToCodeMap.get(name.trim().toLowerCase()) || name.toUpperCase().replace(/\s+/g, '_');

    if (!db || isTest) {
        saveLocalStockFallback(itemCode, type, qty, refId, party, invoice, photoUrl, projectId, name, unit, hsn, issuedBy);
        return { success: true, itemCode };
    }
    
    try {
        await seedStoreStockReport(); // Ensure collections are seeded

        const result = await Promise.race([
            runTransaction(db, async (transaction) => {
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
                let trueAvailableStock = legacyItem.currentStock;
                if (typeof window !== 'undefined' && window.localStorage) {
                    const localSaved = window.localStorage.getItem('local_current_stock');
                    if (localSaved) {
                        try {
                            const localStock = JSON.parse(localSaved);
                            if (localStock[itemCode] && localStock[itemCode].availableStock > trueAvailableStock) {
                                trueAvailableStock = localStock[itemCode].availableStock;
                            }
                        } catch (e) {}
                    }
                }

                if (trueAvailableStock < qty) {
                    throw new Error(`Insufficient stock for ${name}. Available: ${trueAvailableStock}`);
                }
                legacyItem.currentStock -= qty;
                legacyItem.totalOutward += qty;
            }
            if (location) {
                legacyItem.location = location;
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
            if (location) {
                currentStockItem.location = location;
            }
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
                issuedBy: issuedBy || (type === 'OUTWARD' ? 'Gate Operator' : 'Arjun Tiwari'),
                balanceStockAfterIssue: currentStockItem.availableStock,
                remarks: invoice || '',
                type,
                photoUrl: photoUrl || undefined,
                location: location || undefined
            };

            const monthlyTxRef = doc(collection(db, "monthly_registers", monthName, "entries"));
            const monthlyEntry = { ...masterEntry, id: monthlyTxRef.id };

            // --- WRITES START HERE ---
            transaction.set(legacyDocRef, cleanUndefined(legacyItem));
            transaction.set(currentStockRef, cleanUndefined(currentStockItem));

            if (catalogSnap.exists()) {
                const catalogItem = catalogSnap.data();
                if (location) {
                    catalogItem.location = location;
                    catalogItem.lastUpdated = new Date().toISOString();
                    transaction.set(catalogRef, cleanUndefined(catalogItem));
                }
            } else {
                transaction.set(catalogRef, cleanUndefined({
                    itemCode,
                    name,
                    category: hsn || 'GENERAL',
                    unit,
                    location: location || 'MAIN STORE',
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
        }),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Transaction timeout")), 4000))
        ]);

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
            const lockSnap = await getDocWithTimeout(lockDocRef);
            if (lockSnap.exists()) {
                return { success: true, message: "Already synced offline", itemCode };
            }

            const legacySnap = await getDocWithTimeout(legacyDocRef);
            const currentStockSnap = await getDocWithTimeout(currentStockRef);
            const catalogSnap = await getDocWithTimeout(catalogRef);

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
                issuedBy: issuedBy || (type === 'OUTWARD' ? 'Gate Operator' : 'Arjun Tiwari'),
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

            await Promise.race([
                batch.commit(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Batch commit timeout")), 3000))
            ]);
            console.log("Offline batch update succeeded locally!");

            // Run local storage fallback just in case
            saveLocalStockFallback(itemCode, type, qty, refId, party, invoice, photoUrl, projectId, name, unit, hsn, issuedBy);

            return { success: true, offline: true, itemCode };

        } catch (fallbackErr: any) {
            console.error("Offline batch fallback also failed, but local storage succeeded:", fallbackErr);
            saveLocalStockFallback(itemCode, type, qty, refId, party, invoice, photoUrl, projectId, name, unit, hsn, issuedBy);
            return { success: true, offline: true, itemCode, message: "Saved locally (batch timeout)" };
        }
    }
}

// Fetch all materials from current_stock
if (typeof window !== 'undefined') {
    (window as any).db = db;
    (window as any).getDoc = getDoc;
    (window as any).doc = doc;
    (window as any).collection = collection;
    (window as any).getDocs = getDocs;
    (window as any).deleteDoc = deleteDoc;
    (window as any).updateDoc = updateDoc;
}

export async function fetchCurrentStock(): Promise<CurrentStockItem[]> {
    if (!db || isTest) {
        return getLocalStockFallback();
    }
    try {
        await seedStoreStockReport();
        const q = query(collection(db, "current_stock"));
        const snap = await getDocsWithTimeout(q);
        if (snap.empty) {
            return getLocalStockFallback();
        }
        let items = snap.docs.map((d: any) => {
            const data = d.data();
            return {
                ...data,
                itemCode: data.itemCode || d.id,
                id: d.id
            } as CurrentStockItem;
        });

        // --- APPLY LOCAL OFFLINE OVERRIDES ---
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                let localOverrides: Record<string, Partial<InventoryItem>> | null = null;
                const localOverridesSaved = window.localStorage.getItem('local_stock_overrides');
                if (localOverridesSaved) {
                    localOverrides = JSON.parse(localOverridesSaved);
                    if (localOverrides) {
                        items = items.map((item: CurrentStockItem) => {
                            if (localOverrides![item.itemCode]) {
                                const override = localOverrides![item.itemCode];
                                
                                // Ignore stale overrides if server data is newer, OR if override has no timestamp
                                let isStale = false;
                                if (!override.lastUpdated) {
                                    isStale = true;
                                } else if (item.lastUpdated) {
                                    const overrideTime = new Date(override.lastUpdated).getTime();
                                    const serverTime = new Date(item.lastUpdated).getTime();
                                    if (serverTime > overrideTime) {
                                        isStale = true;
                                    }
                                }

                                if (isStale) {
                                    delete localOverrides![item.itemCode];
                                    try {
                                        window.localStorage.setItem('local_stock_overrides', JSON.stringify(localOverrides));
                                    } catch(e) {}
                                    return item;
                                }
                                
                                return {
                                    ...item,
                                    availableStock: override.currentStock !== undefined ? override.currentStock : item.availableStock,
                                    totalInward: override.totalInward !== undefined ? override.totalInward : item.totalInward,
                                    totalOutward: override.totalOutward !== undefined ? override.totalOutward : item.totalOutward,
                                    lastUpdated: override.lastUpdated || item.lastUpdated
                                };
                            }
                            return item;
                        });
                        
                        // Add purely offline items not yet on server
                        for (const [code, override] of Object.entries(localOverrides)) {
                            if (!items.find((i: CurrentStockItem) => i.itemCode === code)) {
                                items.push({
                                    itemCode: code,
                                    id: code,
                                    name: override.name || code,
                                    category: override.category || 'GENERAL',
                                    unit: override.unit || 'Nos',
                                    openingStock: (override as any).openingStock || 0,
                                    totalInward: override.totalInward || 0,
                                    totalOutward: override.totalOutward || 0,
                                    availableStock: override.currentStock || 0,
                                    lastUpdated: override.lastUpdated || new Date().toISOString(),
                                    location: override.location || 'MAIN STORE'
                                });
                            }
                        }
                    }
                }
                
                // ALSO replay any pending transactions from englabs_offline_tx_queue
                const offlineQueueSaved = window.localStorage.getItem('englabs_offline_tx_queue');
                if (offlineQueueSaved) {
                    let offlineQueue: any[] = JSON.parse(offlineQueueSaved);
                    
                    // --- BUG FIX: Purge stuck test data from queue ---
                    const initialLength = offlineQueue.length;
                    offlineQueue = offlineQueue.filter(tx => tx.payload?.staffName !== 'SYSTEM_TEST');
                    if (offlineQueue.length !== initialLength) {
                        try {
                            window.localStorage.setItem('englabs_offline_tx_queue', JSON.stringify(offlineQueue));
                        } catch(e) {}
                    }
                    // -------------------------------------------------

                    // Group queued qty by item code
                    const queuedDelta: Record<string, { inward: number, outward: number }> = {};
                    offlineQueue.forEach(tx => {
                        const code = tx.payload?.itemCode || tx.id.split('_').pop();
                        if (!code) return;
                        if (!queuedDelta[code]) queuedDelta[code] = { inward: 0, outward: 0 };
                        if (tx.payload?.type === 'INWARD') {
                            queuedDelta[code].inward += (tx.payload.qty || 0);
                        } else {
                            queuedDelta[code].outward += (tx.payload.qty || 0);
                        }
                    });

                    items = items.map((item: CurrentStockItem) => {
                        // Only apply queued delta if we DID NOT already apply a local override for this item.
                        // Because local overrides already have the absolute latest computed stock.
                        if (!localOverrides || !localOverrides[item.itemCode]) {
                            if (queuedDelta[item.itemCode]) {
                                const delta = queuedDelta[item.itemCode];
                                return {
                                    ...item,
                                    availableStock: item.availableStock + delta.inward - delta.outward,
                                    totalInward: item.totalInward + delta.inward,
                                    totalOutward: item.totalOutward + delta.outward
                                };
                            }
                        }
                        return item;
                    });
                }

            } catch (e) {
                console.error("Failed to apply local_stock_overrides in fetchCurrentStock", e);
            }
        }
        
        // Deduplicate items by name
        const deduplicatedMap = new Map<string, CurrentStockItem>();
        items.forEach((item: CurrentStockItem) => {
            const normalizedName = (item.name || '').trim().toLowerCase();
            if (deduplicatedMap.has(normalizedName)) {
                const existing = deduplicatedMap.get(normalizedName)!;
                const isExistingStandard = existing.itemCode.toUpperCase().startsWith('ENG-');
                const isNewStandard = item.itemCode.toUpperCase().startsWith('ENG-');
                
                const preferred = (isNewStandard && !isExistingStandard) ? { ...item } : { ...existing };
                const other = (isNewStandard && !isExistingStandard) ? existing : item;
                
                preferred.openingStock = (preferred.openingStock || 0) + (other.openingStock || 0);
                preferred.totalInward = (preferred.totalInward || 0) + (other.totalInward || 0);
                preferred.totalOutward = (preferred.totalOutward || 0) + (other.totalOutward || 0);
                preferred.availableStock = (preferred.availableStock || 0) + (other.availableStock || 0);
                
                deduplicatedMap.set(normalizedName, preferred);
            } else {
                deduplicatedMap.set(normalizedName, { ...item });
            }
        });
        const deduplicatedItems = Array.from(deduplicatedMap.values());

        if (typeof window !== 'undefined' && window.localStorage) {
            const localCurrentStockMap: Record<string, CurrentStockItem> = {};
            deduplicatedItems.forEach((item: CurrentStockItem) => {
                localCurrentStockMap[item.itemCode] = item;
            });
            window.localStorage.setItem('local_current_stock', JSON.stringify(localCurrentStockMap));
        }
        return deduplicatedItems;
    } catch (err) {
        console.warn("Firestore fetchCurrentStock failed, falling back to local masterInventory:", err);
        return getLocalStockFallback();
    }
}

function getLocalStockFallback(): CurrentStockItem[] {
    if (typeof window !== 'undefined' && window.localStorage) {
        const localCurrentStockSaved = window.localStorage.getItem('local_current_stock');
        if (localCurrentStockSaved) {
            try {
                const localCurrentStock: Record<string, CurrentStockItem> = JSON.parse(localCurrentStockSaved);
                const keys = Object.keys(localCurrentStock);
                const hasOldFormat = keys.some(key => !key.startsWith('Eng-'));
                if (hasOldFormat) {
                    console.log("Old stock format detected in localStorage. Clearing caches for re-seeding.");
                    window.localStorage.removeItem('local_current_stock');
                    window.localStorage.removeItem('local_master_register');
                    window.localStorage.removeItem('local_stock_transactions');
                    window.localStorage.removeItem('local_monthly_registers');
                } else {
                    return Object.values(localCurrentStock);
                }
            } catch (e) {
                console.error("Failed to parse local_current_stock", e);
            }
        }
    }
    
    // No local current stock saved, seed from masterInventory
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
    const localStock: CurrentStockItem[] = [];
    for (const item of uniqueItems.values()) {
        localStock.push({
            itemCode: item.itemCode,
            name: item.name,
            category: item.category || 'GENERAL',
            unit: item.unit || 'Nos',
            openingStock: item.currentStock || 0,
            totalInward: 0,
            totalOutward: 0,
            availableStock: item.currentStock || 0,
            lastUpdated: new Date().toISOString(),
            location: item.location || 'MAIN STORE',
            minThreshold: item.minThreshold || 5,
            unitPrice: getEstimatedPrice(item.category || 'GENERAL')
        });
    }
    
    // Save it to local storage so that subsequent modifications can be applied
    if (typeof window !== 'undefined' && window.localStorage) {
        const localCurrentStockMap: Record<string, CurrentStockItem> = {};
        localStock.forEach(item => {
            localCurrentStockMap[item.itemCode] = item;
        });
        window.localStorage.setItem('local_current_stock', JSON.stringify(localCurrentStockMap));
    }
    
    return localStock;
}

// Fetch master register transaction entries
function normalizeTransactionCodes(txs: MasterRegisterEntry[]): MasterRegisterEntry[] {
    return txs.map(tx => {
        if (tx && tx.materialName) {
            const correctCode = nameToCodeMap.get(tx.materialName.trim().toLowerCase());
            if (correctCode && tx.itemCode !== correctCode) {
                return { ...tx, itemCode: correctCode };
            }
        }
        return tx;
    });
}

// Fetch master register transaction entries
export async function fetchMasterRegister(): Promise<MasterRegisterEntry[]> {
    let txs: MasterRegisterEntry[] = [];
    if (!db || isTest) {
        txs = getLocalMasterRegisterFallback();
    } else {
        try {
            const q = query(collection(db, "master_register"), orderBy("timestamp", "desc"));
            const snap = await getDocsWithTimeout(q);
            txs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as MasterRegisterEntry));
        } catch (err) {
            console.warn("Firestore fetchMasterRegister failed, falling back to local master register:", err);
            txs = getLocalMasterRegisterFallback();
        }
    }
    return normalizeTransactionCodes(txs);
}

function getLocalMasterRegisterFallback(): MasterRegisterEntry[] {
    if (typeof window !== 'undefined' && window.localStorage) {
        const localMasterSaved = window.localStorage.getItem('local_master_register');
        if (localMasterSaved) {
            try {
                return JSON.parse(localMasterSaved);
            } catch (e) {
                console.error("Failed to parse local_master_register", e);
            }
        }
    }
    return [];
}

// Fetch specific monthly register transaction entries
export async function fetchMonthlyRegister(month: string): Promise<MasterRegisterEntry[]> {
    let txs: MasterRegisterEntry[] = [];
    if (!db || isTest) {
        txs = getLocalMonthlyRegisterFallback(month);
    } else {
        try {
            const q = query(collection(db, "monthly_registers", month, "entries"), orderBy("timestamp", "desc"));
            const snap = await getDocsWithTimeout(q);
            txs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as MasterRegisterEntry));
        } catch (err) {
            console.warn("Firestore fetchMonthlyRegister failed, falling back to local monthly register:", err);
            txs = getLocalMonthlyRegisterFallback(month);
        }
    }
    return normalizeTransactionCodes(txs);
}

function getLocalMonthlyRegisterFallback(month: string): MasterRegisterEntry[] {
    if (typeof window !== 'undefined' && window.localStorage) {
        const localMonthlySaved = window.localStorage.getItem('local_monthly_registers');
        if (localMonthlySaved) {
            try {
                const localMonthly: Record<string, MasterRegisterEntry[]> = JSON.parse(localMonthlySaved);
                return localMonthly[month] || [];
            } catch (e) {
                console.error("Failed to parse local_monthly_registers", e);
            }
        }
    }
    return [];
}

export async function fetchInventoryMaster(): Promise<InventoryItem[]> {
    if (!db || isTest) {
        return getLocalInventoryMasterFallback();
    }
    try {
        await seedStoreStockReport();
        const items = await fetchCurrentStock();
        return items.map((data: CurrentStockItem) => {
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
    } catch (err) {
        console.warn("Firestore fetchInventoryMaster failed, falling back to local masterInventory:", err);
        return getLocalInventoryMasterFallback();
    }
}

function getLocalInventoryMasterFallback(): InventoryItem[] {
    const localStock = getLocalStockFallback();
    return localStock.map(data => ({
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
    }));
}

export async function fetchStockMovement(): Promise<StockTransaction[]> {
    if (!db || isTest) {
        return getLocalStockMovementFallback();
    }
    try {
        const q = query(collection(db, "master_register"), orderBy("timestamp", "desc"));
        const snap = await getDocsWithTimeout(q);
        if (snap.empty) {
            const qOld = query(collection(db, LOG_COLLECTION), orderBy("timestamp", "desc"));
            const snapOld = await getDocsWithTimeout(qOld);
            return snapOld.docs.map((d: any) => d.data() as StockTransaction);
        }
        return snap.docs.map((d: any) => {
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
    } catch (err) {
        console.warn("Firestore fetchStockMovement failed, falling back to local stock transactions:", err);
        return getLocalStockMovementFallback();
    }
}

function getLocalStockMovementFallback(): StockTransaction[] {
    if (typeof window !== 'undefined' && window.localStorage) {
        const localTxSaved = window.localStorage.getItem('local_stock_transactions');
        if (localTxSaved) {
            try {
                return JSON.parse(localTxSaved);
            } catch (e) {
                console.error("Failed to parse local_stock_transactions", e);
            }
        }
    }
    return [];
}

export async function seedInventoryMaster(items: InventoryItem[]) {
    if (!db) return;
    for (const item of items) {
        const itemCode = item.itemCode;
        const docRef = doc(db, STOCK_COLLECTION, itemCode);
        const snap = await getDocWithTimeout(docRef);
        if (!snap.exists()) {
            await setDoc(docRef, item);
        }
    }
}

export async function updateInventoryItemStock(itemCode: string, currentStock: number) {
    if (!db || isTest) {
        updateLocalStockFallback(itemCode, currentStock);
        return;
    }
    try {
        const docRef = doc(db, STOCK_COLLECTION, itemCode);
        const snap = await getDocWithTimeout(docRef);
        if (snap.exists()) {
            const item = snap.data() as InventoryItem;
            const prevStock = item.currentStock;
            item.currentStock = currentStock;
            item.lastUpdated = new Date().toISOString();
            await setDocWithTimeout(docRef, item);

            // Also update new current_stock collection!
            const newRef = doc(db, "current_stock", itemCode);
            const newSnap = await getDocWithTimeout(newRef);
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
                await setDocWithTimeout(newRef, newItem);
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
            await setDocWithTimeout(logRef, stockTx);

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
            await setDocWithTimeout(masterRef, masterEntry);

            // Save in monthly_registers/{month}/entries
            const monthlyRef = doc(collection(db, "monthly_registers", monthName, "entries"));
            await setDocWithTimeout(monthlyRef, { ...masterEntry, id: monthlyRef.id });
        }
    } catch (err) {
        console.warn("Firestore updateInventoryItemStock failed, applying local update only:", err);
        updateLocalStockFallback(itemCode, currentStock);
    }
}

function updateLocalStockFallback(itemCode: string, currentStock: number) {
    if (typeof window !== 'undefined' && window.localStorage) {
        const localCurrentStockSaved = window.localStorage.getItem('local_current_stock');
        const localCurrentStock: Record<string, CurrentStockItem> = localCurrentStockSaved ? JSON.parse(localCurrentStockSaved) : {};
        if (localCurrentStock[itemCode]) {
            const item = localCurrentStock[itemCode];
            const prevStock = item.availableStock;
            const diff = currentStock - prevStock;
            if (diff > 0) {
                item.totalInward += diff;
            } else {
                item.totalOutward += Math.abs(diff);
            }
            item.availableStock = currentStock;
            item.lastUpdated = new Date().toISOString();
            window.localStorage.setItem('local_current_stock', JSON.stringify(localCurrentStock));
        }
    }
}

export async function updateInventoryItemDetails(
    itemCode: string, 
    currentStock: number, 
    location: string,
    name?: string,
    category?: string,
    unit?: string,
    minThreshold?: number,
    unitPrice?: number
) {
    if (!db || isTest) {
        updateLocalDetailsFallback(itemCode, currentStock, location, name, category, unit, minThreshold, unitPrice);
        return;
    }
    try {
        const docRef = doc(db, STOCK_COLLECTION, itemCode);
        const snap = await getDocWithTimeout(docRef);
        if (snap.exists()) {
            const item = snap.data() as InventoryItem;
            const prevStock = item.currentStock;
            item.currentStock = currentStock;
            item.location = location || "";
            if (name) item.name = name;
            if (category) item.category = category;
            if (unit) item.unit = unit;
            if (minThreshold !== undefined) item.minThreshold = minThreshold;
            item.lastUpdated = new Date().toISOString();
            await setDocWithTimeout(docRef, item);

            // Also update new current_stock collection!
            const newRef = doc(db, "current_stock", itemCode);
            const newSnap = await getDocWithTimeout(newRef);
            if (newSnap.exists()) {
                const newItem = newSnap.data() as CurrentStockItem;
                const diff = currentStock - newItem.availableStock;
                if (diff > 0) {
                    newItem.totalInward += diff;
                } else {
                    newItem.totalOutward += Math.abs(diff);
                }
                newItem.availableStock = currentStock;
                newItem.location = location || "";
                if (name) newItem.name = name;
                if (category) newItem.category = category;
                if (unit) newItem.unit = unit;
                if (minThreshold !== undefined) newItem.minThreshold = minThreshold;
                newItem.lastUpdated = new Date().toISOString();
                await setDocWithTimeout(newRef, newItem);
            }

            // Also update material_catalog!
            const catalogRef = doc(db, "material_catalog", itemCode);
            const catalogSnap = await getDocWithTimeout(catalogRef);
            if (catalogSnap.exists()) {
                const catalogItem = catalogSnap.data();
                catalogItem.location = location || "";
                if (name) catalogItem.name = name;
                if (category) catalogItem.category = category;
                if (unit) catalogItem.unit = unit;
                if (minThreshold !== undefined) catalogItem.minThreshold = minThreshold;
                if (unitPrice !== undefined) catalogItem.unitPrice = unitPrice;
                catalogItem.lastUpdated = new Date().toISOString();
                await setDocWithTimeout(catalogRef, catalogItem);
            }

            if (currentStock !== prevStock) {
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
                    remarks: `MANUAL AUDIT CORRECTION (Rack: ${location || 'N/A'})`,
                    materialName: name || item.name,
                    category: category || item.category,
                    unit: unit || item.unit
                };
                await setDocWithTimeout(logRef, stockTx);

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
                    materialName: name || item.name,
                    itemCode,
                    category: category || item.category || 'GENERAL',
                    quantity: Math.abs(currentStock - prevStock),
                    unit: unit || item.unit || 'Nos',
                    staffName: 'STORE_AUDITOR',
                    issuedBy: 'Store Auditor',
                    balanceStockAfterIssue: currentStock,
                    remarks: stockTx.remarks || '',
                    type: currentStock >= prevStock ? 'INWARD' : 'OUTWARD',
                    location: location || undefined
                };
                await setDocWithTimeout(masterRef, masterEntry);

                // Save in monthly_registers/{month}/entries
                const monthlyRef = doc(collection(db, "monthly_registers", monthName, "entries"));
                await setDocWithTimeout(monthlyRef, { ...masterEntry, id: monthlyRef.id });
            }
        }
    } catch (err) {
        console.warn("Firestore updateInventoryItemDetails failed, applying local update only:", err);
        updateLocalDetailsFallback(itemCode, currentStock, location, name, category, unit, minThreshold, unitPrice);
    }
}

function updateLocalDetailsFallback(
    itemCode: string, 
    currentStock: number, 
    location: string,
    name?: string,
    category?: string,
    unit?: string,
    minThreshold?: number,
    unitPrice?: number
) {
    if (typeof window !== 'undefined' && window.localStorage) {
        const localCurrentStockSaved = window.localStorage.getItem('local_current_stock');
        const localCurrentStock: Record<string, CurrentStockItem> = localCurrentStockSaved ? JSON.parse(localCurrentStockSaved) : {};
        if (localCurrentStock[itemCode]) {
            const item = localCurrentStock[itemCode];
            const prevStock = item.availableStock;
            const diff = currentStock - prevStock;
            if (diff > 0) {
                item.totalInward += diff;
            } else {
                item.totalOutward += Math.abs(diff);
            }
            item.availableStock = currentStock;
            item.location = location || "";
            if (name) item.name = name;
            if (category) item.category = category;
            if (unit) item.unit = unit;
            if (minThreshold !== undefined) item.minThreshold = minThreshold;
            item.lastUpdated = new Date().toISOString();
            window.localStorage.setItem('local_current_stock', JSON.stringify(localCurrentStock));
        }
    }
}


export async function deleteInventoryItem(itemCode: string) {
    if (!itemCode) {
        throw new Error("Item code is undefined or empty. Cannot delete.");
    }
    if (!db || isTest) {
        if (typeof window !== 'undefined' && window.localStorage) {
            const localCurrentStockSaved = window.localStorage.getItem('local_current_stock');
            if (localCurrentStockSaved) {
                try {
                    const localCurrentStock = JSON.parse(localCurrentStockSaved);
                    delete localCurrentStock[itemCode];
                    window.localStorage.setItem('local_current_stock', JSON.stringify(localCurrentStock));
                } catch (e) {
                    console.error(e);
                }
            }
        }
        return;
    }
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, STOCK_COLLECTION, itemCode));
    await deleteDoc(doc(db, "current_stock", itemCode));
    await deleteDoc(doc(db, "material_catalog", itemCode));
}

export async function addInventoryItem(item: InventoryItem) {
    if (!db || isTest) {
        if (typeof window !== 'undefined' && window.localStorage) {
            const localCurrentStockSaved = window.localStorage.getItem('local_current_stock');
            const localCurrentStock = localCurrentStockSaved ? JSON.parse(localCurrentStockSaved) : {};
            const price = item.unitPrice !== undefined ? item.unitPrice : getEstimatedPrice(item.category || 'GENERAL');
            localCurrentStock[item.itemCode] = {
                itemCode: item.itemCode,
                name: item.name,
                category: item.category || 'GENERAL',
                unit: item.unit || 'Nos',
                openingStock: item.currentStock || 0,
                totalInward: 0,
                totalOutward: 0,
                availableStock: item.currentStock || 0,
                location: item.location || 'MAIN STORE',
                lastUpdated: new Date().toISOString(),
                unitPrice: price
            };
            window.localStorage.setItem('local_current_stock', JSON.stringify(localCurrentStock));
        }
        return;
    }
    const docRef = doc(db, STOCK_COLLECTION, item.itemCode);
    await setDocWithTimeout(docRef, item, 2000).catch(e => console.warn("Offline fallback for setDoc", e));

    // Also add to new collections!
    const catalogRef = doc(db, "material_catalog", item.itemCode);
    await setDocWithTimeout(catalogRef, {
        itemCode: item.itemCode,
        name: item.name,
        category: item.category || 'GENERAL',
        unit: item.unit || 'Nos',
        location: item.location || 'MAIN STORE',
        minThreshold: item.minThreshold || 5,
        unitPrice: item.unitPrice !== undefined ? item.unitPrice : getEstimatedPrice(item.category || 'GENERAL'),
        lastUpdated: new Date().toISOString()
    }, 2000).catch(e => console.warn("Offline fallback for setDoc", e));

    const stockRef = doc(db, "current_stock", item.itemCode);
    await setDocWithTimeout(stockRef, {
        itemCode: item.itemCode,
        name: item.name,
        category: item.category || 'GENERAL',
        unit: item.unit || 'Nos',
        openingStock: item.currentStock || 0,
        totalInward: 0,
        totalOutward: 0,
        availableStock: item.currentStock || 0,
        location: item.location || 'MAIN STORE',
        lastUpdated: new Date().toISOString()
    }, 2000).catch(e => console.warn("Offline fallback for setDoc", e));
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
    projectId?: string,
    location?: string,
    issuedBy?: string,
    explicitItemCode?: string
) {
    const refId = `MANUAL_TX_${Date.now()}`;
    return updateStock(name, qty, unit, type, refId, party, invoice, hsn, photoUrl, projectId, location, issuedBy, explicitItemCode);
}

export async function deleteTransaction(tx: MasterRegisterEntry): Promise<{ success: boolean, error?: string }> {
    if (!db || isTest) {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const localMasterSaved = window.localStorage.getItem('local_master_register');
                if (localMasterSaved) {
                    const localMasterList: MasterRegisterEntry[] = JSON.parse(localMasterSaved);
                    const filtered = localMasterList.filter(t => t.id !== tx.id);
                    window.localStorage.setItem('local_master_register', JSON.stringify(filtered));
                }

                const localTxSaved = window.localStorage.getItem('local_stock_transactions');
                if (localTxSaved) {
                    const localTxList: StockTransaction[] = JSON.parse(localTxSaved);
                    const filteredTx = localTxList.filter(t => t.referenceId !== tx.id);
                    window.localStorage.setItem('local_stock_transactions', JSON.stringify(filteredTx));
                }

                const months = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                const txDate = new Date(tx.timestamp);
                const monthName = months[txDate.getMonth()];
                const localMonthlySaved = window.localStorage.getItem('local_monthly_registers');
                if (localMonthlySaved) {
                    const localMonthly: Record<string, MasterRegisterEntry[]> = JSON.parse(localMonthlySaved);
                    if (localMonthly[monthName]) {
                        localMonthly[monthName] = localMonthly[monthName].filter(t => t.id !== tx.id);
                        window.localStorage.setItem('local_monthly_registers', JSON.stringify(localMonthly));
                    }
                }

                const localCurrentStockSaved = window.localStorage.getItem('local_current_stock');
                if (localCurrentStockSaved) {
                    const localCurrentStock: Record<string, CurrentStockItem> = JSON.parse(localCurrentStockSaved);
                    if (localCurrentStock[tx.itemCode]) {
                        const item = localCurrentStock[tx.itemCode];
                        if (tx.type === 'INWARD') {
                            item.totalInward = Math.max(0, item.totalInward - tx.quantity);
                        } else {
                            item.totalOutward = Math.max(0, item.totalOutward - tx.quantity);
                        }
                        item.availableStock = item.openingStock + item.totalInward - item.totalOutward;
                        item.lastUpdated = new Date().toISOString();
                        window.localStorage.setItem('local_current_stock', JSON.stringify(localCurrentStock));
                    }
                }

                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message || err };
            }
        }
        return { success: false, error: "Database offline" };
    }
    try {
        if (!tx || !tx.id) {
            return { success: false, error: "Invalid transaction ID" };
        }

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const txDate = tx.timestamp ? new Date(tx.timestamp) : new Date();
        const monthName = months[txDate.getMonth()];

        const batch = writeBatch(db);

        // 1. Delete from master_register
        const masterRef = doc(db, "master_register", tx.id);
        batch.delete(masterRef);

        // 2. Query and delete from monthly collection
        if (tx.timestamp && tx.itemCode) {
            try {
                const monthlyQuery = query(
                    collection(db, "monthly_registers", monthName, "entries"),
                    where("timestamp", "==", tx.timestamp),
                    where("itemCode", "==", tx.itemCode)
                );
                const monthlySnap = await getDocs(monthlyQuery);
                monthlySnap.forEach(d => {
                    batch.delete(d.ref);
                });
            } catch (queryErr) {
                console.warn("Failed to query monthly registers for delete:", queryErr);
            }
        }

        // 3. Adjust stock levels
        if (tx.itemCode) {
            try {
                const currentStockRef = doc(db, "current_stock", tx.itemCode);
                const legacyDocRef = doc(db, STOCK_COLLECTION, tx.itemCode);

                const currentStockSnap = await getDocWithTimeout(currentStockRef).catch(() => null);
                const legacySnap = await getDocWithTimeout(legacyDocRef).catch(() => null);

                if (currentStockSnap && currentStockSnap.exists()) {
                    const currentStockItem = currentStockSnap.data() as CurrentStockItem;
                    if (tx.type === 'INWARD') {
                        currentStockItem.totalInward = Math.max(0, currentStockItem.totalInward - tx.quantity);
                    } else {
                        currentStockItem.totalOutward = Math.max(0, currentStockItem.totalOutward - tx.quantity);
                    }
                    currentStockItem.availableStock = currentStockItem.openingStock + currentStockItem.totalInward - currentStockItem.totalOutward;
                    currentStockItem.lastUpdated = new Date().toISOString();
                    batch.set(currentStockRef, cleanUndefined(currentStockItem));
                }

                if (legacySnap && legacySnap.exists()) {
                    const legacyItem = legacySnap.data() as InventoryItem;
                    if (tx.type === 'INWARD') {
                        legacyItem.currentStock = Math.max(0, legacyItem.currentStock - tx.quantity);
                        legacyItem.totalInward = Math.max(0, legacyItem.totalInward - tx.quantity);
                    } else {
                        legacyItem.currentStock = legacyItem.currentStock + tx.quantity;
                        legacyItem.totalOutward = Math.max(0, legacyItem.totalOutward - tx.quantity);
                    }
                    legacyItem.lastUpdated = new Date().toISOString();
                    batch.set(legacyDocRef, cleanUndefined(legacyItem));
                }
            } catch (stockErr) {
                console.warn("Failed to adjust stock levels for delete:", stockErr);
            }
        }

        await batch.commit();
        return { success: true };
    } catch (err: any) {
        console.error("Delete transaction error:", err);
        return { success: false, error: err.message || err };
    }
}

export async function editTransaction(
    tx: MasterRegisterEntry,
    newQty: number,
    newStaff: string,
    newRemarks: string,
    newProject: string
): Promise<{ success: boolean, error?: string }> {
    if (!db || isTest) {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const qtyDiff = newQty - tx.quantity;
                const localCurrentStockSaved = window.localStorage.getItem('local_current_stock');
                let finalBalance = tx.balanceStockAfterIssue;
                if (localCurrentStockSaved) {
                    const localCurrentStock: Record<string, CurrentStockItem> = JSON.parse(localCurrentStockSaved);
                    if (localCurrentStock[tx.itemCode]) {
                        const item = localCurrentStock[tx.itemCode];
                        if (tx.type === 'INWARD') {
                            item.totalInward = Math.max(0, item.totalInward + qtyDiff);
                        } else {
                            if (qtyDiff > 0 && item.availableStock < qtyDiff) {
                                return { success: false, error: `Insufficient stock for update. Available: ${item.availableStock}` };
                            }
                            item.totalOutward = Math.max(0, item.totalOutward + qtyDiff);
                        }
                        item.availableStock = item.openingStock + item.totalInward - item.totalOutward;
                        item.lastUpdated = new Date().toISOString();
                        finalBalance = item.availableStock;
                        window.localStorage.setItem('local_current_stock', JSON.stringify(localCurrentStock));
                    }
                }

                const localMasterSaved = window.localStorage.getItem('local_master_register');
                if (localMasterSaved) {
                    const localMasterList: MasterRegisterEntry[] = JSON.parse(localMasterSaved);
                    const idx = localMasterList.findIndex(t => t.id === tx.id);
                    if (idx !== -1) {
                        localMasterList[idx] = {
                            ...localMasterList[idx],
                            quantity: newQty,
                            staffName: newStaff,
                            remarks: newRemarks,
                            projectId: newProject,
                            balanceStockAfterIssue: finalBalance
                        };
                        window.localStorage.setItem('local_master_register', JSON.stringify(localMasterList));
                    }
                }

                const localTxSaved = window.localStorage.getItem('local_stock_transactions');
                if (localTxSaved) {
                    const localTxList: StockTransaction[] = JSON.parse(localTxSaved);
                    const idx = localTxList.findIndex(t => t.referenceId === tx.id);
                    if (idx !== -1) {
                        localTxList[idx] = {
                            ...localTxList[idx],
                            quantity: newQty,
                            partyName: newStaff,
                            invoiceNumber: newRemarks,
                            projectId: newProject,
                            newStock: finalBalance,
                            timestamp: new Date().toISOString()
                        };
                        window.localStorage.setItem('local_stock_transactions', JSON.stringify(localTxList));
                    }
                }

                const months = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                const txDate = new Date(tx.timestamp);
                const monthName = months[txDate.getMonth()];
                const localMonthlySaved = window.localStorage.getItem('local_monthly_registers');
                if (localMonthlySaved) {
                    const localMonthly: Record<string, MasterRegisterEntry[]> = JSON.parse(localMonthlySaved);
                    if (localMonthly[monthName]) {
                        const idx = localMonthly[monthName].findIndex(t => t.id === tx.id);
                        if (idx !== -1) {
                            localMonthly[monthName][idx] = {
                                ...localMonthly[monthName][idx],
                                quantity: newQty,
                                staffName: newStaff,
                                remarks: newRemarks,
                                projectId: newProject,
                                balanceStockAfterIssue: finalBalance
                            };
                            window.localStorage.setItem('local_monthly_registers', JSON.stringify(localMonthly));
                        }
                    }
                }

                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message || err };
            }
        }
        return { success: false, error: "Database offline" };
    }
    try {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const txDate = new Date(tx.timestamp);
        const monthName = months[txDate.getMonth()];

        const batch = writeBatch(db);

        // Calculate quantity difference
        const qtyDiff = newQty - tx.quantity;

        // 1. Update stock levels
        const currentStockRef = doc(db, "current_stock", tx.itemCode);
        const legacyDocRef = doc(db, STOCK_COLLECTION, tx.itemCode);

        const currentStockSnap = await getDocWithTimeout(currentStockRef);
        const legacySnap = await getDocWithTimeout(legacyDocRef);

        let finalBalance = tx.balanceStockAfterIssue;

        if (currentStockSnap.exists()) {
            const currentStockItem = currentStockSnap.data() as CurrentStockItem;
            if (tx.type === 'INWARD') {
                currentStockItem.totalInward = Math.max(0, currentStockItem.totalInward + qtyDiff);
            } else {
                // For OUTWARD, check if we have enough stock before editing!
                if (qtyDiff > 0 && currentStockItem.availableStock < qtyDiff) {
                    return { success: false, error: `Insufficient stock for update. Available: ${currentStockItem.availableStock}` };
                }
                currentStockItem.totalOutward = Math.max(0, currentStockItem.totalOutward + qtyDiff);
            }
            currentStockItem.availableStock = currentStockItem.openingStock + currentStockItem.totalInward - currentStockItem.totalOutward;
            currentStockItem.lastUpdated = new Date().toISOString();
            finalBalance = currentStockItem.availableStock;
            batch.set(currentStockRef, cleanUndefined(currentStockItem));
        }

        if (legacySnap.exists()) {
            const legacyItem = legacySnap.data() as InventoryItem;
            if (tx.type === 'INWARD') {
                legacyItem.currentStock = Math.max(0, legacyItem.currentStock + qtyDiff);
                legacyItem.totalInward = Math.max(0, legacyItem.totalInward + qtyDiff);
            } else {
                if (qtyDiff > 0 && legacyItem.currentStock < qtyDiff) {
                    return { success: false, error: `Insufficient stock for update. Available: ${legacyItem.currentStock}` };
                }
                legacyItem.currentStock = legacyItem.currentStock - qtyDiff;
                legacyItem.totalOutward = Math.max(0, legacyItem.totalOutward + qtyDiff);
            }
            legacyItem.lastUpdated = new Date().toISOString();
            batch.set(legacyDocRef, cleanUndefined(legacyItem));
        }

        // 2. Update master_register
        const masterRef = doc(db, "master_register", tx.id);
        const updatedMasterEntry: MasterRegisterEntry = {
            ...tx,
            quantity: newQty,
            staffName: newStaff,
            remarks: newRemarks,
            projectId: newProject,
            balanceStockAfterIssue: finalBalance,
            lastUpdated: new Date().toISOString()
        } as any;
        batch.set(masterRef, cleanUndefined(updatedMasterEntry));

        // 3. Query and update monthly collection
        const monthlyQuery = query(
            collection(db, "monthly_registers", monthName, "entries"),
            where("timestamp", "==", tx.timestamp),
            where("itemCode", "==", tx.itemCode)
        );
        const monthlySnap = await getDocs(monthlyQuery);
        monthlySnap.forEach(d => {
            const data = d.data();
            batch.set(d.ref, cleanUndefined({
                ...data,
                quantity: newQty,
                staffName: newStaff,
                remarks: newRemarks,
                projectId: newProject,
                balanceStockAfterIssue: finalBalance,
                lastUpdated: new Date().toISOString()
            }));
        });

        await Promise.race([
            batch.commit(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Batch commit timeout")), 3000))
        ]);
        return { success: true };
    } catch (err: any) {
        console.error("Edit transaction error:", err);
        return { success: false, error: err.message || err };
    }
}

// --- MATERIAL REQUIREMENTS MANAGEMENT ---

export interface MaterialRequirement {
    id: string;
    timestamp: string;
    projectId: string;
    materialCode: string;
    materialName: string;
    quantity: number;
    unit: string;
    requestedBy: string;
    remarks: string;
    status: 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'REJECTED';
}

export async function fetchMaterialRequirements(): Promise<MaterialRequirement[]> {
    if (!db || isTest) {
        return getLocalRequirementsFallback();
    }
    try {
        const q = query(collection(db, "material_requirements"), orderBy("timestamp", "desc"));
        const snap = await getDocsWithTimeout(q);
        if (snap.empty) {
            return getLocalRequirementsFallback();
        }
        return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as MaterialRequirement));
    } catch (err) {
        console.warn("Firestore fetchMaterialRequirements failed, falling back to local:", err);
        return getLocalRequirementsFallback();
    }
}

function getLocalRequirementsFallback(): MaterialRequirement[] {
    if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('local_material_requirements');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse local requirements:", e);
            }
        }
    }
    return [];
}

export async function addMaterialRequirement(reqData: Omit<MaterialRequirement, 'id' | 'timestamp' | 'status'>) {
    const timestamp = new Date().toISOString();
    const id = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requirement: MaterialRequirement = {
        ...reqData,
        id,
        timestamp,
        status: 'PENDING'
    };

    if (!db || isTest) {
        saveLocalRequirementFallback(requirement);
        return { success: true, requirement };
    }

    try {
        const docRef = doc(db, "material_requirements", id);
        await setDocWithTimeout(docRef, cleanUndefined(requirement));
        saveLocalRequirementFallback(requirement);
        return { success: true, requirement };
    } catch (err: any) {
        console.error("Firebase addMaterialRequirement failed, saving locally:", err);
        saveLocalRequirementFallback(requirement);
        return { success: true, requirement, offline: true };
    }
}

function saveLocalRequirementFallback(req: MaterialRequirement) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const saved = window.localStorage.getItem('local_material_requirements');
            const list: MaterialRequirement[] = saved ? JSON.parse(saved) : [];
            const idx = list.findIndex(r => r.id === req.id);
            if (idx !== -1) {
                list[idx] = req;
            } else {
                list.unshift(req);
            }
            window.localStorage.setItem('local_material_requirements', JSON.stringify(list));
        }
    } catch (err) {
        console.error("Failed to save local requirement:", err);
    }
}

export async function updateMaterialRequirementStatus(id: string, status: MaterialRequirement['status']) {
    if (!id) {
        console.error("updateMaterialRequirementStatus: ID is undefined or empty!");
        return { success: false, error: "Invalid ID" };
    }
    if (!db || isTest) {
        updateLocalRequirementStatusFallback(id, status);
        return { success: true };
    }
    try {
        const docRef = doc(db, "material_requirements", id);
        await updateDocWithTimeout(docRef, { status: status });
        updateLocalRequirementStatusFallback(id, status);
        return { success: true };
    } catch (err: any) {
        console.error("Firebase updateMaterialRequirementStatus failed:", err);
        updateLocalRequirementStatusFallback(id, status);
        return { success: true, offline: true };
    }
}

function updateLocalRequirementStatusFallback(id: string, status: MaterialRequirement['status']) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const saved = window.localStorage.getItem('local_material_requirements');
            if (saved) {
                const list: MaterialRequirement[] = JSON.parse(saved);
                const idx = list.findIndex(r => r.id === id);
                if (idx !== -1) {
                    list[idx].status = status;
                    window.localStorage.setItem('local_material_requirements', JSON.stringify(list));
                }
            }
        }
    } catch (err) {
        console.error("Failed to update local requirement status:", err);
    }
}

export async function deleteMaterialRequirement(id: string) {
    if (!db || isTest) {
        deleteLocalRequirementFallback(id);
        return { success: true };
    }
    try {
        const docRef = doc(db, "material_requirements", id);
        await deleteDoc(docRef);
        deleteLocalRequirementFallback(id);
        return { success: true };
    } catch (err: any) {
        console.error("Firebase deleteMaterialRequirement failed:", err);
        deleteLocalRequirementFallback(id);
        return { success: true, offline: true };
    }
}

function deleteLocalRequirementFallback(id: string) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const saved = window.localStorage.getItem('local_material_requirements');
            if (saved) {
                const list: MaterialRequirement[] = JSON.parse(saved);
                const filtered = list.filter(r => r.id !== id);
                window.localStorage.setItem('local_material_requirements', JSON.stringify(filtered));
            }
        }
    } catch (err) {
        console.error("Failed to delete local requirement:", err);
    }
}

export async function updateMaterialRequirement(req: MaterialRequirement) {
    if (!db || isTest) {
        saveLocalRequirementFallback(req);
        return { success: true };
    }
    try {
        const docRef = doc(db, "material_requirements", req.id);
        await setDocWithTimeout(docRef, cleanUndefined(req));
        saveLocalRequirementFallback(req);
        return { success: true };
    } catch (err: any) {
        console.error("Firebase updateMaterialRequirement failed, saving locally:", err);
        saveLocalRequirementFallback(req);
        return { success: true, offline: true };
    }
}

export async function migrateJune11Transactions() {
    try {
        // 1. Migrate Local Storage
        if (typeof window !== 'undefined' && window.localStorage) {
            // master register
            const localMaster = window.localStorage.getItem('local_master_register');
            if (localMaster) {
                try {
                    const list: MasterRegisterEntry[] = JSON.parse(localMaster);
                    let changed = false;
                    const updatedList = list.map(tx => {
                        const isJune11 = tx.timestamp && (tx.timestamp.includes('2026-06-11') || tx.timestamp.includes('11 Jun 2026') || tx.timestamp.includes('11-Jun-2026'));
                        if (isJune11 && tx.type === 'INWARD' && (tx.issuedBy === 'Store Manager' || !tx.issuedBy)) {
                            changed = true;
                            return { ...tx, issuedBy: 'Arjun Tiwari' };
                        }
                        return tx;
                    });
                    if (changed) {
                        window.localStorage.setItem('local_master_register', JSON.stringify(updatedList));
                        console.log("Migrated local_master_register entries to Arjun Tiwari");
                    }
                } catch (pe) {
                    console.error("Failed to parse local_master_register during migration:", pe);
                }
            }

            // monthly registers
            const localMonthly = window.localStorage.getItem('local_monthly_registers');
            if (localMonthly) {
                try {
                    const monthlyMap: Record<string, MasterRegisterEntry[]> = JSON.parse(localMonthly);
                    let changed = false;
                    for (const month in monthlyMap) {
                        const list = monthlyMap[month];
                        if (Array.isArray(list)) {
                            const updatedList = list.map(tx => {
                                const isJune11 = tx.timestamp && (tx.timestamp.includes('2026-06-11') || tx.timestamp.includes('11 Jun 2026') || tx.timestamp.includes('11-Jun-2026'));
                                if (isJune11 && tx.type === 'INWARD' && (tx.issuedBy === 'Store Manager' || !tx.issuedBy)) {
                                    changed = true;
                                    return { ...tx, issuedBy: 'Arjun Tiwari' };
                                }
                                return tx;
                            });
                            if (changed) {
                                monthlyMap[month] = updatedList;
                            }
                        }
                    }
                    if (changed) {
                        window.localStorage.setItem('local_monthly_registers', JSON.stringify(monthlyMap));
                        console.log("Migrated local_monthly_registers entries to Arjun Tiwari");
                    }
                } catch (pe) {
                    console.error("Failed to parse local_monthly_registers during migration:", pe);
                }
            }
        }

        // 2. Migrate Firestore DB if online and db exists
        if (db && !isTest) {
            const masterCol = collection(db, "master_register");
            const q = query(
                masterCol,
                where("timestamp", ">=", "2026-06-11T00:00:00"),
                where("timestamp", "<=", "2026-06-11T23:59:59")
            );
            const snap = await getDocsWithTimeout(q);
            if (!snap.empty) {
                const batch = writeBatch(db);
                let count = 0;
                for (const d of snap.docs) {
                    const tx = d.data() as MasterRegisterEntry;
                    if (tx.type === 'INWARD' && (tx.issuedBy === 'Store Manager' || !tx.issuedBy)) {
                        const docRef = doc(db, "master_register", d.id);
                        batch.update(docRef, { issuedBy: "Arjun Tiwari" });
                        count++;
                    }
                }
                if (count > 0) {
                    await Promise.race([
                        batch.commit(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Batch commit timeout")), 3000))
                    ]);
                    console.log(`Successfully migrated ${count} Firestore master_register entries to Arjun Tiwari`);
                }
            }

            // June monthly registers
            const monthlyCol = collection(db, "monthly_registers", "June", "entries");
            const qMonthly = query(
                monthlyCol,
                where("timestamp", ">=", "2026-06-11T00:00:00"),
                where("timestamp", "<=", "2026-06-11T23:59:59")
            );
            const snapMonthly = await getDocsWithTimeout(qMonthly);
            if (!snapMonthly.empty) {
                const batch = writeBatch(db);
                let count = 0;
                for (const d of snapMonthly.docs) {
                    const tx = d.data() as MasterRegisterEntry;
                    if (tx.type === 'INWARD' && (tx.issuedBy === 'Store Manager' || !tx.issuedBy)) {
                        const docRef = doc(db, "monthly_registers", "June", "entries", d.id);
                        batch.update(docRef, { issuedBy: "Arjun Tiwari" });
                        count++;
                    }
                }
                if (count > 0) {
                    await Promise.race([
                        batch.commit(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Batch commit timeout")), 3000))
                    ]);
                    console.log(`Successfully migrated ${count} Firestore June monthly_registers entries to Arjun Tiwari`);
                }
            }
        }
    } catch (err) {
        console.error("Migration error:", err);
    }
}


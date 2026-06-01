import { GateEntry, InventoryItem, StockTransaction } from './gate_system';
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, runTransaction } from 'firebase/firestore';

const STOCK_COLLECTION = "inventory_stock";
const LOG_COLLECTION = "inventory_logs";

export async function processInventoryUpdate(entry: GateEntry) {
    // 🔍 MAIN STORE FILTER: Only update inventory stock when transits are entering/leaving the "MAIN STORE"
    const isInwardToMainStore = entry.type === 'INWARD' && entry.toLocation?.toUpperCase().trim() === 'MAIN STORE';
    const isOutwardFromMainStore = entry.type === 'OUTWARD' && entry.fromLocation?.toUpperCase().trim() === 'MAIN STORE';

    if (!isInwardToMainStore && !isOutwardFromMainStore) {
        if (import.meta.env.DEV) {
            console.log(`Skipping inventory update for Entry ${entry.id}: Route does not target MAIN STORE`);
        }
        return { success: true, message: "Skipped: not MAIN STORE" };
    }

    if (!entry.items || entry.items.length === 0) {
        // Fallback for singular entries (if items array is empty but quantity exists)
        return updateStock(
            entry.materialName,
            entry.quantity,
            entry.unit,
            entry.type,
            entry.id,
            entry.partyName,
            entry.invoiceNumber
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
            item.hsnCode
        );
        results.push(res);
    }
    return results;
}

async function updateStock(
    name: string, 
    qty: number, 
    unit: string, 
    type: 'INWARD' | 'OUTWARD',
    refId: string,
    party: string,
    invoice: string,
    hsn?: string
) {
    if (!db) return { success: false, error: "Database offline" };

    const itemCode = name.toUpperCase().replace(/\s+/g, '_');
    
    try {
        const result = await runTransaction(db, async (transaction) => {
            // 🛡️ DUPLICATION GUARD: Check lock document instead of querying entire collection
            const lockDocRef = doc(db, "inventory_sync_locks", `${refId}_${itemCode}`);
            const lockSnap = await transaction.get(lockDocRef);

            if (lockSnap.exists()) {
                if (import.meta.env.DEV) console.log(`Skipping inventory update: Item ${itemCode} already synced for Entry ${refId}`);
                return { success: true, message: "Already synced" };
            }

            const docRef = doc(db, STOCK_COLLECTION, itemCode);
            const snap = await transaction.get(docRef);
            let item: InventoryItem;

            if (snap.exists()) {
                item = snap.data() as InventoryItem;
            } else {
                item = {
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

            const prevStock = item.currentStock;
            
            if (type === 'INWARD') {
                item.currentStock += qty;
                item.totalInward += qty;
            } else {
                if (item.currentStock < qty) {
                    throw new Error(`Insufficient stock for ${name}. Available: ${item.currentStock}`);
                }
                item.currentStock -= qty;
                item.totalOutward += qty;
            }

            item.lastUpdated = new Date().toISOString();

            // 1. Save updated stock inside transaction
            transaction.set(docRef, item);

            // 2. Set the sync lock doc inside transaction
            transaction.set(lockDocRef, {
                timestamp: new Date().toISOString(),
                referenceId: refId,
                itemId: itemCode
            });

            // 3. Log transaction history doc inside transaction
            const logRef = doc(collection(db, LOG_COLLECTION));
            const stockTx: StockTransaction = {
                id: logRef.id,
                itemId: itemCode,
                type,
                quantity: qty,
                previousStock: prevStock,
                newStock: item.currentStock,
                timestamp: new Date().toISOString(),
                referenceId: refId,
                partyName: party,
                invoiceNumber: invoice
            };
            transaction.set(logRef, stockTx);

            return { success: true, itemCode };
        });

        return result;
    } catch (e: any) {
        console.error("Stock update failure:", e);
        return { success: false, error: e.message || e };
    }
}

export async function fetchInventoryMaster(): Promise<InventoryItem[]> {
    if (!db) return [];
    const q = query(collection(db, STOCK_COLLECTION));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as InventoryItem);
}

export async function fetchStockMovement(): Promise<StockTransaction[]> {
    if (!db) return [];
    const q = query(collection(db, LOG_COLLECTION), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as StockTransaction);
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

        // Append a manual audit log record
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
    }
}

export async function deleteInventoryItem(itemCode: string) {
    if (!db) return;
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, STOCK_COLLECTION, itemCode));
}

export async function addInventoryItem(item: InventoryItem) {
    if (!db) return;
    const docRef = doc(db, STOCK_COLLECTION, item.itemCode);
    await setDoc(docRef, item);
}


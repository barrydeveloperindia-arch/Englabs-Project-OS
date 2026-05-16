import { GateEntry, InventoryItem, StockTransaction } from './gate_system';
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';

const STOCK_COLLECTION = "inventory_stock";
const LOG_COLLECTION = "inventory_logs";

export async function processInventoryUpdate(entry: GateEntry) {
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
    
    // 🛡️ DUPLICATION GUARD: Check if this movement is already logged
    const existingLogsQuery = query(collection(db, LOG_COLLECTION));
    const logSnap = await getDocs(existingLogsQuery);
    const alreadyLogged = logSnap.docs.some(doc => {
        const data = doc.data();
        return data.referenceId === refId && data.itemId === itemCode;
    });

    if (alreadyLogged) {
        if (import.meta.env.DEV) console.log(`Skipping inventory update: Item ${itemCode} already synced for Entry ${refId}`);
        return { success: true, message: "Already synced" };
    }

    const docRef = doc(db, STOCK_COLLECTION, itemCode);
    
    try {
        const snap = await getDoc(docRef);
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
                return { success: false, error: `Insufficient stock for ${name}. Available: ${item.currentStock}` };
            }
            item.currentStock -= qty;
            item.totalOutward += qty;
        }

        item.lastUpdated = new Date().toISOString();

        // 1. Save updated stock
        await setDoc(docRef, item);

        // 2. Log transaction
        const logRef = doc(collection(db, LOG_COLLECTION));
        const transaction: StockTransaction = {
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
        await setDoc(logRef, transaction);

        return { success: true, itemCode };
    } catch (e) {
        console.error("Stock update failure:", e);
        return { success: false, error: e };
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

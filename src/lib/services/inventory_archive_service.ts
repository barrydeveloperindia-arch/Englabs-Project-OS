import { db } from '@config/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';

export interface ArchivedItem {
    itemName: string;
    itemCode: string;
    quantity: number;
    unit: string;
    availableStock: number;
    stockStatus: string;
    location: string;
    category?: string;
}

export interface InventoryArchive {
    id: string; // Document ID
    timestamp: string; // ISO string
    date: string; // YYYY-MM-DD
    time: string; // HH:MM:SS
    month: string; // MM
    year: string; // YYYY
    racks: {
        [rackName: string]: ArchivedItem[];
    };
    totalItems: number;
    totalRacks: number;
}

const ARCHIVE_COLLECTION = "inventory_archives";

export async function saveInventoryArchive(items: any[]): Promise<{success: boolean, id?: string, error?: any}> {
    try {
        if (!db) throw new Error("Database offline");

        const now = new Date();
        const id = `INV-ARCHIVE-${now.getTime()}`;
        const timestamp = now.toISOString();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0];
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear());

        const racks: { [rackName: string]: ArchivedItem[] } = {};
        let totalItems = 0;

        for (const raw of items) {
            const location = raw.location || raw.Location || 'Unassigned Rack';
            if (!racks[location]) racks[location] = [];

            const currentStock = Number(raw.currentStock || raw['Current Stock'] || 0);
            const minThreshold = Number(raw.minThreshold || raw['Min Threshold'] || 0);
            
            const archivedItem: ArchivedItem = {
                itemName: raw.name || raw['Item Name'] || 'Unknown Item',
                itemCode: raw.itemCode || raw['Item Code'] || `UNK-${Math.floor(Math.random()*1000)}`,
                quantity: currentStock, // Using current stock as quantity for the snapshot
                unit: raw.unit || raw.Unit || 'Pcs',
                availableStock: currentStock,
                stockStatus: currentStock > minThreshold ? 'Secure' : 'Low Stock',
                location: location,
                category: raw.category || raw.Category || 'General'
            };

            racks[location].push(archivedItem);
            totalItems++;
        }

        const archiveDoc: InventoryArchive = {
            id,
            timestamp,
            date,
            time,
            month,
            year,
            racks,
            totalItems,
            totalRacks: Object.keys(racks).length
        };

        await setDoc(doc(db, ARCHIVE_COLLECTION, id), archiveDoc);
        
        return { success: true, id };
    } catch (e) {
        console.error("Archive Save Error:", e);
        return { success: false, error: e };
    }
}

export async function fetchInventoryArchives(): Promise<InventoryArchive[]> {
    if (!db) return [];
    try {
        const q = query(collection(db, ARCHIVE_COLLECTION), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as InventoryArchive);
    } catch (e) {
        console.error("Fetch Archive Error:", e);
        return [];
    }
}

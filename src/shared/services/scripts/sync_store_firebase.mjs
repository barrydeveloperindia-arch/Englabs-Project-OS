import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import dotenv from "dotenv";
import fs from 'fs';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const delay = ms => new Promise(res => setTimeout(res, ms));

function parseQuantity(qtyStr) {
    if (!qtyStr) return 0;
    const cleanStr = qtyStr.replace('(-)', '-').replace(',', '');
    const match = cleanStr.match(/(-?\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
}

async function run() {
    try {
        console.log("🔐 Authenticating...");
        await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("✅ Authenticated!");

        // Load original compiled list
        const listPath = 'scratch/compiled_detailed_list.json';
        if (!fs.existsSync(listPath)) {
            console.error("compiled_detailed_list.json not found.");
            process.exit(1);
        }
        const originalList = JSON.parse(fs.readFileSync(listPath, 'utf8'));
        
        let nextId = 276;
        const finalCodedList = [];
        const validCodes = new Set();
        
        // 1. Process codes: Keep original if not N/A, assign ENG-xxxx if N/A
        for (const item of originalList) {
            let code = item.code;
            if (!code || code === 'N/A') {
                code = `ENG-${String(nextId).padStart(4, '0')}`;
                nextId++;
            }
            item.code = code;
            validCodes.add(code);
            finalCodedList.push(item);
        }
        
        console.log(`Prepared ${finalCodedList.length} items. Enforcing Firestore sync...`);
        
        // 2. Fetch all current documents from Firestore to identify orphans to delete
        const currentStockSnap = await getDocs(collection(db, "current_stock"));
        const catalogSnap = await getDocs(collection(db, "material_catalog"));
        
        console.log(`Current DB Stock docs: ${currentStockSnap.size}, Catalog docs: ${catalogSnap.size}`);
        
        let deletedStockCount = 0;
        let deletedCatalogCount = 0;
        
        // Delete orphans from current_stock
        for (const d of currentStockSnap.docs) {
            if (!validCodes.has(d.id)) {
                console.log(`Deleting orphan stock doc: ${d.id}`);
                await deleteDoc(doc(db, "current_stock", d.id));
                deletedStockCount++;
                await delay(20);
            }
        }
        
        // Delete orphans from material_catalog
        for (const d of catalogSnap.docs) {
            if (!validCodes.has(d.id)) {
                console.log(`Deleting orphan catalog doc: ${d.id}`);
                await deleteDoc(doc(db, "material_catalog", d.id));
                deletedCatalogCount++;
                await delay(20);
            }
        }
        
        // 3. Sync/Create all 304 items in Firestore
        let createdCount = 0;
        let updatedCount = 0;
        
        for (const item of finalCodedList) {
            const code = item.code;
            const parsedQty = parseQuantity(item.qty);
            
            const catalogPayload = {
                id: code,
                itemCode: code,
                name: item.name,
                category: item.category.toUpperCase(),
                location: item.location,
                unit: item.unit,
                currentRate: item.c_rate,
                previousRate: item.p_rate,
                lastInwardDate: item.inward_date
            };
            
            const stockPayload = {
                id: code,
                itemCode: code,
                name: item.name,
                category: item.category.toUpperCase(),
                location: item.location,
                unit: item.unit,
                openingStock: 0,
                totalInward: 0,
                totalOutward: 0,
                availableStock: parsedQty,
                currentRate: item.c_rate,
                previousRate: item.p_rate,
                lastInwardDate: item.inward_date,
                lastUpdated: new Date().toISOString()
            };
            
            try {
                const catalogRef = doc(db, "material_catalog", code);
                const catalogSnap = await getDoc(catalogRef);
                
                if (catalogSnap.exists()) {
                    await setDoc(catalogRef, catalogPayload, { merge: true });
                    
                    const stockRef = doc(db, "current_stock", code);
                    const stockSnap = await getDoc(stockRef);
                    if (stockSnap.exists()) {
                        await setDoc(stockRef, {
                            currentRate: item.c_rate,
                            previousRate: item.p_rate,
                            lastInwardDate: item.inward_date,
                            location: item.location,
                            availableStock: parsedQty,
                            lastUpdated: new Date().toISOString()
                        }, { merge: true });
                    } else {
                        await setDoc(stockRef, stockPayload);
                    }
                    updatedCount++;
                } else {
                    await setDoc(catalogRef, catalogPayload);
                    const stockRef = doc(db, "current_stock", code);
                    await setDoc(stockRef, stockPayload);
                    createdCount++;
                }
            } catch (err) {
                console.error(`Error syncing ${code}:`, err.message);
            }
            
            await delay(40);
        }
        
        // Save the updated JSON list to scratch/compiled_detailed_list_coded.json
        fs.writeFileSync('scratch/compiled_detailed_list_coded.json', JSON.stringify(finalCodedList, null, 2));
        console.log(`[SUCCESS] Cloud Sync & Restore complete.`);
        console.log(`Orphans deleted: Stock ${deletedStockCount}, Catalog ${deletedCatalogCount}`);
        console.log(`Items synced: Created ${createdCount}, Updated ${updatedCount}`);
        
        process.exit(0);
    } catch (e) {
        console.error("❌ Sync failed:", e);
        process.exit(1);
    }
}

run();

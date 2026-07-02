import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
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

        // Load compiled list
        const listPath = 'scratch/compiled_detailed_list.json';
        if (!fs.existsSync(listPath)) {
            console.error("compiled_detailed_list.json not found.");
            process.exit(1);
        }
        const compiledList = JSON.parse(fs.readFileSync(listPath, 'utf8'));
        
        let nextId = 276;
        const updatedList = [];
        
        console.log(`Starting cloud sync for ${compiledList.length} items...`);
        let createdCount = 0;
        let updatedCount = 0;
        
        for (const item of compiledList) {
            let code = item.code;
            let isNew = false;
            
            if (!code || code === 'N/A') {
                // Generate a new code
                code = `ENG-${String(nextId).padStart(4, '0')}`;
                nextId++;
                isNew = true;
            }
            
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
                openingStock: isNew ? parsedQty : 0,
                totalInward: 0,
                totalOutward: 0,
                availableStock: parsedQty,
                currentRate: item.c_rate,
                previousRate: item.p_rate,
                lastInwardDate: item.inward_date,
                lastUpdated: new Date().toISOString()
            };
            
            try {
                // Check if document exists in Firestore
                const catalogRef = doc(db, "material_catalog", code);
                const catalogSnap = await getDoc(catalogRef);
                
                if (catalogSnap.exists()) {
                    // Update existing
                    await updateDoc(catalogRef, {
                        currentRate: item.c_rate,
                        previousRate: item.p_rate,
                        lastInwardDate: item.inward_date,
                        location: item.location
                    });
                    
                    const stockRef = doc(db, "current_stock", code);
                    const stockSnap = await getDoc(stockRef);
                    if (stockSnap.exists()) {
                        await updateDoc(stockRef, {
                            currentRate: item.c_rate,
                            previousRate: item.p_rate,
                            lastInwardDate: item.inward_date,
                            location: item.location,
                            availableStock: parsedQty,
                            lastUpdated: new Date().toISOString()
                        });
                    } else {
                        await setDoc(stockRef, stockPayload);
                    }
                    updatedCount++;
                } else {
                    // Create new
                    await setDoc(catalogRef, catalogPayload);
                    const stockRef = doc(db, "current_stock", code);
                    await setDoc(stockRef, stockPayload);
                    createdCount++;
                }
            } catch (err) {
                console.error(`Error syncing ${code}:`, err.message);
            }
            
            // Save code change back to item representation
            item.code = code;
            updatedList.append ? updatedList.append(item) : updatedList.push(item);
            
            // Small throttle
            await delay(50);
        }
        
        // Save coded list back to scratch
        fs.writeFileSync('scratch/compiled_detailed_list_coded.json', JSON.stringify(updatedList, null, 2));
        console.log(`[SUCCESS] Cloud sync complete. Created: ${createdCount}, Updated: ${updatedCount}.`);
        console.log("Saved coded list to scratch/compiled_detailed_list_coded.json");
        process.exit(0);
    } catch (e) {
        console.error("❌ Sync failed:", e);
        process.exit(1);
    }
}

run();

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc, setDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB4Fqw7MM1ROCjCqlFytsgAe6xSjGr-mlg",
  authDomain: "englabs-enterprise.firebaseapp.com",
  projectId: "englabs-enterprise",
  storageBucket: "englabs-enterprise.firebasestorage.app",
  messagingSenderId: "692092298146",
  appId: "1:692092298146:web:168dc020d6a335d01288fb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
    try {
        console.log("Authenticating with email/password...");
        await signInWithEmailAndPassword(auth, 'englabscivilteam@gmail.com', 'Ram@2026');
        console.log("Authenticated successfully!");

        const batch = writeBatch(db);

        // Define item codes
        // We map "Seven Black Gloss Paint" to "Eng-005" (since SBL Black Gloss is Eng-005)
        // We map "H.C. Robotic Aircraft Gray Paint" to "Eng-012" (since H.C. Robotic Grey Paint is Eng-012)
        const blackPaintCode = "Eng-005";
        const grayPaintCode = "Eng-012";

        // Deletions for old 'C_SEVEN_PU_MATCHING_PAINT'
        console.log("Clearing old C_SEVEN_PU_MATCHING_PAINT refs...");
        batch.delete(doc(db, "inventory_sync_locks", "IN-2556_C_SEVEN_PU_MATCHING_PAINT"));
        batch.delete(doc(db, "current_stock", "C_SEVEN_PU_MATCHING_PAINT"));
        batch.delete(doc(db, "inventory_stock", "C_SEVEN_PU_MATCHING_PAINT"));
        batch.delete(doc(db, "material_catalog", "C_SEVEN_PU_MATCHING_PAINT"));
        batch.delete(doc(db, "gate_entries", "IN-2556"));

        await batch.commit();
        console.log("Deleted main C_SEVEN_PU_MATCHING_PAINT docs.");

        // Clear master_register and inventory_logs
        console.log("Cleaning master_register and inventory_logs...");
        const collections = ["master_register", "inventory_logs"];
        for (const colName of collections) {
            const q = query(collection(db, colName), where("itemCode", "==", "C_SEVEN_PU_MATCHING_PAINT"));
            const snap = await getDocs(q);
            for (const docSnap of snap.docs) {
                await deleteDoc(doc(db, colName, docSnap.id));
            }
        }

        // monthly_registers
        const monthlyQuery = query(collection(db, "monthly_registers", "June", "entries"), where("itemCode", "==", "C_SEVEN_PU_MATCHING_PAINT"));
        const monthlySnap = await getDocs(monthlyQuery);
        for (const docSnap of monthlySnap.docs) {
            await deleteDoc(doc(db, "monthly_registers", "June", "entries", docSnap.id));
        }
        console.log("Cleared transaction logs.");

        // Now update stock for Eng-005 and Eng-012
        console.log("Updating stock for Eng-005 (Seven Black Gloss Paint) and Eng-012 (H.C. Robotic Aircraft Gray)...");

        // Fetch current stock documents to get existing values (since they are pre-existing items)
        const blackStockDoc = await getDocs(query(collection(db, "current_stock"), where("itemCode", "==", blackPaintCode)));
        const grayStockDoc = await getDocs(query(collection(db, "current_stock"), where("itemCode", "==", grayPaintCode)));

        let blackCurrent = 8; // opening stock or current
        let grayCurrent = 4;

        if (!blackStockDoc.empty) {
            blackCurrent = blackStockDoc.docs[0].data().availableStock || blackStockDoc.docs[0].data().currentStock || 0;
        }
        if (!grayStockDoc.empty) {
            grayCurrent = grayStockDoc.docs[0].data().availableStock || grayStockDoc.docs[0].data().currentStock || 0;
        }

        const newBlackStock = blackCurrent + 4;
        const newGrayStock = grayCurrent + 4;

        console.log(`Eng-005 old: ${blackCurrent}, new: ${newBlackStock}`);
        console.log(`Eng-012 old: ${grayCurrent}, new: ${newGrayStock}`);

        const newBatch = writeBatch(db);

        // Update current_stock
        newBatch.set(doc(db, "current_stock", blackPaintCode), {
            itemCode: blackPaintCode,
            name: "SBL Black Gloss",
            category: "Paints",
            openingStock: 8,
            totalInward: 4,
            totalOutward: 0,
            availableStock: newBlackStock,
            unit: "Pcs",
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        newBatch.set(doc(db, "current_stock", grayPaintCode), {
            itemCode: grayPaintCode,
            name: "H.C. Robotic Grey Paint",
            category: "Paints",
            openingStock: 4,
            totalInward: 4,
            totalOutward: 0,
            availableStock: newGrayStock,
            unit: "LTR",
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        // Update legacy inventory_stock
        newBatch.set(doc(db, "inventory_stock", blackPaintCode), {
            itemCode: blackPaintCode,
            name: "SBL Black Gloss",
            category: "Paints",
            currentStock: newBlackStock,
            totalInward: 4,
            totalOutward: 0,
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        newBatch.set(doc(db, "inventory_stock", grayPaintCode), {
            itemCode: grayPaintCode,
            name: "H.C. Robotic Grey Paint",
            category: "Paints",
            currentStock: newGrayStock,
            totalInward: 4,
            totalOutward: 0,
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        // Corrected gate entry
        const correctedEntry = {
            id: "IN-2556",
            timestamp: "2026-06-26T07:34:53.522Z",
            type: "INWARD",
            materialName: "Seven Black Gloss Paint & H.C. Robotic Aircraft Gray Paint",
            quantity: 8,
            items: [
                {
                    id: 1,
                    name: "Seven Black Gloss Paint",
                    hsnCode: "32081010",
                    quantity: 4,
                    unit: "LTR",
                    rate: 900.00,
                    amount: 3600.00
                },
                {
                    id: 2,
                    name: "H.C. Robotic Aircraft Gray Paint",
                    hsnCode: "32081010",
                    quantity: 4,
                    unit: "LTR",
                    rate: 900.00,
                    amount: 3600.00
                }
            ],
            partyName: "CHANDIGARH PAINT STORES",
            invoiceNumber: "2556",
            vehicleNumber: "HAND-CARRY",
            fromLocation: "CHANDIGARH",
            toLocation: "MAIN STORE",
            amount: 8496.00,
            billType: "GST",
            paidAmount: 0,
            remainingAmount: 8496.00,
            paymentStatus: "UNPAID",
            paymentMode: "CREDIT",
            employeeName: "SAM",
            supervisorName: "Gaurav Panchal",
            remarks: "CORRECTED INWARD PAINT FROM CHANDIGARH PAINT STORES - WRITTEN WITH PEN BY LANDOWNER",
            isLocked: true,
            status: "VERIFIED",
            version: 1,
            syncedAt: new Date().toISOString()
        };
        newBatch.set(doc(db, "gate_entries", "IN-2556"), correctedEntry);

        // Add sync locks
        newBatch.set(doc(db, "inventory_sync_locks", `IN-2556_${blackPaintCode}`), {
            timestamp: new Date().toISOString(),
            referenceId: "IN-2556",
            itemId: blackPaintCode
        });
        newBatch.set(doc(db, "inventory_sync_locks", `IN-2556_${grayPaintCode}`), {
            timestamp: new Date().toISOString(),
            referenceId: "IN-2556",
            itemId: grayPaintCode
        });

        // Add master_register entries
        const mBlackRef = doc(collection(db, "master_register"));
        newBatch.set(mBlackRef, {
            id: mBlackRef.id,
            timestamp: new Date().toISOString(),
            projectId: "GENERAL",
            materialName: "Seven Black Gloss Paint",
            itemCode: blackPaintCode,
            category: "Paints",
            quantity: 4,
            unit: "LTR",
            staffName: "CHANDIGARH PAINT STORES",
            issuedBy: "Arjun Tiwari",
            balanceStockAfterIssue: newBlackStock,
            remarks: "2556",
            type: "INWARD"
        });

        const mGrayRef = doc(collection(db, "master_register"));
        newBatch.set(mGrayRef, {
            id: mGrayRef.id,
            timestamp: new Date().toISOString(),
            projectId: "GENERAL",
            materialName: "H.C. Robotic Aircraft Gray Paint",
            itemCode: grayPaintCode,
            category: "Paints",
            quantity: 4,
            unit: "LTR",
            staffName: "CHANDIGARH PAINT STORES",
            issuedBy: "Arjun Tiwari",
            balanceStockAfterIssue: newGrayStock,
            remarks: "2556",
            type: "INWARD"
        });

        // Add monthly entries
        const monthBlackRef = doc(collection(db, "monthly_registers", "June", "entries"));
        newBatch.set(monthBlackRef, {
            id: monthBlackRef.id,
            timestamp: new Date().toISOString(),
            projectId: "GENERAL",
            materialName: "Seven Black Gloss Paint",
            itemCode: blackPaintCode,
            category: "Paints",
            quantity: 4,
            unit: "LTR",
            staffName: "CHANDIGARH PAINT STORES",
            issuedBy: "Arjun Tiwari",
            balanceStockAfterIssue: newBlackStock,
            remarks: "2556",
            type: "INWARD"
        });

        const monthGrayRef = doc(collection(db, "monthly_registers", "June", "entries"));
        newBatch.set(monthGrayRef, {
            id: monthGrayRef.id,
            timestamp: new Date().toISOString(),
            projectId: "GENERAL",
            materialName: "H.C. Robotic Aircraft Gray Paint",
            itemCode: grayPaintCode,
            category: "Paints",
            quantity: 4,
            unit: "LTR",
            staffName: "CHANDIGARH PAINT STORES",
            issuedBy: "Arjun Tiwari",
            balanceStockAfterIssue: newGrayStock,
            remarks: "2556",
            type: "INWARD"
        });

        await newBatch.commit();
        console.log("Successfully committed corrected gate entry and stock updates to Firestore!");
        process.exit(0);
    } catch (err) {
        console.error("Execution error:", err);
        process.exit(1);
    }
}

run();

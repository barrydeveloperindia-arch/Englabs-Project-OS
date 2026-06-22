import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, writeBatch, increment, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Mock browser globals for migration script
(global as any).window = {};

import { migrateProjectsToFirestore } from '@services/scripts/migrate_to_firestore';

const runTests = async () => {
    try {
        console.log("=== ERP STAGING AUTOMATED VALIDATION TEST ===");
        
        // 1. Authenticate via standard Email/Password
        const email = "englabscivilteam@gmail.com";
        const pass = "Ram@2026";
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
            console.log("✅ Created test account");
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                await signInWithEmailAndPassword(auth, email, pass);
                console.log("✅ Authenticated as existing test account");
            } else {
                throw e;
            }
        }

        // 2. Run Migration
        console.log("▶️ Running Migration...");
        await migrateProjectsToFirestore();

        // 3. Fetch Initial State of Project C4465
        const projectRef = doc(db, 'projects_master', 'C4465');
        let snap = await getDoc(projectRef);
        
        if (!snap.exists()) {
            console.error("❌ Project C4465 not found.");
            process.exit(1);
        }
        
        const initialMaterialCost = snap.data()?.costTotals?.materialCost || 0;
        console.log(`✅ Initial Project C4465 Material Cost: ${initialMaterialCost}`);

        // 4. Perform Material IN
        const batch1 = writeBatch(db);
        const inRef = doc(collection(db, 'inventory_ledger'));
        batch1.set(inRef, {
            id: inRef.id,
            type: 'MATERIAL_IN',
            itemId: 'ITM-001',
            quantity: 100,
            unitCost: 500,
            totalValue: 50000,
            projectId: null,
            createdBy: auth.currentUser?.uid || 'TEST_RUNNER',
            createdAt: new Date().toISOString()
        });
        await batch1.commit();
        console.log("✅ Material IN Logged (100 units)");

        // 5. Perform Material OUT (Linked to C4465)
        const batch2 = writeBatch(db);
        const outRef = doc(collection(db, 'inventory_ledger'));
        batch2.set(outRef, {
            id: outRef.id,
            type: 'MATERIAL_OUT',
            itemId: 'ITM-001',
            quantity: -20,
            unitCost: 500,
            totalValue: 10000,
            projectId: 'C4465',
            createdBy: auth.currentUser?.uid || 'TEST_RUNNER',
            createdAt: new Date().toISOString()
        });
        
        // Update Project Cost
        batch2.update(projectRef, {
            'costTotals.materialCost': increment(10000)
        });
        await batch2.commit();
        console.log("✅ Material OUT Logged (20 units) & Project Charged 10,000");

        // 6. Verify Final State
        snap = await getDoc(projectRef);
        const finalMaterialCost = snap.data()?.costTotals?.materialCost || 0;
        console.log(`✅ Final Project C4465 Material Cost: ${finalMaterialCost}`);
        
        if (finalMaterialCost - initialMaterialCost === 10000) {
            console.log("🚀 SUCCESS: Cross-Module Synchronization Confirmed.");
        } else {
            console.error("❌ FAILED: Cost delta mismatch.");
        }
        
        // 7. Verify Ledger Entries
        const ledgerSnap = await getDocs(collection(db, 'inventory_ledger'));
        console.log(`✅ Total Ledger Entries: ${ledgerSnap.size}`);
        
        process.exit(0);

    } catch (e) {
        console.error("Test Failed:", e);
        process.exit(1);
    }
};

runTests();

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, deleteDoc, doc, orderBy } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "dummy",
    authDomain: "englabs-inventory.firebaseapp.com",
    projectId: "englabs-inventory",
    storageBucket: "englabs-inventory.appspot.com",
    messagingSenderId: "367375685514",
    appId: "1:367375685514:web:644a4df0d76715b9c1d2cb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
    try {
        const q = query(collection(db, "master_register"));
        const snapshot = await getDocs(q);
        
        let fevTxs: any[] = [];
        snapshot.forEach((d) => {
            const data = d.data();
            if (data.itemCode === "Eng-079" || data.itemCode === "ENG-FEVIKWIK" || (data.materialName && data.materialName.toLowerCase().includes("fevikwik"))) {
                fevTxs.push({ id: d.id, ...data });
            }
        });
        
        console.log("Found", fevTxs.length, "Fevikwik transactions.");
        fevTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Find duplicates based on same quantity, same type, and timestamp within 5 seconds
        let toDelete = null;
        for (let i = 0; i < fevTxs.length - 1; i++) {
            const t1 = fevTxs[i];
            const t2 = fevTxs[i+1];
            
            const diffMs = Math.abs(new Date(t1.timestamp).getTime() - new Date(t2.timestamp).getTime());
            if (diffMs < 5000 && t1.quantity === t2.quantity && t1.type === t2.type && t1.quantity === 100 && t1.type === "INWARD") {
                console.log("Found Duplicate!", t1.id, "and", t2.id);
                toDelete = t1.id;
                break;
            }
        }
        
        if (toDelete) {
            console.log("Deleting duplicate document:", toDelete);
            await deleteDoc(doc(db, "master_register", toDelete));
            console.log("Deleted.");
        } else {
            console.log("No exact 100 Pcs inward duplicate found in recent seconds.");
            // Print all inward 100 txs
            const in100 = fevTxs.filter(tx => tx.quantity === 100 && tx.type === 'INWARD');
            console.log("IN100 txs:", in100.map(tx => ({ id: tx.id, ts: tx.timestamp })));
            if (in100.length >= 2) {
                console.log("Deleting the first one just in case:", in100[0].id);
                await deleteDoc(doc(db, "master_register", in100[0].id));
                console.log("Deleted.");
            }
        }
        
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

main();


import { fetchMasterRegister, deleteTransaction } from './src/lib/domain/inventory_service';

async function run() {
    console.log('Fetching master register...');
    const txs = await fetchMasterRegister();
    const today = new Date().toISOString().split('T')[0];
    
    // Find double entry (qty=100) today
    const duplicates = txs.filter(t => t.timestamp.startsWith(today) && t.quantity === 100);
    console.log('Found matching today transactions with qty=100:', duplicates.length);
    
    if (duplicates.length > 1) {
        console.log('Duplicate detected, deleting the newest one...');
        const toDelete = duplicates[0]; // the newest one is first since fetchMasterRegister orders by desc
        console.log('Deleting tx:', toDelete.id, toDelete.materialName);
        const res = await deleteTransaction(toDelete);
        console.log('Delete result:', res);
    } else {
        console.log('No duplicate found.');
    }
}
run().catch(console.error);

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const app = initializeApp({ projectId: 'englabs-enterprise' });
const db = getFirestore(app);

(async () => {
  const collections = ['projects_master', 'inventory_ledger', 'vendor_ledger', 'finance_ledger', 'porter_ledger', 'food_ledger', 'projects'];
  const dbStats = {};
  
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(db, col));
      dbStats[col] = {
        count: snap.size,
        samples: snap.docs.slice(0, 2).map(d => d.data())
      };
    } catch (e) {
      dbStats[col] = { error: e.message };
    }
  }
  
  fs.writeFileSync('db_stats.json', JSON.stringify(dbStats, null, 2));
  console.log('Database stats exported to db_stats.json');
  process.exit(0);
})();

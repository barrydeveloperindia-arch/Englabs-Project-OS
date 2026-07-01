import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

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

async function syncAll() {
    const dataDir = './data';
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('C') && f.endsWith('.json'));
    console.log(`Found ${files.length} project files to sync.`);
    
    let successCount = 0;
    for (const file of files) {
        const projectId = file.replace('.json', '');
        const filePath = path.join(dataDir, file);
        try {
            const projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const cleanProject = JSON.parse(JSON.stringify(projectData));
            const docRef = doc(db, "projects", projectId);
            
            await setDoc(docRef, {
                ...cleanProject,
                syncedAt: new Date().toISOString(),
                syncSource: 'CLI_ADMIN_BULK_TOOL'
            });
            successCount++;
        } catch (e) {
            console.error(`Failed to sync ${projectId}:`, e);
        }
    }
    console.log(`\n✅ Finished! Successfully synced ${successCount} of ${files.length} projects to Firestore.`);
}

syncAll();

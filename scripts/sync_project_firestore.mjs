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

async function syncProject(projectId) {
    const filePath = path.join('./data', `${projectId}.json`);
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File does not exist at ${filePath}`);
        return;
    }

    try {
        const projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`Syncing project ${projectId} to Firestore...`);

        const cleanProject = JSON.parse(JSON.stringify(projectData));
        const docRef = doc(db, "projects", projectId);
        
        await setDoc(docRef, {
            ...cleanProject,
            syncedAt: new Date().toISOString(),
            syncSource: 'CLI_ADMIN_TOOL'
        });

        console.log(`✅ Success: Project ${projectId} synchronized to Firestore projects collection.`);
    } catch (e) {
        console.error("❌ Firestore Sync Failure:", e);
    }
}

const pid = process.argv[2] || "C5254";
syncProject(pid);

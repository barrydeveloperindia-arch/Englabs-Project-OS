import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
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
const auth = getAuth(app);

async function pullAndMerge() {
    console.log("Authenticating as admin...");
    try {
        await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("Authentication successful! Fetching projects from Firestore...");
        
        const querySnapshot = await getDocs(collection(db, "projects"));
        let updatedCount = 0;
        let createdCount = 0;
        let totalDiffCount = 0;

        querySnapshot.forEach((doc) => {
            const projectId = doc.id;
            const fbData = doc.data();
            const filePath = path.join('./data', `${projectId}.json`);

            // Clean properties added by sync tools
            delete fbData.syncedAt;
            delete fbData.syncSource;

            if (fs.existsSync(filePath)) {
                let localData;
                try {
                    localData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                } catch (e) {
                    console.error(`Error reading local file for ${projectId}:`, e);
                    return;
                }

                let diffCount = 0;

                // Check for differences in dailyStandup
                const localStandup = JSON.stringify(localData.dailyStandup || {});
                const fbStandup = JSON.stringify(fbData.dailyStandup || {});

                if (localStandup !== fbStandup) {
                    console.log(`\n🔍 Difference found in standup for project ${projectId}:`);
                    console.log(`   Local:`, localData.dailyStandup);
                    console.log(`   Firebase:`, fbData.dailyStandup);
                    
                    // Merge dailyStandup from Firebase
                    localData.dailyStandup = fbData.dailyStandup;
                    diffCount++;
                }

                // Check and merge planning
                if (JSON.stringify(localData.planning || {}) !== JSON.stringify(fbData.planning || {})) {
                    console.log(`   Planning diff for ${projectId}: merging Firebase planning...`);
                    localData.planning = fbData.planning;
                    diffCount++;
                }
                
                // Check and merge metrics
                if (JSON.stringify(localData.metrics || {}) !== JSON.stringify(fbData.metrics || {})) {
                    console.log(`   Metrics diff for ${projectId}: merging Firebase metrics...`);
                    localData.metrics = fbData.metrics;
                    diffCount++;
                }

                // Check and merge client
                if (localData.client !== fbData.client) {
                    console.log(`   Client diff for ${projectId}: merging Firebase client...`);
                    localData.client = fbData.client;
                    diffCount++;
                }

                // Check and merge production
                if (JSON.stringify(localData.production || {}) !== JSON.stringify(fbData.production || {})) {
                    console.log(`   Production diff for ${projectId}: merging Firebase production...`);
                    localData.production = fbData.production;
                    diffCount++;
                }

                // Check and merge financials
                if (JSON.stringify(localData.financials || {}) !== JSON.stringify(fbData.financials || {})) {
                    console.log(`   Financials diff for ${projectId}: merging Firebase financials...`);
                    localData.financials = fbData.financials;
                    diffCount++;
                }

                // Check and merge poRelease
                if (JSON.stringify(localData.poRelease || {}) !== JSON.stringify(fbData.poRelease || {})) {
                    console.log(`   poRelease diff for ${projectId}: merging Firebase poRelease...`);
                    localData.poRelease = fbData.poRelease;
                    diffCount++;
                }

                // Check and merge invoiceRelease
                if (JSON.stringify(localData.invoiceRelease || {}) !== JSON.stringify(fbData.invoiceRelease || {})) {
                    console.log(`   invoiceRelease diff for ${projectId}: merging Firebase invoiceRelease...`);
                    localData.invoiceRelease = fbData.invoiceRelease;
                    diffCount++;
                }

                if (diffCount > 0) {
                    fs.writeFileSync(filePath, JSON.stringify(localData, null, 4), 'utf8');
                    updatedCount++;
                    totalDiffCount += diffCount;
                }
            } else {
                console.log(`\n🆕 Creating new local project file for ${projectId} from Firebase data.`);
                fs.writeFileSync(filePath, JSON.stringify(fbData, null, 4), 'utf8');
                createdCount++;
            }
        });

        console.log(`\nSynchronization Summary:`);
        console.log(`- Created local JSONs: ${createdCount}`);
        console.log(`- Updated local JSONs: ${updatedCount}`);
        console.log(`- Total differences merged: ${totalDiffCount}`);

    } catch (e) {
        console.error("❌ Firestore Pull Failure:", e);
    }
}

pullAndMerge();

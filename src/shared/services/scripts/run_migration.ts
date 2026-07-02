import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import * as dotenv from 'dotenv';
dotenv.config();

// Mock the environment to allow migration script to use them
 // Just in case
(global as any).window = {};

import { migrateProjectsToFirestore } from '@services/scripts/migrate_to_firestore';

import { signInWithEmailAndPassword } from 'firebase/auth';

const run = async () => {
    try {
        console.log("Authenticating as Admin...");
        await signInWithEmailAndPassword(auth, "englabscivilteam@gmail.com", "Ram@2026");
        console.log("Authenticated successfully.");
        await migrateProjectsToFirestore();
    } catch (err: any) {
        console.error("Authentication failed:", err.message);
    }
    process.exit(0);
}
run();

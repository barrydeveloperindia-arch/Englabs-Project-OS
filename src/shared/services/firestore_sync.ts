import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { User, ActivityLog } from '../types/database.types';
// @ts-ignore
import { GateEntry } from '@shared/services/gate_system';

export const FirestoreSyncService = {
    /**
     * Sycns the entire local array of users to the remote 'users' collection
     */
    syncUsers: async (users: User[]) => {
        const usersRef = collection(db, 'users');
        const promises = users.map(user => setDoc(doc(usersRef, user.id), user));
        await Promise.all(promises);
    },

    /**
     * Syncs a single user document
     */
    saveUser: async (user: User) => {
        await setDoc(doc(db, 'users', user.id), user);
    },

    /**
     * Listen to real-time changes on the Gate Entries collection
     */
    listenToGateEntries: (callback: (entries: GateEntry[]) => void) => {
        const gateRef = collection(db, 'gate_entries');
        const q = query(gateRef, orderBy('timestamp', 'desc'));
        
        return onSnapshot(q, (snapshot) => {
            const entries: GateEntry[] = [];
            snapshot.forEach(doc => {
                entries.push(doc.data() as GateEntry);
            });
            callback(entries);
        });
    },

    /**
     * Listen to real-time changes on Activity Logs
     */
    listenToActivityLogs: (callback: (logs: ActivityLog[]) => void) => {
        const logsRef = collection(db, 'activity_logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const logs: ActivityLog[] = [];
            snapshot.forEach(doc => {
                logs.push(doc.data() as ActivityLog);
            });
            callback(logs);
        });
    }
};

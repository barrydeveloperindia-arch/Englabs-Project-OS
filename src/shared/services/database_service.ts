import { collection, addDoc, getDocs, query, orderBy, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@services/firebase";
import { GateEntry } from "@shared/services/gate_system";

const COLLECTION_NAME = "gate_entries";

export const saveGateEntry = async (entry: GateEntry) => {
    if (!db) return { success: false, error: "Database not initialized" };
    try {
        // CLEAN UNDEFINED VALUES FOR FIREBASE
        const cleanEntry = JSON.parse(JSON.stringify(entry));
        
        const docRef = doc(db, COLLECTION_NAME, entry.id);
        await setDoc(docRef, {
            ...cleanEntry,
            syncedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (e) {
        console.error("Error saving to Firebase:", e);
        return { success: false, error: e };
    }
};

export const fetchGateEntries = async () => {
    if (!db) return [];
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as GateEntry);
    } catch (e) {
        console.error("Error fetching from Firebase:", e);
        return [];
    }
};

export const syncLocalToFirebase = async (entries: GateEntry[]) => {
    const results = await Promise.all(entries.map(e => saveGateEntry(e)));
    return results.every(r => r.success);
};

export const saveProjectToFirebase = async (project: any) => {
    if (!db) return { success: false, error: "Database not initialized" };
    
    // Cache to localStorage as an offline backup if running in browser
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const localSaved = window.localStorage.getItem('englabs_project_overrides');
            const localMap = localSaved ? JSON.parse(localSaved) : {};
            localMap[project.projectId] = project;
            window.localStorage.setItem('englabs_project_overrides', JSON.stringify(localMap));
        } catch (e) {
            console.error("Failed to cache project to localStorage:", e);
        }
    }

    try {
        // CLEAN UNDEFINED VALUES FOR FIREBASE
        const cleanProject = JSON.parse(JSON.stringify(project));
        
        const docRef = doc(db, "projects", project.projectId);
        await setDoc(docRef, {
            ...cleanProject,
            syncedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (e) {
        console.error("Error saving project to Firebase:", e);
        return { success: false, error: e };
    }
};

export const syncAllProjectsToFirebase = async (projects: any[]) => {
    const results = await Promise.all(projects.map(p => saveProjectToFirebase(p)));
    return results.every(r => r.success);
};

export const deleteProjectFromFirebase = async (projectId: string) => {
    if (!db) return { success: false, error: "Database not initialized" };
    try {
        const docRef = doc(db, "projects", projectId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (e) {
        console.error("Error deleting project from Firebase:", e);
        return { success: false, error: e };
    }
};

export const deleteGateEntryFromFirebase = async (entryId: string) => {
    if (!db) return { success: false, error: "Database not initialized" };
    try {
        const docRef = doc(db, COLLECTION_NAME, entryId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (e) {
        console.error("Error deleting gate entry from Firebase:", e);
        return { success: false, error: e };
    }
};

export const fetchProjectsFromFirebase = async () => {
    if (!db) throw new Error("Database not initialized");
    const querySnapshot = await getDocs(collection(db, "projects"));
    return querySnapshot.docs.map(doc => doc.data());
};

export const savePorterEntry = async (entry: any) => {
    if (!db) return { success: false, error: "Database not initialized" };
    try {
        const cleanEntry = JSON.parse(JSON.stringify(entry));
        const docRef = doc(db, "porter_ledger", entry.id);
        await setDoc(docRef, {
            ...cleanEntry,
            syncedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (e) {
        console.error("Error saving porter entry to Firebase:", e);
        return { success: false, error: e };
    }
};

export const fetchPorterLedger = async () => {
    if (!db) return [];
    try {
        const querySnapshot = await getDocs(collection(db, "porter_ledger"));
        return querySnapshot.docs.map(doc => doc.data());
    } catch (e) {
        console.error("Error fetching porter ledger from Firebase:", e);
        return [];
    }
};


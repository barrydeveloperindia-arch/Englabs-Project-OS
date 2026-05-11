import { collection, addDoc, getDocs, query, orderBy, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { GateEntry } from "./gate_system";

const COLLECTION_NAME = "gate_entries";

export const saveGateEntry = async (entry: GateEntry) => {
    if (!db) return { success: false, error: "Database not initialized" };
    try {
        const docRef = doc(db, COLLECTION_NAME, entry.id);
        await setDoc(docRef, {
            ...entry,
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
    try {
        const docRef = doc(db, "projects", project.projectId);
        await setDoc(docRef, {
            ...project,
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

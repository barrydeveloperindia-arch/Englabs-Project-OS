import { db } from '@config/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, setDoc, getDoc } from 'firebase/firestore';

export type ErrorType = 'VALIDATION' | 'SYNC' | 'DATABASE' | 'BUSINESS_LOGIC' | 'EXPORT' | 'UI' | 'DATA_FETCH' | 'CAMERA_ERROR' | 'CHECK_IN' | 'CHECK_OUT' | 'REQUIREMENT_SUBMIT' | 'DELETE_ITEM' | 'UPDATE_ITEM';
export type ErrorStatus = 'PENDING' | 'RESOLVED' | 'IGNORED';

export interface GuardianError {
    id?: string;
    timestamp: string;
    errorType: ErrorType;
    screenName: string;
    user: string;
    description: string;
    status: ErrorStatus;
    recommendedFix?: string;
    resolvedBy?: string;
    resolvedAt?: string;
}

export interface GuardianKnowledge {
    id: string; // The error signature or name
    rootCause: string;
    recommendedFix: string;
    occurrences: number;
}

class StoreGuardian {
    private errorsCol = 'guardian_errors';
    private knowledgeCol = 'guardian_knowledge';

    // Core method to log errors and auto-recommend fixes
    async logError(
        errorType: ErrorType,
        description: string,
        screenName: string,
        user: string
    ): Promise<void> {
        console.error(`[GUARDIAN] ${errorType} on ${screenName}: ${description}`);

        try {
            // Check knowledge base for known fixes
            let recommendedFix = "Requires Admin Review";
            const errorSignature = this.generateSignature(errorType, description);
            
            if (db) {
                const knowledgeRef = doc(db, this.knowledgeCol, errorSignature);
                const kSnap = await getDoc(knowledgeRef);
                
                if (kSnap.exists()) {
                    const kData = kSnap.data() as GuardianKnowledge;
                    recommendedFix = kData.recommendedFix;
                    // Increment occurrence
                    await updateDoc(knowledgeRef, { occurrences: kData.occurrences + 1 });
                } else {
                    // Create new knowledge entry for future learning
                    await setDoc(knowledgeRef, {
                        id: errorSignature,
                        rootCause: "Unknown",
                        recommendedFix: "Investigate and document fix",
                        occurrences: 1
                    });
                }

                // Log the actual error instance
                const newError: GuardianError = {
                    timestamp: new Date().toISOString(),
                    errorType,
                    screenName,
                    user,
                    description,
                    status: 'PENDING',
                    recommendedFix
                };

                await addDoc(collection(db, this.errorsCol), newError);
            } else {
                console.warn("[GUARDIAN] Offline mode: Error not saved to cloud.");
            }
        } catch (e) {
            console.error("[GUARDIAN] Failed to log error to database:", e);
        }
    }

    // Diagnostics Engine
    async runDiagnostics(): Promise<string[]> {
        const issues: string[] = [];
        if (!db) return ["Diagnostics unavailable offline"];

        try {
            // Check for negative stock
            const masterRef = collection(db, 'master_inventory_registry');
            const snap = await getDocs(masterRef);
            
            snap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.currentStock < 0) {
                    issues.push(`Negative stock detected for ${data.name} (${data.currentStock})`);
                    this.logError('BUSINESS_LOGIC', `Negative stock for ${data.name}`, 'Diagnostics', 'SYSTEM');
                }
            });

            // Check for Sync Anomalies (very high quantities out of nowhere)
            const logsRef = collection(db, 'stock_transactions');
            const logsSnap = await getDocs(query(logsRef, orderBy('timestamp', 'desc')));
            // Simple duplication check within last 50 logs
            const recentLogs = logsSnap.docs.slice(0, 50).map(d => ({id: d.id, ...d.data()}));
            const seen = new Set();
            
            recentLogs.forEach((log: any) => {
                const key = `${log.itemId}-${log.type}-${log.quantity}-${log.partyName}`;
                if (seen.has(key)) {
                    issues.push(`Potential duplicate transaction detected for ${log.itemId} (${log.quantity})`);
                    // We don't auto-log this to avoid spamming the error log with false positives, just show in diagnostics
                }
                seen.add(key);
            });

            if (issues.length === 0) issues.push("System Stable: No anomalies detected.");
            return issues;
        } catch (e: any) {
            console.error("Diagnostics failed", e);
            return [`Diagnostics failed: ${e.message}`];
        }
    }

    async getErrors(): Promise<GuardianError[]> {
        if (!db) return [];
        try {
            const q = query(collection(db, this.errorsCol), orderBy('timestamp', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as GuardianError));
        } catch (e) {
            console.error("Failed to fetch errors", e);
            return [];
        }
    }

    async getKnowledgeBase(): Promise<GuardianKnowledge[]> {
        if (!db) return [];
        try {
            const snap = await getDocs(collection(db, this.knowledgeCol));
            return snap.docs.map(d => d.data() as GuardianKnowledge);
        } catch (e) {
            console.error("Failed to fetch knowledge base", e);
            return [];
        }
    }

    async resolveError(errorId: string, adminName: string, actualFix: string, updateKnowledge: boolean): Promise<void> {
        if (!db) return;
        try {
            const errRef = doc(db, this.errorsCol, errorId);
            const errSnap = await getDoc(errRef);
            
            await updateDoc(errRef, {
                status: 'RESOLVED',
                resolvedBy: adminName,
                resolvedAt: new Date().toISOString()
            });

            if (updateKnowledge && errSnap.exists()) {
                const errData = errSnap.data() as GuardianError;
                const signature = this.generateSignature(errData.errorType, errData.description);
                const kRef = doc(db, this.knowledgeCol, signature);
                
                await updateDoc(kRef, {
                    recommendedFix: actualFix,
                    rootCause: "Admin Resolved"
                });
            }
            console.log("Error resolved successfully.");
        } catch (e) {
            console.error("Failed to resolve error", e);
            console.error("Failed to resolve error.");
        }
    }

    private generateSignature(type: string, desc: string): string {
        // Strip out specific quantities, names, or IDs to create a generic signature
        let genericDesc = desc.replace(/[0-9]+/g, '#').replace(/for [A-Za-z0-9_ -]+/g, 'for [ITEM]');
        // Limit length
        if (genericDesc.length > 50) genericDesc = genericDesc.substring(0, 50);
        return `${type}_${genericDesc.replace(/\s+/g, '_').toUpperCase()}`;
    }
}

export const storeGuardian = new StoreGuardian();

import { db, auth } from '@services/firebase';
import { collection, addDoc } from 'firebase/firestore';

export interface AuditLogEntry {
    userId: string;
    userEmail: string;
    role: string;
    action: string;
    module: string;
    entityId?: string;
    projectId?: string;
    timestamp: string;
    metadata: Record<string, any>;
}

export class AuditLogger {
    /**
     * Automatically logs an event to the immutable `audit_logs` collection.
     * Extracts user info from the current Firebase Auth state if not explicitly provided.
     */
    static async log(
        action: string,
        moduleName: string,
        metadata: Record<string, any> = {},
        entityId?: string,
        projectId?: string
    ) {
        try {
            const currentUser = auth.currentUser;
            const userEmail = currentUser?.email || 'SYSTEM';
            const userId = currentUser?.uid || 'SYSTEM';
            
            // Note: In a full production setup, `role` would be fetched from Custom Claims or `staff_master`.
            // Defaulting to generic STAFF for now unless overridden via metadata or specific admin context.
            const role = metadata.overrideRole || (userEmail.includes('admin') ? 'ADMIN' : 'STAFF');

            const entry: AuditLogEntry = {
                userId,
                userEmail,
                role,
                action,
                module: moduleName,
                entityId: entityId || 'N/A',
                projectId: projectId || 'GLOBAL',
                timestamp: new Date().toISOString(),
                metadata
            };

            await addDoc(collection(db, 'audit_logs'), entry);
        } catch (error) {
            console.error("Critical Failure: Unable to write to Audit Log", error);
            // Non-blocking in UI, but logged to console.
        }
    }

    // Common standard events
    static async logAuthEvent(action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'USER_CREATION', metadata: any = {}) {
        await this.log(action, 'AUTH', metadata);
    }

    static async logInventory(type: 'IN' | 'OUT', itemName: string, quantity: number, projectId: string) {
        await this.log(`INVENTORY_${type}`, 'INVENTORY', { itemName, quantity }, undefined, projectId);
    }
    
    static async logProjectUpdate(projectId: string, fieldChanged: string) {
        await this.log('UPDATE', 'PROJECTS', { fieldChanged }, projectId, projectId);
    }
}

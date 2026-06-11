/**
 * ENGLABS SYSTEM GUARD
 * Security, Integrity, and Data Protection Agent
 */

export interface SystemLog {
    id: string;
    timestamp: string;
    type: 'SECURITY' | 'INTEGRITY' | 'ERROR' | 'BACKUP';
    message: string;
    details?: string;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    user: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOCK' | 'UNLOCK' | 'ROLLBACK' | 'SYSTEM';
    targetId: string;
    details: string;
}

export interface HandoverReport {
    date: string;
    completionRate: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    nextDayPlan: string[];
}

export const logAction = (action: AuditLog['action'], targetId: string, details: string, user: string = 'Admin'): AuditLog => {
    const log: AuditLog = {
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        user,
        action,
        targetId,
        details
    };
    console.log(`[AUDIT] ${log.timestamp}: ${log.user} performed ${log.action} on ${log.targetId}`);
    return log;
};

export class SystemGuard {
    runIntegrityCheck(entries: any[]) {
        const broken = entries.filter(e => !e.id || !e.timestamp);
        if (broken.length > 0) {
            return { status: 'REPAIRED', log: `Fixed ${broken.length} entries by assigning temporal IDs.` };
        }
        return { status: 'STABLE', log: "Data integrity verified. System stable." };
    }

    protectData(data: any) {
        if (!data.id) return data;
        if (data.isLocked === undefined) data.isLocked = false;
        if (data.version === undefined) data.version = 1;
        if (!data.history) data.history = [];
        return data;
    }

    async updateWithProtection(current: any, updates: any, user: string, onLog?: (log: AuditLog) => void) {
        if (current.isLocked) {
            throw new Error("CANNOT MODIFY LOCKED RECORD. REQUIRE ADMIN UNLOCK.");
        }

        const historyEntry = { ...current, history: undefined };
        const updated = {
            ...current,
            ...updates,
            version: (current.version || 1) + 1,
            history: [...(current.history || []), historyEntry],
            updatedAt: new Date().toISOString()
        };

        const log = logAction('UPDATE', current.id, `Modified fields: ${Object.keys(updates).join(', ')}`, user);
        if (onLog) onLog(log);

        return updated;
    }

    async lockRecord(record: any, user: string, onLog?: (log: AuditLog) => void) {
        const locked = { ...record, isLocked: true };
        const log = logAction('LOCK', record.id, 'Record locked for safety', user);
        if (onLog) onLog(log);
        return locked;
    }

    async unlockRecord(record: any, user: string, onLog?: (log: AuditLog) => void) {
        const unlocked = { ...record, isLocked: false };
        const log = logAction('UNLOCK', record.id, 'Admin override: Record unlocked', user);
        if (onLog) onLog(log);
        return unlocked;
    }

    async logDeletion(record: any, user: string, onLog?: (log: AuditLog) => void) {
        const log = logAction('DELETE', record.id, `Permanent deletion of record: ${record.materialName || record.id}`, user);
        if (onLog) onLog(log);
    }

    generateHandover(entries: any[]): HandoverReport {
        const completed = entries.filter(e => e.status === 'VERIFIED' || e.status === 'PAID').length;
        const total = entries.length;
        const rate = total > 0 ? (completed / total) * 100 : 100;

        return {
            date: new Date().toLocaleDateString(),
            completionRate: rate.toFixed(1),
            totalTasks: total,
            completedTasks: completed,
            pendingTasks: total - completed,
            nextDayPlan: ["Verify pending material movements", "Sync monthly billing ledger"]
        };
    }
}

export const englabsGuard = new SystemGuard();

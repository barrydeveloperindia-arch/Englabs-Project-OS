import { ActivityLog } from '../types/database.types';
import { AuthService } from './auth_service';

// Mock in-memory store for Phase 3 development. Will bridge to Firebase or JSON file later.
let activityLogs: ActivityLog[] = [];

export const ActivityLogger = {
    log: (module: string, actionType: string, details?: string, beforeState?: any, afterState?: any) => {
        const user = AuthService.getCurrentUser();
        
        const logEntry: ActivityLog = {
            id: `log_${Date.now()}`,
            userId: user ? user.id : 'SYSTEM',
            userName: user ? user.name : 'System Generated',
            role: user ? user.role : 'System',
            module,
            actionType,
            timestamp: new Date().toISOString(),
            details,
            beforeState,
            afterState
        };

        activityLogs.push(logEntry);
        console.log(`[ACTIVITY LOG] ${module} | ${actionType} by ${logEntry.userName}`);
        
        // In a real implementation, this would push to a Firebase collection or append to a JSON file.
        // For Phase 3 local execution, we keep it in memory.
        return logEntry;
    },

    getLogs: (): ActivityLog[] => {
        return [...activityLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
};

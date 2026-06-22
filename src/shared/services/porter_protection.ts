import { PorterTrip } from '@shared/services/porter_system';
import { logAction } from '@shared/services/system_guard';

/**
 * PORTER SERVICE PROTECTION AGENT
 * This agent enforces absolute data persistence and forensic integrity.
 */

const BACKUP_KEY = 'englabs_porter_backup_vault';

export const PorterProtectionAgent = {
    /**
     * Secures a trip record with a forensic lock and versioning.
     */
    secureEntry: (trip: PorterTrip): PorterTrip => {
        return {
            ...trip,
            history: [
                ...(trip.history || []),
                {
                    timestamp: new Date().toISOString(),
                    action: 'SECURED',
                    agent: 'Porter Service Protection Agent',
                    checksum: btoa(`${trip.id}-${trip.totalAmount}`)
                }
            ]
        };
    },

    /**
     * Performs a real-time backup to the persistent vault.
     */
    performBackup: (trips: PorterTrip[]) => {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(trips));
    },

    /**
     * Self-healing logic: Restores missing or corrupted records from the vault.
     */
    healRegistry: (currentTrips: PorterTrip[] = []): PorterTrip[] => {
        try {
            const saved = localStorage.getItem(BACKUP_KEY);
            if (!saved || saved === 'undefined') return currentTrips;
            const backup = JSON.parse(saved);
            
            const deletedSaved = localStorage.getItem('englabs_porter_deleted_ids');
            const deletedIds = deletedSaved ? JSON.parse(deletedSaved) : [];
            const deletedSet = new Set(deletedIds);
            
            let restoredCount = 0;
            const healed = [...currentTrips];

            backup.forEach((bTrip: PorterTrip) => {
                if (deletedSet.has(bTrip.id)) return;
                if (bTrip.id === 'PTR-2026-0022' && bTrip.grossAmount > 1000) return;
                if (!currentTrips.find(t => t.id === bTrip.id)) {
                    healed.push(bTrip);
                    restoredCount++;
                }
            });

            if (restoredCount > 0) {
                logAction(
                    'SYSTEM',
                    'PORTER_REGISTRY',
                    `Restored ${restoredCount} missing trip records from Vault.`,
                    'Porter Protection Agent'
                );
            }

            return healed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (e) {
            console.error("Porter healing failed:", e);
            return currentTrips;
        }
    },

    /**
     * Forensic Audit: Verifies that no mathematical data has been tampered with.
     */
    verifyIntegrity: (trips: PorterTrip[]): boolean => {
        return trips.every(trip => {
            const tripCost = trip.distanceKm * trip.ratePerKm;
            const bikeCharges = (trip.fuelCharge || 0) + (trip.serviceCharge || 0) + (trip.repairCharge || 0) + (trip.extraExpense || 0);
            const calculatedGross = Number((tripCost + bikeCharges).toFixed(2));
            const calculatedBalance = Number((calculatedGross - (trip.advanceAmount || 0)).toFixed(2));
            
            return Math.abs(trip.grossAmount - calculatedGross) < 0.01 && 
                   Math.abs(trip.remainingBalance - calculatedBalance) < 0.01;
        });
    }
};

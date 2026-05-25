import { describe, it, expect, vi } from 'vitest';
import { processInventoryUpdate } from '../lib/inventory_service';
import { GateEntry } from '../lib/gate_system';

// Mock Firebase dependency to prevent actual database calls
vi.mock('firebase/firestore', () => ({
    runTransaction: vi.fn(),
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn()
}));

vi.mock('../lib/firebase', () => ({
    db: {} // dummy database object
}));

describe('Inventory Service Main Store Filter', () => {
    
    it('skips inward inventory update when toLocation is not MAIN STORE', async () => {
        const mockInwardEntry: GateEntry = {
            id: 'IN-101',
            type: 'INWARD',
            timestamp: new Date().toISOString(),
            materialName: 'TEST MATERIAL',
            quantity: 10,
            unit: 'Nos',
            vehicleNumber: 'DL-123',
            partyName: 'VENDOR A',
            fromLocation: 'DELHI',
            toLocation: 'SITE OFIS', // not MAIN STORE
            invoiceNumber: 'INV-123',
            amount: 1000,
            employeeName: 'Ramesh',
            supervisorName: 'Test Supervisor',
            driverName: 'Test Driver',
            remarks: 'Office delivery.',
            isLocked: true,
            version: 1
        };

        const result = await processInventoryUpdate(mockInwardEntry);
        expect(result).toEqual({ success: true, message: 'Skipped: not MAIN STORE' });
    });

    it('skips outward inventory update when fromLocation is not MAIN STORE', async () => {
        const mockOutwardEntry: GateEntry = {
            id: 'OUT-102',
            type: 'OUTWARD',
            timestamp: new Date().toISOString(),
            materialName: 'TEST MATERIAL',
            quantity: 5,
            unit: 'Nos',
            vehicleNumber: 'DL-456',
            partyName: 'CLIENT B',
            fromLocation: 'SITE OFFICE', // not MAIN STORE
            toLocation: 'CLIENT SITE',
            invoiceNumber: 'INV-456',
            amount: 500,
            employeeName: 'Suresh',
            supervisorName: 'Test Supervisor',
            driverName: 'Test Driver',
            remarks: 'Client dispatch.',
            isLocked: true,
            version: 1
        };

        const result = await processInventoryUpdate(mockOutwardEntry);
        expect(result).toEqual({ success: true, message: 'Skipped: not MAIN STORE' });
    });
});

export type EntryType = 'INWARD' | 'OUTWARD';

export interface GateEntry {
    id: string;
    type: EntryType;
    timestamp: string;
    materialName: string;
    quantity: number;
    unit: string;
    vehicleNumber: string;
    partyName: string;
    fromLocation: string;
    toLocation: string;
    invoiceNumber: string;
    amount: number;
    employeeName: string; // Issued/Received By
    supervisorName: string; // Authorized By
    driverName: string; // Carrier / Driver Name
    remarks: string;
    gatePassNumber?: string; // Mandatory for OUTWARD
    deliveryType?: string; // For OUTWARD
    photoUrl?: string; // URL to uploaded material photo
    invoicePhotoUrl?: string; // URL to uploaded invoice photo
    isLocked: boolean; // Prevent edits after completion
    version: number;
    history?: any[]; // Store previous versions for rollback
}

export const UNITS = ['Nos', 'Kg', 'Meter', 'Liter', 'Packet', 'Box', 'Ton', 'Roll'];
export const DELIVERY_TYPES = ['Topay', 'Porter', 'Company Vehicle', 'Client Vehicle', 'Self Pick'];

export const generateId = (type: EntryType, count: number): string => {
    const prefix = type === 'INWARD' ? 'IN' : 'OUT';
    return `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
};

export const generateGatePassId = (count: number): string => {
    return `GP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
};

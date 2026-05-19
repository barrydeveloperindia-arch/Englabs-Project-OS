export type EntryType = 'INWARD' | 'OUTWARD';
export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';
export type PaymentMode = 'UPI' | 'CASH' | 'NEFT' | 'CHEQUE' | 'OTHER';

export interface GateItem {
    id: number;
    name: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
}

export interface GateEntry {
    id: string;
    type: EntryType;
    timestamp: string;
    materialName: string; // Summary of items for bulk entries
    quantity: number; // Total quantity for bulk entries
    unit: string;
    vehicleNumber: string;
    partyName: string;
    fromLocation: string;
    toLocation: string;
    invoiceNumber: string;
    amount: number; // Total amount for bulk entries
    employeeName: string; // Issued/Received By
    supervisorName: string; // Authorized By
    driverName: string; // Carrier / Driver Name
    remarks: string;
    items?: GateItem[]; // Array for bulk entries
    gatePassNumber?: string; // Mandatory for OUTWARD
    deliveryType?: string; // For OUTWARD
    photoUrl?: string; // URL to uploaded material photo
    invoicePhotoUrl?: string; // URL to uploaded invoice photo
    isLocked: boolean; // Prevent edits after completion
    version: number;
    paymentStatus?: PaymentStatus;
    paymentMode?: PaymentMode;
    transactionId?: string;
    paidAmount?: number;
    remainingAmount?: number;
    paymentDate?: string;
    paymentRemarks?: string;
    billType?: 'GST' | 'WITHOUT_GST';
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

export interface InventoryItem {
    itemCode: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    totalInward: number;
    totalOutward: number;
    minThreshold: number;
    lastUpdated: string;
    location?: string;
}

export interface StockTransaction {
    id: string;
    itemId: string;
    type: 'INWARD' | 'OUTWARD';
    quantity: number;
    previousStock: number;
    newStock: number;
    timestamp: string;
    referenceId: string; // ID of the GateEntry
    partyName: string;
    invoiceNumber: string;
}

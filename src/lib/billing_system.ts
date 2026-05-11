/**
 * ENGLABS BILLING & INVOICE SYSTEM
 * High-Fidelity Data Model & Logic
 */

export type DocumentType = 'INVOICE' | 'BILL' | 'RECEIPT' | 'PAYMENT_ACK';

export interface LineItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

export interface BillingDocument {
    id: string; // Auto-generated e.g., INV-2026-001
    type: DocumentType;
    date: string;
    clientName: string;
    clientAddress: string;
    clientContact: string;
    items: LineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: 'DRAFT' | 'PAID' | 'PARTIAL' | 'OVERDUE';
    creator: string;
    createdAt: string;
    updatedAt: string;
    isLocked: boolean;
    version: number;
    history?: any[];
}

export const COMPANY_DETAILS = {
    name: "ENGLABS INDIA PRIVATE LIMITED",
    address: "2nd FLOOR, UNIT NO. 1021-1022, DISHA ARCAHE, SECTOR 4, MANSA DEVI COMPLEX, PANCHKULA, HARYANA – 134114",
    mobile: "09876457934",
    gstin: "06AAFCE5136K1ZL",
    mapLink: "https://maps.app.goo.gl/NoPy8ogss2618CFQ6"
};

export const generateDocId = (type: DocumentType, count: number): string => {
    const prefix = type === 'INVOICE' ? 'INV' : type === 'BILL' ? 'BIL' : type === 'RECEIPT' ? 'REC' : 'ACK';
    const year = new Date().getFullYear();
    const sequence = (count + 1).toString().padStart(3, '0');
    return `${prefix}-${year}-${sequence}`;
};

export const calculateTotals = (items: LineItem[], taxRate: number = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
};

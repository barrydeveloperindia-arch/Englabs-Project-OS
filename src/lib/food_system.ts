export type FoodPlatform = 'Zomato' | 'Swiggy' | 'Sky-5' | 'Local Vendor';
export type OrderType = 'Individual' | 'Team' | 'Client Meeting' | 'Staff Welfare';
export type Purpose = 'Official Work' | 'Overtime Work' | 'Client Meeting' | 'Site Work' | 'Personal';
export type PaymentMode = 'Cash' | 'UPI' | 'Company Account';
export type PaidBy = 'Employee' | 'Company' | 'Reimbursement';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface FoodOrder {
    entryId: string; // FOOD-001
    timestamp: string;
    employeeName: string;
    department: 'Admin' | 'Engineering' | 'Workshop' | 'Office';
    mobile?: string;
    
    platform: FoodPlatform;
    vendorName: string;
    items: string;
    quantity: number;
    orderType: OrderType;
    
    purpose: Purpose;
    projectCode?: string; // CXXX
    justification: string;
    
    amount: number;
    paymentMode: PaymentMode;
    paidBy: PaidBy;
    hasBill: boolean;
    attachmentUrl?: string;
    
    approvedBy?: string;
    status: ApprovalStatus;
    remarks?: string;
}

export const DEPARTMENTS = ['Admin', 'Engineering', 'Workshop', 'Office'] as const;
export const PLATFORMS: FoodPlatform[] = ['Zomato', 'Swiggy', 'Sky-5', 'Local Vendor'];
export const ORDER_TYPES: OrderType[] = ['Individual', 'Team', 'Client Meeting', 'Staff Welfare'];
export const PURPOSES: Purpose[] = ['Official Work', 'Overtime Work', 'Client Meeting', 'Site Work', 'Personal'];
export const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Company Account'];
export const PAID_BY_OPTIONS: PaidBy[] = ['Employee', 'Company', 'Reimbursement'];

export function generateFoodId(count: number): string {
    return `FOOD-${(count + 1).toString().padStart(3, '0')}`;
}

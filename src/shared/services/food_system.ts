export type FoodPlatform = 'Zomato' | 'Swiggy' | 'Sky-5' | 'Local Vendor' | 'Englabs India Pvt Ltd';
export type OrderType = 'Individual' | 'Team' | 'Client Meeting' | 'Staff Welfare';
export type Purpose = 'Official Work' | 'Overtime Work' | 'Client Meeting' | 'Site Work' | 'Personal' | 'Staff Refreshment';
export type PaymentMode = 'Cash' | 'UPI' | 'GPay' | 'PhonePay' | 'BharatPay' | 'NEFT' | 'Company Account';
export type PaidBy = 'Employee' | 'Company' | 'Reimbursement';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type TrackingStatus = 'Order Placed' | 'In Kitchen' | 'Ready for Pickup' | 'Dispatched' | 'Delivered';
export type DiscountType = 'Flat' | 'Percentage';
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Water Time' | 'Team Time' | 'Break Time' | 'Snacks Time' | 'Normal Food Time';

export interface FoodOrder {
    entryId: string; // FOOD-001
    timestamp: string;
    employeeName: string;
    department: 'Admin' | 'Engineering' | 'Workshop' | 'Office';
    mobile?: string;
    
    platform: FoodPlatform;
    mealType?: MealType;
    vendorName: string;
    items: string;
    quantity: number;
    unit?: string; // Nos, Plate, Kg, etc.
    orderType: OrderType;
    
    purpose: Purpose;
    projectCode?: string; // CXXX
    justification: string;
    
    rate?: number;
    discount?: number;
    discountType?: DiscountType;
    gstPercent?: number;
    amount: number;
    paymentMode: PaymentMode;
    paidBy: PaidBy;
    hasBill: boolean;
    attachmentUrl?: string;
    
    approvedBy?: string;
    status: ApprovalStatus;
    trackingStatus: TrackingStatus;
    kitchenTimestamp?: string;
    remarks?: string;
}

export const DEPARTMENTS = ['Admin', 'Engineering', 'Workshop', 'Office'] as const;
export const PLATFORMS: FoodPlatform[] = ['Zomato', 'Swiggy', 'Sky-5', 'Local Vendor', 'Englabs India Pvt Ltd'];
export const ORDER_TYPES: OrderType[] = ['Individual', 'Team', 'Client Meeting', 'Staff Welfare'];
export const PURPOSES: Purpose[] = ['Official Work', 'Overtime Work', 'Client Meeting', 'Site Work', 'Personal', 'Staff Refreshment'];
export const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'GPay', 'PhonePay', 'BharatPay', 'NEFT', 'Company Account'];
export const PAID_BY_OPTIONS: PaidBy[] = ['Employee', 'Company', 'Reimbursement'];
export const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Water Time', 'Team Time', 'Break Time', 'Snacks Time', 'Normal Food Time'];

export const STAFF_LIST = [
    'Bharat Anand',
    'Salil Anand',
    'Shreeya K Anand',
    'Gaurav Panchal',
    'Shubham Rohilla',
    'Ratnesh Divedi',
    'Arjun Tiwari',
    'Ram',
    'Anurag',
    'Udutanshu',
    'Kunwarlal',
    'Rajindar'
] as const;

export function generateFoodId(count: number): string {
    return `FOOD-${(count + 1).toString().padStart(3, '0')}`;
}

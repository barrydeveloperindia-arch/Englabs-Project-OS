export type DeliveryStatus = 'ACCEPTED' | 'PICKUP_STARTED' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';
export type PorterPaymentStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED';

export interface TripEvent {
    status: DeliveryStatus;
    timestamp: string;
    remarks?: string;
}

export interface PorterTrip {
    id: string;
    timestamp: string;
    date: string;
    time: string;
    porterName: string;
    vehicleNumber: string;
    
    // Customer Details
    customerName: string;
    customerMobile: string;
    deliveryAddress: string;
    deliveryNotes?: string;
    
    fromLocation: string;
    toLocation: string;
    materialDescription: string;
    distanceKm: number;
    ratePerKm: number;
    
    // Bike Service Charges
    fuelCharge?: number;
    serviceCharge?: number;
    repairCharge?: number;
    extraExpense?: number;
    
    // Advance Payment
    advanceAmount?: number;
    advanceDate?: string;
    advanceGivenBy?: string;
    
    // Calculations
    grossAmount: number;
    remainingBalance: number;
    totalAmount: number; // For legacy compatibility (represents gross)
    
    paymentStatus: PorterPaymentStatus;
    deliveryStatus: DeliveryStatus;
    timeline: TripEvent[];
    proofUrl?: string;
    remarks?: string;
    history?: any[];
}

export const generatePorterId = (count: number): string => {
    return `PTR-2026-${(count + 1).toString().padStart(4, '0')}`;
};

/**
 * Calculates the total valuation including service charges and advances.
 */
export const calculatePorterAmount = (
    km: number, 
    rate: number, 
    fuel = 0, 
    service = 0, 
    repair = 0, 
    extra = 0,
    advance = 0
) => {
    const tripCost = km * rate;
    const gross = tripCost + fuel + service + repair + extra;
    const balance = gross - advance;
    
    return {
        gross: Number(gross.toFixed(2)),
        balance: Number(balance.toFixed(2))
    };
};

export type ProjectStageStatus = 'Pending' | 'In Progress' | 'Completed';

export interface ProjectStage {
    name: string;
    status: ProjectStageStatus;
    lead?: string;
    timeTaken?: string;
    completedAt?: string;
}
export interface FinancialData {
    vendorName?: string | null;
    vendorLocation?: string | null;
    dispatchBudget?: number | null;
    totalCost?: number | null;
    profitLoss?: number | null;
    deliveryFeeMode?: string | null;
    poNumber?: string | null;
}

export interface ProjectData {
    projectId: string;
    client: string;
    planning: {
        value: number;
        budget: number;
        deliveryTerms: 'ToPay' | 'Porter';
        poConfirmed: boolean;
        poNumber?: string;
        startDate: string;
    };
    production: {
        currentStage: string;
        stages: ProjectStage[];
    };
    metrics: {
        totalComponents: number;
        materialConsumption: string;
        workforce: string[];
    };
    financials?: FinancialData;
    dailyStandup?: {
        srNo?: string;
        discussingNotes?: string;
        preparingPartsDate?: string;
        routeFrom?: string;
        routeTo?: string;
        porterPayments?: number;
        inputsRequired?: string;
    };
    poRelease?: {
        customerSalePrice?: number;
        vendorName?: string;
        vendorLocation?: string;
        poVendorSent?: string;
        vendorCost?: number;
        releaseDate?: string;
    };
    invoiceRelease?: {
        gstRate?: number;
        gstValue?: number;
        totalInvoiceAmount?: number;
        paymentTerms?: string;
        invoiceNumber?: string;
        paymentStatus?: string;
    };
}

export const STAGES = [
    'Engineering Design',
    'Machine Processing',
    'Workshop Fabrication',
    'Sanding',
    'Painting',
    'Drying',
    'Finishing',
    'Final Packaging'
];

export function calculateBudgetUtilization(project: ProjectData): number {
    if (project.planning.value === 0) return 0;
    return (project.planning.budget / project.planning.value) * 100;
}

export function getNextStage(currentStage: string): string | null {
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === STAGES.length - 1) return null;
    return STAGES[currentIndex + 1];
}

export function isCXXXFormat(id: string): boolean {
    return /^C\d{3,}$/.test(id);
}

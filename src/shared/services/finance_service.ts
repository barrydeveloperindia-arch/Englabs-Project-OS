import { Invoice, Expense } from '../types/database.types';

export const FinanceService = {
    getPendingInvoices: async (): Promise<Invoice[]> => {
        // Module not yet provisioned.
        return [];
    },
    getRecentExpenses: async (): Promise<Expense[]> => {
        return [];
    },
    getPurchaseOrders: async (): Promise<any[]> => {
        return [];
    }
};

export enum ERPRootFolder {
    MANAGEMENT = '01_Management',
    HR_STAFF = '02_HR_Staff_Management',
    ACCOUNTS_FINANCE = '03_Accounts_Finance',
    CLIENTS = '04_Clients',
    PROJECTS = '05_Projects',
    VENDOR_MANAGEMENT = '06_Vendor_Management',
    PROCUREMENT = '07_Procurement',
    STORE_INVENTORY = '08_Store_Inventory',
    PRODUCTION = '09_Production',
    PACKING_DISPATCH = '10_Packing_Dispatch',
    LOGISTICS_TRANSPORTATION = '11_Logistics_Transportation',
    PORTER_SERVICES = '12_Porter_Services',
    FOOD_HOSPITALITY = '13_Food_Hospitality',
    SITE_OPERATIONS = '14_Site_Operations',
    MARKETING_SALES = '15_Marketing_Sales',
    ENGINEERING_SURVEY = '16_Engineering_Survey',
    IT_SYSTEMS = '17_IT_Systems',
    REPORTS_DASHBOARD = '18_Reports_Dashboard',
    BACKUPS = '19_Backups',
    AA_PROJECTS = '20_A&A_Projects'
}

export enum ERPProjectSubFolder {
    CLIENT_DETAILS = '01_Client_Details',
    ENQUIRY = '02_Enquiry',
    QUOTATION = '03_Quotation',
    PO = '04_PO',
    BUDGET = '05_Budget',
    VENDOR = '06_Vendor',
    PROCUREMENT = '07_Procurement',
    MATERIALS = '08_Materials',
    PRODUCTION = '09_Production',
    PACKING = '10_Packing',
    DISPATCH = '11_Dispatch',
    PORTER_COST = '12_Porter_Cost',
    FOOD_HOSPITALITY_COST = '13_Food_Hospitality_Cost',
    SITE_WORK = '14_Site_Work',
    PHOTOS = '15_Photos',
    INVOICES = '16_Invoices',
    PAYMENTS = '17_Payments',
    REPORTS = '18_Reports',
    PROFIT_LOSS = '19_Profit_Loss'
}

export enum ERPProjectStatus {
    NEW_ENQUIRY = 'New Enquiry',
    QUOTATION_SENT = 'Quotation Sent',
    NEGOTIATION = 'Negotiation',
    APPROVED = 'Approved',
    PO_RECEIVED = 'PO Received',
    PLANNING = 'Planning',
    PROCUREMENT = 'Procurement',
    PRODUCTION = 'Production',
    QUALITY_CHECK = 'Quality Check',
    PACKING = 'Packing',
    DISPATCH = 'Dispatch',
    INSTALLATION = 'Installation',
    RUNNING = 'Running',
    UNDER_PROGRESS = 'Under Progress',
    ON_HOLD = 'On Hold',
    COMPLETED = 'Completed',
    CLOSED = 'Closed',
    CANCELLED = 'Cancelled'
}

export enum ERPExpenseCategory {
    RAW_MATERIALS = 'Raw Materials',
    VENDOR_COST = 'Vendor Cost',
    LABOUR_COST = 'Labour Cost',
    SANDING = 'Sanding',
    PAINTING = 'Painting',
    PACKING = 'Packing',
    INSTALLATION = 'Installation',
    DRIVER_CHARGES = 'Driver Charges',
    FUEL = 'Fuel',
    TOLL_TAX = 'Toll Tax',
    TRANSPORTATION = 'Transportation',
    COURIER = 'Courier',
    LOADING_CHARGES = 'Loading Charges',
    UNLOADING_CHARGES = 'Unloading Charges',
    PORTER_CHARGES = 'Porter Charges',
    MATERIAL_SHIFTING_COST = 'Material Shifting Cost',
    TEA_EXPENSES = 'Tea Expenses',
    PANTRY_EXPENSES = 'Pantry Expenses',
    STAFF_MEALS = 'Staff Meals',
    SITE_FOOD_EXPENSES = 'Site Food Expenses',
    DRIVER_FOOD_EXPENSES = 'Driver Food Expenses',
    PORTER_FOOD_EXPENSES = 'Porter Food Expenses',
    GUEST_HOSPITALITY = 'Guest Hospitality',
    HOTEL_EXPENSES = 'Hotel Expenses',
    TRAVEL_EXPENSES = 'Travel Expenses',
    SITE_VISIT_EXPENSES = 'Site Visit Expenses',
    MISCELLANEOUS_EXPENSES = 'Miscellaneous Expenses'
}

export interface ERPProjectData {
    projectId: string; // e.g., C001
    projectName: string;
    clientId: string;
    clientName: string;
    quotationNumber: string;
    poNumber: string;
    poAmount: number;
    budgetAmount: number;
    status: ERPProjectStatus;
    progressPercentage: number;
    sharepointRootUrl?: string; // The URL to the 05_Projects/Active Projects/C001 folder
    createdAt: string;
    updatedAt: string;
}

export interface ERPLedgerEntry {
    entryId: string;
    projectId: string;
    category: ERPExpenseCategory;
    amount: number;
    type: 'DEBIT' | 'CREDIT'; // DEBIT = Expense, CREDIT = Revenue
    vendorId?: string;
    description: string;
    date: string;
    timestamp: number;
    recordedBy: string;
}

export interface ERPLedgerSummary {
    totalRevenue: number; // Sum of CREDIT entries (PO + Additional Billing)
    vendorCost: number;
    materialCost: number;
    porterCost: number;
    foodCost: number;
    logisticsCost: number;
    totalExpenses: number; // Sum of all DEBIT entries
    profit: number; // Total Revenue - Total Expenses (if positive)
    loss: number; // Total Expenses - Total Revenue (if positive)
    pendingClientPayment: number; // PO Amount - Received Payments
    pendingVendorPayment: number; // Logged Vendor Cost - Vendor Payments
}

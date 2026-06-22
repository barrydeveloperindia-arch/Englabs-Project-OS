export type ERPProjectStatus = 
  | 'New Enquiry'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Approved'
  | 'PO Received'
  | 'Planning'
  | 'Procurement'
  | 'Production'
  | 'Quality Check'
  | 'Packing'
  | 'Dispatch'
  | 'Installation'
  | 'Running'
  | 'Under Progress'
  | 'On Hold'
  | 'Completed'
  | 'Closed'
  | 'Cancelled';

export type ERPExpenseCategory = 
  | 'Raw Materials'
  | 'Vendor Cost'
  | 'Labour Cost'
  | 'Sanding'
  | 'Painting'
  | 'Packing'
  | 'Installation'
  | 'Driver Charges'
  | 'Fuel'
  | 'Toll Tax'
  | 'Transportation'
  | 'Courier'
  | 'Loading Charges'
  | 'Unloading Charges'
  | 'Porter Charges'
  | 'Material Shifting Cost'
  | 'Tea Expenses'
  | 'Pantry Expenses'
  | 'Staff Meals'
  | 'Site Food Expenses'
  | 'Driver Food Expenses'
  | 'Porter Food Expenses'
  | 'Guest Hospitality'
  | 'Hotel Expenses'
  | 'Travel Expenses'
  | 'Site Visit Expenses'
  | 'Miscellaneous Expenses';

export interface ERPTransaction {
  id: string;
  projectId: string;
  date: string;
  department: string;
  userName: string;
  costCategory: ERPExpenseCategory;
  amount: number;
  description: string;
}

export interface ERPProject {
  id: string;
  projectName: string;
  clientId: string;
  clientName: string;
  
  // Timeline
  startDate?: string;
  completionDate?: string;

  // Financials & Documents
  enquiryReference?: string;
  quotationNumber?: string;
  poNumber?: string;
  poAmount: number;
  budgetAmount: number;
  
  // Cost tracking (Project Costing Engine)
  materialCost: number;
  vendorCost: number;
  labourCost: number;
  sandingCost: number;
  paintingCost: number;
  packingCost: number;
  porterCost: number;
  foodCost: number;
  logisticsCost: number;
  siteCost: number;
  miscellaneousCost: number;
  totalExpenses: number;
  
  // Financial Health
  revenue: number;
  profit: number;
  loss: number;
  
  // Status & Progress
  progressPercentage: number;
  status: ERPProjectStatus;
  
  // Sub-modules (simplified for beta schema)
  procurementDetails?: any[];
  materials?: any[];
  productionDetails?: any[];
  packingDetails?: any[];
  dispatchDetails?: any[];
  siteWorkDetails?: any[];
  photos?: string[];
  invoices?: any[];
  payments?: any[];
  
  // Balances
  pendingClientPayments: number;
  pendingVendorPayments: number;
  
  createdAt: string;
  updatedAt: string;
}

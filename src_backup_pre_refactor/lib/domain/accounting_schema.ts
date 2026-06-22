export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'DRAFT';

export type ExpenseCategory = 
  | 'Material' 
  | 'Labour' 
  | 'Logistics' 
  | 'Site Expenses' 
  | 'Miscellaneous';

export type MaterialSubcategory = 
  | 'ACP' 
  | 'Acrylic' 
  | 'LED' 
  | 'Paint' 
  | 'Primer' 
  | 'Metal' 
  | 'Hardware'
  | 'Other';

export type LabourSubcategory = 
  | 'Sanding' 
  | 'Painting' 
  | 'Packing' 
  | 'Installation'
  | 'Other';

export type LogisticsSubcategory = 
  | 'Driver' 
  | 'Fuel' 
  | 'Porter' 
  | 'Loading' 
  | 'Unloading' 
  | 'Courier'
  | 'Other';

export type SiteExpenseSubcategory = 
  | 'Hotel' 
  | 'Food' 
  | 'Travel' 
  | 'Site Visits'
  | 'Other';

export type MiscExpenseSubcategory = 
  | 'Emergency Purchases' 
  | 'Tool Purchases' 
  | 'Repairs'
  | 'Other';

export interface ProjectRecord {
  id: string; // e.g., C001
  projectName: string;
  clientId: string; // reference to ClientRecord
  siteLocation: string;
  poNumber: string;
  poDate: string; // ISO String
  deliveryDate: string; // ISO String
  poAmount: number; // Revenue
  
  // Outlook Extraction Details
  contactPerson?: string;
  email?: string;
  mobileNumber?: string;
  address?: string;
  city?: string;
  state?: string;

  // Calculated Fields
  totalCost: number;
  netProfit: number;
  profitPercentage: number;
  isLossProject: boolean;
  
  status: ProjectStatus;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface ClientRecord {
  id: string;
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface VendorRecord {
  id: string;
  vendorName: string;
  gstNumber: string;
  address: string;
  contactDetails: string;
  createdAt: string;
}

export interface ExpenseLedgerEntry {
  id: string;
  projectId: string; // Ref to ProjectRecord
  date: string; // ISO String
  description: string;
  category: ExpenseCategory;
  subcategory?: MaterialSubcategory | LabourSubcategory | LogisticsSubcategory | SiteExpenseSubcategory | MiscExpenseSubcategory;
  
  debit: number; // Expense
  credit: number; // Revenue/Payments received
  balance: number; // Running balance per project
  
  vendorId?: string; // Optional reference to Vendor
  invoiceNumber?: string;
  
  // Material Details (if applicable)
  materialName?: string;
  quantity?: number;
  unit?: string;
  rate?: number;

  createdAt: string;
  sourceDocumentUrl?: string; // Link to OneDrive/Email attachment
}

// Financial Info extracted from documents
export interface ExtractedFinancialInfo {
  invoiceNumber: string;
  invoiceAmount: number;
  gstAmount: number;
  totalAmount: number;
  paymentTerms: string;
}

// Full Extraction Result
export interface ExtractedDocumentData {
  documentType: 'PURCHASE_ORDER' | 'INVOICE' | 'QUOTATION' | 'DELIVERY_CHALLAN' | 'EXPENSE_RECEIPT' | 'UNKNOWN';
  projectInfo?: Partial<ProjectRecord>;
  financialInfo?: Partial<ExtractedFinancialInfo>;
  vendorInfo?: Partial<VendorRecord>;
  ledgerEntry?: Partial<ExpenseLedgerEntry>;
  confidenceScore: number;
  rawText?: string;
}

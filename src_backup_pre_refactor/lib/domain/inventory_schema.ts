// Base interface for all Firebase Documents
export interface BaseEntity {
  id: string; // Firestore Document ID
  projectId: string; // Global Link (if applicable, otherwise 'GLOBAL')
  createdBy: string;
  createdAt: string; // ISO String
  modifiedBy: string;
  modifiedAt: string; // ISO String
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  notes?: string;
}

// ----------------------------------------------------------------------
// Inventory Master (inventory_items collection)
// ----------------------------------------------------------------------
export interface InventoryItem extends BaseEntity {
  itemName: string;
  category: 'Raw Material' | 'Hardware' | 'Paint & Polish' | 'Packaging' | 'Tools' | 'Miscellaneous';
  unitOfMeasure: 'Sheets' | 'Kgs' | 'Liters' | 'Pieces' | 'Boxes' | 'Meters';
  currentStock: number;
  reorderLevel: number;
  averageUnitCost: number;
  barcodeData?: string; // Future QR Support
}

// ----------------------------------------------------------------------
// Inventory Ledger (inventory_ledger collection)
// ----------------------------------------------------------------------
export type TransactionType = 'MATERIAL_IN' | 'MATERIAL_OUT' | 'TRANSFER' | 'AUDIT';

export interface InventoryLedger extends BaseEntity {
  transactionType: TransactionType;
  itemId: string; // FK to inventory_items
  itemName: string; // Denormalized for faster querying
  vendorId?: string; // FK to vendor_master
  department?: string;
  
  quantity: number; // Positive for IN, Negative for OUT
  unitCost: number;
  totalCost: number; // quantity * unitCost
  
  batchNumber?: string; // Batch History
  warehouseLocation?: string;
}

// ----------------------------------------------------------------------
// Costing Engine Bridge
// ----------------------------------------------------------------------
// Helper type to update project costs when a Material Out occurs
export interface ProjectCostUpdate {
  projectId: string;
  costCategory: 'Material Cost' | 'Vendor Cost' | 'Labour Cost';
  amountToAdd: number;
}

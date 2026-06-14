import { db } from '@services/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

/**
 * Generic Firestore document type that includes the document ID.
 */
export type FirestoreDoc<T extends Record<string, any>> = {
  _id: string;
} & T;

/**
 * Cost totals structure used in project documents.
 */
export interface CostTotals {
  materialCost?: number;
  vendorCost?: number;
  labourCost?: number;
  porterCost?: number;
  foodCost?: number;
  miscellaneousCost?: number;
  logisticsCost?: number;
}

/**
 * Project document shape – only fields accessed by the report generators are defined.
 */
export interface ProjectDoc {
  id?: string; // Firestore doc ID fallback
  projectName?: string;
  status?: string;
  clientName?: string;
  poNumber?: string;
  poAmount?: number;
  revenueRealized?: number;
  costTotals?: CostTotals;
  budget?: number;
}

/**
 * Vendor ledger entry.
 */
export interface VendorLedgerDoc {
  vendorId?: string;
  projectId?: string;
  createdAt?: string;
  expenseType?: string;
  amount?: number;
  paymentStatus?: string;
}

/**
 * Staff related ledger entry (salary/advance/overtime).
 */
export interface StaffLedgerDoc {
  staffId?: string;
  projectId?: string;
  createdAt?: string;
  type?: string;
  amount?: number;
}

/**
 * Inventory ledger entry.
 */
export interface InventoryDoc {
  type?: string;
  createdAt?: string;
  projectId?: string;
  itemName?: string;
  quantity?: number;
  totalPrice?: number;
  createdBy?: string;
}

export interface ReportFilter {
  projectId?: string;
  startDate?: string;
  endDate?: string;
  vendorId?: string;
  staffId?: string;
  clientId?: string;
  category?: string;
  status?: string;
}

export interface ValidationMetadata {
  sourceCollection: string;
  recordCount: number;
  aggregationLogic: string;
  generatedTimestamp: string;
  generatedBy: string;
}

export interface ReportPayload {
  data: any[];
  metadata: ValidationMetadata;
}

export const REPORT_TYPES = [
  { id: 'PNL', name: 'Project Profit & Loss Report' },
  { id: 'EXPENSE_SUMMARY', name: 'Project Expense Summary Report' },
  { id: 'INV_CONSUMPTION', name: 'Inventory Consumption Report' },
  { id: 'VENDOR_EXPENSE', name: 'Vendor Expense Report' },
  { id: 'STAFF_COST', name: 'Staff Cost Report' },
  { id: 'REVENUE', name: 'Revenue Report' },
  { id: 'PENDING_PAYMENT', name: 'Pending Payment Report' },
  { id: 'PROJECT_COST_ANALYSIS', name: 'Project Wise Cost Analysis' },
  { id: 'MATERIAL_UTILIZATION', name: 'Material Utilization Report' },
  { id: 'LABOUR_COST_ANALYSIS', name: 'Labour Cost Analysis Report' }
];

export class ReportDataFetcher {
  /**
   * Generic fetcher that returns typed Firestore documents.
   */
  private static async fetchCollection<T extends Record<string, any>>(collectionName: string): Promise<FirestoreDoc<T>[]> {
    const q = query(collection(db, collectionName));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ _id: d.id, ...d.data() } as FirestoreDoc<T>));
  }

  static async fetchReport(reportId: string, filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    switch (reportId) {
      case 'PNL': return this.generatePNL(filters, userEmail);
      case 'EXPENSE_SUMMARY': return this.generateExpenseSummary(filters, userEmail);
      case 'INV_CONSUMPTION': return this.generateInventoryConsumption(filters, userEmail);
      case 'VENDOR_EXPENSE': return this.generateVendorExpense(filters, userEmail);
      case 'STAFF_COST': return this.generateStaffCost(filters, userEmail);
      case 'REVENUE': return this.generateRevenueReport(filters, userEmail);
      case 'PENDING_PAYMENT': return this.generatePendingPayment(filters, userEmail);
      case 'PROJECT_COST_ANALYSIS': return this.generateProjectCostAnalysis(filters, userEmail);
      case 'MATERIAL_UTILIZATION': return this.generateMaterialUtilization(filters, userEmail);
      case 'LABOUR_COST_ANALYSIS': return this.generateLabourCostAnalysis(filters, userEmail);
      default: throw new Error('Unknown Report Type');
    }
  }

  private static filterByDate<T extends Record<string, any>>(data: FirestoreDoc<T>[], dateField: string, startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return data;
    return data.filter(item => {
      const itemDate = (item as any)[dateField];
      if (!itemDate) return false;
      const t = new Date(itemDate).getTime();
      const s = startDate ? new Date(startDate).getTime() : 0;
      const e = endDate ? new Date(endDate).getTime() : Infinity;
      return t >= s && t <= e;
    });
  }

  private static async generatePNL(filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    let projects = await this.fetchCollection<ProjectDoc>('projects_master');
    if (filters.projectId) projects = projects.filter(p => p.id === filters.projectId);
    if (filters.status) projects = projects.filter(p => p.status === filters.status);
    if (filters.clientId) projects = projects.filter(p => p.clientName?.includes(filters.clientId as string));
    const data = projects.map(p => {
      const ct = p.costTotals ?? {};
      const matCost = ct.materialCost || 0;
      const venCost = ct.vendorCost || 0;
      const portCost = ct.porterCost || 0;
      const foodCost = ct.foodCost || 0;
      const logCost = ct.logisticsCost || 0;
      const miscCost = ct.miscellaneousCost || 0;
      const labourCost = ct.labourCost || 0;
      const totalExp = matCost + venCost + portCost + foodCost + logCost + miscCost + labourCost;
      const rev = p.revenueRealized ?? p.poAmount ?? 0;
      const profit = rev - totalExp;
      return {
        ProjectID: p.id,
        ProjectName: p.projectName,
        Status: p.status,
        TotalRevenue: rev,
        TotalExpenses: totalExp,
        NetProfit: profit,
        MarginPercent: rev > 0 ? ((profit / rev) * 100).toFixed(2) + '%' : '0%'
      };
    });
    return { data, metadata: { sourceCollection: 'projects_master', recordCount: data.length, aggregationLogic: 'revenueRealized - (sum of all costTotals)', generatedTimestamp: new Date().toISOString(), generatedBy: userEmail } };
  }

  private static async generateExpenseSummary(filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    let projects = await this.fetchCollection<ProjectDoc>('projects_master');
    if (filters.projectId) projects = projects.filter(p => p.id === filters.projectId);
    const data = projects.map(p => ({
      ProjectID: p.id,
      MaterialCost: p.costTotals?.materialCost || 0,
      VendorCost: p.costTotals?.vendorCost || 0,
      LabourCost: p.costTotals?.labourCost || 0,
      PorterCost: p.costTotals?.porterCost || 0,
      FoodCost: p.costTotals?.foodCost || 0,
      MiscCost: p.costTotals?.miscellaneousCost || 0,
      LogisticsCost: p.costTotals?.logisticsCost || 0,
      TotalExpense: (p.costTotals?.materialCost || 0) + (p.costTotals?.vendorCost || 0) + (p.costTotals?.labourCost || 0) + (p.costTotals?.porterCost || 0) + (p.costTotals?.foodCost || 0) + (p.costTotals?.miscellaneousCost || 0) + (p.costTotals?.logisticsCost || 0)
    }));
    return { data, metadata: { sourceCollection: 'projects_master', recordCount: data.length, aggregationLogic: 'Horizontal sum of costTotals fields per project', generatedTimestamp: new Date().toISOString(), generatedBy: userEmail } };
  }

  private static async generateInventoryConsumption(filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    let inv = await this.fetchCollection<InventoryDoc>('inventory_ledger');
    inv = inv.filter(i => i.type === 'OUT');
    if (filters.projectId) inv = inv.filter(i => i.projectId === filters.projectId);
    inv = this.filterByDate(inv, 'createdAt', filters.startDate, filters.endDate);
    const data = inv.map(i => ({
      TransactionID: i._id,
      Date: i.createdAt ? new Date(i.createdAt).toLocaleDateString() : 'N/A',
      ProjectID: i.projectId,
      MaterialName: i.itemName,
      QuantityConsumed: i.quantity,
      Value: i.totalPrice || 0,
      IssuedBy: i.createdBy
    }));
    return { data, metadata: { sourceCollection: 'inventory_ledger', recordCount: data.length, aggregationLogic: 'Filtered by type="OUT", strictly appended transactions', generatedTimestamp: new Date().toISOString(), generatedBy: userEmail } };
  }

  private static async generateVendorExpense(filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    let vLedger = await this.fetchCollection<VendorLedgerDoc>('vendor_ledger');
    if (filters.vendorId) vLedger = vLedger.filter(v => v.vendorId === filters.vendorId);
    if (filters.projectId) vLedger = vLedger.filter(v => v.projectId === filters.projectId);
    vLedger = this.filterByDate(vLedger, 'createdAt', filters.startDate, filters.endDate);
    const data = vLedger.map(v => ({
      TransactionID: v._id,
      Date: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A',
      VendorID: v.vendorId,
      ProjectID: v.projectId,
      ExpenseCategory: v.expenseType,
      Amount: v.amount,
      Status: v.paymentStatus
    }));
    return { data, metadata: { sourceCollection: 'vendor_ledger', recordCount: vLedger.length, aggregationLogic: 'Direct extraction of immutable vendor transactions', generatedTimestamp: new Date().toISOString(), generatedBy: userEmail } };
  }

  private static async generateStaffCost(filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    const salary = await this.fetchCollection<StaffLedgerDoc>('salary_ledger');
    const advance = await this.fetchCollection<StaffLedgerDoc>('advance_ledger');
    const overtime = await this.fetchCollection<StaffLedgerDoc>('overtime_ledger');
    let combined = [...salary, ...advance, ...overtime];
    if (filters.staffId) combined = combined.filter(c => c.staffId === filters.staffId);
    if (filters.projectId) combined = combined.filter(c => c.projectId === filters.projectId);
    combined = this.filterByDate(combined, 'createdAt', filters.startDate, filters.endDate);
    const data = combined.map(c => ({
      TransactionID: c._id,
      Date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A',
      StaffID: c.staffId,
      ProjectID: c.projectId,
      Type: c.type,
      Amount: c.amount
    }));
    return { data, metadata: { sourceCollection: 'salary_ledger, advance_ledger, overtime_ledger', recordCount: data.length, aggregationLogic: 'Union of all HR financial immutable ledgers', generatedTimestamp: new Date().toISOString(), generatedBy: userEmail } };
  }

  private static async generateRevenueReport(filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    let projects = await this.fetchCollection<ProjectDoc>('projects_master');
    if (filters.projectId) projects = projects.filter(p => p.id === filters.projectId);
    const data = projects.map(p => ({
      ProjectID: p.id,
      ClientName: p.clientName,
      PO_Number: p.poNumber,
      PO_Amount: p.poAmount || 0,
      RevenueRealized: p.revenueRealized || 0,
      PendingMilestoneAmount: (p.poAmount || 0) - (p.revenueRealized || 0),
      Status: p.status
    }));
    return { data, metadata: { sourceCollection: 'projects_master', recordCount: data.length, aggregationLogic: 'poAmount minus revenueRealized', generatedTimestamp: new Date().toISOString(), generatedBy: userEmail } };
  }

  private static async generatePendingPayment(filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    let vLedger = await this.fetchCollection<VendorLedgerDoc>('vendor_ledger');
    vLedger = vLedger.filter(v => v.paymentStatus === 'PENDING' || v.paymentStatus === 'PARTIAL');
    if (filters.vendorId) vLedger = vLedger.filter(v => v.vendorId === filters.vendorId);
    if (filters.projectId) vLedger = vLedger.filter(v => v.projectId === filters.projectId);
    const data = vLedger.map(v => ({
      TransactionID: v._id,
      Date: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A',
      VendorID: v.vendorId,
      ProjectID: v.projectId,
      AmountDue: v.amount,
      Status: v.paymentStatus
    }));
    return { data, metadata: { sourceCollection: 'vendor_ledger', recordCount: data.length, aggregationLogic: 'Filtered vendor_ledger by PENDING or PARTIAL status', generatedTimestamp: new Date().toISOString(), generatedBy: userEmail } };
  }

  private static async generateProjectCostAnalysis(filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    let projects = await this.fetchCollection<ProjectDoc>('projects_master');
    if (filters.projectId) projects = projects.filter(p => p.id === filters.projectId);
    const data = projects.map(p => {
      const ct = p.costTotals ?? {};
      const totalExp = (ct.materialCost || 0) + (ct.vendorCost || 0) + (ct.labourCost || 0) + (ct.porterCost || 0) + (ct.foodCost || 0) + (ct.miscellaneousCost || 0) + (ct.logisticsCost || 0);
      const budget = p.budget || 0;
      return {
        ProjectID: p.id,
        Budget: budget,
        TotalExpense: totalExp,
        Variance: budget - totalExp,
        BudgetConsumedPct: budget > 0 ? ((totalExp / budget) * 100).toFixed(2) + '%' : '0%'
      };
    });
    return { data, metadata: { sourceCollection: 'projects_master', recordCount: data.length, aggregationLogic: 'Total Expenses compared against declared Project Budget', generatedTimestamp: new Date().toISOString(), generatedBy: userEmail } };
  }

  private static async generateMaterialUtilization(filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    let inv = await this.fetchCollection<InventoryDoc>('inventory_ledger');
    if (filters.projectId) inv = inv.filter(i => i.projectId === filters.projectId);
    inv = this.filterByDate(inv, 'createdAt', filters.startDate, filters.endDate);
    const summary: Record<string, { IN: number; OUT: number }> = {};
    inv.forEach(i => {
      const name = i.itemName || 'Unknown';
      if (!summary[name]) summary[name] = { IN: 0, OUT: 0 };
      if (i.type === 'IN') summary[name].IN += Number(i.quantity || 0);
      if (i.type === 'OUT') summary[name].OUT += Number(i.quantity || 0);
    });
    const data = Object.keys(summary).map(key => ({
      MaterialName: key,
      TotalInward: summary[key].IN,
      TotalConsumed: summary[key].OUT,
      NetBalance: summary[key].IN - summary[key].OUT,
      UtilizationPct: summary[key].IN > 0 ? ((summary[key].OUT / summary[key].IN) * 100).toFixed(2) + '%' : '0%'
    }));
    return { data, metadata: { sourceCollection: 'inventory_ledger', recordCount: data.length, aggregationLogic: 'Grouped by Item Name, aggregating IN and OUT transaction volumes', generatedTimestamp: new Date().toISOString(), generatedBy: userEmail } };
  }

  private static async generateLabourCostAnalysis(filters: ReportFilter, userEmail: string): Promise<ReportPayload> {
    const combined = [
      ...(await this.fetchCollection<StaffLedgerDoc>('salary_ledger')),
      ...(await this.fetchCollection<StaffLedgerDoc>('advance_ledger')),
      ...(await this.fetchCollection<StaffLedgerDoc>('overtime_ledger'))
    ];
    let filtered = combined;
    if (filters.projectId) {
      filtered = filtered.filter(c => c.projectId === filters.projectId);
    }
    filtered = this.filterByDate(filtered, 'createdAt', filters.startDate, filters.endDate);
    const summary: Record<string, { Base: number; Advance: number; Overtime: number }> = {};
    filtered.forEach(c => {
      const pid = c.projectId || 'GLOBAL';
      if (!summary[pid]) summary[pid] = { Base: 0, Advance: 0, Overtime: 0 };
      if (c.type === 'SALARY') summary[pid].Base += Number(c.amount || 0);
      if (c.type === 'ADVANCE') summary[pid].Advance += Number(c.amount || 0);
      if (c.type === 'OVERTIME') summary[pid].Overtime += Number(c.amount || 0);
    });
    const data = Object.keys(summary).map(key => ({
      ProjectID: key,
      TotalBaseSalary: summary[key].Base,
      TotalAdvances: summary[key].Advance,
      TotalOvertime: summary[key].Overtime,
      TotalLabourCost: summary[key].Base + summary[key].Advance + summary[key].Overtime
    }));
    return { data, metadata: { sourceCollection: 'salary_ledger, advance_ledger, overtime_ledger', recordCount: data.length, aggregationLogic: 'Grouped by Project ID mapping payload Types to cost buckets', generatedTimestamp: new Date().toISOString(), generatedBy: userEmail } };
  }
}

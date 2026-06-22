export type UserRole = 
  | 'Super Admin' 
  | 'Admin' 
  | 'ADMIN'
  | 'STAFF'
  | 'Project Manager' 
  | 'Engineer' 
  | 'Surveyor' 
  | 'HR' 
  | 'Accountant' 
  | 'Store Manager' 
  | 'Viewer';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    department?: string;
    status: 'Active' | 'Inactive' | 'Suspended';
    createdAt: string;
    lastLogin?: string;
}

export interface Client {
    id: string;
    name: string;
    location: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    createdAt: string;
}

export interface Project {
    id: string;
    clientId: string;
    name: string;
    status: 'Pending' | 'Active' | 'Completed' | 'On Hold';
    budget?: number;
    value?: number;
    startDate: string;
    endDate?: string;
    assignedManagerId?: string;
    createdAt: string;
}

export interface Attendance {
    id: string;
    userId: string;
    date: string;
    status: 'Present' | 'Absent' | 'Leave' | 'Half Day';
    remarks?: string;
}

export interface CheckInOut {
    id: string;
    userId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    locationIn?: string;
    locationOut?: string;
    status: 'Valid' | 'Flagged';
}

export interface FoodEntry {
    id: string;
    requesterId: string;
    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    quantity: number;
    date: string;
    status: 'Pending' | 'Approved' | 'Delivered' | 'Rejected';
    remarks?: string;
}

export interface PorterEntry {
    id: string;
    requesterId: string;
    taskDescription: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed';
    assignedPorterId?: string;
    createdAt: string;
}

export interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    location: string;
    lastUpdated: string;
}

export interface Vendor {
    id: string;
    name: string;
    category: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    rating?: number;
}

export interface Vehicle {
    id: string;
    registrationNumber: string;
    type: string;
    make: string;
    model: string;
    status: 'Available' | 'In Use' | 'Maintenance';
    assignedDriverId?: string;
}

export interface Expense {
    id: string;
    projectId?: string;
    submittedById: string;
    amount: number;
    category: string;
    date: string;
    receiptUrl?: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
}

export interface Invoice {
    id: string;
    projectId: string;
    clientId: string;
    amount: number;
    issueDate: string;
    dueDate: string;
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
}

export interface Document {
    id: string;
    projectId?: string;
    name: string;
    fileUrl: string;
    type: string;
    uploadedById: string;
    uploadDate: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    type: 'Alert' | 'Message' | 'System';
}

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    role: string;
    module: string;
    actionType: string;
    timestamp: string;
    details?: string;
    beforeState?: any;
    afterState?: any;
}

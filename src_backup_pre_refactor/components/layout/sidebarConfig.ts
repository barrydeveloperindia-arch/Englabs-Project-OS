import { 
    Activity, 
    Layers, 
    Map, 
    Box, 
    Truck, 
    Users, 
    DollarSign, 
    Settings,
    FileText,
    Utensils,
    Briefcase
} from 'lucide-react';
import React from 'react';

export interface SubMenuItem {
    id: string;
    label: string;
}

export interface MainMenuItem {
    id: string;
    label: string;
    icon: any; // We'll map this in the component
    iconName: string;
    subItems: SubMenuItem[];
}

export interface MenuGroup {
    groupName: string;
    menus: MainMenuItem[];
}

export const sidebarConfig: MenuGroup[] = [
    {
        groupName: "COMMAND CENTER",
        menus: [
            {
                id: "DASHBOARD",
                label: "Dashboard",
                iconName: "Activity",
                subItems: [
                    { id: "DASHBOARD_EXECUTIVE", label: "Executive Dashboard" },
                    { id: "DASHBOARD_ANALYTICS", label: "Project Analytics" },
                    { id: "DASHBOARD_REVENUE", label: "Revenue Overview" },
                    { id: "DASHBOARD_PROFIT", label: "Profit Overview" },
                    { id: "DASHBOARD_DAILY", label: "Daily Activities" },
                    { id: "DASHBOARD_NOTIFICATIONS", label: "Notifications" },
                    { id: "DASHBOARD_CALENDAR", label: "Calendar" },
                    { id: "DASHBOARD_KPI", label: "KPI Monitoring" }
                ]
            },
            {
                id: "REPORTS",
                label: "Reports",
                iconName: "FileText",
                subItems: [
                    { id: "REPORTS_DAILY", label: "Daily Reports" },
                    { id: "REPORTS_WEEKLY", label: "Weekly Reports" },
                    { id: "REPORTS_MONTHLY", label: "Monthly Reports" },
                    { id: "REPORTS_PROJECT", label: "Project Reports" },
                    { id: "REPORTS_MATERIAL", label: "Material Reports" },
                    { id: "REPORTS_VENDOR", label: "Vendor Reports" },
                    { id: "REPORTS_FINANCIAL", label: "Financial Reports" },
                    { id: "REPORTS_SURVEY", label: "Survey Reports" },
                    { id: "REPORTS_CUSTOM", label: "Custom Reports" }
                ]
            }
        ]
    },
    {
        groupName: "ENGINEERING & PROJECTS",
        menus: [
            {
                id: "PROJECTS",
                label: "Projects",
                iconName: "Layers",
                subItems: [
                    { id: "PROJECTS_COMMAND_CENTER", label: "Project Command Center" },
                    { id: "PROJECTS_CUSTOMER_MASTER", label: "Customer Master" },
                    { id: "PROJECTS_QUOTATION", label: "Quotation Management" },
                    { id: "PROJECTS_CLIENT_PO", label: "Client Purchase Orders" },
                    { id: "PROJECTS_VENDOR_PO", label: "Vendor Purchase Orders" },
                    { id: "PROJECTS_MASTER", label: "Project Master" },
                    { id: "PROJECTS_RUNNING", label: "Running Projects" },
                    { id: "PROJECTS_COMPLETED", label: "Completed Projects" },
                    { id: "PROJECTS_DELAYED", label: "Delayed Projects" },
                    { id: "PROJECTS_ARCHIVED", label: "Archived Projects" },
                    { id: "PROJECTS_TIMELINE", label: "Project Timeline" },
                    { id: "PROJECTS_SCHEDULING", label: "Project Scheduling" },
                    { id: "PROJECTS_TASK", label: "Task Management" },
                    { id: "PROJECTS_MATERIAL_MGMT", label: "Material Management" },
                    { id: "PROJECTS_MATERIAL_REQ", label: "Material Requirements" },
                    { id: "PROJECTS_MATERIAL_CONS", label: "Material Consumption" },
                    { id: "PROJECTS_MATERIAL_COST", label: "Material Costing" },
                    { id: "PROJECTS_VENDOR_MGMT", label: "Vendor Management" },
                    { id: "PROJECTS_VENDOR_QUOTE", label: "Vendor Quotations" },
                    { id: "PROJECTS_VENDOR_COMP", label: "Vendor Comparison" },
                    { id: "PROJECTS_VENDOR_TRACK", label: "Vendor Tracking" },
                    { id: "PROJECTS_DISPATCH_MGMT", label: "Dispatch Management" },
                    { id: "PROJECTS_COURIER", label: "Courier Tracking" },
                    { id: "PROJECTS_LOGISTICS", label: "Logistics Tracking" },
                    { id: "PROJECTS_QC", label: "QC Inspection" },
                    { id: "PROJECTS_QC_REPORTS", label: "Quality Reports" },
                    { id: "PROJECTS_INVOICE", label: "Invoice Register" },
                    { id: "PROJECTS_PROFITABILITY", label: "Project Profitability" },
                    { id: "PROJECTS_LOSS_PROFIT", label: "Loss & Profit Analysis" },
                    { id: "PROJECTS_DOC_CENTER", label: "Document Center" },
                    { id: "PROJECTS_CAD", label: "CAD Drawings" },
                    { id: "PROJECTS_SURVEY_FILES", label: "Survey Files" },
                    { id: "PROJECTS_PHOTOS", label: "Photos" },
                    { id: "PROJECTS_REPORTS", label: "Reports" },
                    { id: "PROJECTS_ATTACHMENTS", label: "Project Attachments" }
                ]
            }
        ]
    },
    {
        groupName: "SURVEY OPERATIONS",
        menus: [
            {
                id: "SPECIAL_BUSINESS_MODULES",
                label: "Special Business Modules",
                iconName: "Map",
                subItems: [
                    { id: "SURVEY_DGPS", label: "DGPS Survey Management" },
                    { id: "SURVEY_DRONE", label: "Drone Survey Management" },
                    { id: "SURVEY_GPR", label: "GPR Survey Management" },
                    { id: "SURVEY_UTILITY", label: "Utility Mapping" },
                    { id: "SURVEY_TOPO", label: "Topographic Survey" },
                    { id: "SURVEY_GIS", label: "GIS Deliverables" },
                    { id: "SURVEY_CAD", label: "CAD Deliverables" },
                    { id: "SURVEY_DRAWINGS", label: "Engineering Drawings" },
                    { id: "SURVEY_REPORTS", label: "Survey Reports" }
                ]
            }
        ]
    },
    {
        groupName: "INVENTORY & SUPPLY CHAIN",
        menus: [
            {
                id: "STORE",
                label: "Store",
                iconName: "Box",
                subItems: [
                    { id: "STORE_MASTER", label: "Material Master" },
                    { id: "STORE_DASHBOARD", label: "Inventory Dashboard" },
                    { id: "STOCK_REPORT", label: "Stock Register" },
                    { id: "STORE_INWARD", label: "Material Inward" },
                    { id: "STORE_OUTWARD", label: "Material Outward" },
                    { id: "STORE_ASSET", label: "Asset Register" },
                    { id: "STORE_AUDIT", label: "Stock Audit" },
                    { id: "STORE_LOW_STOCK", label: "Low Stock Alerts" },
                    { id: "STORE_WAREHOUSE", label: "Warehouse Management" }
                ]
            },
            {
                id: "FOOD",
                label: "Food",
                iconName: "Utensils",
                subItems: [
                    { id: "FOOD_MEALS", label: "Staff Meals" },
                    { id: "FOOD_PANTRY", label: "Pantry Inventory" },
                    { id: "FOOD_REFRESHMENT", label: "Refreshment Expenses" },
                    { id: "FOOD_REPORTS", label: "Monthly Consumption Reports" }
                ]
            }
        ]
    },
    {
        groupName: "LOGISTICS & FLEET",
        menus: [
            {
                id: "PORTER_SERVICE",
                label: "Porter Service",
                iconName: "Truck",
                subItems: [
                    { id: "PORTER_DISPATCH", label: "Dispatch Requests" },
                    { id: "PORTER_COURIER", label: "Courier Tracking" },
                    { id: "PORTER_VEHICLE", label: "Vehicle Tracking" },
                    { id: "PORTER_DRIVER", label: "Driver Records" },
                    { id: "PORTER_DELIVERY", label: "Delivery Status" },
                    { id: "PORTER_ANALYTICS", label: "Logistics Analytics" }
                ]
            }
        ]
    },
    {
        groupName: "HUMAN CAPITAL (HR)",
        menus: [
            {
                id: "HR_TEAM",
                label: "HR Team Management",
                iconName: "Users",
                subItems: [
                    { id: "HR_MASTER", label: "Employee Master" },
                    { id: "ATTENDANCE", label: "Attendance Management" },
                    { id: "HR_LEAVE", label: "Leave Management" },
                    { id: "HR_PAYROLL", label: "Payroll" },
                    { id: "HR_PERFORMANCE", label: "Performance Tracking" },
                    { id: "HR_IDCARD", label: "ID Card Records" },
                    { id: "HR_ALLOCATION", label: "Team Allocation" },
                    { id: "HR_LOGS", label: "Activity Logs" }
                ]
            }
        ]
    },
    {
        groupName: "FINANCE & LEDGER",
        menus: [
            {
                id: "ACCOUNTS",
                label: "Accounts",
                iconName: "DollarSign",
                subItems: [
                    { id: "ACCOUNTS_INVOICES", label: "Customer Invoices" },
                    { id: "ACCOUNTS_BILLS", label: "Vendor Bills" },
                    { id: "ACCOUNTS_RECEIVABLES", label: "Receivables" },
                    { id: "ACCOUNTS_PAYABLES", label: "Payables" },
                    { id: "ACCOUNTS_GST", label: "GST Management" },
                    { id: "ACCOUNTS_PNL", label: "Profit & Loss" },
                    { id: "ACCOUNTS_EXPENSE", label: "Expense Register" },
                    { id: "ACCOUNTS_BANK", label: "Bank Transactions" },
                    { id: "ACCOUNTS_DASHBOARD", label: "Financial Dashboard" }
                ]
            }
        ]
    },
    {
        groupName: "ADMINISTRATION & SETTINGS",
        menus: [
            {
                id: "SETTINGS",
                label: "Settings",
                iconName: "Settings",
                subItems: [
                    { id: "SETTINGS_PROFILE", label: "Company Profile" },
                    { id: "SETTINGS_USERS", label: "User Management" },
                    { id: "SETTINGS_ROLES", label: "Role Management" },
                    { id: "SETTINGS_PERMISSIONS", label: "Permissions" },
                    { id: "SETTINGS_SECURITY", label: "Security Settings" },
                    { id: "SETTINGS_BACKUP", label: "Backup Management" },
                    { id: "SETTINGS_AUDIT", label: "Audit Logs" },
                    { id: "SETTINGS_APP", label: "Application Settings" },
                    { id: "SETTINGS_CONFIG", label: "System Configuration" }
                ]
            }
        ]
    }
];

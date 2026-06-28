import { 
    Activity, 
    Layers, 
    Box, 
    Truck, 
    Users, 
    DollarSign, 
    Settings,
    FileText,
    Utensils,
    Shield,
    Hotel
} from 'lucide-react';
import { UserRole } from '@shared/types/database.types';

export interface SubMenuItem {
    id: string;
    label: string;
    roles?: UserRole[];
}

export interface MainMenuItem {
    id: string;
    label: string;
    iconName: string;
    subItems: SubMenuItem[];
    roles?: UserRole[];
}

export interface MenuGroup {
    groupName: string;
    menus: MainMenuItem[];
    roles?: UserRole[];
}

export const sidebarConfig: MenuGroup[] = [
    {
        groupName: "COMMAND CENTER",
        roles: ['Super Admin', 'Admin', 'ADMIN', 'Project Manager', 'Engineer', 'Surveyor', 'HR', 'Accountant', 'Store Manager', 'STAFF', 'Viewer'],
        menus: [
            {
                id: "DASHBOARD",
                label: "Dashboard",
                iconName: "Activity",
                subItems: [
                    { id: "COMMAND_CENTER", label: "Executive Dashboard" },
                    { id: "EVIDENCE", label: "Digital Evidence" }
                ]
            }
        ]
    },
    {
        groupName: "ENGINEERING & PROJECTS",
        roles: ['Super Admin', 'Admin', 'ADMIN', 'Project Manager', 'Engineer', 'Viewer'],
        menus: [
            {
                id: "PROJECTS",
                label: "Projects",
                iconName: "Layers",
                subItems: [
                    { id: "PROJECT_MANAGEMENT_DASHBOARD", label: "Projects Dashboard" },
                    { id: "PROJECTS", label: "Project Directory" },
                    { id: "PROJECT_LOOKUP", label: "Project Search" },
                    { id: "PROJECT_BUDGETS", label: "Project Budgets" },
                    { id: "PROJECTS_TRACKER", label: "Projects Tracker" },
                    { id: "DAILY_STANDUP", label: "Daily Standup" },
                    { id: "PO_RELEASE", label: "PO Release" },
                    { id: "INVOICE_RELEASE", label: "Invoice Release" }
                ]
            }
        ]
    },
    {
        groupName: "INVENTORY & SUPPLY CHAIN",
        roles: ['Super Admin', 'Admin', 'ADMIN', 'Store Manager', 'STAFF', 'Engineer'],
        menus: [
            {
                id: "STORE",
                label: "Store",
                iconName: "Box",
                subItems: [
                    { id: "INVENTORY", label: "Inventory Manager", roles: ['Super Admin', 'Admin', 'ADMIN', 'Store Manager'] },
                    { id: "STORE_GUARDIAN", label: "Store Guardian", roles: ['Super Admin', 'Admin', 'ADMIN', 'Store Manager'] },
                    { id: "GATE_REGISTER", label: "Gate Register", roles: ['Super Admin', 'Admin', 'ADMIN', 'Store Manager'] }
                ]
            },
            {
                id: "REPORTS",
                label: "Reports",
                iconName: "FileText",
                subItems: [
                    { id: "STOCK_REPORT", label: "Stock Register" }
                ]
            },
            {
                id: "FOOD",
                label: "Food",
                iconName: "Utensils",
                subItems: [
                    { id: "FOOD_MEALS", label: "Staff Meals" }
                ]
            }
        ]
    },
    {
        groupName: "LOGISTICS & FLEET",
        roles: ['Super Admin', 'Admin', 'ADMIN', 'Store Manager', 'STAFF', 'Project Manager'],
        menus: [
            {
                id: "PORTER_SERVICE",
                label: "Porter Service",
                iconName: "Truck",
                subItems: [
                    { id: "PORTER_SERVICE", label: "Porter Dispatch" }
                ]
            },
            {
                id: "HOTEL_STAYS",
                label: "Hotel Stays",
                iconName: "Hotel",
                subItems: [
                    { id: "HOTEL_LOGS", label: "Hotel Stay Logs" }
                ]
            }
        ]
    },
    {
        groupName: "HUMAN CAPITAL (HR)",
        roles: ['Super Admin', 'Admin', 'ADMIN', 'HR'],
        menus: [
            {
                id: "HR_TEAM",
                label: "HR Team Management",
                iconName: "Users",
                subItems: [
                    { id: "HR_MASTER", label: "Employee Master" },
                    { id: "ATTENDANCE", label: "Attendance Management" },
                    { id: "HR_PAYROLL", label: "Payroll Terminal" },
                    { id: "HR_DOCUMENTS", label: "HR Documents" }
                ]
            }
        ]
    },
    {
        groupName: "FINANCE & LEDGER",
        roles: ['Super Admin', 'Admin', 'ADMIN', 'Accountant'],
        menus: [
            {
                id: "ACCOUNTS",
                label: "Accounts",
                iconName: "DollarSign",
                subItems: [
                    { id: "BILLING", label: "Billing Dashboard" },
                    { id: "MANAGEMENT_DASHBOARD", label: "Management Dashboard" }
                ]
            }
        ]
    },
    {
        groupName: "ADMINISTRATION & SETTINGS",
        roles: ['Super Admin', 'Admin', 'ADMIN'],
        menus: [
            {
                id: "SETTINGS",
                label: "Settings",
                iconName: "Settings",
                subItems: [
                    { id: "SETTINGS", label: "System Configuration" }
                ]
            }
        ]
    }
];


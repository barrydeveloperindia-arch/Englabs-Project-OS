import React, { useState } from 'react';
import { 
    LayoutDashboard, 
    FolderTree, 
    Users, 
    Truck, 
    Box, 
    ShoppingCart, 
    Hammer, 
    PackageSearch, 
    MapPin, 
    Utensils, 
    HardHat, 
    TrendingUp, 
    PenTool, 
    Calculator, 
    UserPlus, 
    BarChart3, 
    Files, 
    Settings,
    ArrowLeft,
    Building2,
    Briefcase,
    ChevronDown,
    ChevronRight,
    FileText,
    Folder
} from 'lucide-react';
import { ERPBetaDashboard } from '@features/erp/ERPBetaDashboard';
import { ProjectsModule } from '@features/erp/modules/ProjectsModule';
import { ClientsModule } from '@features/erp/modules/ClientsModule';
import { VendorsModule } from '@features/erp/modules/VendorsModule';
import { StoreInventoryModule } from '@features/erp/modules/StoreInventoryModule';
import { ProcurementModule } from '@features/erp/modules/ProcurementModule';
import { ProductionModule } from '@features/erp/modules/ProductionModule';
import { PackingDispatchModule } from '@features/erp/modules/PackingDispatchModule';
import { LogisticsModule } from '@features/erp/modules/LogisticsModule';
import { PorterServicesModule } from '@features/erp/modules/PorterServicesModule';
import { FoodHospitalityModule } from '@features/erp/modules/FoodHospitalityModule';
import { SiteOperationsModule } from '@features/erp/modules/SiteOperationsModule';
import { MarketingSalesModule } from '@features/erp/modules/MarketingSalesModule';
import { EngineeringSurveyModule } from '@features/erp/modules/EngineeringSurveyModule';
import { AccountsFinanceModule } from '@features/erp/modules/AccountsFinanceModule';
import { HRStaffModule } from '@features/erp/modules/HRStaffModule';
import { ReportsAnalyticsModule } from '@features/erp/modules/ReportsAnalyticsModule';
import { DocumentCenterModule } from '@features/erp/modules/DocumentCenterModule';
import { SettingsAdminModule } from '@features/erp/modules/SettingsAdminModule';
import { ERPProvider, useERPContext } from '@features/erp/context/ERPContext';
import { Switch } from '@headlessui/react';
import { AuditLogger } from '@services/audit/AuditLogger';

export type ERPModule = string;

const erpMenu = [
  {
    name: "Projects",
    icon: <FolderTree className="w-4 h-4" />,
    children: [
      { name: "Create Project", path: "/projects/create" },
      { name: "Project List", path: "/projects/list" },
      { name: "Project Dashboard", path: "/projects/dashboard" }
    ]
  },
  {
    name: "Inventory",
    icon: <Box className="w-4 h-4" />,
    children: [
      { name: "Stock IN", path: "/inventory/in" },
      { name: "Stock OUT", path: "/inventory/out" },
      { name: "Stock Ledger", path: "/inventory/ledger" }
    ]
  },
  {
    name: "HR",
    icon: <UserPlus className="w-4 h-4" />,
    children: [
      { name: "Employees", path: "/hr/employees" },
      { name: "Attendance", path: "/hr/attendance" },
      { name: "Payroll", path: "/hr/payroll" }
    ]
  },
  {
    name: "Finance",
    icon: <Calculator className="w-4 h-4" />,
    children: [
      { name: "Accounts", path: "/finance/accounts" },
      { name: "Expenses", path: "/finance/expenses" },
      { name: "Reports", path: "/finance/reports" }
    ]
  },
  {
    name: "Reports",
    icon: <BarChart3 className="w-4 h-4" />,
    children: [
      { name: "Project Reports", path: "/reports/projects" },
      { name: "Financial Reports", path: "/reports/finance" }
    ]
  },
  {
    name: "Settings",
    icon: <Settings className="w-4 h-4" />,
    children: [
      { name: "Company Profile", path: "/settings/company" },
      { name: "System Config", path: "/settings/system" }
    ]
  }
];

interface ERPBetaLayoutProps {
    onExit: () => void;
}

const ERPBetaLayoutInner: React.FC<ERPBetaLayoutProps> = ({ onExit }) => {
    const [activeModule, setActiveModule] = useState<ERPModule>('/projects/list');
    const [openFolder, setOpenFolder] = useState<string | null>('Projects');
    const { isGlobalView, setIsGlobalView, selectedProjectId, selectedProjectData } = useERPContext();

    return (
        <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans">
            {/* ERP Sidebar */}
            <aside 
                className="bg-[#0b1b29] flex flex-col shadow-2xl shrink-0 border-r border-slate-800"
                style={{ width: '280px', minWidth: '280px', maxWidth: '280px', zIndex: 50 }}
            >
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-sm tracking-tight leading-none">ENGLABS INDIA</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">ERP Command Center</p>
                        </div>
                    </div>
                    <button 
                        onClick={async () => {
                            await AuditLogger.logAuthEvent('LOGOUT');
                            onExit();
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-rose-500/20 px-3 py-2 rounded-lg transition-all w-full"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Exit to Legacy System
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-8 dark-scrollbar space-y-2">
                    <p className="px-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-4 mt-2">Core Modules</p>
                    
                    {erpMenu.map((item) => (
                        <div key={item.name} className="mb-2">
                            <button
                                onClick={() => setOpenFolder(openFolder === item.name ? null : item.name)}
                                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                                    openFolder === item.name 
                                    ? 'bg-slate-800 text-white' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {item.icon}
                                    {item.name}
                                </div>
                                {openFolder === item.name ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>

                            {openFolder === item.name && (
                                <div className="mt-1 ml-4 border-l border-slate-700 pl-2 space-y-1">
                                    {item.children.map((child) => (
                                        <button
                                            key={child.name}
                                            onClick={() => setActiveModule(child.path)}
                                            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[10px] font-bold transition-all text-left ${
                                                activeModule === child.path 
                                                ? 'bg-emerald-500/10 text-emerald-400' 
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <FileText className="w-3 h-3" />
                                            {child.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F1F5F9]">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Folder className="w-5 h-5 text-emerald-600" />
                        {activeModule.split('/').filter(Boolean).join(' / ').toUpperCase()}
                        {selectedProjectId && !isGlobalView && (
                            <span className="ml-4 px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200 uppercase tracking-widest font-black">
                                LOCK: {selectedProjectId}
                            </span>
                        )}
                    </h2>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className={`text-xs font-bold ${!isGlobalView ? 'text-slate-400' : 'text-slate-800'}`}>Global View</span>
                            <button
                                onClick={() => setIsGlobalView(!isGlobalView)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${!isGlobalView ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${!isGlobalView ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-xs font-bold ${!isGlobalView ? 'text-emerald-700' : 'text-slate-400'}`}>Project View</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {(() => {
                        if (activeModule.startsWith('/projects')) return <ProjectsModule initialView={activeModule.split('/').pop()} />;
                        if (activeModule.startsWith('/inventory')) return <StoreInventoryModule />;
                        if (activeModule.startsWith('/hr')) return <HRStaffModule />;
                        if (activeModule.startsWith('/finance')) return <AccountsFinanceModule />;
                        if (activeModule.startsWith('/reports')) return <ReportsAnalyticsModule />;
                        if (activeModule.startsWith('/settings')) return <SettingsAdminModule />;
                        
                        return <div className="text-center p-12">Module not found</div>;
                    })()}
                </div>
            </main>
        </div>
    );
};


import { ERPLogin } from '@features/erp/ERPLogin';
import { auth } from '@services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export const ERPBetaLayout: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (authLoading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (!user) {
        return <ERPLogin />;
    }

    return (
        <ERPProvider>
            <ERPBetaLayoutInner onExit={onExit} />
        </ERPProvider>
    );
};

import React from 'react';
import logo from '@/assets/englabs_logo.png';
import { 
    Layers, 
    Box, 
    Activity, 
    DollarSign, 
    Users, 
    Search, 
    Plus, 
    CheckCircle2, 
    Shield,
    Utensils,
    CreditCard,
    FileText,
    ChefHat,
    Truck,
    Lock,
    MapPin,
    TrendingUp
} from 'lucide-react';

interface SidebarButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    color?: 'emerald' | 'amber';
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ active, onClick, icon, label, color = 'emerald' }) => {
    const activeClass = color === 'emerald' 
        ? 'bg-white/10 text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.25)] scale-[1.01] relative before:content-[""] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:bg-emerald-400 before:rounded-r-full' 
        : 'bg-white/10 text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.25)] scale-[1.01] relative before:content-[""] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:bg-amber-400 before:rounded-r-full';
        
    return (
        <button 
            type="button"
            onClick={onClick}
            data-testid={`sidebar-btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] transition-all duration-300 w-full text-left ${active ? activeClass : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
            {React.cloneElement(icon as React.ReactElement, { className: 'w-4.5 h-4.5' })}
            {label}
        </button>
    );
};

export interface DesktopSidebarProps {
    currentView: string;
    setCurrentView: (view: any) => void;
    userRole: 'ADMIN' | 'STAFF' | null;
    handleLogout: () => void;
    setIsModalOpen: (isOpen: boolean) => void;
    appMode: string;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
    currentView,
    setCurrentView,
    userRole,
    handleLogout,
    setIsModalOpen,
    appMode
}) => {
    return (
        <aside 
            className="bg-[#0e4368] hidden md:flex flex-col shadow-2xl shrink-0 border-r border-slate-800 print:hidden pt-safe"
            style={{ width: '320px', minWidth: '320px', maxWidth: '320px', zIndex: 50 }}
        >
            <div className="p-8">
                <div className="flex items-center gap-4 mb-3">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl group-hover:bg-emerald-500/40 transition-all rounded-xl" />
                        <div className="relative p-1 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center w-12 h-12">
                            <img src={logo} alt="ENGLABS" className="w-10 h-10 object-contain" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-white tracking-tighter leading-none">
                            {appMode === 'STORE' ? 'ENGLABS STORE' : appMode === 'PORTER_SERVICE' ? 'PORTER SERVICE' : 'ENGLABS PROJECTS'}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">PVT LTD</span>
                    </div>
                </div>
                <p className="text-[9px] font-black text-emerald-500/80 tracking-[0.25em] uppercase pl-1">
                    {appMode === 'STORE' ? 'Enterprise Store OS' : appMode === 'PORTER_SERVICE' ? 'Porter Logistics OS' : 'Enterprise Projects OS'}
                </p>
                <div className="mt-4 pl-1">
                    {userRole === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Admin Mode
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black text-amber-400 uppercase tracking-widest">
                            <Lock className="w-3.5 h-3.5 text-amber-400" /> Staff Mode
                        </span>
                    )}
                </div>
            </div>

            {/* In the Master-Detail pattern, the sidebar ALWAYS shows the global navigation and never the project list */}
            <div className="px-6 flex flex-col gap-2.5 overflow-y-auto dark-scrollbar shrink-0 max-h-[65vh] mb-8">
                {userRole === 'ADMIN' ? (
                    <>
                        <div>
                            <p className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-4 mt-2">1. Command Center</p>
                            <SidebarButton 
                                active={currentView === 'ERP_BETA_DASHBOARD'} 
                                onClick={() => setCurrentView('ERP_BETA_DASHBOARD')} 
                                icon={<Activity className="w-4.5 h-4.5" />} 
                                label="LIVE DASHBOARD" 
                            />
                            <SidebarButton 
                                active={currentView === 'MASTER_TASK_REGISTER'} 
                                onClick={() => setCurrentView('MASTER_TASK_REGISTER')} 
                                icon={<CheckCircle2 className="w-4.5 h-4.5" />} 
                                label="MASTER TASK REGISTER" 
                            />
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-4">2. Engineering & Projects</p>
                            <SidebarButton 
                                active={currentView === 'PROJECTS'} 
                                onClick={() => setCurrentView('PROJECTS')} 
                                icon={<Layers className="w-4.5 h-4.5" />} 
                                label="PROJECT MASTER" 
                            />
                            <SidebarButton 
                                active={currentView === 'PROJECT_LOOKUP'} 
                                onClick={() => setCurrentView('PROJECT_LOOKUP')} 
                                icon={<Search className="w-4.5 h-4.5" />} 
                                label="LIFECYCLE MAPPING" 
                            />
                            <SidebarButton 
                                active={currentView === 'PROJECT_BUDGETS'} 
                                onClick={() => setCurrentView('PROJECT_BUDGETS')} 
                                icon={<DollarSign className="w-4.5 h-4.5" />} 
                                label="BUDGET & COSTING" 
                            />
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-4">3. Inventory & Supply Chain</p>
                            <SidebarButton 
                                active={currentView === 'INVENTORY'} 
                                onClick={() => setCurrentView('INVENTORY')} 
                                icon={<Box className="w-4.5 h-4.5" />} 
                                label="INVENTORY MASTER" 
                            />
                            <SidebarButton 
                                active={currentView === 'STOCK_REPORT'} 
                                onClick={() => setCurrentView('STOCK_REPORT')} 
                                icon={<FileText className="w-4.5 h-4.5" />} 
                                label="STOCK ANALYTICS REPORT" 
                            />
                            <SidebarButton 
                                active={currentView === 'STORE_GUARDIAN'} 
                                onClick={() => setCurrentView('STORE_GUARDIAN')} 
                                icon={<Shield className="w-4.5 h-4.5 text-indigo-400" />} 
                                label="STORE GUARDIAN" 
                                color="emerald"
                            />
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-4">4. Logistics & Fleet</p>
                            <SidebarButton 
                                active={currentView === 'GATE_REGISTER'} 
                                onClick={() => setCurrentView('GATE_REGISTER')} 
                                icon={<Truck className="w-4.5 h-4.5" />} 
                                label="GATE COMMAND" 
                            />
                            <SidebarButton 
                                active={currentView === 'PORTER_SERVICE'} 
                                onClick={() => setCurrentView('PORTER_SERVICE')} 
                                icon={<MapPin className="w-4.5 h-4.5 text-emerald-400" />} 
                                label="PORTER LOGISTICS" 
                                color="emerald"
                            />
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-4">5. Human Capital (HR)</p>
                            <SidebarButton 
                                active={currentView === 'ATTENDANCE'} 
                                onClick={() => alert("Attendance Module Integration Pending")} 
                                icon={<Users className="w-4.5 h-4.5" />} 
                                label="ATTENDANCE & ROSTERS" 
                            />
                            <SidebarButton 
                                active={currentView === 'FOOD_REGISTER'} 
                                onClick={() => setCurrentView('FOOD_REGISTER')} 
                                icon={<Utensils className="w-4.5 h-4.5" />} 
                                label="PANTRY CONTROL" 
                            />
                            <SidebarButton 
                                active={currentView === 'PAYROLL'} 
                                onClick={() => alert("Payroll Module Integration Pending")} 
                                icon={<CreditCard className="w-4.5 h-4.5" />} 
                                label="PAYROLL & ADVANCES" 
                            />
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-4">6. Finance & Ledger</p>
                            <SidebarButton 
                                active={currentView === 'BILLING'} 
                                onClick={() => setCurrentView('BILLING')} 
                                icon={<DollarSign className="w-4.5 h-4.5 text-emerald-400" />} 
                                label="ACCOUNTS & INVOICING" 
                                color="emerald"
                            />
                            <SidebarButton 
                                active={currentView === 'MANAGEMENT_DASHBOARD'} 
                                onClick={() => setCurrentView('MANAGEMENT_DASHBOARD')} 
                                icon={<TrendingUp className="w-4.5 h-4.5 text-emerald-400" />} 
                                label="AI ACCOUNTING" 
                                color="emerald"
                            />
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <p className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-5">Vendor Channels</p>
                            <SidebarButton 
                                active={currentView === 'SKY5_TERMINAL'} 
                                onClick={() => setCurrentView('SKY5_TERMINAL')} 
                                icon={<ChefHat className="w-4.5 h-4.5 text-amber-400" />} 
                                label="SKY-5 KITCHEN" 
                                color="amber"
                            />
                        </div>
                    </>
                ) : (
                    <SidebarButton 
                        active={currentView === 'STOCK_REPORT'} 
                        onClick={() => setCurrentView('STOCK_REPORT')} 
                        icon={<FileText className="w-4.5 h-4.5" />} 
                        label="STORE STOCK REPORT" 
                    />
                )}
            </div>

            <div className="p-6 border-t border-slate-800 shrink-0 space-y-3 mt-auto">
                {userRole === 'ADMIN' && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        data-testid="btn-new-mission"
                        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-950/20 cursor-pointer"
                    >
                        <Plus className="w-5 h-5" /> NEW MISSION
                    </button>
                )}
                <button 
                    onClick={handleLogout}
                    className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer text-xs"
                >
                    <Lock className="w-4 h-4" /> LOCK SYSTEM
                </button>
            </div>
        </aside>
    );
};

import React from 'react';
import { 
    Activity, 
    Layers, 
    Box, 
    Plus, 
    MoreHorizontal, 
    Lock, 
    FileText,
    X,
    Utensils,
    CreditCard,
    ChefHat,
    Search,
    DollarSign,
    Users,
    Truck,
    CheckCircle2
} from 'lucide-react';

interface MobileTabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    color?: 'emerald' | 'amber';
}

const MobileTabButton: React.FC<MobileTabButtonProps> = ({ active, onClick, icon, label, color = 'emerald' }) => {
    const activeColor = color === 'emerald' ? 'text-emerald-400' : 'text-amber-400';
    return (
        <button 
            type="button"
            onClick={onClick}
            data-testid={`mobile-nav-btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all"
        >
            <div className={`p-1.5 rounded-lg ${active ? 'bg-slate-800 ' + activeColor : 'text-slate-500'}`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-wider mt-1 ${active ? activeColor : 'text-slate-500'}`}>{label}</span>
        </button>
    );
};

const MobileGridButton = ({ onClick, icon, label, active, color = 'emerald' }: any) => {
    const activeColor = color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return (
        <button 
            onClick={onClick}
            data-testid={`mobile-grid-btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                active 
                ? activeColor 
                : 'bg-slate-800/40 border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
        >
            {icon}
            <span className="text-[9px] font-black uppercase tracking-wider mt-2 text-center">{label}</span>
        </button>
    );
};

export interface MobileLayoutProps {
    currentView: string;
    setCurrentView: (view: any) => void;
    userRole: 'ADMIN' | 'STAFF' | null;
    handleLogout: () => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
    currentView,
    setCurrentView,
    userRole,
    handleLogout,
    isMobileMenuOpen,
    setIsMobileMenuOpen
}) => {
    return (
        <>
            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0e4368] border-t border-slate-800 flex items-center justify-between px-2 z-50 print:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
                {userRole === 'ADMIN' ? (
                    <>
                        <MobileTabButton 
                            active={currentView === 'ERP_BETA_DASHBOARD'} 
                            onClick={() => setCurrentView('ERP_BETA_DASHBOARD')} 
                            icon={<Activity className="w-5 h-5" />} 
                            label="Dashboard" 
                        />
                        <MobileTabButton 
                            active={currentView === 'ATTENDANCE'} 
                            onClick={() => setCurrentView('ATTENDANCE')} 
                            icon={<Users className="w-5 h-5" />} 
                            label="HR" 
                        />
                        
                        {/* FAB CENTER BUTTON */}
                        <div className="relative -top-6">
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(16,185,129,0.4)] border-4 border-[#F8FAFC] transition-transform active:scale-95"
                            >
                                <Plus className="w-6 h-6 text-slate-900 font-black" />
                            </button>
                        </div>

                        <MobileTabButton 
                            active={currentView === 'PROJECTS'} 
                            onClick={() => setCurrentView('PROJECTS')} 
                            icon={<Layers className="w-5 h-5" />} 
                            label="Projects" 
                        />
                        <button 
                            type="button"
                            onClick={() => setIsMobileMenuOpen(true)}
                            data-testid="mobile-nav-btn-more"
                            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-500 hover:text-white"
                        >
                            <div className="p-1.5">
                                <MoreHorizontal className="w-5 h-5" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-wider mt-1">More</span>
                        </button>
                    </>
                ) : (
                    <>
                        <MobileTabButton 
                            active={currentView === 'STOCK_REPORT'} 
                            onClick={() => setCurrentView('STOCK_REPORT')} 
                            icon={<FileText className="w-5 h-5" />} 
                            label="Store" 
                        />
                        <button 
                            type="button"
                            onClick={handleLogout}
                            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-rose-400 hover:text-rose-350"
                        >
                            <div className="p-1.5">
                                <Lock className="w-5 h-5" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-wider mt-1">Lock</span>
                        </button>
                    </>
                )}
            </nav>

            {/* MOBILE MORE SHEET MODAL */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden flex items-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="relative w-full max-h-[85vh] overflow-y-auto dark-scrollbar bg-[#0e4368] rounded-t-[2.5rem] border-t border-slate-800 p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">More Operations</h3>
                                <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Englabs Administrative Control</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                data-testid="btn-close-more-sheet"
                                className="p-2 bg-slate-850 rounded-full text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 py-2">
                            <MobileGridButton 
                                onClick={() => { setCurrentView('BILLING'); setIsMobileMenuOpen(false); }} 
                                icon={<DollarSign className="w-6 h-6" />} 
                                label="Accounts" 
                                active={currentView === 'BILLING'}
                            />
                            <MobileGridButton 
                                onClick={() => { setCurrentView('INVENTORY'); setIsMobileMenuOpen(false); }} 
                                icon={<Box className="w-6 h-6" />} 
                                label="Reports" 
                                active={currentView === 'INVENTORY'}
                            />
                            <MobileGridButton 
                                onClick={() => { setCurrentView('PORTER_SERVICE'); setIsMobileMenuOpen(false); }} 
                                icon={<Truck className="w-6 h-6" />} 
                                label="Porter" 
                                active={currentView === 'PORTER_SERVICE'}
                            />
                            <MobileGridButton 
                                onClick={() => { setCurrentView('STOCK_REPORT'); setIsMobileMenuOpen(false); }} 
                                icon={<FileText className="w-6 h-6" />} 
                                label="Store" 
                                active={currentView === 'STOCK_REPORT'}
                            />
                            <MobileGridButton 
                                onClick={() => { setCurrentView('FOOD_REGISTER'); setIsMobileMenuOpen(false); }} 
                                icon={<Utensils className="w-6 h-6" />} 
                                label="Food" 
                                active={currentView === 'FOOD_REGISTER'}
                            />
                            <MobileGridButton 
                                onClick={() => { setCurrentView('SETTINGS'); setIsMobileMenuOpen(false); }} 
                                icon={<CheckCircle2 className="w-6 h-6" />} 
                                label="Settings" 
                                active={currentView === 'SETTINGS'}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

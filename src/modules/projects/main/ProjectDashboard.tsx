import React from 'react';
import { ProjectData } from '@shared/services/project';
import { 
    Clock, 
    Shield, 
    Lock, 
    Activity, 
    CheckCircle2, 
    Users, 
    Box, 
    ArrowDownRight,
    ArrowLeft,
    Plus
} from 'lucide-react';
import logo from '@/assets/englabs_logo.png';

interface ProjectDashboardProps {
    selectedProject: ProjectData;
    onBack: () => void;
    userRole: string | null;
    updateStage: (stageName: string, newStatus: any) => void;
    recentCheckouts: any[];
    handleCheckoutSubmit: (e: React.FormEvent) => void;
    checkoutItemCode: string;
    setCheckoutItemCode: (code: string) => void;
    inventoryItems: any[];
    checkoutQty: number;
    setCheckoutQty: (qty: number) => void;
    checkoutStaffName: string;
    setCheckoutStaffName: (name: string) => void;
    staffList: string[];
    setIsAddStaffModalOpen: (isOpen: boolean) => void;
    checkoutLoading: boolean;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
    selectedProject,
    onBack,
    userRole,
    updateStage,
    recentCheckouts,
    handleCheckoutSubmit,
    checkoutItemCode,
    setCheckoutItemCode,
    inventoryItems,
    checkoutQty,
    setCheckoutQty,
    checkoutStaffName,
    setCheckoutStaffName,
    staffList,
    setIsAddStaffModalOpen,
    checkoutLoading
}) => {
    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
            <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-10 shrink-0 pt-safe">
                <div className="flex items-center gap-3 md:gap-6">
                    <button 
                        onClick={onBack}
                        className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-sm md:text-lg font-black text-slate-900 leading-none">Mission Control</h1>
                        <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Oversight Matrix</span>
                    </div>
                    <div className="h-6 md:h-8 w-px bg-slate-100 hidden md:block"></div>
                    <div className="items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 hidden md:flex">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-6">
                    {userRole === 'ADMIN' ? (
                        <span className="hidden md:flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                            <Shield className="w-3 h-3 text-emerald-500" /> Admin Mode
                        </span>
                    ) : (
                        <span className="hidden md:flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-[9px] font-black text-amber-600 uppercase tracking-widest">
                            <Lock className="w-3 h-3 text-amber-500" /> Staff Mode
                        </span>
                    )}
                    <div className="flex gap-2.5 md:gap-4 items-center">
                        <div className="text-right hidden sm:block">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase">GAURAV PANCHAL</p>
                            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">PROJECT HEAD</p>
                        </div>
                        <img src={logo} alt="GP" className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center border-2 border-slate-100 p-1" />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto flex flex-col gap-6 md:gap-8">
                    
                    {/* HERO CARD */}
                    <div className="bg-white p-5 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center">
                        <div>
                            <div className="flex items-center gap-2.5 md:gap-3 mb-3 md:mb-4">
                                <span className="bg-[#0e4368] text-emerald-500 text-[8px] md:text-[10px] font-black px-2.5 py-1.5 rounded-lg tracking-widest uppercase">{selectedProject.projectId}</span>
                                <span className="text-slate-400 font-black text-[8px] md:text-[10px] uppercase tracking-widest">In-Orbit Dynamics</span>
                            </div>
                            <h2 className="text-xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight md:leading-none">{selectedProject.client}</h2>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contract Valuation</p>
                            <p className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter">₹{selectedProject.planning.value.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {/* SPLIT SECTION */}
                    <div className="flex flex-col xl:flex-row gap-6 md:gap-8">
                        
                        {/* PIPELINE (LEFT) */}
                        <div className="flex-1 flex flex-col gap-6 md:gap-8">
                            <div className="bg-white p-5 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-6 md:mb-8 tracking-tight flex items-center gap-3">
                                    <Activity className="w-5.5 h-5.5 text-emerald-500" /> Production Pipeline
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {selectedProject.production.stages.map((stage, idx) => (
                                        <div 
                                            key={stage.name} 
                                            className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer group flex flex-col justify-between h-48 ${
                                                stage.status === 'Completed' ? 'bg-emerald-50/30 border-emerald-100' :
                                                stage.status === 'In Progress' ? 'bg-blue-50/30 border-blue-200' :
                                                'bg-slate-50 border-transparent hover:border-slate-200'
                                            }`}
                                            onClick={() => updateStage(stage.name, stage.status === 'Pending' ? 'In Progress' : stage.status === 'In Progress' ? 'Completed' : 'Pending')}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                                                    stage.status === 'Completed' ? 'bg-emerald-500 text-slate-900' :
                                                    stage.status === 'In Progress' ? 'bg-blue-500 text-white' :
                                                    'bg-slate-200 text-slate-400'
                                                }`}>
                                                    {stage.status === 'Completed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{stage.status}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm leading-tight mb-3">{stage.name}</h4>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase truncate">{stage.lead || "Pending Assignment"}</span>
                                                    </div>
                                                    {stage.timeTaken && (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3 h-3 text-slate-400" />
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{stage.timeTaken}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* TODAY'S MATERIAL ISSUED */}
                            <div className="bg-white p-5 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] flex flex-col gap-6">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                                <Box className="w-5.5 h-5.5 text-amber-500" /> Today's Material Issued
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Operations Release Registry</p>
                                        </div>
                                        <span className="bg-slate-100 rounded-xl px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                                            {recentCheckouts.filter(tx => new Date(tx.timestamp).toDateString() === new Date().toDateString()).length} Items
                                        </span>
                                    </div>

                                    {recentCheckouts.filter(tx => new Date(tx.timestamp).toDateString() === new Date().toDateString()).length === 0 ? (
                                        <div className="p-16 text-center text-slate-300 flex flex-col items-center gap-3">
                                            <Clock className="w-12 h-12 opacity-30" />
                                            <p className="font-black text-sm uppercase tracking-widest">No Materials Issued Today</p>
                                            <p className="text-xs text-slate-400 max-w-xs">Items checked out via the side panel will instantly appear here in real-time.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">
                                                        <th className="pb-4 pr-4">Item Identity</th>
                                                        <th className="pb-4 px-4 text-center">Quantity</th>
                                                        <th className="pb-4 px-4">Staff Member</th>
                                                        <th className="pb-4 pl-4 text-right">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 text-xs">
                                                    {recentCheckouts.filter(tx => new Date(tx.timestamp).toDateString() === new Date().toDateString()).map((tx) => (
                                                        <tr key={tx.id} className="group hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-4 pr-4">
                                                            <p className="font-black text-slate-900">{(tx.itemId || '').replace(/_/g, ' ')}</p>
                                                                <p className="text-[8px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">{tx.itemId}</p>
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                                                    -{tx.quantity} {tx.unit || 'Nos'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 font-bold text-slate-700 uppercase">
                                                                {tx.partyName}
                                                            </td>
                                                            <td className="py-4 pl-4 text-right font-medium text-slate-400">
                                                                {new Date(tx.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* INTEL (RIGHT) */}
                        <div className="w-full xl:w-[400px] flex flex-col gap-6 md:gap-8">
                            {/* LIVE CHECK-OUT PANEL */}
                            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[1.75rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col gap-6 shrink-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                                
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Check-Out Panel
                                        </h3>
                                        <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-black text-emerald-400 uppercase tracking-wider">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Live
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Store Inventory Release Center</p>
                                </div>

                                {/* QUICK FORM */}
                                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Select Item</label>
                                        <select 
                                            value={checkoutItemCode} 
                                            onChange={(e) => setCheckoutItemCode(e.target.value)}
                                            required 
                                            className="w-full bg-slate-800 border border-slate-700/50 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
                                        >
                                            <option value="">-- Select Material --</option>
                                            {inventoryItems.map((item) => (
                                                <option key={item.itemCode} value={item.itemCode}>
                                                    [{item.itemCode}] {item.name} ({item.currentStock} {item.unit} left)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={checkoutQty} 
                                                onChange={(e) => setCheckoutQty(parseInt(e.target.value) || 1)}
                                                required 
                                                className="w-full bg-slate-800 border border-slate-700/50 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Staff Name</label>
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsAddStaffModalOpen(true)}
                                                    className="text-[8px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest flex items-center gap-0.5 transition-all"
                                                >
                                                    <Plus className="w-3 h-3" /> New Staff
                                                </button>
                                            </div>
                                            <select 
                                                value={checkoutStaffName} 
                                                onChange={(e) => setCheckoutStaffName(e.target.value)}
                                                required 
                                                className="w-full bg-slate-800 border border-slate-700/50 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
                                            >
                                                <option value="">-- Staff --</option>
                                                {staffList.map((name) => (
                                                    <option key={name} value={name}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={checkoutLoading}
                                        className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-xl hover:bg-emerald-400 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50 mt-2 shadow-lg shadow-emerald-500/10"
                                    >
                                        {checkoutLoading ? 'Processing...' : 'CHECK OUT'}
                                    </button>
                                </form>

                                {/* MINI RECENT TICKER */}
                                <div className="border-t border-slate-800/80 pt-4">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">Live Checkout Feed</span>
                                    {recentCheckouts.length === 0 ? (
                                        <p className="text-[10px] font-bold text-slate-600 uppercase text-center py-4">No recent releases logged</p>
                                    ) : (
                                        <div className="space-y-2.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                                            {recentCheckouts.slice(0, 3).map((tx) => (
                                                <div key={tx.id} className="p-3 bg-slate-800/40 border border-slate-800/60 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-300">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                                            <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-black text-white truncate">{(tx.itemId || '').replace(/_/g, ' ')}</p>
                                                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate">By: {tx.partyName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[11px] font-black text-amber-400">-{tx.quantity} {tx.unit || 'Nos'}</p>
                                                        <p className="text-[8px] font-medium text-slate-500 mt-0.5">{new Date(tx.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#0e4368] p-6 md:p-10 rounded-[1.75rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex-1">
                                <div className="relative z-10">
                                    <h3 className="text-lg md:text-xl font-black text-slate-400 mb-4 md:mb-6 uppercase tracking-widest">Financial Health</h3>
                                    <div className="space-y-6 md:space-y-8">
                                        <div>
                                            <div className="flex justify-between text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-3">
                                                <span>Budget Utilization</span>
                                                <span className="text-emerald-500">{((selectedProject.planning.budget / selectedProject.planning.value) * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(selectedProject.planning.budget / selectedProject.planning.value) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div className="p-4 md:p-5 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vault Margin</p>
                                            <p className="text-xl md:text-2xl font-black text-emerald-400">₹{(selectedProject.planning.value - selectedProject.planning.budget).toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                                <h3 className="text-lg md:text-xl font-black text-slate-900 mb-4 md:mb-6 flex items-center gap-3">
                                    <Box className="w-5.5 h-5.5 text-emerald-500" /> Intelligence
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Material Integrity</p>
                                        <p className="font-bold text-slate-900 text-xs md:text-[13px]">{selectedProject.metrics.materialConsumption}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div className="p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Components</p>
                                            <p className="font-black text-emerald-500 text-lg md:text-xl">{selectedProject.metrics.totalComponents}</p>
                                        </div>
                                        <div className="p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Workforce</p>
                                            <p className="font-black text-blue-500 text-lg md:text-xl">{selectedProject.metrics.workforce?.length || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 md:gap-4 pt-2">
                                        <a href="https://in.linkedin.com/company/englabs-limited" target="_blank" rel="noreferrer" className="flex-1 bg-slate-100 p-3 md:p-4 rounded-xl flex items-center justify-center gap-2 text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200">LinkedIn</a>
                                        <a href="https://www.instagram.com/englabs_india/" target="_blank" rel="noreferrer" className="flex-1 bg-slate-100 p-3 md:p-4 rounded-xl flex items-center justify-center gap-2 text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200">Instagram</a>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                                <h3 className="text-lg md:text-xl font-black text-slate-900 mb-4 md:mb-6 flex items-center gap-3">
                                    <Users className="w-5.5 h-5.5 text-emerald-500" /> Project Team
                                </h3>
                                <div className="grid grid-cols-2 gap-2 md:gap-3">
                                    {staffList.map(name => (
                                        <div key={name} className="flex items-center gap-1.5 p-1.5 md:p-2 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[8px] md:text-[10px] font-bold text-slate-700 uppercase">{name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

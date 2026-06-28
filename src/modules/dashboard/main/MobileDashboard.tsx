import React from 'react';
import { Activity, Box, Truck, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { ProjectData } from '@shared/services/project';
import logo from '@/assets/englabs_logo.png';

interface MobileDashboardProps {
    projects: ProjectData[];
    gateEntries: any[];
    recentCheckouts: any[];
    onQuickAction: (action: 'GATE_ENTRY' | 'CHECKOUT' | 'PORTER' | 'PROJECT_UPDATE') => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({ 
    projects, 
    gateEntries, 
    recentCheckouts,
    onQuickAction
}) => {
    // Calculate daily metrics
    const todayStr = new Date().toDateString();
    
    const activeProjects = projects.filter(p => p.planning.poConfirmed && !p.production.stages.every(s => s.status === 'Completed')).length;
    
    const todaysGateEntries = gateEntries.filter(e => new Date(e.timestamp).toDateString() === todayStr).length;
    
    const todaysCheckouts = recentCheckouts.filter(c => new Date(c.timestamp).toDateString() === todayStr);
    
    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] pb-24 overflow-y-auto custom-scrollbar pt-safe">
            {/* Top Branding / Header with 3D Digital Grid */}
            <div 
                className="bg-[#0e4368] px-6 pt-10 pb-16 rounded-b-[2.5rem] relative overflow-hidden shrink-0 shadow-[0_15px_30px_rgba(14,67,104,0.15)]"
                style={{ 
                    backgroundImage: 'linear-gradient(rgba(14, 67, 104, 0.95), rgba(14, 67, 104, 0.95)), linear-gradient(0deg, transparent 24%, rgba(82, 204, 163, 0.04) 25%, rgba(82, 204, 163, 0.04) 26%, transparent 27%, transparent), linear-gradient(90deg, transparent 24%, rgba(82, 204, 163, 0.04) 25%, rgba(82, 204, 163, 0.04) 26%, transparent 27%, transparent)', 
                    backgroundSize: '100% 100%, 20px 20px, 20px 20px' 
                }}
            >
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex justify-between items-center relative z-10 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                            <img src={logo} alt="Englabs Logo" className="w-7 h-7 object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tighter uppercase font-outfit">Command Center</h1>
                            <p className="text-[9px] font-black text-[#52cca3] uppercase tracking-widest mt-0.5">Live Operations Overview</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                        <Activity className="w-5 h-5 text-[#52cca3] animate-pulse" />
                    </div>
                </div>

                {/* KPI Cards Carousel - 3D Glassmorphic Bevel Blocks */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory dark-scrollbar hide-scroll-bar">
                    <div className="snap-center shrink-0 w-[140px] bg-[#0e4368]/45 backdrop-blur-md border-t border-l border-white/20 border-b-[4px] border-r-[4px] border-slate-950/80 rounded-2xl p-4 shadow-[0_12px_24px_rgba(0,0,0,0.25),_0_0_15px_rgba(82,204,163,0.05)]">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                            <Box className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-3xl font-black text-white tracking-tight font-outfit">{activeProjects}</p>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Active Projects</p>
                    </div>
                    
                    <div className="snap-center shrink-0 w-[140px] bg-[#0e4368]/45 backdrop-blur-md border-t border-l border-white/20 border-b-[4px] border-r-[4px] border-slate-950/80 rounded-2xl p-4 shadow-[0_12px_24px_rgba(0,0,0,0.25),_0_0_15px_rgba(245,158,11,0.05)]">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
                            <Truck className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-3xl font-black text-white tracking-tight font-outfit">{todaysGateEntries}</p>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Today's Gate Log</p>
                    </div>

                    <div className="snap-center shrink-0 w-[140px] bg-[#0e4368]/45 backdrop-blur-md border-t border-l border-white/20 border-b-[4px] border-r-[4px] border-slate-950/80 rounded-2xl p-4 shadow-[0_12px_24px_rgba(0,0,0,0.25),_0_0_15px_rgba(244,63,94,0.05)]">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center mb-3">
                            <Package className="w-4 h-4 text-rose-400" />
                        </div>
                        <p className="text-3xl font-black text-white tracking-tight font-outfit">{todaysCheckouts.length}</p>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Items Released</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid - 3D Tactile Buttons */}
            <div className="px-5 -mt-8 relative z-20">
                <div className="bg-white rounded-3xl p-5 shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-slate-100">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 font-mono">Quick Deployment</h3>
                    <div className="grid grid-cols-4 gap-3">
                        <button data-testid="quick-action-gate" onClick={() => onQuickAction('GATE_ENTRY')} className="flex flex-col items-center gap-2 group transition-all duration-100">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 border-t border-l border-amber-100 border-b-[4px] border-r-[4px] border-amber-300 flex items-center justify-center transition-all duration-100 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] group-active:translate-y-[3px] group-active:translate-x-[2px] group-active:border-b-[1px] group-active:border-r-[1px] group-active:border-amber-200">
                                <Truck className="w-5 h-5 text-amber-600" />
                            </div>
                            <span className="text-[9px] font-black text-slate-500 group-hover:text-slate-800 transition-colors uppercase mt-0.5">Gate</span>
                        </button>
                        
                        <button data-testid="quick-action-inventory" onClick={() => onQuickAction('CHECKOUT')} className="flex flex-col items-center gap-2 group transition-all duration-100">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border-t border-l border-emerald-100 border-b-[4px] border-r-[4px] border-emerald-300 flex items-center justify-center transition-all duration-100 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] group-active:translate-y-[3px] group-active:translate-x-[2px] group-active:border-b-[1px] group-active:border-r-[1px] group-active:border-emerald-200">
                                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-[9px] font-black text-slate-500 group-hover:text-slate-800 transition-colors uppercase mt-0.5">Release</span>
                        </button>

                        <button data-testid="quick-action-porter" onClick={() => onQuickAction('PORTER')} className="flex flex-col items-center gap-2 group transition-all duration-100">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border-t border-l border-indigo-100 border-b-[4px] border-r-[4px] border-indigo-300 flex items-center justify-center transition-all duration-100 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)] group-active:translate-y-[3px] group-active:translate-x-[2px] group-active:border-b-[1px] group-active:border-r-[1px] group-active:border-indigo-200">
                                <Package className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="text-[9px] font-black text-slate-500 group-hover:text-slate-800 transition-colors uppercase mt-0.5">Porter</span>
                        </button>

                        <button data-testid="quick-action-update" onClick={() => onQuickAction('PROJECT_UPDATE')} className="flex flex-col items-center gap-2 group transition-all duration-100">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 border-t border-l border-blue-100 border-b-[4px] border-r-[4px] border-blue-300 flex items-center justify-center transition-all duration-100 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] group-active:translate-y-[3px] group-active:translate-x-[2px] group-active:border-b-[1px] group-active:border-r-[1px] group-active:border-blue-200">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-[9px] font-black text-slate-500 group-hover:text-slate-800 transition-colors uppercase mt-0.5">Update</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Live Feed */}
            <div className="px-6 mt-8 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" /> Activity Stream
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400">TODAY</span>
                </div>

                <div className="space-y-3">
                    {todaysCheckouts.length === 0 && todaysGateEntries === 0 ? (
                        <div className="p-8 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Activity Yet</p>
                        </div>
                    ) : (
                        <>
                            {todaysCheckouts.slice(0, 3).map((tx: any) => (
                                <div key={tx.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                                    <div className="flex items-center gap-3 min-w-0 pl-1">
                                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                            <ArrowDownRight className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-900 truncate">{(tx.itemId || '').replace(/_/g, ' ')}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">By {tx.partyName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-black text-amber-600">-{tx.quantity} {tx.unit}</p>
                                        <p className="text-[8px] font-bold text-slate-400 mt-1">{new Date(tx.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                            
                            {/* We can mix gate entries here too if we want, for now just checkouts to prove concept */}
                            {gateEntries.filter(e => new Date(e.timestamp).toDateString() === todayStr).slice(0, 2).map((entry: any) => (
                                <div key={entry.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 relative overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${entry.movementType === 'IN' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                    <div className="flex items-center gap-3 min-w-0 pl-1">
                                        <div className={`w-8 h-8 rounded-xl ${entry.movementType === 'IN' ? 'bg-emerald-50' : 'bg-rose-50'} flex items-center justify-center shrink-0`}>
                                            <Truck className={`w-4 h-4 ${entry.movementType === 'IN' ? 'text-emerald-500' : 'text-rose-500'}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-900 truncate">{entry.vehicleNo}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{entry.movementType}WARD GATE</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[8px] font-bold text-slate-400 mt-1">{new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
            
            {/* Extra padding at bottom for FAB & Navbar */}
            <div className="h-12"></div>
        </div>
    );
};
export default MobileDashboard;

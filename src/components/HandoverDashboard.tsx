import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertCircle, Clock, Zap, ListTodo, FileText, Activity } from 'lucide-react';
import handoverData from '../../data/handover_state.json';

interface HandoverProps {
    onAcknowledge: () => void;
}

const HandoverDashboard: React.FC<HandoverProps> = ({ onAcknowledge }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const isOptimal = handoverData.systemHealth === 'OPTIMAL';

    return (
        <div className="fixed inset-0 z-[100] bg-[#0e4368] text-white flex flex-col font-sans overflow-hidden">
            {/* BACKGROUND EFFECTS */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-md px-10 py-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                        <Shield className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight leading-none">SYSTEM HANDOVER</h1>
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] mt-2">Antigravity Master Protection Agent</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <p className="text-4xl font-black tracking-tighter">{currentTime.toLocaleTimeString()}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{currentTime.toLocaleDateString('en-GB', { dateStyle: 'full' })}</p>
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-10 custom-scrollbar flex justify-center">
                <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: Health & Urgent */}
                    <div className="flex flex-col gap-8">
                        <div className={`p-8 rounded-[2rem] border shadow-2xl ${isOptimal ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                {isOptimal ? <CheckCircle2 className="w-10 h-10 text-emerald-400" /> : <AlertCircle className="w-10 h-10 text-red-400" />}
                                <div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">System Health</h2>
                                    <p className={`text-3xl font-black ${isOptimal ? 'text-emerald-400' : 'text-red-400'}`}>{handoverData.systemHealth}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-bold">Last Audit Time</span>
                                    <span className="font-black text-white">{new Date(handoverData.lastAuditTime).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-bold">Databases Secured</span>
                                    <span className="font-black text-white">{handoverData.dbHealth.length} Active Nodes</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-[2rem] border border-white/10 p-8 flex-1">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-400" /> Urgent Reminders
                            </h3>
                            <ul className="space-y-4">
                                {handoverData.reminders.map((r, i) => (
                                    <li key={i} className="flex gap-3 text-sm font-bold text-slate-300">
                                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 shrink-0"></div>
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* MIDDLE COLUMN: Today's Progress */}
                    <div className="bg-white/5 rounded-[2rem] border border-white/10 p-8 lg:col-span-1 flex flex-col">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400 mb-6 flex items-center gap-3">
                            <Activity className="w-5 h-5" /> Verified Progress (Last Session)
                        </h3>
                        <div className="space-y-4 flex-1">
                            {handoverData.completedWorkToday.map((work, i) => (
                                <div key={i} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-4 items-start">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <p className="text-sm font-bold text-emerald-100">{work}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Pending Operations */}
                    <div className="bg-white/5 rounded-[2rem] border border-white/10 p-8 lg:col-span-1 flex flex-col">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400 mb-6 flex items-center gap-3">
                            <ListTodo className="w-5 h-5" /> Pending Operations
                        </h3>
                        <div className="space-y-4 flex-1">
                            {handoverData.pendingTasks.map((task, i) => (
                                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-4 items-start">
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-500 shrink-0"></div>
                                    <p className="text-sm font-bold text-slate-200">{task}</p>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={onAcknowledge}
                            className="mt-8 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm uppercase tracking-widest py-5 rounded-2xl transition-all hover:scale-[1.02] shadow-[0_0_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3"
                        >
                            <Zap className="w-5 h-5" /> Initialize Workday
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default HandoverDashboard;

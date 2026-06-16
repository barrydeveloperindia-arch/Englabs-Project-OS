import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, 
    ShieldAlert, 
    History, 
    Database, 
    ArrowRightCircle, 
    ClipboardCheck, 
    AlertCircle,
    Activity,
    Save,
    RotateCcw,
    TrendingUp,
    CheckCircle2,
    Clock,
    User,
    Lock,
    Unlock,
    FileSearch,
    Fingerprint
} from 'lucide-react';
import { englabsGuard, SystemLog, HandoverReport } from '@domain/system_guard';

interface Props {
    todayActivities: any[];
    auditLogs?: any[]; // New prop for live logs
}

const SystemGuardDashboard: React.FC<Props> = ({ todayActivities, auditLogs = [] }) => {
    const [status, setStatus] = useState<'STABLE' | 'BUSY' | 'ALERT'>('STABLE');
    const [lastCheck, setLastCheck] = useState<string>(new Date().toLocaleTimeString());
    const [handover, setHandover] = useState<HandoverReport | null>(null);
    const [liveLogs, setLiveLogs] = useState<any[]>([]);

    useEffect(() => {
        // Sync with provided logs or generate some for context
        if (auditLogs.length > 0) {
            setLiveLogs(auditLogs);
        } else {
            setLiveLogs([
                { id: 'initial', action: 'SYSTEM', user: 'DATA PROTECTOR', target: 'ENGLABS OS', time: '09:00 AM', timestamp: new Date().toISOString() }
            ]);
        }
    }, [auditLogs]);

    useEffect(() => {
        // Continuous Monitoring Simulation
        const interval = setInterval(() => {
            const check = englabsGuard.runIntegrityCheck(todayActivities);
            if (check.status === 'STABLE') setStatus('STABLE');
            else if (check.status === 'REPAIRED') setStatus('BUSY');
            setLastCheck(new Date().toLocaleTimeString());
        }, 10000);

        return () => clearInterval(interval);
    }, [todayActivities]);

    const handleGenerateHandover = () => {
        const report = englabsGuard.generateHandover(todayActivities);
        setHandover(report);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#0e4368] text-white overflow-hidden p-10">
            <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-[2rem] shadow-2xl transition-all duration-500 ${status === 'STABLE' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-orange-500 animate-pulse'}`}>
                        <ShieldCheck className="w-10 h-10 text-slate-900" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">ENGLABS SYSTEM GUARD</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Monitoring • Last Check: {lastCheck}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <Database className="w-4 h-4 text-emerald-400" /> FULL BACKUP
                    </button>
                    <button 
                        onClick={handleGenerateHandover}
                        className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10"
                    >
                        <ArrowRightCircle className="w-4 h-4" /> DAILY HANDOVER
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
                {/* STATUS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-[2.5rem] flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Data Integrity</p>
                            <p className="text-2xl font-black text-white uppercase">100% Secure</p>
                        </div>
                        <Activity className="w-10 h-10 text-emerald-500/20" />
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-[2.5rem] flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Records</p>
                            <p className="text-2xl font-black text-white uppercase">{todayActivities.length} Protected</p>
                        </div>
                        <History className="w-10 h-10 text-blue-500/20" />
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-[2.5rem] flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">System State</p>
                            <p className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">IMMUTABLE</p>
                        </div>
                        <ShieldCheck className="w-10 h-10 text-emerald-500/20" />
                    </div>
                </div>

                {/* DATA PROTECTOR CONTROL CENTER */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-slate-800 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-slate-700">
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                            <Fingerprint className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-500 text-slate-900 rounded-2xl">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tighter">DATA PROTECTOR</h2>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Monitoring Engaged</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center p-6 bg-slate-900/50 rounded-3xl border border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <Lock className="w-5 h-5 text-emerald-400" />
                                        <span className="text-sm font-black uppercase tracking-widest">Automatic Record Lock</span>
                                    </div>
                                    <span className="px-4 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase">ENABLED</span>
                                </div>
                                <div className="flex justify-between items-center p-6 bg-slate-900/50 rounded-3xl border border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <History className="w-5 h-5 text-blue-400" />
                                        <span className="text-sm font-black uppercase tracking-widest">Version Snapshots</span>
                                    </div>
                                    <span className="px-4 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase">REAL-TIME</span>
                                </div>
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button className="flex-1 py-4 bg-emerald-500 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all">
                                    CREATE MANUAL BACKUP
                                </button>
                                <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">
                                    VIEW HISTORY
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-10 rounded-[3rem] border border-slate-700 shadow-sm overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 text-white rounded-2xl">
                                    <FileSearch className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Audit Trail</h2>
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Live</span>
                        </div>

                            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
                                {liveLogs.length > 0 ? (
                                    [...liveLogs].reverse().map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700 group hover:border-emerald-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-1.5 h-1.5 rounded-full ${log.action === 'DELETE' ? 'bg-red-500' : 'bg-emerald-500'} shadow-[0_0_10px_currentColor]`}></div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-white uppercase tracking-widest">{log.action}</span>
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">• {log.target || log.targetId}</span>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                                        <User className="w-3 h-3" /> {log.user}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-600">{log.time || new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                                        <FileSearch className="w-12 h-12 mb-2" />
                                        <p className="text-[10px] font-black uppercase">No Logs Recorded</p>
                                    </div>
                                )}
                            </div>
                    </div>
                </div>

                {/* HANDOVER SECTION */}
                <div className="pt-10 border-t border-slate-800">
                    {handover ? (
                        <div className="bg-emerald-500 text-slate-900 rounded-[3rem] p-12 shadow-2xl flex justify-between items-center">
                            <div>
                                <h2 className="text-4xl font-black mb-2 tracking-tighter">Daily Handover Ready</h2>
                                <p className="text-xs font-black uppercase tracking-widest opacity-60">Generated: {handover.date} • {handover.totalTasks} Records Audited</p>
                            </div>
                            <button className="bg-slate-900 text-emerald-500 px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl">
                                <Save className="w-5 h-5" /> EXPORT & SIGN FINAL HANDOVER
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-[3rem] p-12 flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <AlertCircle className="w-12 h-12 text-slate-600" />
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">Handover Required</h2>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Awaiting end-of-day summary generation to finalize logs.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleGenerateHandover}
                                className="bg-emerald-500 text-slate-900 px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10"
                            >
                                GENERATE HANDOVER
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SystemGuardDashboard;

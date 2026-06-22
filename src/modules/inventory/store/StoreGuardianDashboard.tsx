import React, { useState, useEffect } from 'react';
import { 
    Shield, 
    AlertTriangle, 
    CheckCircle, 
    Activity, 
    Database, 
    X, 
    BookOpen, 
    RefreshCw,
    Search
} from 'lucide-react';
import { storeGuardian, GuardianError, GuardianKnowledge } from '@shared/services/store_guardian';

const StoreGuardianDashboard: React.FC = () => {
    const [errors, setErrors] = useState<GuardianError[]>([]);
    const [knowledge, setKnowledge] = useState<GuardianKnowledge[]>([]);
    const [loading, setLoading] = useState(true);
    const [diagnostics, setDiagnostics] = useState<string[]>([]);
    const [runningDiag, setRunningDiag] = useState(false);
    const [activeTab, setActiveTab] = useState<'LOG' | 'KNOWLEDGE'>('LOG');

    const [selectedError, setSelectedError] = useState<GuardianError | null>(null);
    const [resolveNote, setResolveNote] = useState('');
    const [updateKnowledge, setUpdateKnowledge] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [errs, know] = await Promise.all([
            storeGuardian.getErrors(),
            storeGuardian.getKnowledgeBase()
        ]);
        setErrors(errs);
        setKnowledge(know);
        setLoading(false);
    };

    const handleRunDiagnostics = async () => {
        setRunningDiag(true);
        const results = await storeGuardian.runDiagnostics();
        setDiagnostics(results);
        setRunningDiag(false);
        loadData();
    };

    const handleResolve = async () => {
        if (!selectedError) return;
        await storeGuardian.resolveError(
            selectedError.id!, 
            'Admin',
            resolveNote || selectedError.recommendedFix || 'Resolved by Admin',
            updateKnowledge
        );
        setSelectedError(null);
        setResolveNote('');
        loadData();
    };

    const totalErrors = errors.length;
    const pendingErrors = errors.filter(e => e.status === 'PENDING').length;
    const resolvedErrors = errors.filter(e => e.status === 'RESOLVED').length;

    const filteredErrors = errors.filter(e => 
        e.errorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredKnowledge = knowledge.filter(k => 
        k.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.rootCause.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
            {/* HEADER */}
            <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 shadow-sm z-20">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">STORE GUARDIAN</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Quality Control & System Health</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
                        <button 
                            onClick={() => setActiveTab('LOG')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'LOG' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <AlertTriangle className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                            Error Log Book
                        </button>
                        <button 
                            onClick={() => setActiveTab('KNOWLEDGE')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'KNOWLEDGE' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <BookOpen className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                            Learning Register
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200"></div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={activeTab === 'LOG' ? "Search Errors..." : "Search Knowledge..."}
                            className="bg-slate-50 border border-slate-100 pl-12 pr-6 py-3 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all w-[300px] text-slate-800 placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        onClick={handleRunDiagnostics}
                        disabled={runningDiag}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                    >
                        <Activity className={`w-4 h-4 ${runningDiag ? 'animate-spin' : ''}`} />
                        {runningDiag ? 'Scanning...' : 'Run Diagnostics'}
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto space-y-10">
                    
                    {/* STATS STRIP */}
                    <div className="grid grid-cols-4 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Database className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
                                    <Database className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Total Evaluated Logs</p>
                            <p className="text-3xl font-black text-slate-900 relative">{totalErrors}</p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-rose-500">
                                <AlertTriangle className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Pending Anomalies</p>
                            <p className="text-3xl font-black text-rose-600 relative flex items-baseline gap-2">
                                {pendingErrors}
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
                                <CheckCircle className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Resolved Issues</p>
                            <p className="text-3xl font-black text-emerald-600 relative flex items-baseline gap-2">
                                {resolvedErrors}
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-indigo-500">
                                <BookOpen className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Knowledge Rules</p>
                            <p className="text-3xl font-black text-indigo-600 relative">{knowledge.length}</p>
                        </div>
                    </div>

                    {/* DIAGNOSTICS LOG */}
                    {diagnostics.length > 0 && (
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Shield className="w-32 h-32 text-indigo-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-6 relative">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <Activity className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Live Diagnostic Output</h3>
                            </div>
                            <div className="space-y-2 relative max-h-[200px] overflow-y-auto custom-scrollbar pr-4">
                                {diagnostics.map((d, i) => (
                                    <div key={i} className={`flex items-start gap-3 text-xs font-mono p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 ${d.includes('Stable') || d.includes('passed') ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        <span className="opacity-50 mt-0.5">&gt;</span>
                                        <p>{d}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MAIN CONTENT TABLE */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-[600px]">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            </div>
                        ) : activeTab === 'LOG' ? (
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Timestamp</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Error Type / Screen</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Details</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredErrors.map(err => (
                                            <tr key={err.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6 align-middle">
                                                    {err.status === 'PENDING' ? (
                                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Pending
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                                                            <CheckCircle className="w-3 h-3" /> Resolved
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 align-middle">
                                                    <span className="text-xs font-bold text-slate-500">{new Date(err.timestamp).toLocaleString()}</span>
                                                </td>
                                                <td className="px-8 py-6 align-middle">
                                                    <p className="text-sm font-black text-slate-900">{err.errorType}</p>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{err.screenName}</span>
                                                </td>
                                                <td className="px-8 py-6 align-middle">
                                                    <p className="text-sm font-bold text-slate-600 max-w-lg line-clamp-2">{err.description}</p>
                                                </td>
                                                <td className="px-8 py-6 align-middle text-right">
                                                    {err.status === 'PENDING' ? (
                                                        <button 
                                                            onClick={() => setSelectedError(err)}
                                                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                                                        >
                                                            Review & Fix
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">By {err.resolvedBy}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredErrors.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-16 text-center">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Shield className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">System is Healthy</p>
                                                    <p className="text-xs font-bold text-slate-400 mt-1">No anomalies detected in the logs.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Knowledge Signature</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Occurrences</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Root Cause Pattern</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Auto-Remediation Strategy</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredKnowledge.map(k => (
                                            <tr key={k.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6 align-middle">
                                                    <span className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-mono font-bold">
                                                        {k.id}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 align-middle">
                                                    <span className="text-sm font-black text-slate-900">{k.occurrences}</span>
                                                </td>
                                                <td className="px-8 py-6 align-middle">
                                                    <p className="text-sm font-bold text-slate-700">{k.rootCause}</p>
                                                </td>
                                                <td className="px-8 py-6 align-middle">
                                                    <p className="text-sm font-bold text-slate-500">{k.recommendedFix}</p>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredKnowledge.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-16 text-center">
                                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Knowledge Base Empty</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* RESOLUTION MODAL */}
            {selectedError && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-slate-100 overflow-hidden animate-spring-zoom flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Resolve Anomaly</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">AI Guided Resolution</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedError(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 bg-white">
                            <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> System Log
                                </p>
                                <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                    {selectedError.description}
                                </p>
                            </div>

                            {selectedError.recommendedFix && (
                                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <BookOpen className="w-3 h-3" /> AI Recommended Fix
                                    </p>
                                    <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                                        {selectedError.recommendedFix}
                                    </p>
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Actual Resolution Notes
                                </label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none h-32"
                                    placeholder="Describe how this anomaly was resolved to update the AI Knowledge Base..."
                                    value={resolveNote}
                                    onChange={e => setResolveNote(e.target.value)}
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 border-2 border-slate-300 rounded-md text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 transition-colors cursor-pointer group-hover:border-indigo-500"
                                        checked={updateKnowledge}
                                        onChange={e => setUpdateKnowledge(e.target.checked)}
                                    />
                                </div>
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                                    Inject this resolution into the Learning Register for future auto-remediation.
                                </span>
                            </label>
                        </div>

                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setSelectedError(null)}
                                className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleResolve}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25"
                            >
                                Confirm Resolution
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreGuardianDashboard;

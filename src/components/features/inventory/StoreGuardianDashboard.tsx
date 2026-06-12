import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Activity, FileText, Database, X, BookOpen, RefreshCw } from 'lucide-react';
import { storeGuardian, GuardianError, GuardianKnowledge } from '@domain/store_guardian';

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
        loadData(); // refresh errors in case diagnostics found something
    };

    const handleResolve = async () => {
        if (!selectedError) return;
        await storeGuardian.resolveError(
            selectedError.id!, 
            'Admin', // Ideally fetched from context
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

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">ENGLABS STORE GUARDIAN</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">AI Quality Control & System Health</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleRunDiagnostics}
                        disabled={runningDiag}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                        <Activity className={`w-4 h-4 ${runningDiag ? 'animate-spin' : ''}`} />
                        {runningDiag ? 'Scanning...' : 'Run Diagnostics'}
                    </button>
                    <button 
                        onClick={loadData}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Logs</p>
                        <p className="text-3xl font-black text-slate-800">{totalErrors}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <Database className="w-5 h-5 text-slate-400" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Pending Alerts</p>
                        <p className="text-3xl font-black text-rose-600">{pendingErrors}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Resolved</p>
                        <p className="text-3xl font-black text-emerald-600">{resolvedErrors}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Knowledge DB</p>
                        <p className="text-3xl font-black text-indigo-600">{knowledge.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-indigo-500" />
                    </div>
                </div>
            </div>

            {/* Diagnostic Results */}
            {diagnostics.length > 0 && (
                <div className="mb-6 p-4 bg-slate-900 rounded-2xl shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Diagnostic Output</h3>
                    </div>
                    <div className="space-y-1">
                        {diagnostics.map((d, i) => (
                            <p key={i} className={`text-xs font-mono ${d.includes('Stable') ? 'text-emerald-400' : 'text-amber-400'}`}>
                                &gt; {d}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 mb-4 shrink-0 border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('LOG')}
                    className={`pb-3 px-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'LOG' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Error Log Book
                </button>
                <button 
                    onClick={() => setActiveTab('KNOWLEDGE')}
                    className={`pb-3 px-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'KNOWLEDGE' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Learning Register
                </button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : activeTab === 'LOG' ? (
                    <div className="overflow-auto flex-1 dark-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type / Screen</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {errors.map(err => (
                                    <tr key={err.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4">
                                            {err.status === 'PENDING' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 text-rose-600 text-[10px] font-bold uppercase">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Pending
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase">
                                                    <CheckCircle className="w-3 h-3" /> Resolved
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                                            {new Date(err.timestamp).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">{err.errorType}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{err.screenName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-600 max-w-md truncate" title={err.description}>
                                            {err.description}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {err.status === 'PENDING' ? (
                                                <button 
                                                    onClick={() => setSelectedError(err)}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors"
                                                >
                                                    Review & Fix
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400">By {err.resolvedBy}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {errors.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400 text-sm font-medium">
                                            No errors logged yet. System is healthy.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-auto flex-1 dark-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Error Signature</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Occurrences</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Root Cause</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Recommended Fix</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {knowledge.map(k => (
                                    <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 text-xs font-mono font-bold text-indigo-600">
                                            {k.id}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded font-bold text-xs">
                                                {k.occurrences}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs font-medium text-slate-700">
                                            {k.rootCause}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-600">
                                            {k.recommendedFix}
                                        </td>
                                    </tr>
                                ))}
                                {knowledge.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400 text-sm font-medium">
                                            Knowledge base is empty.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Resolve Modal */}
            {selectedError && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-spring-zoom">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Resolve Error</h3>
                            </div>
                            <button onClick={() => setSelectedError(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6 space-y-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Error Description</label>
                                    <p className="text-sm font-medium text-slate-800 bg-rose-50/50 p-3 rounded-xl border border-rose-100 mt-1">
                                        {selectedError.description}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Recommended Fix</label>
                                    <p className="text-sm font-medium text-indigo-800 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 mt-1">
                                        {selectedError.recommendedFix || 'No fix recommended.'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Actual Resolution Notes</label>
                                    <textarea 
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none h-24"
                                        placeholder="Describe how this was fixed to update the AI Knowledge Base..."
                                        value={resolveNote}
                                        onChange={e => setResolveNote(e.target.value)}
                                    />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                        checked={updateKnowledge}
                                        onChange={e => setUpdateKnowledge(e.target.checked)}
                                    />
                                    <span className="text-xs font-bold text-slate-600">Update Learning Register with this fix</span>
                                </label>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                            <button 
                                onClick={() => setSelectedError(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleResolve}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-500/25"
                            >
                                Mark as Resolved
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreGuardianDashboard;

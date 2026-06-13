import React, { useState } from 'react';
import { Layers, Database, Lock, FolderTree, Activity } from 'lucide-react';

export const ERPBetaDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROJECT_MODULE' | 'FINANCE_MODULE' | 'TEST_DATABASE'>('OVERVIEW');

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-3">
                            <Activity className="w-6 h-6 text-emerald-600" />
                            ERP-BETA COMMAND CENTER
                        </h1>
                        <p className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-widest">
                            Isolated Testing Environment (Phase 1)
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-xl border border-amber-200">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Production Database Isolated</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-slate-200 pb-px">
                    {[
                        { id: 'OVERVIEW', label: 'Architecture Overview', icon: <Layers /> },
                        { id: 'PROJECT_MODULE', label: 'Project Flow Test', icon: <FolderTree /> },
                        { id: 'FINANCE_MODULE', label: 'Ledger Engine', icon: <Database /> },
                        { id: 'TEST_DATABASE', label: 'Sandbox DB Monitor', icon: <Activity /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                                activeTab === tab.id 
                                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' 
                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                        >
                            {React.cloneElement(tab.icon as React.ReactElement, { className: 'w-4 h-4' })}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[60vh]">
                    {activeTab === 'OVERVIEW' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-slate-800">Core Architecture Deployed</h2>
                            <p className="text-sm text-slate-600 max-w-2xl">
                                Phase 1 backend architecture is currently running in this isolated environment. 
                                The <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">erp_projects</span> and <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">erp_ledgers</span> schemas are initialized.
                            </p>
                            <div className="grid grid-cols-3 gap-6 mt-8">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                        <FolderTree className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-slate-800">20-Root Hierarchy</h3>
                                    <p className="text-xs text-slate-500 mt-2">Microsoft 365 standard synchronization ready.</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-slate-800">27 Expense Categories</h3>
                                    <p className="text-xs text-slate-500 mt-2">Strict enum validation applied to all ledgers.</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-slate-800">19 Project Sub-folders</h3>
                                    <p className="text-xs text-slate-500 mt-2">Auto-generation template configured for new active projects.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab !== 'OVERVIEW' && (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                            <Activity className="w-12 h-12 text-emerald-200 mb-4 animate-pulse" />
                            <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest">Module Under Construction</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-md">
                                The UI for this specific module is currently being built using the newly deployed backend architecture.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

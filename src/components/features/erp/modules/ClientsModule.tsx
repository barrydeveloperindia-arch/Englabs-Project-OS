import React, { useState } from 'react';

export const ClientsModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Client Master');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Client Management</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Module Overview</p>
                </div>
            </div>

            <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto dark-scrollbar">
                {['Client Master', 'Client Enquiries'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center mt-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-slate-100">
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h3 className="text-lg font-black text-slate-700">{activeTab}</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto font-medium">This view is currently being scaffolded. Live data integration will be connected shortly.</p>
            </div>
        </div>
    );
};

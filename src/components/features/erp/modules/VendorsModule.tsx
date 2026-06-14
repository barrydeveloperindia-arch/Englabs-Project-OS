import React, { useState, useEffect } from 'react';
import { useERPContext } from '@features/erp/context/ERPContext';
import { db, auth } from '@services/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { VendorTransactionForm } from '@features/erp/modules/vendors/VendorTransactionForm';
import { FileText, ArrowRightLeft, CreditCard, Box, Search } from 'lucide-react';

export const VendorsModule: React.FC = () => {
    const { selectedProjectId, isGlobalView } = useERPContext();
    const [activeTab, setActiveTab] = useState<'Live Actions'|'Vendor Master'|'Ledger'>('Live Actions');
    const [liveLedger, setLiveLedger] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'vendor_ledger'), orderBy('createdAt', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLiveLedger(data);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Vendor Directory</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Module Overview</p>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl w-max mb-6">
                <button 
                    onClick={() => setActiveTab('Live Actions')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'Live Actions' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Live Actions
                </button>
                <button 
                    onClick={() => setActiveTab('Vendor Master')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'Vendor Master' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Vendor Master
                </button>
                <button 
                    onClick={() => setActiveTab('Ledger')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'Ledger' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Vendor Ledger
                </button>
            </div>

            {activeTab === 'Live Actions' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <VendorTransactionForm />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-blue-300 mb-4" />
                        <h3 className="text-lg font-black text-blue-900">Live Transaction Mode Enabled</h3>
                        <p className="text-sm text-blue-700 mt-2 max-w-md font-medium">
                            {selectedProjectId 
                                ? `Project locked: \${selectedProjectId}. Vendor Purchases will instantly update the Project Cost.` 
                                : 'Select a Project ID in the global header to enable Vendor dispatching.'}
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'Ledger' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Vendor Movement Ledger</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendor</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liveLedger.map(txn => (
                                <tr key={txn.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(txn.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider \${
                                            txn.type === 'VENDOR_PURCHASE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {txn.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{txn.vendorId}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{txn.projectId || '-'}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{txn.invoiceNo || '-'}</td>
                                    <td className={`px-6 py-4 text-sm font-black text-right \${txn.amount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {txn.amount > 0 ? '+' : ''}{txn.amount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'Vendor Master' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center mt-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-slate-100">
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-slate-700">{activeTab}</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto font-medium">This view is currently being scaffolded. Live data integration will be connected shortly.</p>
                </div>
            )}
        </div>
    );
};

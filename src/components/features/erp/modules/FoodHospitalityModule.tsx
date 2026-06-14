import React, { useState, useEffect } from 'react';
import { useERPContext } from '@features/erp/context/ERPContext';
import { db } from '@services/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { FoodTransactionForm } from '@features/erp/modules/food/FoodTransactionForm';
import { FileText, Coffee } from 'lucide-react';

export const FoodHospitalityModule: React.FC = () => {
    const { selectedProjectId } = useERPContext();
    const [activeTab, setActiveTab] = useState<'Live Actions'|'Pantry Inventory'|'Ledger'>('Live Actions');
    const [liveLedger, setLiveLedger] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'food_ledger'), orderBy('createdAt', 'desc'), limit(50));
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
                    <h1 className="text-2xl font-black text-slate-800">Food & Hospitality</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Module Overview</p>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl w-max mb-6">
                <button 
                    onClick={() => setActiveTab('Live Actions')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'Live Actions' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Live Expenses
                </button>
                <button 
                    onClick={() => setActiveTab('Pantry Inventory')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'Pantry Inventory' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Pantry Database
                </button>
                <button 
                    onClick={() => setActiveTab('Ledger')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'Ledger' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Expense Ledger
                </button>
            </div>

            {activeTab === 'Live Actions' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <FoodTransactionForm />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-blue-300 mb-4" />
                        <h3 className="text-lg font-black text-blue-900">Live Hospitality Mode</h3>
                        <p className="text-sm text-blue-700 mt-2 max-w-md font-medium">
                            {selectedProjectId 
                                ? `Project locked: \${selectedProjectId}. Food & site meals will update Project Costing instantly.` 
                                : 'Select a Project ID in the global header to enable hospitality logging.'}
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'Ledger' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Food & Hospitality Ledger</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liveLedger.map(txn => (
                                <tr key={txn.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(txn.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider \${
                                            txn.type === 'FOOD_SITE_MEAL' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {txn.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{txn.projectId || '-'}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                        {txn.description} {txn.headcount ? `(Headcount: \${txn.headcount})` : ''}
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-black text-right text-rose-600`}>
                                        {txn.amount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'Pantry Inventory' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center mt-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-slate-100">
                        <Coffee className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-700">{activeTab}</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto font-medium">This view is currently being scaffolded. Live data integration will be connected shortly.</p>
                </div>
            )}
        </div>
    );
};

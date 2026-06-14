import React, { useState, useEffect } from 'react';
import { useERPContext } from '@features/erp/context/ERPContext';
import { db } from '@services/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { MaterialTransactionForm } from '@features/erp/modules/inventory/MaterialTransactionForm';
import { Package, ArrowRightLeft, AlertTriangle, FileText, Search, PlusCircle, MinusCircle } from 'lucide-react';

export const StoreInventoryModule: React.FC = () => {
    const { isGlobalView, selectedProjectId } = useERPContext();
    const [activeTab, setActiveTab] = useState<'Master' | 'Ledger' | 'Transactions'>('Transactions');
    const [liveLedger, setLiveLedger] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'inventory_ledger'), orderBy('createdAt', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLiveLedger(data);
        });
        return () => unsubscribe();
    }, []);

    // Dummy data matching our new Firestore schema
    const dummyItems = [
        { id: 'ITM-001', name: 'MDF Board 18mm', category: 'Raw Material', uom: 'Sheets', stock: 145, reorder: 50, cost: 2200 },
        { id: 'ITM-002', name: 'Fevicol SH', category: 'Hardware', uom: 'Kgs', stock: 12, reorder: 20, cost: 350 }, // Low Stock
        { id: 'ITM-003', name: 'Asian Paints PU', category: 'Paint & Polish', uom: 'Liters', stock: 5, reorder: 10, cost: 850 }, // Low Stock
    ];

    const lowStockItems = dummyItems.filter(i => i.stock <= i.reorder);

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-6">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Store & Inventory</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">
                        {!isGlobalView && selectedProjectId 
                            ? `Project Consumption Mode: ${selectedProjectId}` 
                            : 'Global Inventory Command'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-max">
                <button 
                    onClick={() => setActiveTab('Transactions')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'Transactions' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Live Actions
                </button>
                <button 
                    onClick={() => setActiveTab('Master')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'Master' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Master Inventory
                </button>
                <button 
                    onClick={() => setActiveTab('Ledger')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'Ledger' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Movement Ledger
                </button>
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 overflow-y-auto pb-8 dark-scrollbar space-y-6">
                
                {/* LOW STOCK ALERTS (Only visible in Master View) */}
                {activeTab === 'Master' && lowStockItems.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-rose-600" />
                            <h3 className="text-sm font-black text-rose-800 uppercase tracking-widest">Low Stock Alerts</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {lowStockItems.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-rose-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500">{item.id}</p>
                                        <p className="text-sm font-black text-slate-800">{item.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-rose-600">{item.stock} <span className="text-xs">{item.uom}</span></p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Reorder at {item.reorder}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CURRENT STOCK REPORT */}
                {activeTab === 'Master' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Current Stock Report</h3>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search Inventory..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:outline-none" />
                            </div>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item ID</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Name</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Current Stock</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Unit Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dummyItems.map(item => (
                                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.id}</td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-800">{item.name}</td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">{item.category}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-black \${item.stock <= item.reorder ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {item.stock} <span className="text-xs text-slate-400 font-bold">{item.uom}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-700 text-right">₹{item.cost.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TRANSACTION LEDGER */}
                {activeTab === 'Ledger' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Inventory Movement Ledger</h3>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liveLedger.map(txn => (
                                    <tr key={txn.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(txn.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider \${
                                                txn.type === 'MATERIAL_IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {txn.type === 'MATERIAL_IN' ? <PlusCircle className="w-3 h-3" /> : <MinusCircle className="w-3 h-3" />}
                                                {txn.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{txn.itemId}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{txn.projectId || '-'}</td>
                                        <td className={`px-6 py-4 text-sm font-black text-right \${txn.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* LIVE TRANSACTIONS */}
                {activeTab === 'Transactions' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <MaterialTransactionForm />
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                            <FileText className="w-12 h-12 text-blue-300 mb-4" />
                            <h3 className="text-lg font-black text-blue-900">Live Transaction Mode Enabled</h3>
                            <p className="text-sm text-blue-700 mt-2 max-w-md font-medium">
                                {selectedProjectId 
                                    ? `Project locked: \${selectedProjectId}. Material Out will instantly deduct from global inventory and add to Project Cost.` 
                                    : 'Select a Project ID in the global header to enable Material Out dispatching.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

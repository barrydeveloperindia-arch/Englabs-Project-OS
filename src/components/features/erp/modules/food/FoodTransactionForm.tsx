import React, { useState } from 'react';
import { db, auth } from '@services/firebase';
import { collection, doc, writeBatch, increment } from 'firebase/firestore';
import { useERPContext } from '@features/erp/context/ERPContext';
import { Coffee, Utensils, Users } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const FoodTransactionForm: React.FC = () => {
    const { selectedProjectId } = useERPContext();
    const [type, setType] = useState<'SITE_MEAL' | 'PANTRY'>('SITE_MEAL');
    const [description, setDescription] = useState(''); 
    const [headcount, setHeadcount] = useState<number | ''>(''); 
    const [amount, setAmount] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || amount <= 0) return;
        
        if (!selectedProjectId) {
            setMessage({ text: 'Error: A project must be locked to log food expenses.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const batch = writeBatch(db);
            const ledgerRef = doc(collection(db, 'food_ledger'));
            
            const transactionValue = Number(amount);

            // 1. Immutable Ledger Entry
            batch.set(ledgerRef, {
                id: ledgerRef.id,
                type: type === 'SITE_MEAL' ? 'FOOD_SITE_MEAL' : 'FOOD_PANTRY_RESTOCK',
                amount: transactionValue,
                description,
                headcount: type === 'SITE_MEAL' ? Number(headcount) : null,
                projectId: selectedProjectId,
                createdBy: auth.currentUser?.email || 'Unknown User',
                createdAt: new Date().toISOString()
            });

            // 2. Cross-Module Sync 
            const projectRef = doc(db, 'projects_master', selectedProjectId);
            
            // Food expenses increase the foodCost for the project
            batch.update(projectRef, {
                'costTotals.foodCost': increment(transactionValue)
            });
            await batch.commit();
            await AuditLogger.log(type === 'SITE_MEAL' ? 'FOOD_SITE_MEAL_LOGGED' : 'FOOD_PANTRY_RESTOCK_LOGGED', 'FOOD_SERVICES', { amount: transactionValue, description, headcount }, ledgerRef.id, selectedProjectId);

            setMessage({ text: `Successfully logged ${type === 'SITE_MEAL' ? 'Site Meal' : 'Pantry Restock'}!`, type: 'success' });
            setAmount('');
            setDescription('');
            setHeadcount('');
        } catch (error: any) {
            console.error('Transaction Failed:', error);
            setMessage({ text: error.message || 'Transaction Failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-emerald-600" /> Food & Hospitality Terminal
            </h3>

            {message.text && (
                <div className={`p-3 rounded-lg text-xs font-bold mb-4 ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setType('SITE_MEAL')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'SITE_MEAL' 
                            ? 'bg-amber-50 border-amber-500 text-amber-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <Utensils className="w-4 h-4" /> Site Labour Meals
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('PANTRY')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'PANTRY' 
                            ? 'bg-blue-50 border-blue-500 text-blue-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <Coffee className="w-4 h-4" /> HQ Pantry Restock
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Description / Vendor</label>
                        <input 
                            type="text" 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                            placeholder="e.g. Local Canteen, Groceries"
                        />
                    </div>

                    {type === 'SITE_MEAL' && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Meal Headcount</label>
                            <input 
                                type="number" 
                                value={headcount}
                                onChange={e => setHeadcount(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                placeholder="10"
                            />
                        </div>
                    )}

                    <div className={type === 'SITE_MEAL' ? '' : 'col-span-2'}>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Bill (₹)</label>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                            placeholder="0"
                            required
                        />
                    </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs font-bold text-blue-800">
                        {selectedProjectId 
                            ? `Target Project: ${selectedProjectId}. This will instantly increase the project Food & Hospitality Cost.`
                            : `⚠️ WARNING: No project is locked. You must lock a project in the global header to post food expenses.`}
                    </p>
                </div>

                <button 
                    type="submit"
                    disabled={loading || !selectedProjectId}
                    className="w-full py-3 bg-[#0b1b29] hover:bg-[#132a40] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
                >
                    {loading ? 'Processing Expense...' : `Confirm ${type === 'SITE_MEAL' ? 'Meal' : 'Pantry'} Log`}
                </button>
            </form>
        </div>
    );
};

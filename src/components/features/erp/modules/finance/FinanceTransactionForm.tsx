import React, { useState } from 'react';
import { db, auth } from '@services/firebase';
import { collection, doc, writeBatch, increment } from 'firebase/firestore';
import { useERPContext } from '@features/erp/context/ERPContext';
import { Landmark, TrendingDown, TrendingUp, FileText } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const FinanceTransactionForm: React.FC = () => {
    const { selectedProjectId } = useERPContext();
    const [type, setType] = useState<'REVENUE' | 'EXPENSE'>('EXPENSE');
    const [category, setCategory] = useState('Miscellaneous'); 
    const [amount, setAmount] = useState<number | ''>('');
    const [gstAmount, setGstAmount] = useState<number | ''>('');
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || amount <= 0) return;
        
        if (!selectedProjectId) {
            setMessage({ text: 'Error: A project must be locked to log financial transactions.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const batch = writeBatch(db);
            const ledgerRef = doc(collection(db, 'finance_ledger'));
            
            const transactionValue = Number(amount);
            const gstValue = Number(gstAmount) || 0;

            // 1. Immutable Ledger Entry
            batch.set(ledgerRef, {
                id: ledgerRef.id,
                type: type === 'REVENUE' ? 'FINANCE_REVENUE' : 'FINANCE_EXPENSE',
                category,
                amount: type === 'REVENUE' ? transactionValue : -transactionValue,
                gstAmount: gstValue,
                reference,
                projectId: selectedProjectId,
                createdBy: auth.currentUser?.email || 'Unknown User',
                createdAt: new Date().toISOString()
            });

            // 2. Cross-Module Sync 
            const projectRef = doc(db, 'projects_master', selectedProjectId);
            
            if (type === 'EXPENSE') {
                batch.update(projectRef, {
                    'costTotals.miscellaneousCost': increment(transactionValue)
                });
            } else if (type === 'REVENUE') {
                batch.update(projectRef, {
                    revenueRealized: increment(transactionValue)
                });
            }

            await batch.commit();
            await AuditLogger.log(type === 'REVENUE' ? 'FINANCE_REVENUE_LOGGED' : 'FINANCE_EXPENSE_LOGGED', 'FINANCE', { category, amount: type === 'REVENUE' ? transactionValue : -transactionValue, reference, gstAmount: gstValue }, ledgerRef.id, selectedProjectId);

            setMessage({ text: `Successfully logged Finance ${type}!`, type: 'success' });
            setAmount('');
            setGstAmount('');
            setReference('');
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
                <Landmark className="w-4 h-4 text-emerald-600" /> Accounts & Finance Terminal
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
                        onClick={() => setType('REVENUE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'REVENUE' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4" /> Client Revenue
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('EXPENSE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'EXPENSE' 
                            ? 'bg-rose-50 border-rose-500 text-rose-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <TrendingDown className="w-4 h-4" /> Log Expense
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Category</label>
                        <input 
                            type="text" 
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Bill / Ref No</label>
                        <input 
                            type="text" 
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Base Amount (₹)</label>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                            placeholder="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">GST Tax (₹)</label>
                        <input 
                            type="number" 
                            value={gstAmount}
                            onChange={e => setGstAmount(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs font-bold text-blue-800">
                        {selectedProjectId 
                            ? `Target Project: ${selectedProjectId}. ${type === 'EXPENSE' ? 'This expense will increase project Miscellaneous Costs.' : 'This revenue will increase Project Revenue Realized.'}`
                            : `⚠️ WARNING: No project is locked. You must lock a project in the global header to post finance entries.`}
                    </p>
                </div>

                <button 
                    type="submit"
                    disabled={loading || !selectedProjectId}
                    className="w-full py-3 bg-[#0b1b29] hover:bg-[#132a40] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
                >
                    {loading ? 'Processing Transaction...' : `Post ${type} Entry`}
                </button>
            </form>
        </div>
    );
};

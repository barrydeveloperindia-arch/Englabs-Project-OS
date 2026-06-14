import React, { useState } from 'react';
import { db, auth } from '@services/firebase';
import { collection, doc, writeBatch, increment } from 'firebase/firestore';
import { useERPContext } from '@features/erp/context/ERPContext';
import { Truck, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const VendorTransactionForm: React.FC = () => {
    const { selectedProjectId } = useERPContext();
    const [type, setType] = useState<'PURCHASE' | 'PAYMENT'>('PURCHASE');
    const [vendorId, setVendorId] = useState('VND-001'); 
    const [amount, setAmount] = useState<number | ''>('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || amount <= 0) return;
        
        if (!selectedProjectId) {
            setMessage({ text: 'Error: A project must be locked to link this vendor transaction.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const batch = writeBatch(db);
            const ledgerRef = doc(collection(db, 'vendor_ledger'));
            
            const transactionValue = Number(amount);

            // 1. Immutable Ledger Entry
            batch.set(ledgerRef, {
                id: ledgerRef.id,
                type: type === 'PURCHASE' ? 'VENDOR_PURCHASE' : 'VENDOR_PAYMENT',
                vendorId,
                amount: type === 'PURCHASE' ? transactionValue : -transactionValue,
                invoiceNo,
                projectId: selectedProjectId,
                createdBy: auth.currentUser?.email || 'Unknown User',
                createdAt: new Date().toISOString()
            });

            // 2. Cross-Module Sync 
            const projectRef = doc(db, 'projects_master', selectedProjectId);
            
            if (type === 'PURCHASE') {
                // Purchase increases the vendor cost for the project
                batch.update(projectRef, {
                    'costTotals.vendorCost': increment(transactionValue)
                });
            }

            await batch.commit();
            await AuditLogger.log(type === 'PURCHASE' ? 'VENDOR_PURCHASE_CREATED' : 'VENDOR_PAYMENT_CREATED', 'VENDOR_TRANSACTIONS', { vendorId, amount: transactionValue, invoiceNo }, ledgerRef.id, selectedProjectId);
            
            setMessage({ text: `Successfully logged Vendor ${type}!`, type: 'success' });
            setAmount('');
            setInvoiceNo('');
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
                <Truck className="w-4 h-4 text-emerald-600" /> Vendor Live Terminal
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
                        onClick={() => setType('PURCHASE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'PURCHASE' 
                            ? 'bg-amber-50 border-amber-500 text-amber-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <ArrowDownRight className="w-4 h-4" /> Material Purchase
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('PAYMENT')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'PAYMENT' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <CreditCard className="w-4 h-4" /> Make Payment
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vendor ID</label>
                        <input 
                            type="text" 
                            value={vendorId}
                            onChange={e => setVendorId(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Invoice / Ref No</label>
                        <input 
                            type="text" 
                            value={invoiceNo}
                            onChange={e => setInvoiceNo(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount (₹)</label>
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
                            ? `Target Project: ${selectedProjectId}. ${type === 'PURCHASE' ? 'This purchase will instantly increase the project vendor cost.' : 'Payment logged against this project.'}`
                            : `⚠️ WARNING: No project is locked. You must lock a project in the global header to post vendor transactions.`}
                    </p>
                </div>

                <button 
                    type="submit"
                    disabled={loading || !selectedProjectId}
                    className="w-full py-3 bg-[#0b1b29] hover:bg-[#132a40] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
                >
                    {loading ? 'Processing Transaction...' : `Confirm ${type} Entry`}
                </button>
            </form>
        </div>
    );
};

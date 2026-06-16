import React, { useState } from 'react';
import { db, auth } from '@services/firebase';
import { collection, doc, writeBatch, increment } from 'firebase/firestore';

import { Banknote, Clock, Wallet, UserCheck } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const PayrollTerminal: React.FC = () => {
    const selectedProjectId = 'GENERAL';
    const [type, setType] = useState<'SALARY' | 'ADVANCE' | 'OVERTIME'>('SALARY');
    const [staffId, setStaffId] = useState(''); 
    const [amount, setAmount] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || amount <= 0 || !staffId.trim()) return;
        
        if (!selectedProjectId) {
            setMessage({ text: 'Error: A project must be locked to allocate labour costs.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const batch = writeBatch(db);
            
            // Determine collection based on type
            let collectionName = 'salary_ledger';
            let ledgerTypeStr = 'HR_SALARY';
            if (type === 'ADVANCE') {
                collectionName = 'advance_ledger';
                ledgerTypeStr = 'HR_ADVANCE';
            } else if (type === 'OVERTIME') {
                collectionName = 'overtime_ledger';
                ledgerTypeStr = 'HR_OVERTIME';
            }

            const ledgerRef = doc(collection(db, collectionName));
            
            const transactionValue = Number(amount);

            // 1. Immutable Ledger Entry
            batch.set(ledgerRef, {
                id: ledgerRef.id,
                type: ledgerTypeStr,
                staffId: staffId.trim(),
                amount: transactionValue,
                reason: reason.trim() || null,
                projectId: selectedProjectId,
                createdBy: auth.currentUser?.email || 'Unknown User',
                createdAt: new Date().toISOString()
            });

            // 2. Cross-Module Sync 
            const projectRef = doc(db, 'projects_master', selectedProjectId);
            
            // All payroll types increase the labourCost for the project
            batch.update(projectRef, {
                'costTotals.labourCost': increment(transactionValue)
            });
            await batch.commit();
            await AuditLogger.log(type === 'SALARY' ? 'PAYROLL_SALARY_PROCESSED' : type === 'ADVANCE' ? 'PAYROLL_ADVANCE_PROCESSED' : 'PAYROLL_OVERTIME_PROCESSED', 'HR_PAYROLL', { staffId: staffId.trim(), amount: transactionValue, reason: reason.trim() }, ledgerRef.id, selectedProjectId);

            setMessage({ text: `Successfully processed ${type}!`, type: 'success' });
            setAmount('');
            setReason('');
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
                <Banknote className="w-4 h-4 text-emerald-600" /> Payroll & Disbursement Terminal
            </h3>

            {message.text && (
                <div className={`p-3 rounded-lg text-xs font-bold mb-4 ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setType('SALARY')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'SALARY' 
                            ? 'bg-blue-50 border-blue-500 text-blue-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <Wallet className="w-4 h-4" /> Base Salary
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('ADVANCE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'ADVANCE' 
                            ? 'bg-amber-50 border-amber-500 text-amber-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <Banknote className="w-4 h-4" /> Advance
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('OVERTIME')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'OVERTIME' 
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <Clock className="w-4 h-4" /> Overtime
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Staff ID</label>
                        <input 
                            type="text" 
                            value={staffId}
                            onChange={e => setStaffId(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                            placeholder="EMP-1001"
                            required
                        />
                    </div>
                    
                    <div className="col-span-1">
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

                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reason / Notes (Optional)</label>
                        <input 
                            type="text" 
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                            placeholder="Details..."
                        />
                    </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs font-bold text-blue-800">
                        {selectedProjectId 
                            ? `Target Project: ${selectedProjectId}. This will instantly increase the project Labour Cost.`
                            : `⚠️ WARNING: No project is locked. You must lock a project in the global header to allocate payroll costs.`}
                    </p>
                </div>

                <button 
                    type="submit"
                    disabled={loading || !selectedProjectId}
                    className="w-full py-3 bg-[#0b1b29] hover:bg-[#132a40] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
                >
                    {loading ? 'Processing Disbursement...' : `Confirm ${type} Payout`}
                </button>
            </form>
        </div>
    );
};

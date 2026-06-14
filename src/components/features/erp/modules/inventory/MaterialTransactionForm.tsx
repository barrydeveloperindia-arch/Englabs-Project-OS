import React, { useState } from 'react';
import { db, auth } from '@services/firebase';
import { collection, doc, writeBatch, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { useERPContext } from '@features/erp/context/ERPContext';
import { Box, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const MaterialTransactionForm: React.FC = () => {
    const { selectedProjectId } = useERPContext();
    const [type, setType] = useState<'IN' | 'OUT'>('IN');
    const [itemId, setItemId] = useState('ITM-001'); // Hardcoded default for testing
    const [quantity, setQuantity] = useState<number | ''>('');
    const [unitCost, setUnitCost] = useState<number | ''>(500); // Dummy unit cost for demo
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quantity || quantity <= 0) return;
        
        if (type === 'OUT' && !selectedProjectId) {
            setMessage({ text: 'Error: A project must be locked to perform Material Out.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const batch = writeBatch(db);
            const ledgerRef = doc(collection(db, 'inventory_ledger'));
            
            const transactionCost = Number(quantity) * Number(unitCost);

            // 1. Immutable Ledger Entry
            batch.set(ledgerRef, {
                id: ledgerRef.id,
                type: type === 'IN' ? 'MATERIAL_IN' : 'MATERIAL_OUT',
                itemId,
                quantity: type === 'IN' ? Number(quantity) : -Number(quantity),
                unitCost: Number(unitCost),
                totalValue: transactionCost,
                projectId: type === 'OUT' ? selectedProjectId : null,
                createdBy: auth.currentUser?.email || 'Unknown User',
                createdAt: new Date().toISOString()
            });

            // 2. Cross-Module Sync (If OUT, increase project material cost)
            if (type === 'OUT' && selectedProjectId) {
                const projectRef = doc(db, 'projects_master', selectedProjectId);
                const projectSnap = await getDoc(projectRef);
                
                if (projectSnap.exists()) {
                    // Update nested costTotals
                    const currentCostTotals = projectSnap.data().costTotals || {};
                    batch.update(projectRef, {
                        'costTotals.materialCost': increment(transactionCost)
                    });
                } else {
                    throw new Error(`Project ${selectedProjectId} not found in Firestore.`);
                }
            }

            await batch.commit();
            await AuditLogger.log(type === 'IN' ? 'INVENTORY_IN' : 'INVENTORY_OUT', 'INVENTORY', { itemId, quantity: type === 'IN' ? Number(quantity) : -Number(quantity), unitCost, totalValue: transactionCost }, ledgerRef.id, selectedProjectId || undefined);

            setMessage({ text: `Successfully logged Material ${type} transaction!`, type: 'success' });
            setQuantity('');
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
                <Box className="w-4 h-4 text-emerald-600" /> Live Transaction Engine
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
                        onClick={() => setType('IN')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'IN' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <ArrowDownRight className="w-4 h-4" /> Material IN
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('OUT')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            type === 'OUT' 
                            ? 'bg-rose-50 border-rose-500 text-rose-700' 
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <ArrowUpRight className="w-4 h-4" /> Material OUT
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Item ID</label>
                        <input 
                            type="text" 
                            value={itemId}
                            onChange={e => setItemId(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Quantity</label>
                        <input 
                            type="number" 
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                            placeholder="0"
                            required
                        />
                    </div>
                </div>

                {type === 'OUT' && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs font-bold text-amber-800">
                            {selectedProjectId 
                                ? `Target Project: ${selectedProjectId}. The material cost will be automatically charged to this project.`
                                : `⚠️ WARNING: No project is locked. You must lock a project in the global header to dispatch materials.`}
                        </p>
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading || (type === 'OUT' && !selectedProjectId)}
                    className="w-full py-3 bg-[#0b1b29] hover:bg-[#132a40] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
                >
                    {loading ? 'Processing Transaction...' : `Confirm ${type} Entry`}
                </button>
            </form>
        </div>
    );
};

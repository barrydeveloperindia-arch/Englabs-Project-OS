import React, { useState } from 'react';
import { db } from '@services/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { AuditLogger } from '@services/audit/AuditLogger';
import { ERPProject, ERPProjectStatus } from '@domain/erp_beta_types';

interface ProjectFormProps {
    initialData?: ERPProject | null;
    onClose: () => void;
    onSuccess: () => void;
}

const STATUS_OPTIONS: ERPProjectStatus[] = [
    'ENQUIRY' as any,
    'QUOTATION' as any,
    'PO_RECEIVED' as any,
    'EXECUTION' as any,
    'BILLING' as any,
    'COMPLETED' as any,
    'ON_HOLD' as any,
    'CANCELLED' as any
];

export const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, onClose, onSuccess }) => {
    const isEdit = !!initialData;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        id: initialData?.id || '',
        projectName: initialData?.projectName || '',
        clientName: initialData?.clientName || '',
        poNumber: initialData?.poNumber || '',
        quotationNumber: initialData?.quotationNumber || '',
        budgetAmount: initialData?.budgetAmount || 0,
        poAmount: initialData?.poAmount || 0,
        status: initialData?.status || 'ENQUIRY' as any
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.id.startsWith('ENGLABS-')) {
                throw new Error("Project ID must start with ENGLABS-YYYY-XXXX");
            }

            const projectRef = doc(db, 'projects_master', formData.id);

            if (isEdit) {
                await updateDoc(projectRef, {
                    projectName: formData.projectName.trim(),
                    clientName: formData.clientName.trim(),
                    poNumber: formData.poNumber.trim(),
                    quotationNumber: formData.quotationNumber.trim(),
                    budgetAmount: Number(formData.budgetAmount),
                    poAmount: Number(formData.poAmount),
                    status: formData.status,
                    updatedAt: new Date().toISOString()
                });
                await AuditLogger.log('PROJECT_UPDATED', 'PROJECTS', { 
                    status: formData.status, 
                    budget: formData.budgetAmount 
                }, formData.id, formData.id);
            } else {
                const functionsInstance = getFunctions();
                const generateId = httpsCallable(functionsInstance, 'generateUniqueProjectId');
                const result = await generateId();
                const generatedId = (result.data as { id: string }).id;
                const newProject: Partial<ERPProject> = {
                    ...formData,
                    id: generatedId,
                    clientId: formData.clientName.trim(),
                    materialCost: 0,
                    vendorCost: 0,
                    labourCost: 0,
                    sandingCost: 0,
                    paintingCost: 0,
                    packingCost: 0,
                    porterCost: 0,
                    foodCost: 0,
                    logisticsCost: 0,
                    siteCost: 0,
                    miscellaneousCost: 0,
                    totalExpenses: 0,
                    revenue: 0,
                    profit: 0,
                    loss: 0,
                    progressPercentage: 0,
                    pendingClientPayments: 0,
                    pendingVendorPayments: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                const newProjectRef = doc(db, 'projects_master', generatedId);
                await setDoc(newProjectRef, newProject);
                await AuditLogger.log('PROJECT_CREATED', 'PROJECTS', {
                    client: formData.clientName,
                    generatedId
                }, generatedId, generatedId);
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in p-6">
            <h2 className="text-xl font-black text-slate-800 mb-6">{isEdit ? 'Edit Project' : 'Create New Project'}</h2>
            
            {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Project ID</label>
                        <input 
                            type="text" 
                            required
                            disabled={isEdit}
                            placeholder="ENGLABS-2026-0001"
                            value={formData.id}
                            onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Status</label>
                        <select 
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value as any})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                            {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Project Name</label>
                        <input 
                            type="text" 
                            required
                            value={formData.projectName}
                            onChange={e => setFormData({...formData, projectName: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Client Name</label>
                        <input 
                            type="text" 
                            required
                            value={formData.clientName}
                            onChange={e => setFormData({...formData, clientName: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Quotation Number</label>
                        <input 
                            type="text" 
                            value={formData.quotationNumber}
                            onChange={e => setFormData({...formData, quotationNumber: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">PO Number</label>
                        <input 
                            type="text" 
                            value={formData.poNumber}
                            onChange={e => setFormData({...formData, poNumber: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">PO Amount</label>
                        <input 
                            type="number" 
                            required
                            value={formData.poAmount}
                            onChange={e => setFormData({...formData, poAmount: Number(e.target.value)})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Budget Amount</label>
                        <input 
                            type="number" 
                            required
                            value={formData.budgetAmount}
                            onChange={e => setFormData({...formData, budgetAmount: Number(e.target.value)})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>
                
                <div className="flex gap-3 justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Project'}
                    </button>
                </div>
            </form>
        </div>
    );
};

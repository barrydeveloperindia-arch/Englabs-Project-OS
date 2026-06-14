import React, { useState } from 'react';
import { db, auth } from '@services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useERPContext } from '@features/erp/context/ERPContext';
import { FolderOpen, UploadCloud } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const EmployeeDocumentsForm: React.FC = () => {
    const { selectedProjectId } = useERPContext();
    const [staffId, setStaffId] = useState('');
    const [documentType, setDocumentType] = useState('Aadhaar Card');
    const [fileRefUrl, setFileRefUrl] = useState(''); // Simulated file URL before actual storage implementation
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffId.trim() || !fileRefUrl.trim()) return;

        // Note: Project ID isn't strictly required for global employee docs, but we link it if active
        // for project-specific contracts.

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await addDoc(collection(db, 'employee_documents'), {
                staffId: staffId.trim().toUpperCase(),
                projectId: selectedProjectId || null,
                documentType,
                fileUrl: fileRefUrl.trim(),
                status: 'VERIFIED',
                createdBy: auth.currentUser?.email || 'Unknown User',
                createdAt: new Date().toISOString()
            });

            await AuditLogger.log('DOCUMENT_UPLOADED', 'HR_DOCUMENTS', { staffId: staffId.trim().toUpperCase(), documentType, fileUrl: fileRefUrl.trim() }, undefined, selectedProjectId || undefined);

            setMessage({ text: `Successfully uploaded ${documentType} for ${staffId}!`, type: 'success' });
            setStaffId('');
            setFileRefUrl('');
        } catch (error: any) {
            console.error('Upload Failed:', error);
            setMessage({ text: error.message || 'Document Upload Failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-600" /> Employee Documents Vault
            </h3>

            {message.text && (
                <div className={`p-3 rounded-lg text-xs font-bold mb-4 ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
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
                    
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Document Type</label>
                        <select 
                            value={documentType}
                            onChange={e => setDocumentType(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="Aadhaar Card">Aadhaar Card</option>
                            <option value="PAN Card">PAN Card</option>
                            <option value="Driving License">Driving License</option>
                            <option value="Bank Details">Bank Details</option>
                            <option value="Educational Certificates">Educational Certificates</option>
                            <option value="Employment Agreement">Employment Agreement</option>
                            <option value="Other Custom Documents">Other Custom Documents</option>
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Document Reference URL (Drive/Storage Link)</label>
                        <div className="relative">
                            <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="url" 
                                value={fileRefUrl}
                                onChange={e => setFileRefUrl(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                placeholder="https://storage.googleapis.com/..."
                                required
                            />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#0b1b29] hover:bg-[#132a40] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
                >
                    {loading ? 'Archiving...' : `Archive Document securely`}
                </button>
            </form>
        </div>
    );
};

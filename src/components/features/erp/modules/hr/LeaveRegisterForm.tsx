import React, { useState } from 'react';
import { db, auth } from '@services/firebase';
import { collection, doc, addDoc } from 'firebase/firestore';
import { useERPContext } from '@features/erp/context/ERPContext';
import { Plane, Calendar } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const LeaveRegisterForm: React.FC = () => {
    const { selectedProjectId } = useERPContext();
    const [staffId, setStaffId] = useState('');
    const [leaveType, setLeaveType] = useState<'SICK' | 'CASUAL' | 'UNPAID'>('CASUAL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffId.trim() || !startDate || !endDate) return;

        if (!selectedProjectId) {
            setMessage({ text: 'Error: A project must be locked to register leave.', type: 'error' });
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setMessage({ text: 'Error: End Date cannot be before Start Date.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await addDoc(collection(db, 'leave_ledger'), {
                staffId: staffId.trim().toUpperCase(),
                projectId: selectedProjectId,
                leaveType,
                startDate,
                endDate,
                status: 'PENDING', // Leaves start as pending approval
                createdBy: auth.currentUser?.email || 'Unknown User',
                createdAt: new Date().toISOString()
            });

            await AuditLogger.log('LEAVE_REQUESTED', 'HR_LEAVE', { staffId: staffId.trim().toUpperCase(), leaveType, startDate, endDate }, undefined, selectedProjectId);

            setMessage({ text: `Successfully requested ${leaveType} leave for ${staffId}!`, type: 'success' });
            setStaffId('');
            setStartDate('');
            setEndDate('');
        } catch (error: any) {
            console.error('Leave Request Failed:', error);
            setMessage({ text: error.message || 'Leave Request Failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plane className="w-4 h-4 text-emerald-600" /> Leave Register
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
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Leave Type</label>
                        <select 
                            value={leaveType}
                            onChange={e => setLeaveType(e.target.value as any)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="CASUAL">Casual Leave</option>
                            <option value="SICK">Sick Leave</option>
                            <option value="PAID">Paid Leave</option>
                            <option value="UNPAID">Unpaid Leave</option>
                            <option value="EMERGENCY">Emergency Leave</option>
                        </select>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Start Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">End Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs font-bold text-blue-800">
                        {selectedProjectId 
                            ? `Target Project: ${selectedProjectId}. This leave will be logged against the active site.`
                            : `⚠️ WARNING: No project is locked. You must lock a project to register a leave request.`}
                    </p>
                </div>

                <button 
                    type="submit"
                    disabled={loading || !selectedProjectId}
                    className="w-full py-3 bg-[#0b1b29] hover:bg-[#132a40] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
                >
                    {loading ? 'Submitting Request...' : `Submit Leave Request`}
                </button>
            </form>
        </div>
    );
};

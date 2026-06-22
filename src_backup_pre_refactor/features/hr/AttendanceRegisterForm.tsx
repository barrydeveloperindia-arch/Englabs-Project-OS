import React, { useState } from 'react';
import { db, auth } from '@services/firebase';
import { collection, doc, addDoc } from 'firebase/firestore';

import { CalendarCheck } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const AttendanceRegisterForm: React.FC = () => {
    const selectedProjectId = 'GENERAL';
    const [staffId, setStaffId] = useState('');
    const [status, setStatus] = useState<'PRESENT' | 'ABSENT' | 'HALF-DAY'>('PRESENT');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffId.trim()) return;

        if (!selectedProjectId) {
            setMessage({ text: 'Error: A project must be locked to log attendance.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await addDoc(collection(db, 'attendance_ledger'), {
                staffId: staffId.trim().toUpperCase(),
                projectId: selectedProjectId,
                status,
                date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                createdBy: auth.currentUser?.email || 'Unknown User',
                createdAt: new Date().toISOString()
            });

            await AuditLogger.log('ATTENDANCE_LOGGED', 'HR_ATTENDANCE', { staffId: staffId.trim().toUpperCase(), status, date: new Date().toISOString().split('T')[0] }, undefined, selectedProjectId);

            setMessage({ text: `Successfully logged attendance for ${staffId}!`, type: 'success' });
            setStaffId('');
        } catch (error: any) {
            console.error('Attendance Failed:', error);
            setMessage({ text: error.message || 'Attendance Failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600" /> Daily Attendance Log
            </h3>

            {message.text && (
                <div className={`p-3 rounded-lg text-xs font-bold mb-4 ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
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
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</label>
                        <select 
                            value={status}
                            onChange={e => setStatus(e.target.value as any)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="PRESENT">Present</option>
                            <option value="HALF-DAY">Half-Day</option>
                            <option value="ABSENT">Absent</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs font-bold text-blue-800">
                        {selectedProjectId 
                            ? `Target Project: ${selectedProjectId}. Staff will be logged to this project site.`
                            : `⚠️ WARNING: No project is locked. You must lock a project to take attendance.`}
                    </p>
                </div>

                <button 
                    type="submit"
                    disabled={loading || !selectedProjectId}
                    className="w-full py-3 bg-[#0b1b29] hover:bg-[#132a40] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
                >
                    {loading ? 'Logging...' : `Log Attendance`}
                </button>
            </form>
        </div>
    );
};

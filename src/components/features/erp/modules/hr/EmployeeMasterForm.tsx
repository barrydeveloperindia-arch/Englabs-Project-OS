import React, { useState } from 'react';
import { db, auth } from '@services/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { UserPlus } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const EmployeeMasterForm: React.FC = () => {
    const [staffId, setStaffId] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('Engineer');
    const [department, setDepartment] = useState('Civil');
    const [baseSalary, setBaseSalary] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffId.trim() || !name.trim() || !baseSalary || baseSalary <= 0) return;

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const masterRef = doc(db, 'staff_master', staffId.trim().toUpperCase());
            
            await setDoc(masterRef, {
                staffId: staffId.trim().toUpperCase(),
                name: name.trim(),
                role,
                department,
                baseSalary: Number(baseSalary),
                status: 'ACTIVE',
                createdBy: auth.currentUser?.email || 'Unknown User',
                createdAt: new Date().toISOString()
            });

            await AuditLogger.log('STAFF_REGISTERED', 'HR_STAFF', { staffId: staffId.trim().toUpperCase(), name: name.trim(), role, department, baseSalary: Number(baseSalary) }, masterRef.id);

            setMessage({ text: `Successfully registered Employee ${name}!`, type: 'success' });
            setStaffId('');
            setName('');
            setBaseSalary('');
        } catch (error: any) {
            console.error('Registration Failed:', error);
            setMessage({ text: error.message || 'Registration Failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" /> Employee Registration
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
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Full Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Department</label>
                        <select 
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="Civil">Civil</option>
                            <option value="Electrical">Electrical</option>
                            <option value="Plumbing">Plumbing</option>
                            <option value="Architecture">Architecture</option>
                            <option value="Management">Management</option>
                        </select>
                    </div>

                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Base Salary (₹)</label>
                        <input 
                            type="number" 
                            value={baseSalary}
                            onChange={e => setBaseSalary(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                            placeholder="0"
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#0b1b29] hover:bg-[#132a40] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
                >
                    {loading ? 'Registering...' : `Register Employee`}
                </button>
            </form>
        </div>
    );
};

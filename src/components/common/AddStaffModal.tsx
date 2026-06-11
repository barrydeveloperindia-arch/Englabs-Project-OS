import React, { useState } from 'react';
import { X, UserPlus, Sparkles } from 'lucide-react';

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string) => void;
    existingStaff: string[];
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({ isOpen, onClose, onAdd, existingStaff }) => {
    const [staffName, setStaffName] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = staffName.trim();
        if (!trimmedName) {
            setError('Staff name cannot be empty.');
            return;
        }
        if (existingStaff.some(name => name.toLowerCase() === trimmedName.toLowerCase())) {
            setError('This staff member already exists.');
            return;
        }
        onAdd(trimmedName);
        setStaffName('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 print:hidden">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-600">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 tracking-tight">Add Staff Member</h2>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Register New Operator</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                        <input 
                            required
                            autoFocus
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all text-slate-800 placeholder-slate-400"
                            placeholder="Enter operator / staff name"
                            value={staffName}
                            onChange={e => {
                                setStaffName(e.target.value);
                                if (error) setError('');
                            }}
                        />
                        {error && (
                            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider pl-1 animate-pulse">
                                {error}
                            </p>
                        )}
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-[#0e4368] hover:bg-[#0b3350] text-white font-black py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-950/10 text-[10px] uppercase tracking-widest"
                    >
                        <Sparkles className="w-3.5 h-3.5" /> Register Staff
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddStaffModal;

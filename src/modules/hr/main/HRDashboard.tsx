import React, { useState } from 'react';
import { 
    Users, 
    UserCheck, 
    UserMinus, 
    Clock, 
    ShieldCheck, 
    Download, 
    Search
} from 'lucide-react';
import { AttendanceRegisterForm } from './AttendanceRegisterForm';
import { STAFF_ROSTER } from '@shared/utils/config/constants';

// Simulated daily data for visual fidelity
const mockTodayLogs = [
    { id: 1, staffId: 'EMP-1001', name: 'Gaurav Kumar', role: 'Store Keeper', status: 'PRESENT', checkIn: '08:45 AM', project: 'GENERAL' },
    { id: 2, staffId: 'EMP-1004', name: 'Sagar', role: 'Machine Operator', status: 'PRESENT', checkIn: '08:50 AM', project: 'C4465' },
    { id: 3, staffId: 'EMP-1011', name: 'Rahul', role: 'Helper', status: 'HALF-DAY', checkIn: '09:15 AM', project: 'C4851' },
    { id: 4, staffId: 'EMP-1007', name: 'Ramesh', role: 'Welder', status: 'ABSENT', checkIn: '-', project: '-' },
    { id: 5, staffId: 'EMP-1015', name: 'Amit', role: 'Fitter', status: 'PRESENT', checkIn: '08:55 AM', project: 'C4922' },
];

export const HRDashboard: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLogs = mockTodayLogs.filter(log => 
        log.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
            {/* HEADER */}
            <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 shadow-sm z-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">HR Operations Center</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Staff & Attendance</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search Roster..." 
                            className="bg-slate-50 border border-slate-100 pl-12 pr-6 py-3 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all w-[300px] text-slate-800 placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto space-y-10">
                    
                    {/* STATS STRIP */}
                    <div className="grid grid-cols-4 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Users className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Total Active Staff</p>
                            <p className="text-3xl font-black text-slate-900 relative">{STAFF_ROSTER.length || 38}</p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <UserCheck className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Present Today</p>
                            <p className="text-3xl font-black text-emerald-600 relative">
                                32
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <UserMinus className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                    <UserMinus className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Absent / On Leave</p>
                            <p className="text-3xl font-black text-rose-600 relative">4</p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-amber-500">
                                <Clock className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Pending Overtime (Hrs)</p>
                            <p className="text-3xl font-black text-amber-600 relative flex items-baseline gap-2">
                                14.5
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-10">
                        {/* LEFT COLUMN: REGISTRATION TERMINAL */}
                        <div className="col-span-4 space-y-8">
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Manual Check-In</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized Log Terminal</p>
                                    </div>
                                </div>
                                
                                <AttendanceRegisterForm />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: DAILY ROSTER TABLE */}
                        <div className="col-span-8">
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-[700px]">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live Daily Roster</h2>
                                        <p className="text-xs font-bold text-slate-400 mt-1">Showing {filteredLogs.length} verified logs for today</p>
                                    </div>
                                    <button className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all font-bold text-[11px] uppercase tracking-wider">
                                        <Download className="w-4 h-4" /> Export Report
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1 custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Staff Info</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Project / Site</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5 align-middle">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                                                                <span className="text-xs font-black text-slate-600">{log.name.charAt(0)}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900">{log.name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] font-black text-slate-400 font-mono">{log.staffId}</span>
                                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                                    <span className="text-[10px] font-bold text-slate-500">{log.role}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 align-middle">
                                                        {log.project && log.project !== '-' ? (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                                                                {log.project}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm font-bold text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5 align-middle text-center">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                            log.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                                                            log.status === 'HALF-DAY' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-rose-100 text-rose-700'
                                                        }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 align-middle text-right">
                                                        <span className="text-xs font-black text-slate-900">{log.checkIn}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredLogs.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold text-sm">
                                                        No staff records found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HRDashboard;

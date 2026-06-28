import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    UserCheck, 
    UserMinus, 
    Clock, 
    ShieldCheck, 
    ShieldAlert,
    ShieldQuestion,
    Download, 
    Search,
    ScanFace,
    Fingerprint,
    CreditCard,
    User,
    Monitor,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AttendanceRegisterForm } from './AttendanceRegisterForm';
import { STAFF_ROSTER } from '@shared/utils/config/constants';
import UserManagement, { UserRecord, LoginHistoryRecord } from './UserManagement';
import { HRDocuments } from './HRDocuments';


interface AttendanceLog {
    id: number;
    staffId: string;
    name: string;
    role: string;
    status: string;
    checkIn: string;
    project: string;
    method?: string;
    confidence?: number | null;
}

interface StatsData {
    totalActiveStaff: number;
    presentToday: number;
    absentToday: number;
    pendingOvertime: number;
}

// ── Status badge matching AuraLock style ──
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, { label: string, bg: string, Icon: React.ComponentType<any> }> = {
        'PRESENT': { label: 'Present', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', Icon: ShieldCheck },
        'ABSENT': { label: 'Absent', bg: 'bg-red-500/10 text-red-600 border-red-500/20', Icon: ShieldAlert },
        'HALF-DAY': { label: 'Half-Day', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', Icon: ShieldQuestion },
        'ON_TIME': { label: 'On Time', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', Icon: ShieldCheck },
        'LATE': { label: 'Late', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', Icon: Clock },
    };
    const s = map[status] || { label: status, bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20', Icon: ShieldQuestion };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.bg}`}>
            <s.Icon className="w-3 h-3" />
            {s.label}
        </span>
    );
};

// ── Sortable header component ──
const SortHeader: React.FC<{ 
    label: string; 
    col: string; 
    activeCol: string; 
    dir: 'asc' | 'desc'; 
    onSort: (col: string) => void;
    className?: string;
}> = ({ label, col, activeCol, dir, onSort, className = '' }) => {
    const isActive = activeCol === col;
    return (
        <th 
            onClick={() => onSort(col)}
            className={`px-8 py-5 text-[10px] font-black text-slate-450 text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer select-none hover:text-slate-600 transition-colors ${className}`}
        >
            <div className="flex items-center gap-1.5">
                {label}
                {isActive ? (
                    dir === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-400" />
                )}
            </div>
        </th>
    );
};

// ── Method badge matching AuraLock style ──
const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
    const map: Record<string, { label: string, Icon: React.ComponentType<any>, cls: string }> = {
        face: { label: 'Face', Icon: ScanFace, cls: 'text-blue-600 bg-blue-50/50 border-blue-100/50' },
        fingerprint: { label: 'Fingerprint', Icon: Fingerprint, cls: 'text-violet-600 bg-violet-50/50 border-violet-100/50' },
        remote: { label: 'Remote', Icon: Monitor, cls: 'text-emerald-600 bg-emerald-50/50 border-emerald-100/50' },
        rfid: { label: 'RFID', Icon: CreditCard, cls: 'text-teal-600 bg-teal-50/50 border-teal-100/50' },
        manual: { label: 'Manual', Icon: User, cls: 'text-slate-500 bg-slate-50 border-slate-100' },
    };
    const m = map[method?.toLowerCase()] || { label: method || '-', Icon: User, cls: 'text-slate-500 bg-slate-50 border-slate-100' };
    
    if (method === '-' || !method) {
        return <span className="text-slate-300 text-xs font-bold">—</span>;
    }
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wide ${m.cls}`}>
            <m.Icon className="w-3 h-3" />
            {m.label}
        </span>
    );
};

// ── Confidence bar matching AuraLock style ──
const ConfidenceBar: React.FC<{ value: number | null | undefined }> = ({ value }) => {
    if (value == null) return <span className="text-slate-300 text-xs font-bold">—</span>;
    const pct = Math.round(value <= 1.0 ? value * 100 : value);
    const color = pct >= 80 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' : pct >= 60 ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]';
    return (
        <div className="flex items-center gap-2 w-24">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/30">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 w-8 text-right">{pct}%</span>
        </div>
    );
};

interface HRDashboardProps {
    currentView?: string;
    setCurrentView?: (view: string) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ currentView, setCurrentView }) => {
    const [activeTab, setActiveTab] = useState<'today' | 'monthly' | 'employees' | 'documents'>(() => {
        if (currentView === 'HR_MASTER') return 'employees';
        if (currentView === 'HR_DOCUMENTS') return 'documents';
        return 'today';
    });

    useEffect(() => {
        if (currentView === 'HR_MASTER') {
            setActiveTab('employees');
        } else if (currentView === 'HR_DOCUMENTS') {
            setActiveTab('documents');
        } else if (currentView === 'ATTENDANCE') {
            setActiveTab(prev => prev === 'monthly' ? 'monthly' : 'today');
        }
    }, [currentView]);

    // User credentials state for UserManagement
    const [users, setUsers] = useState<UserRecord[]>(() => {
        try {
            const saved = localStorage.getItem('englabs_user_credentials');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to load user credentials from localStorage:", e);
        }
        
        // Default initial credentials
        const initialUsers: UserRecord[] = [
            {
                id: '1',
                name: 'Admin',
                role: 'ADMIN',
                assignedApp: 'ALL',
                pin: '9999',
                enabled: true
            },
            ...STAFF_ROSTER.map((name, index) => ({
                id: String(index + 2),
                name: name,
                role: 'STAFF' as const,
                assignedApp: 'PROJECTS' as const,
                pin: String(1000 + index),
                enabled: true
            }))
        ];
        localStorage.setItem('englabs_user_credentials', JSON.stringify(initialUsers));
        return initialUsers;
    });

    const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>(() => {
        try {
            const saved = localStorage.getItem('englabs_login_history');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to load login history from localStorage:", e);
        }
        return [];
    });

    const handleUpdateUsers = (updatedUsers: UserRecord[]) => {
        setUsers(updatedUsers);
        localStorage.setItem('englabs_user_credentials', JSON.stringify(updatedUsers));
    };

    const handleClearHistory = () => {
        setLoginHistory([]);
        localStorage.removeItem('englabs_login_history');
    };

    // Today's Live view states
    const [searchQuery, setSearchQuery] = useState('');
    const [rosterLogs, setRosterLogs] = useState<AttendanceLog[]>([]);
    const [stats, setStats] = useState<StatsData>({
        totalActiveStaff: 38,
        presentToday: 0,
        absentToday: 0,
        pendingOvertime: 14.5
    });
    const [loading, setLoading] = useState(true);

    // Monthly view states
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [historyStatusFilter, setHistoryStatusFilter] = useState('');
    const [historyMethodFilter, setHistoryMethodFilter] = useState('');
    const [historySortCol, setHistorySortCol] = useState('date');
    const [historySortDir, setHistorySortDir] = useState<'asc' | 'desc'>('desc');
    const [historyPage, setHistoryPage] = useState(1);
    const historyPageSize = 10;

    const [historyStartDate, setHistoryStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // First day of current month (IST split safe)
        return d.toISOString().split('T')[0];
    });
    const [historyEndDate, setHistoryEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const fetchLiveAttendance = async () => {
        try {
            const res = await fetch('/api/attendance/live');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setRosterLogs(data.roster);
                    setStats(data.stats);
                }
            }
        } catch (e) {
            console.error("Error fetching live EAT attendance:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistoryAttendance = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/attendance/history?startDate=${historyStartDate}&endDate=${historyEndDate}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setHistoryLogs(data.data);
                    setHistoryPage(1); // Reset to first page when new data is fetched
                }
            }
        } catch (e) {
            console.error("Error fetching historical attendance:", e);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveAttendance();
        
        // Polling: refresh every 15 seconds to keep it hmesha live updated
        const interval = setInterval(fetchLiveAttendance, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab === 'monthly') {
            fetchHistoryAttendance();
        }
    }, [activeTab, historyStartDate, historyEndDate]);

    const filteredLogs = rosterLogs.filter(log => 
        log.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSortHistory = (col: string) => {
        if (historySortCol === col) {
            setHistorySortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setHistorySortCol(col);
            setHistorySortDir('desc');
        }
        setHistoryPage(1);
    };

    const filteredHistoryLogs = useMemo(() => {
        let logs = Array.isArray(historyLogs) ? [...historyLogs] : [];

        // Search filter
        if (historySearchQuery.trim()) {
            const q = historySearchQuery.toLowerCase();
            logs = logs.filter(l => 
                l.name.toLowerCase().includes(q) || 
                l.staffId.toLowerCase().includes(q) ||
                l.role.toLowerCase().includes(q)
            );
        }

        // Status filter
        if (historyStatusFilter) {
            logs = logs.filter(l => l.status === historyStatusFilter);
        }

        // Method filter
        if (historyMethodFilter) {
            logs = logs.filter(l => l.method?.toLowerCase() === historyMethodFilter.toLowerCase());
        }

        // Sorting
        logs.sort((a, b) => {
            let valA = a[historySortCol];
            let valB = b[historySortCol];

            if (valA == null) return historySortDir === 'asc' ? 1 : -1;
            if (valB == null) return historySortDir === 'asc' ? -1 : 1;

            if (typeof valA === 'string') {
                return historySortDir === 'asc' 
                    ? valA.localeCompare(valB) 
                    : valB.localeCompare(valA);
            } else {
                return historySortDir === 'asc' 
                    ? (valA as number) - (valB as number) 
                    : (valB as number) - (valA as number);
            }
        });

        return logs;
    }, [historyLogs, historySearchQuery, historyStatusFilter, historyMethodFilter, historySortCol, historySortDir]);

    const paginatedHistoryLogs = useMemo(() => {
        const start = (historyPage - 1) * historyPageSize;
        return filteredHistoryLogs.slice(start, start + historyPageSize);
    }, [filteredHistoryLogs, historyPage]);

    const totalHistoryPages = Math.ceil(filteredHistoryLogs.length / historyPageSize);

    const handleExportMonthlyExcel = () => {
        if (filteredHistoryLogs.length === 0) return;
        
        const flatData = filteredHistoryLogs.map((log, idx) => ({
            'Sr. No.': idx + 1,
            'Staff ID': log.staffId,
            'Name': log.name,
            'Role': log.role,
            'Date': log.date,
            'Check In': log.checkIn,
            'Check Out': log.checkOut,
            'Work Hours': log.workingHours != null ? `${log.workingHours} hrs` : '—',
            'Status': log.status === 'ON_TIME' ? 'On Time' : log.status === 'LATE' ? 'Late' : log.status,
            'Method': log.method,
            'Project Site': log.project
        }));

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Attendance");

        const maxWidths = Object.keys(flatData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...flatData.map(row => String(row[key as keyof typeof row] || '').length)) + 2
        }));
        worksheet['!cols'] = maxWidths;

        XLSX.writeFile(workbook, `Monthly_Attendance_${historyStartDate}_to_${historyEndDate}.xlsx`);
    };

    const monthlyStats = useMemo(() => {
        const totalLogs = filteredHistoryLogs.length;
        const presentLogs = filteredHistoryLogs.filter(l => l.checkIn !== '-');
        const presentCount = presentLogs.length;
        
        // Late Count
        const lateCount = filteredHistoryLogs.filter(l => l.status === 'LATE').length;
        
        // On Time Rate
        const onTimeCount = filteredHistoryLogs.filter(l => l.status === 'ON_TIME').length;
        const onTimeRate = presentCount > 0 ? Math.round((onTimeCount / presentCount) * 100) : 0;
        
        // Average Working Hours
        const logsWithHours = filteredHistoryLogs.filter(l => l.workingHours != null);
        const avgHours = logsWithHours.length > 0 
            ? (logsWithHours.reduce((acc, curr) => acc + curr.workingHours, 0) / logsWithHours.length).toFixed(1)
            : '0.0';
            
        return {
            totalLogs,
            lateCount,
            onTimeRate,
            avgHours
        };
    }, [filteredHistoryLogs]);

    const applyPreset = (preset: 'today' | 'week' | 'month' | '30days') => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        if (preset === 'today') {
            // Start is today, end is today
        } else if (preset === 'week') {
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
        } else if (preset === 'month') {
            start.setDate(1);
        } else if (preset === '30days') {
            start.setDate(today.getDate() - 30);
        }

        setHistoryStartDate(start.toISOString().split('T')[0]);
        setHistoryEndDate(end.toISOString().split('T')[0]);
    };

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
                    {activeTab === 'today' ? (
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
                    ) : activeTab === 'monthly' ? (
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search History..." 
                                className="bg-slate-50 border border-slate-100 pl-12 pr-6 py-3 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all w-[300px] text-slate-800 placeholder:text-slate-400"
                                value={historySearchQuery}
                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                            />
                        </div>
                    ) : null}
                </div>
            </header>

            {/* TABS SELECTOR */}
            <div className="bg-white border-b border-slate-100 px-10 py-3 shrink-0 flex gap-6 z-10 shadow-sm">
                <button
                    onClick={() => {
                        setActiveTab('today');
                        if (setCurrentView) setCurrentView('ATTENDANCE');
                    }}
                    className={`pb-2 text-sm font-black uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'today'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Today's Live Stream
                </button>
                <button
                    onClick={() => {
                        setActiveTab('monthly');
                        if (setCurrentView) setCurrentView('ATTENDANCE');
                    }}
                    className={`pb-2 text-sm font-black uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'monthly'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Monthly Registry & Analytics
                </button>
                <button
                    onClick={() => {
                        setActiveTab('employees');
                        if (setCurrentView) setCurrentView('HR_MASTER');
                    }}
                    className={`pb-2 text-sm font-black uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'employees'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Employee Master
                </button>
                <button
                    onClick={() => {
                        setActiveTab('documents');
                        if (setCurrentView) setCurrentView('HR_DOCUMENTS');
                    }}
                    className={`pb-2 text-sm font-black uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'documents'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    HR Documents & Letters
                </button>
            </div>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto space-y-10">
                    
                    {activeTab === 'today' && (
                        <>
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
                                    <p className="text-3xl font-black text-slate-900 relative">{loading ? '...' : stats.totalActiveStaff}</p>
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
                                        {loading ? '...' : stats.presentToday}
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
                                    <p className="text-3xl font-black text-rose-600 relative">{loading ? '...' : stats.absentToday}</p>
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
                                        </div>

                                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm">
                                                    <tr>
                                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Staff Info</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Project / Site</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Method</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Confidence</th>
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
                                                            <td className="px-8 py-5 align-middle">
                                                                <MethodBadge method={log.method || '-'} />
                                                            </td>
                                                            <td className="px-8 py-5 align-middle">
                                                                <ConfidenceBar value={log.confidence} />
                                                            </td>
                                                            <td className="px-8 py-5 align-middle text-center">
                                                                <StatusBadge status={log.status} />
                                                            </td>
                                                            <td className="px-8 py-5 align-middle text-right">
                                                                <span className="text-xs font-black text-slate-900">{log.checkIn}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {filteredLogs.length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-bold text-sm">
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
                        </>
                    )}

                    {activeTab === 'monthly' && (
                        <>
                            {/* MONTHLY STATS STRIP */}
                            <div className="grid grid-cols-4 gap-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Calendar className="w-24 h-24" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Total Logs</p>
                                    <p className="text-3xl font-black text-slate-900 relative">{historyLoading ? '...' : monthlyStats.totalLogs}</p>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Clock className="w-24 h-24" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Avg Work Hours</p>
                                    <p className="text-3xl font-black text-indigo-600 relative">{historyLoading ? '...' : `${monthlyStats.avgHours} hrs`}</p>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <ShieldCheck className="w-24 h-24" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">On-Time Rate</p>
                                    <p className="text-3xl font-black text-emerald-600 relative">{historyLoading ? '...' : `${monthlyStats.onTimeRate}%`}</p>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Clock className="w-24 h-24" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Late Check-Ins</p>
                                    <p className="text-3xl font-black text-amber-600 relative">{historyLoading ? '...' : monthlyStats.lateCount}</p>
                                </div>
                            </div>

                            {/* FILTERS & SEARCH ROW */}
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-6 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date Range</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="date" 
                                            value={historyStartDate}
                                            onChange={(e) => setHistoryStartDate(e.target.value)}
                                            className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition-all w-full"
                                        />
                                        <span className="text-xs text-slate-400 font-bold">to</span>
                                        <input 
                                            type="date" 
                                            value={historyEndDate}
                                            onChange={(e) => setHistoryEndDate(e.target.value)}
                                            className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition-all w-full"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => applyPreset('today')}
                                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200/65 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                        >
                                            Today
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset('week')}
                                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200/65 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                        >
                                            This Week
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset('month')}
                                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200/65 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                        >
                                            This Month
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset('30days')}
                                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200/65 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                        >
                                            Last 30 Days
                                        </button>
                                    </div>
                                </div>

                                <div className="min-w-[150px]">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                    <select
                                        value={historyStatusFilter}
                                        onChange={(e) => setHistoryStatusFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition-all w-full cursor-pointer"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="ON_TIME">On Time</option>
                                        <option value="LATE">Late</option>
                                        <option value="ABSENT">Absent</option>
                                    </select>
                                </div>

                                <div className="min-w-[150px]">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Method</label>
                                    <select
                                        value={historyMethodFilter}
                                        onChange={(e) => setHistoryMethodFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition-all w-full cursor-pointer"
                                    >
                                        <option value="">All Methods</option>
                                        <option value="face">Face</option>
                                        <option value="fingerprint">Fingerprint</option>
                                        <option value="rfid">RFID</option>
                                        <option value="remote">Remote</option>
                                        <option value="manual">Manual</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleExportMonthlyExcel}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <Download className="w-4 h-4" /> Export Excel
                                </button>
                            </div>

                            {/* HISTORICAL ATTENDANCE TABLE */}
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col min-h-[500px]">
                                <div className="overflow-x-auto flex-1 custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm">
                                            <tr>
                                                <SortHeader label="Date" col="date" activeCol={historySortCol} dir={historySortDir} onSort={handleSortHistory} />
                                                <SortHeader label="Staff Info" col="name" activeCol={historySortCol} dir={historySortDir} onSort={handleSortHistory} />
                                                <SortHeader label="Check In" col="checkIn" activeCol={historySortCol} dir={historySortDir} onSort={handleSortHistory} />
                                                <SortHeader label="Check Out" col="checkOut" activeCol={historySortCol} dir={historySortDir} onSort={handleSortHistory} />
                                                <SortHeader label="Work Hours" col="workingHours" activeCol={historySortCol} dir={historySortDir} onSort={handleSortHistory} />
                                                <SortHeader label="Status" col="status" activeCol={historySortCol} dir={historySortDir} onSort={handleSortHistory} className="text-center" />
                                                <SortHeader label="Method" col="method" activeCol={historySortCol} dir={historySortDir} onSort={handleSortHistory} />
                                                <SortHeader label="Project Site" col="project" activeCol={historySortCol} dir={historySortDir} onSort={handleSortHistory} className="text-right" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {historyLoading ? (
                                                <tr>
                                                    <td colSpan={8} className="px-8 py-12 text-center text-slate-400 font-bold text-sm">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                                                            <span>Loading historical records...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : paginatedHistoryLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5 align-middle">
                                                        <span className="text-xs font-mono font-bold text-slate-600">{log.date}</span>
                                                    </td>
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
                                                        <span className="text-xs font-black text-slate-900">{log.checkIn}</span>
                                                    </td>
                                                    <td className="px-8 py-5 align-middle">
                                                        <span className="text-xs font-black text-slate-900">{log.checkOut}</span>
                                                    </td>
                                                    <td className="px-8 py-5 align-middle">
                                                        <span className="text-xs font-mono font-bold text-slate-600">
                                                            {log.workingHours != null ? `${Number(log.workingHours).toFixed(1)} hrs` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 align-middle text-center">
                                                        <StatusBadge status={log.status} />
                                                    </td>
                                                    <td className="px-8 py-5 align-middle">
                                                        <MethodBadge method={log.method} />
                                                    </td>
                                                    <td className="px-8 py-5 align-middle text-right">
                                                        {log.project && log.project !== '-' ? (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                                                                {log.project}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm font-bold text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {!historyLoading && paginatedHistoryLogs.length === 0 && (
                                                <tr>
                                                    <td colSpan={8} className="px-8 py-12 text-center text-slate-400 font-bold text-sm">
                                                        No historical records found for the selected filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* PAGINATION CONTROLS */}
                                {totalHistoryPages > 1 && (
                                    <div className="p-6 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                                        <p className="text-xs font-bold text-slate-500">
                                            Showing <span className="text-slate-900">{((historyPage - 1) * historyPageSize) + 1}</span> to{' '}
                                            <span className="text-slate-900">
                                                {Math.min(historyPage * historyPageSize, filteredHistoryLogs.length)}
                                            </span>{' '}
                                            of <span className="text-slate-900">{filteredHistoryLogs.length}</span> records
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={historyPage === 1}
                                                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-xs font-bold text-slate-900 px-2">
                                                Page {historyPage} of {totalHistoryPages}
                                            </span>
                                            <button
                                                disabled={historyPage === totalHistoryPages}
                                                onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                                                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'employees' && (
                        <UserManagement 
                            users={users}
                            history={loginHistory}
                            onUpdateUsers={handleUpdateUsers}
                            onClearHistory={handleClearHistory}
                        />
                    )}

                    {activeTab === 'documents' && (
                        <HRDocuments />
                    )}
                </div>
            </main>
        </div>
    );
};

export default HRDashboard;

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Banknote,
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
    RefreshCw,
    Edit2,
    XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { AttendanceRegisterForm } from './AttendanceRegisterForm';
import { STAFF_ROSTER } from '@shared/utils/config/constants';
import UserManagement, { UserRecord, LoginHistoryRecord } from './UserManagement';
import { HRDocuments } from './HRDocuments';


const SALARY_CONFIG: Record<string, { daily_rate: number; ot_hourly_rate: number; designation: string }> = {
    "Anurag Panchal": { daily_rate: 1000.00, ot_hourly_rate: 111.11, designation: "Operations Engineer" },
    "Arjun Tiwari": { daily_rate: 500.00, ot_hourly_rate: 55.56, designation: "Site Engineer" },
    "Devarshu": { daily_rate: 333.33, ot_hourly_rate: 37.04, designation: "Site Engineer" },
    "Gaurav Panchal": { daily_rate: 1400.00, ot_hourly_rate: 155.56, designation: "Project Manager" },
    "Gurpreet Singh": { daily_rate: 500.00, ot_hourly_rate: 55.56, designation: "Site Engineer" },
    "Jamshed": { daily_rate: 900.00, ot_hourly_rate: 100.00, designation: "Logistics Lead" },
    "Kunwarlal": { daily_rate: 566.67, ot_hourly_rate: 62.96, designation: "Site Engineer" },
    "Poonam": { daily_rate: 800.00, ot_hourly_rate: 88.89, designation: "Junior Engineer" },
    "Rajinder": { daily_rate: 400.00, ot_hourly_rate: 44.44, designation: "Sr. Engineer" },
    "Ram": { daily_rate: 566.67, ot_hourly_rate: 62.96, designation: "Maintenance Staff" },
    "Ratnesh": { daily_rate: 766.67, ot_hourly_rate: 85.19, designation: "Project Lead" },
    "Roshni": { daily_rate: 800.00, ot_hourly_rate: 88.89, designation: "Office Admin" },
    "Shiv Narayan": { daily_rate: 850.00, ot_hourly_rate: 94.44, designation: "Assistant Engineer" },
    "Shreeya": { daily_rate: 950.00, ot_hourly_rate: 105.56, designation: "Office Coordinator" },
    "Subham Kumar": { daily_rate: 1333.33, ot_hourly_rate: 148.15, designation: "Project Engineer" },
    "Thakur Parshad": { daily_rate: 533.33, ot_hourly_rate: 59.26, designation: "Project Manager" },
    "Uditanshu": { daily_rate: 333.33, ot_hourly_rate: 37.04, designation: "Site Engineer" },
    "Kusum": { daily_rate: 333.33, ot_hourly_rate: 37.04, designation: "Maintenance Staff" }
};

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
        fingerprint: { label: 'Register', Icon: Fingerprint, cls: 'text-violet-600 bg-violet-50/50 border-violet-100/50' },
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
    const [historyStaffFilter, setHistoryStaffFilter] = useState('');
    const [monthlySubTab, setMonthlySubTab] = useState<'biometric' | 'register' | 'cl'>('biometric');

     // Casual Leave (CL) ledger state
     const [clLedger, setClLedger] = useState<Record<string, { used: number; available: number }>>(() => {
         try {
             const saved = localStorage.getItem('englabs_cl_ledger_v2');
             if (saved) return JSON.parse(saved);
         } catch (e) {
             console.error("Failed to load CL ledger:", e);
         }
         const defaultLedger: Record<string, { used: number; available: number }> = {
             "Anurag Panchal": { used: 8, available: 1 },
             "Arjun Tiwari": { used: 3, available: 1 },
             "Ram": { used: 1, available: 1 },
             "Ratnesh": { used: 0, available: 1 },
             "Subham Kumar": { used: 0, available: 1 },
             "Rajinder": { used: 1, available: 1 }
         };
         localStorage.setItem('englabs_cl_ledger_v2', JSON.stringify(defaultLedger));
         return defaultLedger;
     });
 
     const [editingCL, setEditingCL] = useState<{ name: string; used: number; available: number } | null>(null);
 
     const handleUpdateCL = (name: string, used: number, available: number) => {
         const updated = {
             ...clLedger,
             [name]: { used, available }
         };
         setClLedger(updated);
         localStorage.setItem('englabs_cl_ledger_v2', JSON.stringify(updated));
     };

    const clStats = useMemo(() => {
        let totalUsed = 0;
        let totalAvailable = 0;
        let activeLeaveTakers = 0;
        
        Object.entries(clLedger).forEach(([name, data]) => {
            totalUsed += data.used;
            totalAvailable += data.available;
            if (data.used > 0) activeLeaveTakers++;
        });
        
        return {
            totalUsed,
            totalAvailable,
            totalAllocated: totalUsed + totalAvailable,
            activeLeaveTakers
        };
    }, [clLedger]);

    const filteredCLEmployees = useMemo(() => {
        const allNames = Object.keys(SALARY_CONFIG).sort();
        if (!historySearchQuery.trim()) return allNames;
        const q = historySearchQuery.toLowerCase();
        return allNames.filter(name => name.toLowerCase().includes(q));
    }, [historySearchQuery]);

    const uniqueStaffList = useMemo(() => {
        const names = new Set<string>();
        if (Array.isArray(historyLogs)) {
            historyLogs.forEach(l => {
                if (l.name) names.add(l.name);
            });
        }
        return Array.from(names).sort();
    }, [historyLogs]);
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

        // Client-side de-duplication:
        // Keep only one entry per employee, date, and method.
        const seenKeys = new Map<string, any>();
        logs.forEach(log => {
            const key = `${log.staffId || log.name}_${log.date}_${log.method?.toLowerCase()}`;
            const existing = seenKeys.get(key);
            if (!existing) {
                seenKeys.set(key, log);
            } else {
                const existingHasOut = existing.checkOut && existing.checkOut !== '-';
                const newHasOut = log.checkOut && log.checkOut !== '-';
                if (newHasOut && !existingHasOut) {
                    seenKeys.set(key, log);
                }
            }
        });
        logs = Array.from(seenKeys.values());

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

        // Filter by monthly sub-tab: Biometric vs Register
        if (monthlySubTab === 'biometric') {
            logs = logs.filter(l => l.method?.toLowerCase() === 'face');
        } else if (monthlySubTab === 'register') {
            logs = logs.filter(l => l.method?.toLowerCase() === 'fingerprint');
        }

        // Staff filter
        if (historyStaffFilter) {
            logs = logs.filter(l => l.name === historyStaffFilter);
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
    }, [historyLogs, historySearchQuery, historyStatusFilter, historyMethodFilter, historyStaffFilter, historySortCol, historySortDir, monthlySubTab]);

    const paginatedHistoryLogs = useMemo(() => {
        const start = (historyPage - 1) * historyPageSize;
        return filteredHistoryLogs.slice(start, start + historyPageSize);
    }, [filteredHistoryLogs, historyPage]);

    const totalHistoryPages = Math.ceil(filteredHistoryLogs.length / historyPageSize);

    const staffSalaryDetails = useMemo(() => {
        if (!historyStaffFilter) return null;
        
        const normalized = historyStaffFilter.trim().toLowerCase();
        const mappedName = 
            normalized === 'arjun' ? 'Arjun Tiwari' :
            normalized === 'anurag' ? 'Anurag Panchal' :
            (normalized === 'devanshu' || normalized === 'devarshu') ? 'Devarshu' :
            normalized === 'gaurav' ? 'Gaurav Panchal' :
            normalized === 'gurpreet' ? 'Gurpreet Singh' :
            normalized === 'kunwarlal' ? 'Kunwarlal' :
            normalized === 'kusum' ? 'Kusum' :
            normalized === 'rajinder' ? 'Rajinder' :
            normalized === 'ram' ? 'Ram' :
            normalized === 'ratnesh' ? 'Ratnesh' :
            normalized === 'shubham' ? 'Subham Kumar' :
            normalized === 'thakur' ? 'Thakur Parshad' :
            normalized === 'uditanshu' ? 'Uditanshu' :
            historyStaffFilter;

        const config = SALARY_CONFIG[mappedName] || { daily_rate: 900, ot_hourly_rate: 135, designation: "Staff Member" };
        
        // Count days present (status !== 'ABSENT')
        const presentLogs = filteredHistoryLogs.filter(l => l.status !== 'ABSENT');
        const daysPresent = presentLogs.length;
        
        const totalDays = 30;
        const weeklyOffs = 4;
        const workingDays = 26;
        
        const absences = Math.max(0, workingDays - daysPresent);
        const paidDays = Math.max(0, workingDays - absences);
        
        // Calculate overtime hours
        let otHours = 0;
        filteredHistoryLogs.forEach(l => {
            if (l.status === 'ABSENT' || !l.workingHours) return;
            
            const dt = new Date(l.date);
            const isSunday = dt.getDay() === 0;
            const hrs = Number(l.workingHours);
            
            if (isSunday) {
                if (hrs > 0) {
                    otHours += hrs;
                }
            } else {
                if (hrs > 9.0) {
                    otHours += (hrs - 9.0);
                }
            }
        });
        
        const basicSalary = paidDays * config.daily_rate;
        const otPay = otHours * config.ot_hourly_rate;
        const netPay = basicSalary + otPay;
        
        return {
            designation: config.designation,
            dailyRate: config.daily_rate,
            otHourlyRate: config.ot_hourly_rate,
            daysPresent,
            paidDays,
            otHours,
            basicSalary,
            otPay,
            netPay
        };
    }, [filteredHistoryLogs, historyStaffFilter]);

    const handleDownloadPayslipPDF = () => {
        if (!historyStaffFilter) return;
        
        const employeeName = historyStaffFilter;
        const downloadUrl = `/api/payroll/pdf?name=${encodeURIComponent(employeeName)}&type=${monthlySubTab}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${employeeName}_June_2026_Payslip.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSharePayslipWhatsApp = () => {
        if (!historyStaffFilter || !staffSalaryDetails) return;
        
        const details = staffSalaryDetails;
        let message = `*ENGLABS INDIA PRIVATE LIMITED*\n`;
        message += `*SALARY STATEMENT / PAYSLIP — JUNE 2026*\n`;
        message += `---------------------------------------\n`;
        message += `*Employee Name:* ${historyStaffFilter}\n`;
        message += `*Designation:* ${details.designation}\n`;
        message += `*Working Days:* 26 Days\n`;
        message += `*Paid Days:* ${details.paidDays} Days\n`;
        message += `*Days Present:* ${details.daysPresent} Days\n`;
        message += `*Register Type:* ${monthlySubTab === 'biometric' ? 'Biometric (AuraLock)' : 'Manual Register'}\n`;
        message += `---------------------------------------\n`;
        message += `*Basic Salary:* Rs. ${details.basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${details.paidDays} Days @ Rs. ${details.dailyRate}/day)\n`;
        message += `*Overtime Pay:* Rs. ${details.otPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${details.otHours.toFixed(2)} Hrs @ Rs. ${details.otHourlyRate}/hr)\n`;
        message += `*Total Gross:* Rs. ${details.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        message += `---------------------------------------\n`;
        message += `*Net Disbursement:* *Rs. ${details.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n`;
        message += `---------------------------------------\n`;
        message += `_This is an auto-generated digital salary statement._\n`;
        
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleExportMonthlyExcel = () => {
        if (filteredHistoryLogs.length === 0) return;
        
        const flatData = filteredHistoryLogs.map((log, idx) => {
            const clInfo = clLedger[log.name] || { used: 0, available: 0 };
            return {
                'Sr. No.': idx + 1,
                'Staff ID': log.staffId,
                'Name': log.name,
                'Role': log.role,
                'Date': log.date,
                'Check In': log.checkIn,
                'Check Out': log.checkOut,
                'Work Hours': log.workingHours != null ? `${log.workingHours} hrs` : '—',
                'Status': log.status === 'ON_TIME' ? 'On Time' : log.status === 'LATE' ? 'Late' : log.status,
                'Method': log.method === 'face' ? 'Face Scan' : 'Fingerprint',
                'Register Type': log.method === 'face' ? 'Biometric (AuraLock)' : 'Manual Register',
                'Project Site': log.project,
                'CL Used (Taken)': clInfo.used,
                'CL Available (Balance)': clInfo.available,
                'Total CL': clInfo.used + clInfo.available
            };
        });

        const workbook = XLSX.utils.book_new();

        // Sheet 1: Attendance
        const worksheet = XLSX.utils.json_to_sheet(flatData);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Attendance");

        // Sheet 2: Casual Leaves (CL)
        const clData = Object.keys(SALARY_CONFIG).sort().map((name, idx) => {
            const data = clLedger[name] || { used: 0, available: 0 };
            return {
                'Sr. No.': idx + 1,
                'Employee Name': name,
                'Designation': SALARY_CONFIG[name]?.designation || 'Staff',
                'CL Used (Taken)': data.used,
                'CL Available (Balance)': data.available,
                'Total CL Limit': data.used + data.available
            };
        });
        const clWorksheet = XLSX.utils.json_to_sheet(clData);
        XLSX.utils.book_append_sheet(workbook, clWorksheet, "Casual Leaves (CL)");

        // Column width adjustment for Sheet 1
        const maxWidths = Object.keys(flatData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...flatData.map(row => String(row[key as keyof typeof row] || '').length)) + 2
        }));
        worksheet['!cols'] = maxWidths;

        // Column width adjustment for Sheet 2
        const clMaxWidths = Object.keys(clData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...clData.map(row => String(row[key as keyof typeof row] || '').length)) + 2
        }));
        clWorksheet['!cols'] = clMaxWidths;

        XLSX.writeFile(workbook, `Monthly_Attendance_and_CL_Report_${historyStartDate}_to_${historyEndDate}.xlsx`);
    };

    const handleShareWhatsApp = () => {
        if (filteredHistoryLogs.length === 0) return;
        
        const empSummary: Record<string, { present: number, late: number, absent: number, totalHours: number }> = {};
        
        filteredHistoryLogs.forEach(log => {
            if (!empSummary[log.name]) {
                empSummary[log.name] = { present: 0, late: 0, absent: 0, totalHours: 0 };
            }
            const isAbsent = log.status === 'ABSENT' || (!log.checkIn || log.checkIn === '-');
            if (isAbsent) {
                empSummary[log.name].absent += 1;
            } else {
                empSummary[log.name].present += 1;
                if (log.status === 'LATE') {
                    empSummary[log.name].late += 1;
                }
                if (log.workingHours != null) {
                    const hrs = typeof log.workingHours === 'string' ? parseFloat(log.workingHours) : log.workingHours;
                    if (!isNaN(hrs)) {
                        empSummary[log.name].totalHours += hrs;
                    }
                }
            }
        });
        
        const methodLabel = historyMethodFilter === 'face' ? 'AuraLock Face Scan' : historyMethodFilter === 'fingerprint' ? 'Manual Register' : 'All Methods';
        
        let text = `📋 *EngLabs Attendance Summary*\n`;
        text += `📅 Range: *${historyStartDate} to ${historyEndDate}*\n`;
        text += `🔒 Source: *${methodLabel}*\n\n`;
        
        Object.entries(empSummary).sort().forEach(([name, stats]) => {
            text += `👤 *${name}*:\n`;
            text += `   • Status: ${stats.present} Present (incl. ${stats.late} Late) | ${stats.absent} Absent\n`;
            if (stats.totalHours > 0) {
                text += `   • Total Hours: ${stats.totalHours.toFixed(1)} hrs\n`;
            }
            text += `\n`;
        });
        
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleExportCLExcel = () => {
        const flatData = Object.keys(SALARY_CONFIG).sort().map((name, idx) => {
            const data = clLedger[name] || { used: 0, available: 0 };
            return {
                'Sr. No.': idx + 1,
                'Employee Name': name,
                'Designation': SALARY_CONFIG[name]?.designation || 'Staff',
                'CL Used (Taken)': data.used,
                'CL Available (Balance)': data.available,
                'Total CL Limit': data.used + data.available
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Casual Leaves (CL)");

        const maxWidths = Object.keys(flatData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...flatData.map(row => String(row[key as keyof typeof row] || '').length)) + 2
        }));
        worksheet['!cols'] = maxWidths;

        XLSX.writeFile(workbook, `Casual_Leaves_Registry_Jan_to_Jun_2026.xlsx`);
    };

    const handleShareCLWhatsApp = () => {
        let text = `📋 *EngLabs Casual Leaves (CL) Summary*\n`;
        text += `📅 Period: *Jan 2026 to Present*\n\n`;
        
        Object.keys(SALARY_CONFIG).sort().forEach((name) => {
            const data = clLedger[name];
            if (data && (data.used > 0 || data.available > 0)) {
                text += `👤 *${name}*:\n`;
                text += `   • CL Used: ${data.used} | Balance: ${data.available} | Total: ${data.used + data.available}\n\n`;
            }
        });
        
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleExportPDF = () => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Add title and header styling
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(14, 67, 104); // #0E4368
        doc.text("ENGLABS INDIA PRIVATE LIMITED", 15, 15);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate color
        const period = `Period: ${historyStartDate} to ${historyEndDate}`;
        
        if (monthlySubTab === 'cl') {
            doc.text("CASUAL LEAVES (CL) REGISTRY REPORT", 15, 22);
            doc.text(`Period: January 2026 to June 2026`, 15, 27);
            
            // Draw table header
            doc.setFontSize(9);
            doc.setFont("Helvetica", "bold");
            doc.setFillColor(14, 67, 104);
            doc.rect(15, 33, 267, 8, "F");
            doc.setTextColor(255, 255, 255);
            doc.text("S.No.", 17, 38.5);
            doc.text("Employee Name", 30, 38.5);
            doc.text("Designation", 100, 38.5);
            doc.text("CL Used (Taken)", 160, 38.5);
            doc.text("CL Available (Balance)", 200, 38.5);
            doc.text("Total CL Limit", 245, 38.5);
            
            // Draw rows
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(30, 41, 59);
            let y = 41;
            filteredCLEmployees.forEach((name, idx) => {
                const data = clLedger[name] || { used: 0, available: 0 };
                const designation = SALARY_CONFIG[name]?.designation || "Staff Member";
                
                // Draw background row stripes
                if (idx % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(15, y, 267, 7, "F");
                }
                
                // Draw bottom border
                doc.setDrawColor(226, 232, 240);
                doc.line(15, y + 7, 282, y + 7);
                
                doc.text(String(idx + 1), 17, y + 5);
                doc.text(name, 30, y + 5);
                doc.text(designation, 100, y + 5);
                doc.text(String(data.used), 160, y + 5);
                doc.text(String(data.available), 200, y + 5);
                doc.text(String(data.used + data.available), 245, y + 5);
                
                y += 7;
                // Page break if too many rows
                if (y > 185 && idx < filteredCLEmployees.length - 1) {
                    doc.addPage();
                    y = 20;
                }
            });
            
            doc.save(`Casual_Leaves_Report_Jan_to_Jun_2026.pdf`);
        } else {
            const sourceLabel = monthlySubTab === 'biometric' ? 'Biometric (AuraLock)' : 'Manual Register';
            doc.text(`ATTENDANCE REGISTER REPORT - ${sourceLabel.toUpperCase()}`, 15, 22);
            doc.text(period, 15, 27);
            
            // Draw table header
            doc.setFontSize(9);
            doc.setFont("Helvetica", "bold");
            doc.setFillColor(14, 67, 104);
            doc.rect(15, 33, 267, 8, "F");
            doc.setTextColor(255, 255, 255);
            doc.text("S.No.", 17, 38.5);
            doc.text("Date", 30, 38.5);
            doc.text("Employee Name", 60, 38.5);
            doc.text("Role", 110, 38.5);
            doc.text("Check In", 160, 38.5);
            doc.text("Check Out", 190, 38.5);
            doc.text("Work Hours", 220, 38.5);
            doc.text("Status", 250, 38.5);
            
            // Draw rows
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(30, 41, 59);
            let y = 41;
            
            filteredHistoryLogs.forEach((log, idx) => {
                // Draw background row stripes
                if (idx % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(15, y, 267, 7, "F");
                }
                
                // Draw bottom border
                doc.setDrawColor(226, 232, 240);
                doc.line(15, y + 7, 282, y + 7);
                
                doc.text(String(idx + 1), 17, y + 5);
                doc.text(log.date || '—', 30, y + 5);
                doc.text(log.name || '—', 60, y + 5);
                doc.text(log.role || '—', 110, y + 5);
                doc.text(log.checkIn || '—', 160, y + 5);
                doc.text(log.checkOut || '—', 190, y + 5);
                doc.text(log.workingHours != null ? `${Number(log.workingHours).toFixed(1)} hrs` : '—', 220, y + 5);
                doc.text(log.status === 'ON_TIME' ? 'On Time' : log.status === 'LATE' ? 'Late' : log.status === 'ABSENT' ? 'Absent' : log.status || '—', 250, y + 5);
                
                y += 7;
                // Page break if too many rows
                if (y > 185 && idx < filteredHistoryLogs.length - 1) {
                    doc.addPage();
                    y = 20;
                }
            });
            
            doc.save(`Attendance_Report_${historyStartDate}_to_${historyEndDate}.pdf`);
        }
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
                            {/* REGISTER TYPE SELECTOR SUB-TAB SWITCHER */}
                            <div className="flex gap-2 p-1.5 bg-slate-100/70 border border-slate-200/50 rounded-2xl w-fit mb-8 shrink-0">
                                <button
                                    onClick={() => setMonthlySubTab('biometric')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        monthlySubTab === 'biometric' 
                                            ? 'bg-[#0b1b29] text-white shadow-md' 
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <ScanFace className="w-4 h-4" /> Biometric (AuraLock)
                                </button>
                                <button
                                    onClick={() => setMonthlySubTab('register')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        monthlySubTab === 'register' 
                                            ? 'bg-[#0b1b29] text-white shadow-md' 
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" /> Manual Register
                                </button>
                                <button
                                    onClick={() => setMonthlySubTab('cl')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        monthlySubTab === 'cl' 
                                            ? 'bg-[#0b1b29] text-white shadow-md' 
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <UserMinus className="w-4 h-4" /> Casual Leaves (CL)
                                </button>
                            </div>

                            {/* MONTHLY STATS STRIP */}
                            {monthlySubTab === 'cl' ? (
                                <div className="grid grid-cols-4 gap-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <UserMinus className="w-24 h-24" />
                                        </div>
                                        <div className="flex justify-between items-start mb-4 relative">
                                            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                                <UserMinus className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Total CL Used</p>
                                        <p className="text-3xl font-black text-rose-600 relative">{clStats.totalUsed}</p>
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
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Remaining Balance</p>
                                        <p className="text-3xl font-black text-emerald-600 relative">{clStats.totalAvailable}</p>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Calendar className="w-24 h-24" />
                                        </div>
                                        <div className="flex justify-between items-start mb-4 relative">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Total Allocated</p>
                                        <p className="text-3xl font-black text-blue-600 relative">{clStats.totalAllocated}</p>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Users className="w-24 h-24" />
                                        </div>
                                        <div className="flex justify-between items-start mb-4 relative">
                                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                                <Users className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Active Leave Takers</p>
                                        <p className="text-3xl font-black text-amber-600 relative">{clStats.activeLeaveTakers}</p>
                                    </div>
                                </div>
                            ) : (
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
                            )}

                            {/* PAYSLIP SUMMARY PANEL */}
                            {monthlySubTab !== 'cl' && historyStaffFilter && staffSalaryDetails && (
                                <div className="bg-[#0b1b29] text-white p-8 rounded-[2.5rem] mt-8 shadow-lg border border-slate-800 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Banknote className="w-48 h-48" />
                                    </div>
                                    
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                    {monthlySubTab === 'biometric' ? '🔒 Biometric Slip' : '📝 Register Slip'}
                                                </span>
                                                <span className="text-slate-400 text-xs font-bold">June 2026 Period</span>
                                            </div>
                                            <h4 className="text-2xl font-black">{historyStaffFilter}</h4>
                                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{staffSalaryDetails.designation}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-8">
                                            <div className="border-r border-slate-800 pr-8">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Basic Salary</span>
                                                <span className="text-lg font-black text-slate-100">
                                                    Rs. {staffSalaryDetails.basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[10px] text-slate-500 block mt-0.5">{staffSalaryDetails.paidDays} Days @ Rs.{staffSalaryDetails.dailyRate}</span>
                                            </div>

                                            <div className="border-r border-slate-800 pr-8">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Overtime Pay</span>
                                                <span className="text-lg font-black text-slate-100">
                                                    Rs. {staffSalaryDetails.otPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[10px] text-slate-500 block mt-0.5">{staffSalaryDetails.otHours.toFixed(1)} Hrs @ Rs.{staffSalaryDetails.otHourlyRate}</span>
                                            </div>

                                            <div>
                                                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black block mb-1">Net Disbursement</span>
                                                <span className="text-2xl font-black text-emerald-400">
                                                    Rs. {staffSalaryDetails.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 w-full lg:w-auto">
                                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                                <button
                                                    onClick={handleDownloadPayslipPDF}
                                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer justify-center"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download PDF Payslip
                                                </button>

                                                <button
                                                    onClick={handleSharePayslipWhatsApp}
                                                    className="flex items-center gap-2 px-6 py-3 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer justify-center"
                                                >
                                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.805-9.801.002-2.618-1.01-5.08-2.859-6.93C16.378 2.023 13.918.995 11.3 1.002 5.897 1.002 1.5 5.4 1.498 10.806c-.001 1.51.393 2.986 1.144 4.3l-.95 3.47 3.563-.934zM19.145 15.5c-.328-.164-1.944-.959-2.242-1.068-.298-.11-.515-.164-.73.164-.215.328-.832 1.068-1.02 1.287-.188.219-.375.246-.703.082-.328-.164-1.385-.51-2.637-1.628-.974-.87-1.632-1.944-1.823-2.272-.192-.328-.02-.505.144-.669.148-.148.328-.382.492-.574.164-.192.219-.328.328-.547.11-.219.055-.411-.027-.574-.082-.164-.73-1.758-.999-2.406-.263-.632-.53-.547-.73-.557L9.3 5.92c-.219.008-.477.086-.73.344-.254.258-.969.949-.969 2.316s.996 2.684 1.137 2.875c.141.191 1.961 2.992 4.75 4.199.664.287 1.18.459 1.582.586.668.213 1.277.184 1.758.113.535-.08 1.944-.795 2.219-1.564.273-.769.273-1.43.191-1.564-.082-.134-.298-.215-.626-.379z"/>
                                                    </svg>
                                                    Share on WhatsApp
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-bold block mt-1 italic text-center lg:text-left">
                                                💡 Tip: Click "Download PDF Payslip" first, then attach or drag-and-drop the PDF file into your WhatsApp chat window.
                                            </p>
                                        </div>
                                     </div>
                                 </div>
                             )}

                            {/* FILTERS & SEARCH ROW */}
                            {monthlySubTab === 'cl' ? (
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center w-full">
                                    <p className="text-xs font-bold text-slate-500">
                                        Managing casual leaves (CL) allocations. Click edit button to change values.
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleExportCLExcel}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                                        >
                                            <Download className="w-4 h-4" /> Export CL Excel
                                        </button>
                                        <button
                                            onClick={handleExportPDF}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                                        >
                                            <Download className="w-4 h-4" /> Export CL PDF
                                        </button>
                                        <button
                                            onClick={handleShareCLWhatsApp}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                                        >
                                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.503-5.729-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437.002 9.861-4.416 9.863-9.864.001-2.639-1.025-5.12-2.887-6.985C16.386 1.89 13.91 .862 11.27.862c-5.436 0-9.86 4.418-9.863 9.866-.001 1.83.488 3.619 1.416 5.19L1.83 22.08l6.417-1.68zM18.25 14.88c-.34-.17-2.015-.995-2.324-1.107-.31-.11-.535-.17-.76.17-.225.34-.87 1.107-1.066 1.333-.197.225-.394.25-.733.08-.34-.17-1.432-.527-2.73-1.685-1.01-.9-1.69-2.01-1.89-2.348-.198-.34-.02-.524.15-.694.152-.152.34-.396.51-.594.17-.198.225-.34.34-.565.113-.226.056-.424-.028-.593-.084-.17-.76-1.832-1.04-2.507-.272-.656-.55-.567-.76-.578-.19-.01-.41-.01-.62-.01-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.28 3.26.15.21 2.22 3.4 5.39 4.76.75.32 1.34.52 1.79.67.76.24 1.45.2 1.99.12.61-.09 2.01-.82 2.3-1.61.28-.79.28-1.47.2-1.61-.09-.13-.31-.22-.65-.39z"/>
                                            </svg> Share WhatsApp
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-6 items-end w-full">
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
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Staff Member</label>
                                        <select
                                            value={historyStaffFilter}
                                            onChange={(e) => setHistoryStaffFilter(e.target.value)}
                                            className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition-all w-full cursor-pointer"
                                        >
                                            <option value="">All Staff</option>
                                            {uniqueStaffList.map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
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

                                    <button
                                        onClick={handleExportMonthlyExcel}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                                    >
                                        <Download className="w-4 h-4" /> Export Excel
                                    </button>

                                    <button
                                        onClick={handleExportPDF}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                                    >
                                        <Download className="w-4 h-4" /> Export PDF
                                    </button>

                                    <button
                                        onClick={handleShareWhatsApp}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                                        title="Share on WhatsApp"
                                    >
                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.503-5.729-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437.002 9.861-4.416 9.863-9.864.001-2.639-1.025-5.12-2.887-6.985C16.386 1.89 13.91 .862 11.27.862c-5.436 0-9.86 4.418-9.863 9.866-.001 1.83.488 3.619 1.416 5.19L1.83 22.08l6.417-1.68zM18.25 14.88c-.34-.17-2.015-.995-2.324-1.107-.31-.11-.535-.17-.76.17-.225.34-.87 1.107-1.066 1.333-.197.225-.394.25-.733.08-.34-.17-1.432-.527-2.73-1.685-1.01-.9-1.69-2.01-1.89-2.348-.198-.34-.02-.524.15-.694.152-.152.34-.396.51-.594.17-.198.225-.34.34-.565.113-.226.056-.424-.028-.593-.084-.17-.76-1.832-1.04-2.507-.272-.656-.55-.567-.76-.578-.19-.01-.41-.01-.62-.01-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.28 3.26.15.21 2.22 3.4 5.39 4.76.75.32 1.34.52 1.79.67.76.24 1.45.2 1.99.12.61-.09 2.01-.82 2.3-1.61.28-.79.28-1.47.2-1.61-.09-.13-.31-.22-.65-.39z"/>
                                        </svg> Share WhatsApp
                                    </button>
                                </div>
                            )}

                            {/* HISTORICAL ATTENDANCE TABLE */}
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col min-h-[500px]">
                                {monthlySubTab === 'cl' ? (
                                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">S.No.</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee Name</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Designation</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">CL Used (Taken)</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">CL Available (Balance)</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Total CL Limit</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredCLEmployees.map((name, idx) => {
                                                    const data = clLedger[name] || { used: 0, available: 0 };
                                                    const designation = SALARY_CONFIG[name]?.designation || "Staff Member";
                                                    
                                                    return (
                                                        <tr key={name} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-8 py-5 align-middle">
                                                                <span className="text-xs font-mono font-bold text-slate-600">{idx + 1}</span>
                                                            </td>
                                                            <td className="px-8 py-5 align-middle">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                                                                        <span className="text-xs font-black text-slate-600">{name.charAt(0)}</span>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-slate-900">{name}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 align-middle">
                                                                <span className="text-xs font-black text-slate-600">{designation}</span>
                                                            </td>
                                                            <td className="px-8 py-5 align-middle text-center">
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-rose-500/10 text-rose-600 border-rose-500/20">
                                                                    Used: {data.used}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5 align-middle text-center">
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                                    Balance: {data.available}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5 align-middle text-center">
                                                                <span className="text-xs font-mono font-black text-slate-900">
                                                                    {data.used + data.available}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5 align-middle text-right">
                                                                <button
                                                                    onClick={() => setEditingCL({ name, used: data.used, available: data.available })}
                                                                    className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all inline-flex items-center justify-center cursor-pointer"
                                                                    title="Edit CL details"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <>
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
                                    </>
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

                    {editingCL && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingCL(null)} />
                            
                            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Casual Leaves (CL)</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{editingCL.name}</p>
                                    </div>
                                    <button onClick={() => setEditingCL(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm cursor-pointer">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUpdateCL(editingCL.name, editingCL.used, editingCL.available);
                                    setEditingCL(null);
                                }} className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CL Used (Taken so far)</label>
                                            <input 
                                                type="number" 
                                                required 
                                                min={0}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all" 
                                                value={editingCL.used}
                                                onChange={e => setEditingCL({ ...editingCL, used: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CL Available (Remaining Balance)</label>
                                            <input 
                                                type="number" 
                                                required 
                                                min={0}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all" 
                                                value={editingCL.available}
                                                onChange={e => setEditingCL({ ...editingCL, available: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => setEditingCL(null)}
                                            className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            className="flex-1 bg-[#0e4368] text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest cursor-pointer"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default HRDashboard;

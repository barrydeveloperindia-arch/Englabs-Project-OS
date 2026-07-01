import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, 
    Filter, 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    Download, 
    Edit2, 
    Smartphone, 
    XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

export interface SIMRecord {
    simId: string;
    assignedTo: string;
    mobileNumber: string;
    department: string;
    operator: string;
    deviceType: string;
    usageType: string;
    rechargeDate: string;
    plan: string;
    amount: string;
    validityDays: number;
    expiryDate: string;
    doneBy: string;
    remarks: string;
}

const DEFAULT_SIM_DATA: SIMRecord[] = [
    { simId: 'SIM001', assignedTo: 'CB Anand sir', mobileNumber: '9815087934', department: 'CEO', operator: 'Airtel', deviceType: 'A & A', usageType: 'Official', rechargeDate: '2026-05-01', plan: 'Family Pack', amount: '1199', validityDays: 30, expiryDate: '2026-06-01', doneBy: '', remarks: '' },
    { simId: 'SIM002', assignedTo: 'Swati Mam', mobileNumber: '9815047934', department: 'CEO', operator: 'Airtel', deviceType: 'A & A', usageType: 'Official', rechargeDate: '', plan: '', amount: '', validityDays: 0, expiryDate: '', doneBy: '', remarks: '' },
    { simId: 'SIM003', assignedTo: 'Salil Sir', mobileNumber: '9876457934', department: 'CEO', operator: 'Airtel', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '2026-05-01', plan: 'Family Pack', amount: 'DONE', validityDays: 30, expiryDate: '2026-06-01', doneBy: '', remarks: '' },
    { simId: 'SIM004', assignedTo: 'Larissa mam', mobileNumber: '8699515403', department: 'CEO', operator: 'Airtel', deviceType: 'Sky5 Hotal', usageType: 'Official', rechargeDate: '2025-09-08', plan: 'yearly', amount: '2249', validityDays: 365, expiryDate: '2026-09-08', doneBy: '', remarks: '' },
    { simId: 'SIM005', assignedTo: 'Bharat Sir', mobileNumber: '9878407934', department: 'CEO', operator: 'Airtel', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '2026-05-01', plan: 'Family Pack', amount: 'DONE', validityDays: 30, expiryDate: '2026-06-01', doneBy: '', remarks: '' },
    { simId: 'SIM006', assignedTo: 'Shreeya Mam', mobileNumber: '9115895673', department: 'CEO', operator: 'VI', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '', plan: '', amount: '', validityDays: 0, expiryDate: '', doneBy: '', remarks: '' },
    { simId: 'SIM007', assignedTo: 'Gaurav', mobileNumber: '9779395934', department: 'DGPS / Civil', operator: 'Airtel', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '2025-12-18', plan: 'yearly', amount: '2249', validityDays: 365, expiryDate: '2026-12-18', doneBy: '', remarks: '' },
    { simId: 'SIM008', assignedTo: 'Gaurav / Shubham', mobileNumber: '8360841498', department: 'HR / Admin / Opretions', operator: 'JIO', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '2026-01-13', plan: 'yearly', amount: '3599', validityDays: 365, expiryDate: '2027-01-13', doneBy: '', remarks: '' },
    { simId: 'SIM009', assignedTo: 'Ratnesh', mobileNumber: '8360585697', department: 'Accounts', operator: 'JIO', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '', plan: 'Monthly', amount: '299', validityDays: 28, expiryDate: '2026-05-21', doneBy: '', remarks: '' },
    { simId: 'SIM012', assignedTo: 'Shubham', mobileNumber: '9815573934', department: 'Marketing-1', operator: 'JIO', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '', plan: 'yearly', amount: '2249', validityDays: 365, expiryDate: '2027-02-25', doneBy: '', remarks: '' },
    { simId: 'SIM013', assignedTo: 'Shubham', mobileNumber: '7814352421', department: 'Marketing-2', operator: 'JIO', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '2026-05-05', plan: 'yearly', amount: '3599', validityDays: 365, expiryDate: '2027-03-20', doneBy: '', remarks: '' },
    { simId: 'SIM014', assignedTo: 'Anurag', mobileNumber: '6284953120', department: 'Machine Room', operator: 'JIO', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '2026-06-04', plan: 'Monthly', amount: '346', validityDays: 28, expiryDate: '2026-07-02', doneBy: '', remarks: '' },
    { simId: 'SIM017', assignedTo: 'Ratnesh', mobileNumber: '7589277985', department: 'Accounts', operator: 'BSNL', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '', plan: '', amount: '', validityDays: 0, expiryDate: '', doneBy: '', remarks: '' },
    { simId: 'SIM018', assignedTo: 'Kusum Didi', mobileNumber: '7380139684', department: 'House Keeping', operator: 'BSNL', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '', plan: '', amount: '', validityDays: 0, expiryDate: '', doneBy: '', remarks: '' },
    { simId: 'SIM019', assignedTo: 'Arjun Tiwari', mobileNumber: '7837484439', department: 'Store', operator: 'VI', deviceType: 'Englabs', usageType: 'Official', rechargeDate: '2026-05-25', plan: 'Expired Plan', amount: '—', validityDays: 30, expiryDate: '2026-06-25', doneBy: '', remarks: 'Outgoing & Incoming Stopped' },
    { simId: 'SIM019_Sky', assignedTo: 'KEVEL / Reception', mobileNumber: '8146407934', department: 'SKY5', operator: 'SKY5', deviceType: 'Sky5 Hotal', usageType: 'Official', rechargeDate: '', plan: '', amount: '', validityDays: 0, expiryDate: '', doneBy: '', remarks: '' },
    { simId: 'SIM020', assignedTo: 'School Van', mobileNumber: '8901084836', department: 'School Van', operator: 'BSNL', deviceType: 'Bright Kids School', usageType: 'Official', rechargeDate: '2025-11-18', plan: 'yearly', amount: '1499', validityDays: 365, expiryDate: '2026-11-18', doneBy: '', remarks: '' },
    { simId: 'SIM021', assignedTo: 'Sunny / Reception', mobileNumber: '9876049652', department: 'School', operator: 'Airtel', deviceType: 'Bright Kids School', usageType: 'Official', rechargeDate: '2026-04-05', plan: 'yearly', amount: '2249', validityDays: 365, expiryDate: '2027-04-05', doneBy: '', remarks: '' }
];

export const SIMCardLedger: React.FC = () => {
    const [sims, setSims] = useState<SIMRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [operatorFilter, setOperatorFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [editingSim, setEditingSim] = useState<SIMRecord | null>(null);

    // Current Date Reference: July 1, 2026
    const currentDateStr = '2026-07-01';
    const currentDate = new Date(currentDateStr);

    useEffect(() => {
        const stored = localStorage.getItem('englabs_sim_ledger_v2');
        if (stored) {
            try {
                setSims(JSON.parse(stored));
            } catch (e) {
                setSims(DEFAULT_SIM_DATA);
            }
        } else {
            setSims(DEFAULT_SIM_DATA);
            localStorage.setItem('englabs_sim_ledger_v2', JSON.stringify(DEFAULT_SIM_DATA));
        }
    }, []);

    const saveSims = (newSims: SIMRecord[]) => {
        setSims(newSims);
        localStorage.setItem('englabs_sim_ledger_v2', JSON.stringify(newSims));
    };

    // Calculate SIM Status details
    const getSimStatus = (sim: SIMRecord) => {
        if (!sim.expiryDate) return { label: 'Unknown', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', daysLeft: null };
        
        const expiry = new Date(sim.expiryDate);
        const diffTime = expiry.getTime() - currentDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: 'Expired', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20', daysLeft: diffDays };
        } else if (diffDays <= 7) {
            return { label: 'Expiring Soon', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', daysLeft: diffDays };
        } else {
            return { label: 'Active', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', daysLeft: diffDays };
        }
    };

    // Filtering and Searching
    const filteredSims = useMemo(() => {
        return sims.filter(sim => {
            const matchesSearch = 
                sim.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sim.mobileNumber.includes(searchQuery) ||
                sim.simId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sim.department.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesOperator = operatorFilter === 'All' || sim.operator === operatorFilter;
            
            const status = getSimStatus(sim);
            const matchesStatus = statusFilter === 'All' || status.label === statusFilter;

            return matchesSearch && matchesOperator && matchesStatus;
        });
    }, [sims, searchQuery, operatorFilter, statusFilter]);

    // Summary Statistics
    const stats = useMemo(() => {
        let expired = 0;
        let expiringSoon = 0;
        let active = 0;
        let unknown = 0;

        sims.forEach(sim => {
            const status = getSimStatus(sim);
            if (status.label === 'Expired') expired++;
            else if (status.label === 'Expiring Soon') expiringSoon++;
            else if (status.label === 'Active') active++;
            else unknown++;
        });

        return { total: sims.length, expired, expiringSoon, active, unknown };
    }, [sims]);

    // Handle updating recharge details
    const handleSaveRecharge = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSim) return;

        // Auto-calculate Expiry Date if Recharge Date and Validity are provided
        let calcExpiry = editingSim.expiryDate;
        if (editingSim.rechargeDate && editingSim.validityDays > 0) {
            const rDate = new Date(editingSim.rechargeDate);
            rDate.setDate(rDate.getDate() + editingSim.validityDays);
            
            // Format to YYYY-MM-DD
            const yyyy = rDate.getFullYear();
            const mm = String(rDate.getMonth() + 1).padStart(2, '0');
            const dd = String(rDate.getDate()).padStart(2, '0');
            calcExpiry = `${yyyy}-${mm}-${dd}`;
        }

        const updatedSims = sims.map(s => 
            s.simId === editingSim.simId 
                ? { ...editingSim, expiryDate: calcExpiry }
                : s
        );

        saveSims(updatedSims);
        setEditingSim(null);
    };

    // Export to Excel
    const exportExcel = () => {
        const data = sims.map(sim => {
            const status = getSimStatus(sim);
            return {
                'SIM ID': sim.simId,
                'Assigned To': sim.assignedTo,
                'Mobile Number': sim.mobileNumber,
                'Department': sim.department,
                'Operator': sim.operator,
                'Device Type': sim.deviceType,
                'Usage Type': sim.usageType,
                'Recharge Date': sim.rechargeDate || 'N/A',
                'Plan': sim.plan || 'N/A',
                'Amount (INR)': sim.amount || 'N/A',
                'Validity (Days)': sim.validityDays || 'N/A',
                'Expiry Date': sim.expiryDate || 'N/A',
                'Status': status.label,
                'Days Remaining': status.daysLeft !== null ? status.daysLeft : 'N/A',
                'Done By': sim.doneBy || 'N/A',
                'Remarks': sim.remarks || 'N/A'
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'SIM Master Data');
        XLSX.writeFile(wb, 'Englabs_SIM_Master_Data.xlsx');
    };

    // Export to PDF
    const exportPDF = () => {
        const doc = new jsPDF('landscape', 'pt', 'a4');
        
        // Brand styling
        doc.setFillColor(14, 67, 104); // Navy
        doc.rect(0, 0, 842, 60, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('ENGLABS ENTERPRISE', 40, 35);
        
        doc.setFontSize(10);
        doc.text('SIM CARD REGISTER & RECHARGE PLANNER', 780, 35, { align: 'right' });

        // Add headers
        doc.setFillColor(248, 250, 252);
        doc.rect(40, 80, 762, 30, 'F');

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(9);
        
        const colWidths = [50, 110, 80, 80, 60, 80, 60, 60, 60, 60, 60];
        const headers = ['SIM ID', 'Assigned To', 'Mobile No.', 'Dept.', 'Operator', 'Plan', 'Amt', 'Recharge', 'Expiry', 'Days left', 'Status'];
        
        let x = 40;
        headers.forEach((h, idx) => {
            doc.text(h, x + 5, 100);
            x += colWidths[idx];
        });

        doc.setFont('helvetica', 'normal');
        let y = 130;

        filteredSims.forEach((sim) => {
            if (y > 500) {
                doc.addPage();
                // Redraw banner on new page
                doc.setFillColor(14, 67, 104);
                doc.rect(0, 0, 842, 60, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('ENGLABS ENTERPRISE', 40, 35);
                doc.setFontSize(10);
                doc.text('SIM CARD REGISTER & RECHARGE PLANNER', 780, 35, { align: 'right' });

                // Redraw table headers
                doc.setFillColor(248, 250, 252);
                doc.rect(40, 80, 762, 30, 'F');
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(9);
                x = 40;
                headers.forEach((h, idx) => {
                    doc.text(h, x + 5, 100);
                    x += colWidths[idx];
                });

                doc.setFont('helvetica', 'normal');
                y = 130;
            }

            const status = getSimStatus(sim);
            const dataRow = [
                sim.simId,
                sim.assignedTo,
                sim.mobileNumber,
                sim.department,
                sim.operator,
                sim.plan || '—',
                sim.amount || '—',
                sim.rechargeDate || '—',
                sim.expiryDate || '—',
                status.daysLeft !== null ? String(status.daysLeft) : '—',
                status.label
            ];

            x = 40;
            doc.setFontSize(8.5);
            dataRow.forEach((val, idx) => {
                doc.text(val, x + 5, y);
                x += colWidths[idx];
            });

            // Draw line
            doc.setDrawColor(226, 232, 240);
            doc.line(40, y + 5, 802, y + 5);

            y += 22;
        });

        // Add page footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text(`Page ${i} of ${pageCount}`, 421, 575, { align: 'center' });
            doc.text(`Generated: ${new Date().toLocaleDateString()} • Englabs Projects`, 802, 575, { align: 'right' });
        }

        doc.save('Englabs_SIM_Ledger_Report.pdf');
    };

    return (
        <div className="space-y-10">
            {/* STATS STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex items-center justify-between hover:scale-[1.02] transition-all duration-300">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total SIMs</h3>
                        <p className="text-3xl font-black text-slate-900 mt-2">{stats.total}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-500">
                        <Smartphone className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex items-center justify-between hover:scale-[1.02] transition-all duration-300">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</h3>
                        <p className="text-3xl font-black text-emerald-600 mt-2">{stats.active}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-500">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex items-center justify-between hover:scale-[1.02] transition-all duration-300">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiring Soon (7d)</h3>
                        <p className="text-3xl font-black text-amber-600 mt-2">{stats.expiringSoon}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl text-amber-500">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex items-center justify-between hover:scale-[1.02] transition-all duration-300">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expired</h3>
                        <p className="text-3xl font-black text-rose-600 mt-2">{stats.expired}</p>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-2xl text-rose-500">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* EXPIRY ALERT BLOCK */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-[2rem] p-8 space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h2 className="text-base font-black tracking-tight">Critical Recharge Expiry Alerts</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Anurag SIM expiring tomorrow */}
                    {sims.filter(s => s.simId === 'SIM014').map(s => {
                        return (
                            <div key={s.simId} className="bg-white border border-rose-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-xs font-black text-rose-600 uppercase tracking-wider">⚠️ Expires Tomorrow ({s.expiryDate})</p>
                                    <h4 className="text-sm font-black text-slate-900 mt-1">{s.assignedTo} ({s.mobileNumber})</h4>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.department} • Operator: {s.operator}</p>
                                </div>
                                <button 
                                    onClick={() => setEditingSim(s)}
                                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-700 transition-colors shadow-sm cursor-pointer border-none"
                                >
                                    Recharge Now
                                </button>
                            </div>
                        );
                    })}

                    {/* Expired SIMs */}
                    {sims.map(s => {
                        const status = getSimStatus(s);
                        if (status.label === 'Expired' && s.simId !== 'SIM014') {
                            return (
                                <div key={s.simId} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                                    <div>
                                        <p className="text-xs font-black text-rose-600 uppercase tracking-wider">🚫 Expired on {s.expiryDate || 'N/A'}</p>
                                        <h4 className="text-sm font-black text-slate-900 mt-1">{s.assignedTo} ({s.mobileNumber})</h4>
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.department} • Operator: {s.operator}</p>
                                    </div>
                                    <button 
                                        onClick={() => setEditingSim(s)}
                                        className="px-4 py-2 bg-[#0e4368] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm cursor-pointer border-none"
                                    >
                                        Recharge Done
                                    </button>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>

            {/* FILTER & REGISTRY GRID */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                {/* Control bar */}
                <div className="p-8 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6 bg-slate-50/50">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search SIM Registry..." 
                                className="bg-white border border-slate-200/60 pl-12 pr-6 py-3 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all w-[260px] text-slate-800"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Operator Filter */}
                        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200/60">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            <select 
                                className="text-xs font-black uppercase tracking-wider bg-transparent outline-none cursor-pointer text-slate-700 border-none"
                                value={operatorFilter}
                                onChange={e => setOperatorFilter(e.target.value)}
                            >
                                <option value="All">All Operators</option>
                                <option value="Airtel">Airtel</option>
                                <option value="JIO">JIO</option>
                                <option value="BSNL">BSNL</option>
                                <option value="VI">VI</option>
                                <option value="SKY5">SKY5</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200/60">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <select 
                                className="text-xs font-black uppercase tracking-wider bg-transparent outline-none cursor-pointer text-slate-700 border-none"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Expiring Soon">Expiring Soon</option>
                                <option value="Expired">Expired</option>
                                <option value="Unknown">Unknown/No Plan</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={exportExcel}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-black py-3 px-5 rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        >
                            Excel
                        </button>
                        <button 
                            onClick={exportPDF}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-black py-3 px-5 rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        >
                            PDF
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[80px]">SIM ID</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[160px]">Assigned To</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recharge Status</th>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[100px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-800">
                            {filteredSims.map(sim => {
                                const status = getSimStatus(sim);
                                return (
                                    <tr key={sim.simId} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="py-5 px-8 font-mono text-xs">{sim.simId}</td>
                                        <td className="py-5 px-6 text-slate-900">{sim.assignedTo}</td>
                                        <td className="py-5 px-6 font-mono">{sim.mobileNumber}</td>
                                        <td className="py-5 px-6 text-slate-500">{sim.department}</td>
                                        <td className="py-5 px-6">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                sim.operator === 'Airtel' ? 'bg-red-50 text-red-600' :
                                                sim.operator === 'JIO' ? 'bg-blue-50 text-blue-600' :
                                                sim.operator === 'BSNL' ? 'bg-green-50 text-green-600' :
                                                'bg-purple-50 text-purple-600'
                                            }`}>
                                                {sim.operator}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 text-slate-600">{sim.plan || '—'}</td>
                                        <td className="py-5 px-6 font-mono text-xs text-slate-600">{sim.expiryDate || '—'}</td>
                                        <td className="py-5 px-6">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            <button 
                                                onClick={() => setEditingSim(sim)}
                                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-all cursor-pointer inline-flex items-center border-none bg-transparent"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredSims.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                                        No SIM records match your search or filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EDIT RECHARGE MODAL */}
            {editingSim && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingSim(null)} />
                    
                    <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Record / Update Recharge</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{editingSim.assignedTo} ({editingSim.mobileNumber})</p>
                            </div>
                            <button onClick={() => setEditingSim(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm cursor-pointer border-none bg-transparent">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRecharge} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all cursor-pointer border-none"
                                        value={editingSim.operator}
                                        onChange={e => setEditingSim({ ...editingSim, operator: e.target.value })}
                                    >
                                        <option value="Airtel">Airtel</option>
                                        <option value="JIO">JIO</option>
                                        <option value="BSNL">BSNL</option>
                                        <option value="VI">VI</option>
                                        <option value="SKY5">SKY5</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                        value={editingSim.department}
                                        onChange={e => setEditingSim({ ...editingSim, department: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Description</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Monthly, yearly, Family Pack"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                        value={editingSim.plan}
                                        onChange={e => setEditingSim({ ...editingSim, plan: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recharge Amount (INR)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 299, 2249"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                        value={editingSim.amount}
                                        onChange={e => setEditingSim({ ...editingSim, amount: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recharge Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all cursor-pointer font-mono"
                                        value={editingSim.rechargeDate}
                                        onChange={e => setEditingSim({ ...editingSim, rechargeDate: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Validity (Days)</label>
                                    <input 
                                        type="number" 
                                        min={0}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                        value={editingSim.validityDays}
                                        onChange={e => setEditingSim({ ...editingSim, validityDays: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Done By / Remarks</label>
                                    <input 
                                        type="text" 
                                        placeholder="Who did the recharge, or other details"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                        value={editingSim.remarks}
                                        onChange={e => setEditingSim({ ...editingSim, remarks: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setEditingSim(null)}
                                    className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest cursor-pointer border-none"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-[#0e4368] text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest cursor-pointer border-none"
                                >
                                    Save Recharge
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

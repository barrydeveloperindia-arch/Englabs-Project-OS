import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, 
    Download, 
    TrendingUp,
    Truck,
    AlertCircle,
    Building2,
    MapPin,
    Package,
    Calendar,
    ListFilter,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { ProjectData } from '@shared/services/project';
import monthlyDataRaw from '../../../data/monthly_patty_cash.json';

interface MonthlyRecord {
    date: string | null;
    details: string;
    cr: number;
    dr: number;
    balance: number;
    projectId: string | null;
    projectDr: number;
}

type MonthlyData = Record<string, MonthlyRecord[]>;

const BillingDashboard: React.FC = () => {
    const [viewMode, setViewMode] = useState<'MASTER' | 'MONTHLY'>('MASTER');
    const [selectedMonth, setSelectedMonth] = useState<string>('Jun_2026');
    const [searchQuery, setSearchQuery] = useState('');
    const [projects, setProjects] = useState<ProjectData[]>([]);

    const monthlyData = monthlyDataRaw as MonthlyData;
    const availableMonths = Object.keys(monthlyData).reverse();

    useEffect(() => {
        const loadProjects = async () => {
            const modules = import.meta.glob('../../../data/*.json');
            const loaded: ProjectData[] = [];
            for (const path in modules) {
                const mod = await modules[path]() as { default: ProjectData };
                if (mod.default && mod.default.financials) {
                    loaded.push(mod.default);
                }
            }
            setProjects(loaded);
        };
        loadProjects();
    }, []);

    const formatCurrency = (val: number | null | undefined) => {
        if (val === null || val === undefined || isNaN(val)) return '₹0';
        return `₹${Math.round(val).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr || dateStr === 'None') return '-';
        return dateStr;
    };

    // ------------- MASTER VIEW LOGIC -------------
    const stats = useMemo(() => {
        let totalDispatchBudget = 0;
        let totalProfitLoss = 0;
        let uniqueVendors = new Set<string>();
        let negativeProjects = 0;

        projects.forEach(project => {
            const f = project.financials;
            if (!f) return;
            if (f.dispatchBudget) totalDispatchBudget += Number(f.dispatchBudget);
            if (f.profitLoss) {
                totalProfitLoss += Number(f.profitLoss);
                if (Number(f.profitLoss) < 0) negativeProjects++;
            }
            if (f.vendorName) uniqueVendors.add(f.vendorName);
        });

        return {
            totalDispatchBudget,
            totalProfitLoss,
            vendorCount: uniqueVendors.size,
            negativeProjects,
            totalProjects: projects.length
        };
    }, [projects]);

    const filteredRecords = useMemo(() => {
        if (!searchQuery) return projects;
        const lowerQ = searchQuery.toLowerCase();
        return projects.filter(p => {
            const f = p.financials;
            return (
                (p.projectId?.toLowerCase() || '').includes(lowerQ) ||
                (p.client?.toLowerCase() || '').includes(lowerQ) ||
                (f?.vendorName?.toLowerCase() || '').includes(lowerQ) ||
                (f?.poNumber?.toLowerCase() || '').includes(lowerQ)
            );
        });
    }, [projects, searchQuery]);

    // ------------- MONTHLY VIEW LOGIC -------------
    const currentMonthRecords = useMemo(() => {
        if (!monthlyData[selectedMonth]) return [];
        return monthlyData[selectedMonth].filter(r => {
            if (!searchQuery) return true;
            const lowerQ = searchQuery.toLowerCase();
            return (
                (r.details?.toLowerCase() || '').includes(lowerQ) ||
                (r.projectId?.toLowerCase() || '').includes(lowerQ)
            );
        });
    }, [selectedMonth, searchQuery, monthlyData]);

    const monthlyStats = useMemo(() => {
        if (!monthlyData[selectedMonth]) return { in: 0, out: 0, net: 0 };
        let totalIn = 0;
        let totalOut = 0;
        monthlyData[selectedMonth].forEach(r => {
            totalIn += r.cr;
            totalOut += r.dr;
        });
        return { in: totalIn, out: totalOut, net: totalIn - totalOut };
    }, [selectedMonth, monthlyData]);

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
            {/* HEADER */}
            <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 shadow-sm z-20">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">FINANCE COMMAND</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Petty Cash & Dispatch Tracking</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* VIEW TOGGLE */}
                    <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
                        <button 
                            onClick={() => setViewMode('MASTER')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                viewMode === 'MASTER' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Truck className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                            Project Master
                        </button>
                        <button 
                            onClick={() => setViewMode('MONTHLY')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                viewMode === 'MONTHLY' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Calendar className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                            Monthly Log
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200"></div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={viewMode === 'MASTER' ? "Search Projects / Vendors..." : "Search Transactions..."}
                            className="bg-slate-50 border border-slate-100 pl-12 pr-6 py-3 rounded-2xl text-sm font-bold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all w-[300px] text-slate-800 placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto space-y-10">
                    
                    {viewMode === 'MASTER' ? (
                        <>
                            {/* STATS STRIP */}
                            <div className="grid grid-cols-4 gap-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Truck className="w-24 h-24" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                            <Package className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Total Dispatch Budget</p>
                                    <p className="text-3xl font-black text-slate-900 relative">{formatCurrency(stats.totalDispatchBudget)}</p>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <TrendingUp className="w-24 h-24" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div className={`p-3 rounded-2xl ${stats.totalProfitLoss >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Net Profit / Loss</p>
                                    <p className={`text-3xl font-black relative ${stats.totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(stats.totalProfitLoss)}
                                    </p>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Building2 className="w-24 h-24" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Active Vendors</p>
                                    <p className="text-3xl font-black text-slate-900 relative">{stats.vendorCount}</p>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-orange-500">
                                        <AlertCircle className="w-24 h-24" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">Overbudget Projects</p>
                                    <p className="text-3xl font-black text-orange-600 relative flex items-baseline gap-2">
                                        {stats.negativeProjects} <span className="text-sm font-bold text-slate-400">/ {stats.totalProjects}</span>
                                    </p>
                                </div>
                            </div>

                            {/* MASTER REGISTER */}
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-[600px]">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Project Dispatch Register</h2>
                                        <p className="text-xs font-bold text-slate-400 mt-1">Showing {filteredRecords.length} synchronized projects</p>
                                    </div>
                                    <button className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all font-bold text-[11px] uppercase tracking-wider">
                                        <Download className="w-4 h-4" /> Export CSV
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1 custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Project</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client Details</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Vendor Details</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Financials</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">P/L Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredRecords.map((project, idx) => {
                                                const f = project.financials!;
                                                const isLoss = (f.profitLoss !== null && f.profitLoss !== undefined && f.profitLoss < 0);
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-8 py-6 align-top">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
                                                                    <Truck className="w-4 h-4 text-orange-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900">{project.projectId}</p>
                                                                    {f.poNumber && f.poNumber !== 'Missing' && (
                                                                        <p className="text-[10px] font-black text-slate-400 mt-1 font-mono">{f.poNumber}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 align-top">
                                                            <p className="text-sm font-black text-slate-800 line-clamp-1">{project.client || 'N/A'}</p>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Registered Client</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 align-top">
                                                            <p className="text-sm font-bold text-slate-700 line-clamp-1">{f.vendorName || 'N/A'}</p>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[200px]">{f.vendorLocation || 'Unknown'}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 align-top">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Proj Cost</span>
                                                                    <span className="text-xs font-black text-slate-900">{formatCurrency(f.totalCost)}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dispatch Budget</span>
                                                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{formatCurrency(f.dispatchBudget)}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 align-top text-right">
                                                            <div className="flex flex-col items-end gap-2">
                                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest ${
                                                                    isLoss ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                                }`}>
                                                                    {formatCurrency(f.profitLoss)}
                                                                </span>
                                                                {f.deliveryFeeMode && f.deliveryFeeMode !== 'Missing' && (
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                                        {f.deliveryFeeMode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* MONTHLY LOG HEADER */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm">
                                        <ListFilter className="w-5 h-5 text-slate-400" />
                                        <select 
                                            className="bg-transparent text-sm font-black text-slate-800 focus:outline-none cursor-pointer"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                        >
                                            {availableMonths.map(m => (
                                                <option key={m} value={m}>{m.replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">
                                        {currentMonthRecords.length} recorded transactions
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl flex items-center gap-3">
                                        <ArrowDownRight className="w-5 h-5" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total In (Cr)</p>
                                            <p className="text-lg font-black">{formatCurrency(monthlyStats.in)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-rose-50 text-rose-700 px-6 py-3 rounded-2xl flex items-center gap-3">
                                        <ArrowUpRight className="w-5 h-5" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Out (Dr)</p>
                                            <p className="text-lg font-black">{formatCurrency(monthlyStats.out)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MONTHLY LOG TABLE */}
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-[700px]">
                                <div className="overflow-y-auto flex-1 custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Transaction Details</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Project ID</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Cr (In)</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Dr (Out)</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right bg-slate-100/50">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {currentMonthRecords.map((record, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-4 align-middle whitespace-nowrap">
                                                        <span className="text-xs font-bold text-slate-500">{formatDate(record.date)}</span>
                                                    </td>
                                                    <td className="px-8 py-4 align-middle">
                                                        <p className="text-sm font-bold text-slate-700 max-w-[400px]">{record.details}</p>
                                                    </td>
                                                    <td className="px-8 py-4 align-middle">
                                                        {record.projectId && record.projectId !== 'None' ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                                                {record.projectId}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-4 align-middle text-right">
                                                        {record.cr > 0 ? (
                                                            <span className="text-sm font-black text-emerald-600">{formatCurrency(record.cr)}</span>
                                                        ) : <span className="text-sm text-slate-300">-</span>}
                                                    </td>
                                                    <td className="px-8 py-4 align-middle text-right">
                                                        {record.dr > 0 ? (
                                                            <span className="text-sm font-black text-rose-600">{formatCurrency(record.dr)}</span>
                                                        ) : <span className="text-sm text-slate-300">-</span>}
                                                    </td>
                                                    <td className="px-8 py-4 align-middle text-right bg-slate-50/30">
                                                        <span className="text-sm font-black text-slate-900">{formatCurrency(record.balance)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {currentMonthRecords.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-bold text-sm">
                                                        No transactions found for {selectedMonth.replace('_', ' ')}.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BillingDashboard;

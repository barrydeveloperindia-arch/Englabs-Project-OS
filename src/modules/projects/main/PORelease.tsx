import React, { useState, useMemo } from 'react';
import { 
    Search, 
    Filter, 
    Download, 
    CheckCircle2, 
    AlertTriangle, 
    DollarSign, 
    TrendingUp, 
    Briefcase,
    ShieldCheck,
    Globe,
    MessageSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProjectData } from '@shared/services/project';

interface POReleaseProps {
    projects: ProjectData[];
}

export const PORelease: React.FC<POReleaseProps> = ({ projects }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [marginFilter, setMarginFilter] = useState<'all' | 'low' | 'healthy'>('all');
    const [selectedDate, setSelectedDate] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'id' | 'margin' | 'cost' | 'sale'>('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Filter projects with poRelease information
    const poProjects = useMemo(() => {
        return projects.filter(p => p.poRelease && p.poRelease.vendorName);
    }, [projects]);

    // Unique dates list for filter
    const uniqueDates = useMemo(() => {
        const dates = new Set<string>();
        poProjects.forEach(p => {
            if (p.poRelease?.releaseDate) {
                dates.add(p.poRelease.releaseDate);
            }
        });
        return Array.from(dates).sort((a, b) => b.localeCompare(a));
    }, [poProjects]);

    // Filter & Sort
    const processedProjects = useMemo(() => {
        return poProjects
            .filter(p => {
                const po = p.poRelease!;
                const matchesSearch = 
                    p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (po.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (po.poVendorSent || '').toLowerCase().includes(searchQuery.toLowerCase());

                const sale = po.customerSalePrice || p.planning.value || 0;
                const cost = po.vendorCost || 0;
                const margin = sale - cost;
                const marginPct = sale > 0 ? (margin / sale) * 100 : 0;

                const matchesMargin = 
                    marginFilter === 'all' || 
                    (marginFilter === 'low' && marginPct < 20) ||
                    (marginFilter === 'healthy' && marginPct >= 20);

                const matchesDate = 
                    selectedDate === 'all' || 
                    po.releaseDate === selectedDate;

                return matchesSearch && matchesMargin && matchesDate;
            })
            .sort((a, b) => {
                let comparison = 0;
                const poA = a.poRelease!;
                const poB = b.poRelease!;
                const saleA = poA.customerSalePrice || a.planning.value || 0;
                const costA = poA.vendorCost || 0;
                const saleB = poB.customerSalePrice || b.planning.value || 0;
                const costB = poB.vendorCost || 0;

                if (sortBy === 'id') {
                    comparison = a.projectId.localeCompare(b.projectId);
                } else if (sortBy === 'sale') {
                    comparison = saleA - saleB;
                } else if (sortBy === 'cost') {
                    comparison = costA - costB;
                } else if (sortBy === 'margin') {
                    const marginA = saleA - costA;
                    const marginB = saleB - costB;
                    comparison = marginA - marginB;
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });
    }, [poProjects, searchQuery, marginFilter, selectedDate, sortBy, sortOrder]);

    // Aggregate statistics
    const stats = useMemo(() => {
        let totalSaleValue = 0;
        let totalVendorCost = 0;
        let lowMarginCount = 0;

        poProjects.forEach(p => {
            const po = p.poRelease!;
            const sale = po.customerSalePrice || p.planning.value || 0;
            const cost = po.vendorCost || 0;
            const margin = sale - cost;
            const marginPct = sale > 0 ? (margin / sale) * 100 : 0;

            totalSaleValue += sale;
            totalVendorCost += cost;
            if (marginPct < 20) {
                lowMarginCount++;
            }
        });

        const totalMargin = totalSaleValue - totalVendorCost;
        const avgMarginPct = totalSaleValue > 0 ? (totalMargin / totalSaleValue) * 100 : 0;

        return {
            totalPOs: poProjects.length,
            totalSaleValue,
            totalVendorCost,
            totalMargin,
            avgMarginPct,
            lowMarginCount
        };
    }, [poProjects]);

    const handleSort = (field: 'id' | 'margin' | 'cost' | 'sale') => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const exportToExcel = () => {
        const flatData = processedProjects.map((p, index) => {
            const po = p.poRelease!;
            const sale = po.customerSalePrice || p.planning.value || 0;
            const cost = po.vendorCost || 0;
            const margin = sale - cost;
            const marginPct = sale > 0 ? (margin / sale) * 100 : 0;

            return {
                'Sr. No.': index + 1,
                'Project ID': p.projectId,
                'Client': p.client,
                'Client PO Number': p.planning.poNumber || '—',
                'Customer Sale Price (INR)': sale,
                'Vendor Name': po.vendorName || '—',
                'Vendor Location': po.vendorLocation || '—',
                'Released Vendor PO': po.poVendorSent || '—',
                'Vendor Cost Price (INR)': cost,
                'Gross Margin (INR)': margin,
                'Margin (%)': Math.round(marginPct),
                'Release Date': po.releaseDate || '—'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor PO Release");

        const maxWidths = Object.keys(flatData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...flatData.map(row => String(row[key as keyof typeof row]).length)) + 2
        }));
        worksheet['!cols'] = maxWidths;

        XLSX.writeFile(workbook, `Vendor_PO_Release_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const sharePOOnWhatsApp = (project: ProjectData) => {
        const po = project.poRelease!;
        const sale = po.customerSalePrice || project.planning.value || 0;
        const cost = po.vendorCost || 0;
        const margin = sale - cost;
        const marginPct = sale > 0 ? (margin / sale) * 100 : 0;
        
        const text = encodeURIComponent(
            `*Project PO Release Update*\n` +
            `*Project ID:* ${project.projectId}\n` +
            `*Client:* ${project.client}\n` +
            `*Client PO Number:* ${project.planning.poNumber || 'N/A'}\n` +
            `*Customer Sale Price:* ₹${sale.toLocaleString('en-IN')}\n` +
            `*Vendor Name:* ${po.vendorName || 'N/A'} (${po.vendorLocation || 'N/A'})\n` +
            `*Released Vendor PO:* ${po.poVendorSent || 'N/A'}\n` +
            `*Vendor Cost Price:* ₹${cost.toLocaleString('en-IN')}\n` +
            `*Gross Margin:* ₹${margin.toLocaleString('en-IN')} (${marginPct.toFixed(0)}% margin)\n` +
            `*Release Date:* ${po.releaseDate || 'N/A'}`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    const sharePOSummaryOnWhatsApp = () => {
        const text = encodeURIComponent(
            `*ENGLABS PORTFOLIO PO RELEASE SUMMARY*\n` +
            `--------------------------------\n` +
            `*Total Released POs:* ${stats.totalPOs}\n` +
            `*Contract Valuation:* ₹${stats.totalSaleValue.toLocaleString('en-IN')}\n` +
            `*Released Vendor Costs:* ₹${stats.totalVendorCost.toLocaleString('en-IN')}\n` +
            `*Gross Portfolio Margin:* ₹${stats.totalMargin.toLocaleString('en-IN')} (${stats.avgMarginPct.toFixed(1)}% margin)\n` +
            `*Low Margin Flags:* ${stats.lowMarginCount} (Under 20% margin target)\n` +
            `--------------------------------\n` +
            `_Generated by Englabs Store OS_`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    return (
        <div className="flex-grow overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#F8FAFC]">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-none">PO Release</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Vendor purchase orders register & margins audit</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Contract Valuation</span>
                            <p className="text-2xl font-black text-slate-950">₹{stats.totalSaleValue.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Across {stats.totalPOs} released POs</span>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Released Vendor Costs</span>
                            <p className="text-2xl font-black text-slate-950">₹{stats.totalVendorCost.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Direct third-party costs</span>
                        </div>
                        <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                            <Briefcase className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Gross Portfolio Margin</span>
                            <p className="text-2xl font-black text-emerald-600">₹{stats.totalMargin.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-emerald-500 block mt-1">Avg Margin: {stats.avgMarginPct.toFixed(1)}%</span>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Low Margin Flags</span>
                            <p className={`text-2xl font-black ${stats.lowMarginCount > 0 ? 'text-amber-600' : 'text-slate-950'}`}>{stats.lowMarginCount}</p>
                            <span className="text-[9px] font-bold text-amber-500 block mt-1">Under 20% margin target</span>
                        </div>
                        <div className={`p-3 rounded-2xl ${stats.lowMarginCount > 0 ? 'bg-amber-500/10 text-amber-600 animate-pulse border border-amber-500/20' : 'bg-slate-100 text-slate-400'}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white p-6 md:p-8 rounded-[1.75rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
                        {/* Search */}
                        <div className="relative flex-grow min-w-[280px] max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search client, vendor or PO code..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                            <select 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                                value={marginFilter}
                                onChange={(e: any) => setMarginFilter(e.target.value)}
                            >
                                <option value="all">ALL PROJECTS</option>
                                <option value="low">LOW MARGIN (&lt; 20%)</option>
                                <option value="healthy">HEALTHY MARGIN (&gt;= 20%)</option>
                            </select>

                            <select 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            >
                                <option value="all">ALL DATES</option>
                                {uniqueDates.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            <button 
                                onClick={exportToExcel}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export Excel</span>
                            </button>

                            <button 
                                onClick={sharePOSummaryOnWhatsApp}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-[#25D366]/10 hover:text-emerald-600 hover:border-[#25D366]/20 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer"
                                title="Share Portfolio PO Summary on WhatsApp"
                            >
                                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                                <span>Share Portfolio</span>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto w-full custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="pb-4 w-12">SR. NO.</th>
                                    <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('id')}>Project ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th className="pb-4">Client</th>
                                    <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('sale')}>Sale Price {sortBy === 'sale' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th className="pb-4">Vendor</th>
                                    <th className="pb-4">Released PO</th>
                                    <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('cost')}>Vendor Cost {sortBy === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('margin')}>Gross Margin {sortBy === 'margin' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th className="pb-4">Release Date</th>
                                    <th className="pb-4 text-right">Status</th>
                                    <th className="pb-4 text-right w-16">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                                {processedProjects.map((project, index) => {
                                    const po = project.poRelease!;
                                    const sale = po.customerSalePrice || project.planning.value || 0;
                                    const cost = po.vendorCost || 0;
                                    const margin = sale - cost;
                                    const marginPct = sale > 0 ? (margin / sale) * 100 : 0;

                                    return (
                                        <tr 
                                            key={project.projectId}
                                            className="hover:bg-slate-50/50 cursor-pointer transition-all"
                                        >
                                            <td className="py-4 text-[11px] font-bold text-slate-400">{index + 1}</td>
                                            <td className="py-4 font-black text-[#0e4368]">{project.projectId}</td>
                                            <td className="py-4 font-bold text-slate-900">{project.client}</td>
                                            <td className="py-4 font-bold text-slate-900">₹{sale.toLocaleString('en-IN')}</td>
                                            <td className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 leading-tight">{po.vendorName}</span>
                                                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5 mt-0.5"><Globe className="w-3 h-3" /> {po.vendorLocation}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 font-mono text-xs text-slate-500">{po.poVendorSent || '—'}</td>
                                            <td className="py-4 font-mono text-slate-500">₹{cost.toLocaleString('en-IN')}</td>
                                            <td className="py-4">
                                                <span className={`font-black ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    ₹{margin.toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">{marginPct.toFixed(0)}% margin</span>
                                            </td>
                                            <td className="py-4 text-xs font-semibold text-slate-500">{po.releaseDate || '—'}</td>
                                            <td className="py-4 text-right">
                                                {marginPct < 20 ? (
                                                    <span className="inline-flex items-center gap-1 text-[8px] font-black border border-amber-500/20 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        Low Margin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[8px] font-black border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Audited
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => sharePOOnWhatsApp(project)}
                                                    className="p-2 bg-slate-50 text-slate-400 hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-all border border-transparent hover:border-[#25D366]/20 inline-flex items-center justify-center cursor-pointer"
                                                    title="Share PO on WhatsApp"
                                                >
                                                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {processedProjects.length === 0 && (
                                    <tr className="border-none">
                                        <td colSpan={11} className="py-12 text-center">
                                            <Briefcase className="w-10 h-10 text-slate-400 mb-3 mx-auto" />
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">No PO Released Data</h4>
                                            <p className="text-xs text-slate-400 max-w-xs leading-normal mx-auto">
                                                Try adjusting your search criteria or filter to see matches.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

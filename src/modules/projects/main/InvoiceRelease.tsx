import React, { useState, useMemo } from 'react';
import { 
    Search, 
    Filter, 
    Download, 
    CheckCircle2, 
    AlertTriangle, 
    DollarSign, 
    FileText, 
    CreditCard,
    TrendingUp,
    Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProjectData } from '@shared/services/project';

interface InvoiceReleaseProps {
    projects: ProjectData[];
}

export const InvoiceRelease: React.FC<InvoiceReleaseProps> = ({ projects }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
    const [sortBy, setSortBy] = useState<'id' | 'value' | 'total' | 'invoiceNo'>('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Filter projects with invoiceRelease information
    const invoiceProjects = useMemo(() => {
        return projects.filter(p => p.invoiceRelease && p.invoiceRelease.invoiceNumber);
    }, [projects]);

    // Filter & Sort
    const processedProjects = useMemo(() => {
        return invoiceProjects
            .filter(p => {
                const inv = p.invoiceRelease!;
                const matchesSearch = 
                    p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (inv.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

                const status = (inv.paymentStatus || 'Pending').toLowerCase();
                const matchesStatus = 
                    statusFilter === 'all' || 
                    status === statusFilter;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                let comparison = 0;
                const invA = a.invoiceRelease!;
                const invB = b.invoiceRelease!;
                const valA = a.planning.value || 0;
                const totalA = invA.totalInvoiceAmount || (valA * 1.18);
                const valB = b.planning.value || 0;
                const totalB = invB.totalInvoiceAmount || (valB * 1.18);

                if (sortBy === 'id') {
                    comparison = a.projectId.localeCompare(b.projectId);
                } else if (sortBy === 'invoiceNo') {
                    comparison = (invA.invoiceNumber || '').localeCompare(invB.invoiceNumber || '');
                } else if (sortBy === 'value') {
                    comparison = valA - valB;
                } else if (sortBy === 'total') {
                    comparison = totalA - totalB;
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });
    }, [invoiceProjects, searchQuery, statusFilter, sortBy, sortOrder]);

    // Aggregate statistics
    const stats = useMemo(() => {
        let totalBaseValue = 0;
        let totalGSTValue = 0;
        let totalInvoiceAmount = 0;
        let paidCount = 0;
        let pendingCount = 0;
        let overdueCount = 0;

        invoiceProjects.forEach(p => {
            const inv = p.invoiceRelease!;
            const base = p.planning.value || 0;
            const gst = inv.gstValue || (base * 0.18);
            const total = inv.totalInvoiceAmount || (base + gst);
            const status = (inv.paymentStatus || 'Pending').toUpperCase();

            totalBaseValue += base;
            totalGSTValue += gst;
            totalInvoiceAmount += total;

            if (status === 'PAID') {
                paidCount++;
            } else if (status === 'OVERDUE') {
                overdueCount++;
            } else {
                pendingCount++;
            }
        });

        return {
            totalInvoices: invoiceProjects.length,
            totalBaseValue,
            totalGSTValue,
            totalInvoiceAmount,
            paidCount,
            pendingCount,
            overdueCount
        };
    }, [invoiceProjects]);

    const handleSort = (field: 'id' | 'value' | 'total' | 'invoiceNo') => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const getPaymentStatusStyles = (status: string) => {
        const s = status.toUpperCase();
        if (s === 'PAID') {
            return {
                label: 'Paid',
                color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            };
        }
        if (s === 'OVERDUE') {
            return {
                label: 'Overdue',
                color: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
            };
        }
        return {
            label: 'Pending',
            color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        };
    };

    const exportToExcel = () => {
        const flatData = processedProjects.map((p, index) => {
            const inv = p.invoiceRelease!;
            const base = p.planning.value || 0;
            const gst = inv.gstValue || (base * 0.18);
            const total = inv.totalInvoiceAmount || (base + gst);

            return {
                'Sr. No.': index + 1,
                'Project ID': p.projectId,
                'Client': p.client,
                'Invoice Number': inv.invoiceNumber || '—',
                'Base Value (INR)': base,
                'GST Rate (%)': inv.gstRate || 18,
                'GST Value (INR)': gst,
                'Total Invoice Amount (INR)': total,
                'Payment Terms': inv.paymentTerms || '—',
                'Payment Status': inv.paymentStatus || 'Pending'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Release Ledger");

        const maxWidths = Object.keys(flatData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...flatData.map(row => String(row[key as keyof typeof row]).length)) + 2
        }));
        worksheet['!cols'] = maxWidths;

        XLSX.writeFile(workbook, `Invoice_Release_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="flex-grow overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#F8FAFC]">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-none">Invoice Release</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Billing registry, tax invoices & collection ledger</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Invoice Value (Base)</span>
                            <p className="text-2xl font-black text-slate-950">₹{stats.totalBaseValue.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Total base services</span>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Total GST (18%)</span>
                            <p className="text-2xl font-black text-slate-950">₹{stats.totalGSTValue.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Calculated service tax</span>
                        </div>
                        <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Gross Billing Ledger</span>
                            <p className="text-2xl font-black text-[#0e4368]">₹{stats.totalInvoiceAmount.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Tax-inclusive billing amount</span>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl shadow-md">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Ledger Collections</span>
                            <p className="text-2xl font-black text-slate-950">
                                {stats.paidCount} / {stats.totalInvoices} Paid
                            </p>
                            <span className="text-[9px] font-bold text-amber-500 block mt-1">Pending: {stats.pendingCount} | Overdue: {stats.overdueCount}</span>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                            <CreditCard className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white p-6 md:p-8 rounded-[1.75rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search client or invoice number..." 
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
                                value={statusFilter}
                                onChange={(e: any) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">ALL STATUS</option>
                                <option value="paid">PAID</option>
                                <option value="pending">PENDING</option>
                                <option value="overdue">OVERDUE</option>
                            </select>

                            <button 
                                onClick={exportToExcel}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export Excel</span>
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
                                    <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('invoiceNo')}>Invoice Number {sortBy === 'invoiceNo' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('value')}>Base Value {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th className="pb-4">GST Rate</th>
                                    <th className="pb-4">GST Value</th>
                                    <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('total')}>Invoice Total {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th className="pb-4">Payment Terms</th>
                                    <th className="pb-4 text-right">Collection</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                                {processedProjects.map((project, index) => {
                                    const inv = project.invoiceRelease!;
                                    const base = project.planning.value || 0;
                                    const gst = inv.gstValue || (base * 0.18);
                                    const total = inv.totalInvoiceAmount || (base + gst);
                                    const status = getPaymentStatusStyles(inv.paymentStatus || 'Pending');

                                    return (
                                        <tr 
                                            key={project.projectId}
                                            className="hover:bg-slate-50/50 cursor-pointer transition-all"
                                        >
                                            <td className="py-4 text-[11px] font-bold text-slate-400">{index + 1}</td>
                                            <td className="py-4 font-black text-[#0e4368]">{project.projectId}</td>
                                            <td className="py-4 font-bold text-slate-900">{project.client}</td>
                                            <td className="py-4 font-mono text-xs text-slate-500">{inv.invoiceNumber}</td>
                                            <td className="py-4 font-semibold text-slate-700">₹{base.toLocaleString('en-IN')}</td>
                                            <td className="py-4 text-slate-500">{inv.gstRate || 18}%</td>
                                            <td className="py-4 font-mono text-xs text-slate-500">₹{gst.toLocaleString('en-IN')}</td>
                                            <td className="py-4 font-black text-slate-900">₹{total.toLocaleString('en-IN')}</td>
                                            <td className="py-4 text-xs font-semibold text-slate-500">{inv.paymentTerms || '—'}</td>
                                            <td className="py-4 text-right">
                                                <span className={`text-[9px] font-black border px-2 py-1 rounded-full uppercase tracking-wider ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {processedProjects.length === 0 && (
                                    <tr className="border-none">
                                        <td colSpan={10} className="py-12 text-center">
                                            <FileText className="w-10 h-10 text-slate-400 mb-3 mx-auto" />
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">No Invoice Release Data</h4>
                                            <p className="text-xs text-slate-400 max-w-xs leading-normal mx-auto">
                                                Try adjusting your filters or search query to list billing details.
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

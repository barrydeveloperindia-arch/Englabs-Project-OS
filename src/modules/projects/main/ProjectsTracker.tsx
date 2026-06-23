import React, { useState, useMemo } from 'react';
import { 
    Search, 
    Filter, 
    Download, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Package, 
    Box, 
    TrendingUp, 
    Briefcase,
    Globe
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProjectData } from '@shared/services/project';

interface ProjectsTrackerProps {
    projects: ProjectData[];
    onSelectProject?: (p: ProjectData) => void;
}

export const ProjectsTracker: React.FC<ProjectsTrackerProps> = ({ projects, onSelectProject }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [sortBy, setSortBy] = useState<'id' | 'client' | 'value' | 'qty'>('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Determine completion status helper
    const isCompleted = (project: ProjectData) => {
        return project.production.stages.every(s => s.status === 'Completed');
    };

    // Filter & Sort
    const processedProjects = useMemo(() => {
        return projects
            .filter(p => {
                const matchesSearch = 
                    p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.metrics.materialConsumption || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.financials?.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase());
                
                const completed = isCompleted(p);
                const matchesStatus = 
                    statusFilter === 'all' || 
                    (statusFilter === 'active' && !completed) ||
                    (statusFilter === 'completed' && completed);

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'id') {
                    comparison = a.projectId.localeCompare(b.projectId);
                } else if (sortBy === 'client') {
                    comparison = a.client.localeCompare(b.client);
                } else if (sortBy === 'value') {
                    comparison = a.planning.value - b.planning.value;
                } else if (sortBy === 'qty') {
                    comparison = a.metrics.totalComponents - b.metrics.totalComponents;
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });
    }, [projects, searchQuery, statusFilter, sortBy, sortOrder]);

    // Aggregate statistics
    const stats = useMemo(() => {
        let totalValuation = 0;
        let totalBudget = 0;
        let activeCount = 0;
        let completedCount = 0;
        let totalComponents = 0;

        projects.forEach(p => {
            totalValuation += p.planning.value;
            totalBudget += p.planning.budget;
            totalComponents += p.metrics.totalComponents;
            if (isCompleted(p)) {
                completedCount++;
            } else {
                activeCount++;
            }
        });

        return {
            totalCount: projects.length,
            totalValuation,
            totalBudget,
            activeCount,
            completedCount,
            totalComponents
        };
    }, [projects]);

    const handleSort = (field: 'id' | 'client' | 'value' | 'qty') => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const exportToExcel = () => {
        const flatData = processedProjects.map((p, index) => {
            const completed = isCompleted(p);
            return {
                'Sr. No.': index + 1,
                'Project ID': p.projectId,
                'Client': p.client,
                'Valuation (INR)': p.planning.value,
                'Budget (INR)': p.planning.budget,
                'Materials': p.metrics.materialConsumption || '—',
                'Qty': p.metrics.totalComponents,
                'Current Stage': p.production.currentStage || '—',
                'Overall Status': completed ? 'Completed' : 'Active',
                'Vendor Name': p.financials?.vendorName || '—',
                'Vendor Location': p.financials?.vendorLocation || '—',
                'Client PO Number': p.planning.poNumber || '—',
                'Start Date': p.planning.startDate || '—'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Projects Tracker");

        const maxWidths = Object.keys(flatData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...flatData.map(row => String(row[key as keyof typeof row]).length)) + 2
        }));
        worksheet['!cols'] = maxWidths;

        XLSX.writeFile(workbook, `Projects_Tracker_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="flex-grow overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#F8FAFC]">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-none">Projects Tracker</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Operational Allocation & Project Progress Matrix</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Total Valuation</span>
                            <p className="text-2xl font-black text-slate-950">₹{stats.totalValuation.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Across {stats.totalCount} active channels</span>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Active Projects</span>
                            <p className="text-2xl font-black text-slate-950">{stats.activeCount}</p>
                            <span className="text-[9px] font-bold text-amber-500 block mt-1">Running in workshop</span>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                            <Clock className="w-6 h-6 animate-pulse" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Successfully Delivered</span>
                            <p className="text-2xl font-black text-slate-950">{stats.completedCount}</p>
                            <span className="text-[9px] font-bold text-emerald-500 block mt-1">100% stage completion</span>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Total Components</span>
                            <p className="text-2xl font-black text-slate-950">{stats.totalComponents.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Total operational parts</span>
                        </div>
                        <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                            <Package className="w-6 h-6" />
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
                                placeholder="Search ID, Client, Material or Vendor..." 
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
                                <option value="all">ALL PROJECTS</option>
                                <option value="active">ACTIVE RUNNING</option>
                                <option value="completed">COMPLETED</option>
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
                                    <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('client')}>Client {sortBy === 'client' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('value')}>Valuation {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th className="pb-4">Materials</th>
                                    <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('qty')}>Qty {sortBy === 'qty' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4">Vendor</th>
                                    <th className="pb-4">PO Number</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                                {processedProjects.map((project, index) => {
                                    const completed = isCompleted(project);
                                    
                                    return (
                                        <tr 
                                            key={project.projectId}
                                            className="hover:bg-slate-50/50 cursor-pointer transition-all"
                                            onClick={() => onSelectProject && onSelectProject(project)}
                                        >
                                            <td className="py-4 text-[11px] font-bold text-slate-400">{index + 1}</td>
                                            <td className="py-4 font-black text-[#0e4368]">{project.projectId}</td>
                                            <td className="py-4 font-bold text-slate-900">{project.client}</td>
                                            <td className="py-4">₹{project.planning.value.toLocaleString('en-IN')}</td>
                                            <td className="py-4">
                                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200">
                                                    <Box className="w-3 h-3" />
                                                    {project.metrics.materialConsumption || '—'}
                                                </span>
                                            </td>
                                            <td className="py-4 font-mono text-slate-500">{project.metrics.totalComponents}</td>
                                            <td className="py-4">
                                                {completed ? (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full uppercase tracking-wider">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black border border-amber-500/20 bg-amber-500/10 text-amber-600 px-2 py-1 rounded-full uppercase tracking-wider">
                                                        <Clock className="w-3.5 h-3.5" /> {project.production.currentStage || 'Active'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4">
                                                {project.financials?.vendorName ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-800 font-bold leading-tight">{project.financials.vendorName}</span>
                                                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5 mt-0.5"><Globe className="w-3 h-3" /> {project.financials.vendorLocation || '—'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 font-mono text-xs text-slate-500">{project.planning.poNumber || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

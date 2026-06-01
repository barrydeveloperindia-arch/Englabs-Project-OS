import React, { useState, useMemo } from 'react';
import { 
    DollarSign, 
    TrendingUp, 
    PieChart, 
    Search, 
    Filter, 
    ArrowUpRight, 
    CheckCircle2, 
    AlertTriangle,
    Sliders,
    X,
    Briefcase,
    Percent,
    ShieldAlert
} from 'lucide-react';
import { ProjectData } from '../lib/project';

interface ProjectBudgetsProps {
    projects: ProjectData[];
}

export const ProjectBudgets: React.FC<ProjectBudgetsProps> = ({ projects }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [poFilter, setPoFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
    const [sortBy, setSortBy] = useState<'id' | 'value' | 'budget' | 'margin'>('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    
    // Simulator states
    const [simulatedBudget, setSimulatedBudget] = useState<number>(0);
    const [isSimulating, setIsSimulating] = useState(false);

    // Filtered & Sorted projects
    const processedProjects = useMemo(() => {
        return projects
            .filter(p => {
                const matchesSearch = p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                     p.client.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesPO = poFilter === 'all' || 
                                 (poFilter === 'confirmed' && p.planning.poConfirmed) ||
                                 (poFilter === 'pending' && !p.planning.poConfirmed);
                return matchesSearch && matchesPO;
            })
            .sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'id') {
                    comparison = a.projectId.localeCompare(b.projectId);
                } else if (sortBy === 'value') {
                    comparison = a.planning.value - b.planning.value;
                } else if (sortBy === 'budget') {
                    comparison = a.planning.budget - b.planning.budget;
                } else if (sortBy === 'margin') {
                    const marginA = a.planning.value - a.planning.budget;
                    const marginB = b.planning.value - b.planning.budget;
                    comparison = marginA - marginB;
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });
    }, [projects, searchQuery, poFilter, sortBy, sortOrder]);

    // Aggregate statistics
    const stats = useMemo(() => {
        let totalValuation = 0;
        let totalBudget = 0;
        let confirmedCount = 0;
        
        projects.forEach(p => {
            totalValuation += p.planning.value;
            totalBudget += p.planning.budget;
            if (p.planning.poConfirmed) confirmedCount++;
        });

        const totalMargin = totalValuation - totalBudget;
        const utilization = totalValuation > 0 ? (totalBudget / totalValuation) * 100 : 0;

        return {
            totalValuation,
            totalBudget,
            totalMargin,
            utilization,
            confirmedCount,
            totalCount: projects.length
        };
    }, [projects]);

    const handleSort = (field: 'id' | 'value' | 'budget' | 'margin') => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handleSelectProject = (project: ProjectData) => {
        setSelectedProject(project);
        setSimulatedBudget(project.planning.budget);
        setIsSimulating(false);
    };

    const getBudgetStatus = (value: number, budget: number) => {
        const ratio = budget / value;
        if (ratio >= 1.0) return { label: 'CRITICAL', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
        if (ratio >= 0.85) return { label: 'WARNING', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
        return { label: 'HEALTHY', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    };

    return (
        <div className="flex-grow overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#F8FAFC]">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-6 md:gap-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-none">Project Financials & Budgets</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Valuation, Allocation & Portfolio Margin Control</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Portfolio Valuation</span>
                            <p className="text-2xl font-black text-slate-950">₹{stats.totalValuation.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Across {stats.totalCount} active channels</span>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Budget Allocation</span>
                            <p className="text-2xl font-black text-slate-950">₹{stats.totalBudget.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Utilization: {stats.utilization.toFixed(1)}%</span>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                            <PieChart className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Projected Margin</span>
                            <p className="text-2xl font-black text-slate-950">₹{stats.totalMargin.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-emerald-500 block mt-1">Avg Margin: {(100 - stats.utilization).toFixed(1)}%</span>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl shadow-md">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">PO Confirmation Rate</span>
                            <p className="text-2xl font-black text-slate-950">{((stats.confirmedCount / stats.totalCount) * 100).toFixed(0)}%</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">{stats.confirmedCount} of {stats.totalCount} confirmed</span>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Main Section */}
                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                    
                    {/* Projects Ledger Table */}
                    <div className="flex-1 bg-white p-6 md:p-8 rounded-[1.75rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.01)] overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search Project ID or Client..." 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-3">
                                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                                <select 
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                                    value={poFilter}
                                    onChange={(e: any) => setPoFilter(e.target.value)}
                                >
                                    <option value="all">ALL PROJECTS</option>
                                    <option value="confirmed">PO CONFIRMED</option>
                                    <option value="pending">PO PENDING</option>
                                </select>
                            </div>
                        </div>

                        {/* Responsive Table */}
                        <div className="overflow-x-auto w-full custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('id')}>Project ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                        <th className="pb-4">Client</th>
                                        <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('value')}>Value {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                        <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('budget')}>Budget {sortBy === 'budget' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                        <th className="pb-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('margin')}>Margin {sortBy === 'margin' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                        <th className="pb-4">PO</th>
                                        <th className="pb-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                                    {processedProjects.map((project) => {
                                        const marginVal = project.planning.value - project.planning.budget;
                                        const marginPct = project.planning.value > 0 ? (marginVal / project.planning.value) * 100 : 0;
                                        const status = getBudgetStatus(project.planning.value, project.planning.budget);
                                        const isSelected = selectedProject?.projectId === project.projectId;

                                        return (
                                            <tr 
                                                key={project.projectId}
                                                className={`hover:bg-slate-50/50 cursor-pointer transition-all ${isSelected ? 'bg-emerald-500/5' : ''}`}
                                                onClick={() => handleSelectProject(project)}
                                            >
                                                <td className="py-4 font-black text-[#0e4368]">{project.projectId}</td>
                                                <td className="py-4 font-bold text-slate-900 truncate max-w-[150px]">{project.client}</td>
                                                <td className="py-4">₹{project.planning.value.toLocaleString('en-IN')}</td>
                                                <td className="py-4 text-slate-500">₹{project.planning.budget.toLocaleString('en-IN')}</td>
                                                <td className="py-4">
                                                    <span className={marginVal >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                                        ₹{marginVal.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">{marginPct.toFixed(0)}% margin</span>
                                                </td>
                                                <td className="py-4">
                                                    {project.planning.poConfirmed ? (
                                                        <span className="text-emerald-500"><CheckCircle2 className="w-5 h-5" /></span>
                                                    ) : (
                                                        <span className="text-slate-300"><AlertTriangle className="w-5 h-5" /></span>
                                                    )}
                                                </td>
                                                <td className="py-4">
                                                    <span className={`text-[9px] font-black border px-2 py-1 rounded-full uppercase tracking-wider ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Panel: Detail Intel & Simulator */}
                    <div className="w-full lg:w-[450px] flex flex-col gap-6 md:gap-8">
                        {selectedProject ? (
                            <div className="bg-white p-6 md:p-8 rounded-[1.75rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.01)] relative">
                                <button 
                                    className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-1"
                                    onClick={() => setSelectedProject(null)}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-[#0e4368] text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase">{selectedProject.projectId}</span>
                                    <span className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Financial Detail Intel</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 leading-tight pr-8">{selectedProject.client}</h3>

                                <div className="space-y-5 border-b border-slate-100 pb-6 mb-6">
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Valuation</span>
                                        <span className="font-black text-slate-950 text-base">₹{selectedProject.planning.value.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Current Allocation</span>
                                        <span className="font-black text-slate-950 text-base">₹{selectedProject.planning.budget.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Project Margin</span>
                                        <span className="font-black text-emerald-600 text-base">
                                            ₹{(selectedProject.planning.value - selectedProject.planning.budget).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Start Date</span>
                                        <span className="font-bold text-slate-700 text-xs uppercase">{selectedProject.planning.startDate || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Delivery Terms</span>
                                        <span className="font-bold text-slate-700 text-xs uppercase">{selectedProject.planning.deliveryTerms || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Simulator Panel */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                            <Sliders className="w-4 h-4 text-emerald-500" /> Operational Budget Simulator
                                        </h4>
                                        <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded uppercase">Interactive</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mb-4 leading-normal">
                                        Adjust the budget slider below to simulate real-time adjustments on project margins and portfolio utilization.
                                    </p>

                                    <div className="space-y-6 bg-[#0e4368]/5 p-5 rounded-2xl border border-[#0e4368]/10">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                                                <span>Simulated Budget</span>
                                                <span className="font-black text-[#0e4368]">₹{simulatedBudget.toLocaleString('en-IN')}</span>
                                            </div>
                                            <input 
                                                type="range"
                                                min={0}
                                                max={selectedProject.planning.value * 1.2}
                                                step={5000}
                                                value={simulatedBudget}
                                                onChange={(e) => {
                                                    setSimulatedBudget(Number(e.target.value));
                                                    setIsSimulating(true);
                                                }}
                                                className="w-full accent-emerald-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg appearance-none"
                                            />
                                        </div>

                                        {isSimulating && (
                                            <div className="space-y-3 pt-3 border-t border-slate-200">
                                                <div className="flex justify-between text-[11px] font-semibold">
                                                    <span className="text-slate-500">New Margin Pct</span>
                                                    <span className="text-slate-900 font-bold">
                                                        {(((selectedProject.planning.value - simulatedBudget) / selectedProject.planning.value) * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-semibold">
                                                    <span className="text-slate-500">Margin Change</span>
                                                    <span className={simulatedBudget < selectedProject.planning.budget ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                                        {simulatedBudget < selectedProject.planning.budget ? '↑' : '↓'} ₹{Math.abs(selectedProject.planning.budget - simulatedBudget).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setSimulatedBudget(selectedProject.planning.budget);
                                                        setIsSimulating(false);
                                                    }}
                                                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-black py-2 rounded-xl text-xs transition-all mt-2"
                                                >
                                                    RESET SIMULATOR
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-10 rounded-[1.75rem] border border-dashed border-slate-300 flex flex-col items-center justify-center text-center h-[350px]">
                                <Briefcase className="w-10 h-10 text-slate-400 mb-3" />
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">No Project Selected</h4>
                                <p className="text-xs text-slate-400 max-w-xs leading-normal">
                                    Click any project row in the ledger matrix to view complete details, contract values, and simulated margins.
                                </p>
                            </div>
                        )}
                        
                        {/* Risk Indicator Card */}
                        <div className="bg-white p-6 md:p-8 rounded-[1.75rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.01)]">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-rose-500" /> Portfolio Risk Intel
                            </h3>
                            <div className="space-y-4">
                                {projects.filter(p => p.planning.budget >= p.planning.value * 0.85).length > 0 ? (
                                    projects.filter(p => p.planning.budget >= p.planning.value * 0.85).map(p => {
                                        const ratio = p.planning.budget / p.planning.value;
                                        return (
                                            <div key={p.projectId} className="flex justify-between items-center p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/10">
                                                <div>
                                                    <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded uppercase tracking-wider">{p.projectId}</span>
                                                    <p className="text-xs font-black text-slate-900 truncate max-w-[200px] mt-1.5">{p.client}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Budget Util.</span>
                                                    <span className="text-xs font-black text-rose-600">{(ratio * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 bg-emerald-500/5 text-emerald-600 rounded-xl border border-emerald-500/10 text-xs font-bold text-center">
                                        All project budgets are healthy (under 85% utilization).
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

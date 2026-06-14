import React, { useState, useMemo } from 'react';
import { useERPContext } from '@features/erp/context/ERPContext';
import { ERPProject } from '@domain/erp_beta_types';
import { Search, Filter, Lock } from 'lucide-react';

interface ProjectMasterTableProps {
    projects: ERPProject[];
    onRowClick: (project: ERPProject) => void;
}

export const ProjectMasterTable: React.FC<ProjectMasterTableProps> = ({ projects, onRowClick }) => {
    const { selectedProjectId, setSelectedProjectId, setIsGlobalView } = useERPContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [clientFilter, setClientFilter] = useState<string>('ALL');

    // Extract unique clients and statuses for filter dropdowns
    const clients = useMemo(() => Array.from(new Set(projects.map(p => p.clientName))), [projects]);
    const statuses = useMemo(() => Array.from(new Set(projects.map(p => p.status))), [projects]);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch = p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  p.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
            const matchesClient = clientFilter === 'ALL' || p.clientName === clientFilter;
            return matchesSearch && matchesStatus && matchesClient;
        });
    }, [projects, searchQuery, statusFilter, clientFilter]);

    const handleLockProject = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        setSelectedProjectId(projectId);
        setIsGlobalView(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-fade-in">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search Project ID or Name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select 
                            value={clientFilter} 
                            onChange={(e) => setClientFilter(e.target.value)}
                            className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none w-32 truncate"
                        >
                            <option value="ALL">All Clients</option>
                            {clients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none w-32"
                        >
                            <option value="ALL">All Statuses</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1 dark-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-slate-200">
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 bg-slate-50 w-12 text-center">Lock</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 bg-slate-50">Project ID</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 bg-slate-50">Client Name</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 bg-slate-50">Project Name</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 bg-slate-50 text-center">Status</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 bg-slate-50 text-right">Start Date</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-slate-100 bg-slate-50 text-right">Completion Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.map(project => {
                            const isLocked = selectedProjectId === project.id;
                            return (
                                <tr 
                                    key={project.id} 
                                    onClick={() => onRowClick(project)}
                                    className={`border-b border-slate-100 transition-colors cursor-pointer \${isLocked ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'}`}
                                >
                                    <td className="px-4 py-3 border-r border-slate-100 text-center">
                                        <button 
                                            onClick={(e) => handleLockProject(e, project.id)}
                                            className={`p-1.5 rounded-md transition-colors \${isLocked ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-200 text-slate-400'}`}
                                            title="Lock this Project ID globally"
                                        >
                                            <Lock className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-bold text-slate-700 border-r border-slate-100">{project.id}</td>
                                    <td className="px-4 py-3 text-xs font-bold text-slate-800 border-r border-slate-100">{project.clientName}</td>
                                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 border-r border-slate-100">{project.projectName}</td>
                                    <td className="px-4 py-3 border-r border-slate-100 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider \${
                                            project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                            project.status === 'Running' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {project.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-medium text-slate-500 text-right border-r border-slate-100">{project.startDate || 'N/A'}</td>
                                    <td className="px-4 py-3 text-xs font-medium text-slate-500 text-right">{project.completionDate || 'N/A'}</td>
                                </tr>
                            );
                        })}
                        {filteredProjects.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-sm font-medium text-slate-500">
                                    No projects found matching the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Showing {filteredProjects.length} of {projects.length} projects</span>
                <span className="text-xs font-semibold text-slate-400">Click a row to view Project Details</span>
            </div>
        </div>
    );
};

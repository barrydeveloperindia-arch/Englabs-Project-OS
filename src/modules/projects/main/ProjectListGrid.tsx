import React from 'react';
import { ProjectData } from '@shared/services/project';
import { Search, ChevronRight, Briefcase, Activity, Clock, DollarSign, Box } from 'lucide-react';

interface ProjectListGridProps {
    projects: ProjectData[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    projectFilter: 'ALL' | 'ACTIVE' | 'UPCOMING';
    setProjectFilter: (f: 'ALL' | 'ACTIVE' | 'UPCOMING') => void;
    onSelectProject: (p: ProjectData) => void;
}

export const ProjectListGrid: React.FC<ProjectListGridProps> = ({
    projects,
    searchQuery,
    setSearchQuery,
    projectFilter,
    setProjectFilter,
    onSelectProject
}) => {
    
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.client.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (projectFilter === 'ACTIVE') {
            const isCompleted = p.production.stages.every(s => s.status === 'Completed');
            return matchesSearch && !isCompleted;
        }
        if (projectFilter === 'UPCOMING') {
            const hasStarted = p.production.stages.some(s => s.status !== 'Pending');
            return matchesSearch && !hasStarted;
        }
        return matchesSearch;
    });

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
            {/* Header Area */}
            <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-10 shrink-0 pt-safe">
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-sm md:text-lg font-black text-slate-900 leading-none">Project Master</h1>
                        <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Enterprise Portfolios</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        <Briefcase className="w-3 h-3 text-emerald-500" />
                        <span className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">{filteredProjects.length} Projects</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                    
                    {/* Controls Row */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="relative w-full md:w-96 shrink-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by C-Code or Client..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-bold"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
                            {(['ALL', 'ACTIVE', 'UPCOMING'] as const).map(f => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setProjectFilter(f)}
                                    className={`flex-1 md:w-32 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all select-none ${
                                        projectFilter === f
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProjects.map(project => {
                            const completedStages = project.production.stages.filter(s => s.status === 'Completed').length;
                            const totalStages = project.production.stages.length;
                            const progress = Math.round((completedStages / totalStages) * 100);
                            
                            return (
                                <button 
                                    key={project.projectId}
                                    onClick={() => onSelectProject(project)}
                                    className="group text-left bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-900/5 transition-all flex flex-col gap-5 relative overflow-hidden"
                                >
                                    {/* Top info */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-2.5 py-1 rounded-lg tracking-widest uppercase inline-block mb-3">
                                                {project.projectId}
                                            </span>
                                            <h3 className="text-xl font-black text-slate-900 leading-tight">{project.client}</h3>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors">
                                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4 mt-auto">
                                        <div className="bg-slate-50 rounded-2xl p-4">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> Valuation</p>
                                            <p className="text-base font-black text-slate-900">₹{(project.planning.value).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-4">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Progress</p>
                                            <p className="text-base font-black text-emerald-600">{progress}% Done</p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    
                    {filteredProjects.length === 0 && (
                        <div className="text-center py-20">
                            <Box className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-slate-900">No Projects Found</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2">Try adjusting your search filters.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

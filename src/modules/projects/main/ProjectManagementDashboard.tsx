import React, { useState, useMemo } from 'react';
import { ProjectData } from '@shared/services/project';
import { 
    LayoutDashboard, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Activity,
    MessageSquare,
    Calendar,
    Target,
    ListTodo,
    Download,
    Filter,
    ArrowUpDown,
    Briefcase
} from 'lucide-react';

interface ProjectManagementDashboardProps {
    projects: ProjectData[];
    onSelectProject: (p: ProjectData) => void;
}

// Mock Types for UI extension
interface MockTask {
    id: string;
    projectId: string;
    client: string;
    title: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Past Due';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate: string;
}

interface MockFeedback {
    id: string;
    projectId: string;
    client: string;
    message: string;
    time: string;
    status: 'New' | 'Resolved';
}

export const ProjectManagementDashboard: React.FC<ProjectManagementDashboardProps> = ({
    projects,
    onSelectProject
}) => {
    // 1. Calculate Core Metrics
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.production.stages.every(s => s.status === 'Completed')).length;
    const incompleteProjects = totalProjects - completedProjects;
    
    // 2. Generate Mock Granular Data based on real projects
    const { mockTasks, mockFeedback, pastDueCount } = useMemo(() => {
        const tasks: MockTask[] = [];
        const feedbacks: MockFeedback[] = [];
        let pdCount = 0;

        projects.forEach((p, idx) => {
            // Generate some mock tasks based on stages
            p.production.stages.forEach((stage, sIdx) => {
                if (stage.status !== 'Completed') {
                    const isPastDue = sIdx === 0 && stage.status === 'Pending' && idx % 3 === 0;
                    if (isPastDue) pdCount++;
                    
                    tasks.push({
                        id: `TSK-${p.projectId}-${sIdx}`,
                        projectId: p.projectId,
                        client: p.client,
                        title: `${stage.name} Execution`,
                        status: isPastDue ? 'Past Due' : stage.status,
                        priority: isPastDue ? 'Critical' : (sIdx % 2 === 0 ? 'High' : 'Medium'),
                        dueDate: new Date(Date.now() + (isPastDue ? -1 : 1) * (sIdx + 1) * 86400000).toISOString()
                    });
                }
            });

            // Generate some mock feedback
            if (idx % 2 === 0) {
                feedbacks.push({
                    id: `FB-${p.projectId}`,
                    projectId: p.projectId,
                    client: p.client,
                    message: `Please prioritize the ${p.production.stages[0]?.name || 'initial'} phase for early review.`,
                    time: new Date(Date.now() - idx * 3600000).toISOString(),
                    status: idx === 0 ? 'New' : 'Resolved'
                });
            }
        });

        return { mockTasks: tasks, mockFeedback: feedbacks, pastDueCount: pdCount };
    }, [projects]);

    // Task List State
    const [sortField, setSortField] = useState<'dueDate' | 'priority'>('dueDate');
    const [filterStatus, setFilterStatus] = useState<string>('All');

    const filteredTasks = useMemo(() => {
        let ft = mockTasks;
        if (filterStatus !== 'All') {
            ft = ft.filter(t => t.status === filterStatus);
        }
        return ft.sort((a, b) => {
            if (sortField === 'dueDate') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            // simple priority sort
            const pVal = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
            return pVal[b.priority] - pVal[a.priority];
        });
    }, [mockTasks, filterStatus, sortField]);

    const handleExport = () => {
        alert("Exporting Organized Task List as CSV...");
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
            <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-10 shrink-0 pt-safe">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm md:text-lg font-black text-slate-900 leading-none">Project Command Center</h1>
                        <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Global Operations Dashboard</span>
                    </div>
                </div>
                <button 
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md"
                    onClick={() => onSelectProject(projects[0])} // Just a fallback action for now
                >
                    <Briefcase className="w-3.5 h-3.5" /> View Project Grid
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8">
                    
                    {/* 1. TOP METRICS ROW */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">Completed</span>
                            </div>
                            <p className="text-3xl font-black text-slate-900 mb-1">{completedProjects}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Successfully Delivered</p>
                        </div>

                        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-500/20">In Progress</span>
                            </div>
                            <p className="text-3xl font-black text-slate-900 mb-1">{incompleteProjects}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active / Incomplete</p>
                        </div>

                        <div className="bg-white p-5 md:p-6 rounded-3xl border border-rose-100 shadow-[0_8px_30px_rgb(225,29,72,0.04)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <span className="bg-rose-500/10 text-rose-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-rose-500/20">Attention</span>
                            </div>
                            <p className="text-3xl font-black text-rose-600 mb-1">{pastDueCount}</p>
                            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Pending Past Due</p>
                        </div>

                        <div className="bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-slate-800 text-indigo-400 rounded-xl border border-slate-700">
                                    <Target className="w-5 h-5" />
                                </div>
                                <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">Portfolio</span>
                            </div>
                            <p className="text-3xl font-black text-white mb-1">{totalProjects}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Projects</p>
                        </div>
                    </div>

                    {/* 2. MIDDLE INSIGHTS ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Project Progress & Task Overview */}
                        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
                            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.03)] flex flex-col h-full">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-indigo-500" /> Task Overview & Progress
                                    </h2>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion Insights</span>
                                </div>
                                
                                <div className="flex-1 flex flex-col justify-center gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-32 h-32 rounded-full border-8 border-slate-50 relative flex items-center justify-center shrink-0">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="46" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                                <circle cx="50" cy="50" r="46" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray={`${(completedProjects / totalProjects) * 289 || 0} 289`} className="transition-all duration-1000" />
                                            </svg>
                                            <div className="text-center">
                                                <p className="text-2xl font-black text-slate-900">{Math.round((completedProjects / totalProjects) * 100 || 0)}%</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Done</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                                                    <span className="text-emerald-600">Completed Sprints</span>
                                                    <span className="text-slate-900">{completedProjects}</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(completedProjects / totalProjects) * 100}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                                                    <span className="text-blue-600">Active Pipelines</span>
                                                    <span className="text-slate-900">{incompleteProjects}</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(incompleteProjects / totalProjects) * 100}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Client Feedback & Review */}
                        <div className="bg-[#0e4368] p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-6 relative z-10">
                                <MessageSquare className="w-5 h-5 text-emerald-400" /> Client Feedback
                            </h2>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 relative z-10">
                                {mockFeedback.map(fb => (
                                    <div key={fb.id} className="bg-slate-900/50 border border-white/10 p-4 rounded-2xl hover:bg-slate-900/80 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-md">{fb.client}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{fb.status}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-200 leading-relaxed mb-3">"{fb.message}"</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{new Date(fb.time).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. ORGANIZED TASK LIST */}
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.03)] flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <ListTodo className="w-6 h-6 text-indigo-500" /> Organized Task List
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sprint Planning & Task Review</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                                    <div className="px-3 flex items-center gap-1.5 text-slate-400">
                                        <Filter className="w-3.5 h-3.5" />
                                    </div>
                                    <select 
                                        className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-4 py-1.5 cursor-pointer"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Past Due">Past Due</option>
                                    </select>
                                </div>

                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                                    <div className="px-3 flex items-center gap-1.5 text-slate-400">
                                        <ArrowUpDown className="w-3.5 h-3.5" />
                                    </div>
                                    <select 
                                        className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-4 py-1.5 cursor-pointer"
                                        value={sortField}
                                        onChange={(e) => setSortField(e.target.value as any)}
                                    >
                                        <option value="dueDate">Sort by Date</option>
                                        <option value="priority">Sort by Priority</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={handleExport}
                                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" /> Export
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                        <th className="pb-4 pl-4">Task Name</th>
                                        <th className="pb-4">Project / Client</th>
                                        <th className="pb-4">Priority</th>
                                        <th className="pb-4">Due Date</th>
                                        <th className="pb-4 pr-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400">
                                                <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-bold">No tasks found matching current filters.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTasks.map(task => (
                                            <tr key={task.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 pl-4">
                                                    <p className="font-black text-slate-900 text-sm">{task.title}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{task.id}</p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="font-black text-slate-700">{task.client}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{task.projectId}</p>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                                        task.priority === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                        task.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                        task.priority === 'Medium' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-600">{new Date(task.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-4 text-right">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                                                        task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        task.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        task.status === 'Past Due' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-slate-50 text-slate-500 border-slate-200'
                                                    }`}>
                                                        {task.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                                                        {task.status === 'Past Due' && <AlertCircle className="w-3 h-3" />}
                                                        {task.status === 'In Progress' && <Activity className="w-3 h-3" />}
                                                        {task.status === 'Pending' && <Clock className="w-3 h-3" />}
                                                        {task.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

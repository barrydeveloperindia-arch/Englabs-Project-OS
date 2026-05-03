import React, { useState, useEffect } from 'react';
import { 
    Layout, 
    Layers, 
    Box, 
    Activity, 
    DollarSign, 
    Users, 
    ChevronRight, 
    Search, 
    Plus, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Package,
    Settings,
    Bell,
    ExternalLink,
    TrendingUp
} from 'lucide-react';
import NewProjectModal from './components/NewProjectModal';
import { ProjectData, STAGES, ProjectStage } from './lib/project';

const App: React.FC = () => {
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const projectFiles = import.meta.glob('../data/*.json');
        const loadProjects = async () => {
            const loadedProjects: ProjectData[] = [];
            for (const path in projectFiles) {
                try {
                    const module = await projectFiles[path]() as { default: ProjectData };
                    loadedProjects.push(module.default);
                } catch (e) {
                    console.error("Error loading project:", path, e);
                }
            }
            if (loadedProjects.length > 0) {
                setProjects(loadedProjects);
                const defaultProject = loadedProjects.find(p => p.projectId === 'C001') || loadedProjects[0];
                setSelectedProject(defaultProject);
            }
        };
        loadProjects();
    }, []);

    const filteredProjects = projects.filter(p => 
        p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const updateStage = (stageName: string, newStatus: ProjectStage['status']) => {
        if (!selectedProject) return;
        const updatedStages = selectedProject.production.stages.map(s => 
            s.name === stageName ? { ...s, status: newStatus } : s
        );
        const updatedProject = {
            ...selectedProject,
            production: { ...selectedProject.production, stages: updatedStages }
        };
        setSelectedProject(updatedProject);
        setProjects(prev => prev.map(p => p.projectId === updatedProject.projectId ? updatedProject : p));
    };

    if (!selectedProject) return <div className="h-screen w-screen bg-slate-900 flex items-center justify-center text-white font-black text-4xl">INITIALIZING...</div>;

    return (
        <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans">
            {/* SIDEBAR LEDGER */}
            <aside 
                className="bg-[#0F172A] flex flex-col shadow-2xl shrink-0 border-r border-slate-800"
                style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}
            >
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500 rounded-lg">
                            <Layers className="w-6 h-6 text-slate-900" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tighter">ENGLABS PROJECTS</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Operational OS</p>
                </div>

                <div className="px-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search Projects..." 
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto px-4 space-y-2 pb-8 custom-scrollbar">
                    {filteredProjects.map(project => (
                        <button 
                            key={project.projectId}
                            onClick={() => setSelectedProject(project)}
                            className={`w-full text-left px-4 py-4 rounded-2xl transition-all border ${
                                selectedProject.projectId === project.projectId 
                                ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20' 
                                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black tracking-widest">{project.projectId}</span>
                                <ChevronRight className="w-3 h-3" />
                            </div>
                            <p className="text-sm font-bold truncate leading-tight">{project.client}</p>
                        </button>
                    ))}
                </div>

                <div className="p-6 border-t border-slate-800">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                    >
                        <Plus className="w-5 h-5" /> NEW MISSION
                    </button>
                </div>
            </aside>

            {/* MAIN OPERATIONAL CORE */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
                <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h1 className="text-lg font-black text-slate-900 leading-none">Mission Control</h1>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Oversight Matrix</span>
                        </div>
                        <div className="h-8 w-px bg-slate-100"></div>
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-4 items-center">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-900 uppercase">ENGLABS PROJECTS</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Fleet Commander</p>
                            </div>
                            <div className="w-10 h-10 bg-[#0F172A] rounded-full flex items-center justify-center font-black text-emerald-500 shadow-lg border-2 border-white">EP</div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
                        
                        {/* HERO CARD */}
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="bg-[#0F172A] text-emerald-500 text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase">{selectedProject.projectId}</span>
                                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">In-Orbit Dynamics</span>
                                </div>
                                <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{selectedProject.client}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contract Valuation</p>
                                <p className="text-5xl font-black text-slate-900 tracking-tighter">₹{selectedProject.planning.value.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* SPLIT SECTION */}
                        <div className="flex flex-col xl:flex-row gap-8">
                            
                            {/* PIPELINE (LEFT) */}
                            <div className="flex-1 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                                <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
                                    <Activity className="w-6 h-6 text-emerald-500" /> Production Pipeline
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {selectedProject.production.stages.map((stage, idx) => (
                                        <div 
                                            key={stage.name} 
                                            className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer group flex flex-col justify-between h-48 ${
                                                stage.status === 'Completed' ? 'bg-emerald-50/30 border-emerald-100' :
                                                stage.status === 'In Progress' ? 'bg-blue-50/30 border-blue-200' :
                                                'bg-slate-50 border-transparent hover:border-slate-200'
                                            }`}
                                            onClick={() => updateStage(stage.name, stage.status === 'Pending' ? 'In Progress' : stage.status === 'In Progress' ? 'Completed' : 'Pending')}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                                                    stage.status === 'Completed' ? 'bg-emerald-500 text-slate-900' :
                                                    stage.status === 'In Progress' ? 'bg-blue-500 text-white' :
                                                    'bg-slate-200 text-slate-400'
                                                }`}>
                                                    {stage.status === 'Completed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{stage.status}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm leading-tight mb-3">{stage.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-3 h-3 text-slate-400" />
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{stage.lead || "Pending"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* INTEL (RIGHT) */}
                            <div className="w-full xl:w-[400px] flex flex-col gap-8">
                                <div className="bg-[#0F172A] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex-1">
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-black text-slate-400 mb-6 uppercase tracking-widest">Financial Health</h3>
                                        <div className="space-y-8">
                                            <div>
                                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-3">
                                                    <span>Budget Utilization</span>
                                                    <span className="text-emerald-500">{((selectedProject.planning.budget / selectedProject.planning.value) * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(selectedProject.planning.budget / selectedProject.planning.value) * 100}%` }} />
                                                </div>
                                            </div>
                                            <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vault Margin</p>
                                                <p className="text-2xl font-black text-emerald-400">₹{(selectedProject.planning.value - selectedProject.planning.budget).toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                        <Box className="w-6 h-6 text-emerald-500" /> Intelligence
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Material Integrity</p>
                                            <p className="font-bold text-slate-900 text-[13px]">{selectedProject.metrics.materialConsumption}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <a href="https://in.linkedin.com/company/englabs-limited" target="_blank" className="flex-1 bg-slate-100 p-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200">LinkedIn</a>
                                            <a href="https://www.instagram.com/englabs_india/" target="_blank" className="flex-1 bg-slate-100 p-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200">Instagram</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>

            <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={(newProj) => setProjects(prev => [...prev, newProj])} />
        </div>
    );
};

export default App;

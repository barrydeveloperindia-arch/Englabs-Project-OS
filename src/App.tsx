import React, { useState, useEffect } from 'react';
import logo from './assets/englabs_logo.png';
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
    TrendingUp,
    Shield,
    Utensils,
    CreditCard,
    FileText,
    ChefHat
} from 'lucide-react';
import NewProjectModal from './components/NewProjectModal';
import GateRegister from './components/GateRegister';
import Showroom from './components/Showroom';
import FoodRegister from './components/FoodRegister';
import SystemGuardDashboard from './components/SystemGuardDashboard';
import BillingDashboard from './components/BillingDashboard';
import QADashboard from './components/QADashboard';
import DigitalEvidence from './components/DigitalEvidence';
import InventoryManager from './components/InventoryManager';
import Sky5Terminal from './components/Sky5Terminal';
import { ProjectData, STAGES, ProjectStage } from './lib/project';
import { logAction, AuditLog } from './lib/system_guard';
import { fetchGateEntries, syncLocalToFirebase, syncAllProjectsToFirebase, saveGateEntry } from './lib/database_service';
import { processInventoryUpdate } from './lib/inventory_service';
import forensicRegistry from '../data/forensic_gate_registry.json';

const projectFiles = import.meta.glob('/data/*.json');

const App: React.FC = () => {
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [gateEntries, setGateEntries] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('englabs_gate_v2');
            console.log("Retrieved from localStorage (englabs_gate_v2):", saved);
            if (!saved || saved === 'undefined') return [];
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse gate entries:", e);
            return [];
        }
    });
    const [currentView, setCurrentView] = useState<'PROJECTS' | 'GATE_REGISTER' | 'FOOD_REGISTER' | 'SYSTEM_GUARD' | 'BILLING' | 'QA_TESTER' | 'SKY5_TERMINAL' | 'INVENTORY'>('PROJECTS');

    useEffect(() => {
        console.log("Found project files:", Object.keys(projectFiles));
        
        const loadProjects = async () => {
            const loadedProjects: ProjectData[] = [];
            for (const path in projectFiles) {
                try {
                    const module = await projectFiles[path]() as { default: any };
                    const data = module.default;
                    if (data && typeof data === 'object' && !Array.isArray(data) && data.projectId) {
                        loadedProjects.push(data as ProjectData);
                    } else {
                        console.log(`Skipping non-project file: ${path}`);
                    }
                } catch (e) {
                    console.error("Error loading project:", path, e);
                }
            }
            
            console.log("Loaded projects:", loadedProjects.length);
            if (loadedProjects.length > 0) {
                setProjects(loadedProjects);
                const defaultProject = loadedProjects.find(p => p.projectId === 'C001') || loadedProjects[0];
                setSelectedProject(defaultProject);
            } else {
                console.warn("No projects loaded from ../data/*.json");
            }
        };
        loadProjects();
    }, []);
    
    useEffect(() => {
        const syncFromCloud = async () => {
            try {
                const cloudEntries = await fetchGateEntries();
                const forensicData = forensicRegistry as any[];
                
                setGateEntries(prev => {
                    // Create a map of existing entries for quick lookup
                    const entryMap = new Map();
                    
                    // 1. Start with Forensic Data (Baseline)
                    forensicData.forEach(e => entryMap.set(e.id, e));
                    
                    // 2. Overlay Cloud Data (Priority)
                    cloudEntries.forEach(e => entryMap.set(e.id, e));
                    
                    // 3. Merge Local State (Priority for active session changes)
                    prev.forEach(e => {
                        const existing = entryMap.get(e.id);
                        if (!existing) {
                            entryMap.set(e.id, e);
                        } else {
                            // If it exists, prefer the one with a newer timestamp or specific update flag
                            // We use a simple timestamp comparison or just assume local is more recent if it was just edited
                            const localTime = new Date(e.timestamp).getTime();
                            const cloudTime = new Date(existing.timestamp).getTime();
                            
                            // If local has been updated or is same age, keep local
                            if (localTime >= cloudTime) {
                                entryMap.set(e.id, e);
                            }
                        }
                    });

                    const merged = Array.from(entryMap.values()).sort((a, b) => 
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                    
                    console.log(`Forensic Sync: ${forensicData.length} disk, ${cloudEntries.length} cloud, total ${merged.length} entries.`);
                    return merged;
                });
            } catch (e) {
                console.error("Cloud hydration failed:", e);
            }
        };
        syncFromCloud();
    }, []);

    useEffect(() => {
        localStorage.setItem('englabs_gate_v2', JSON.stringify(gateEntries));
    }, [gateEntries]);

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
        
        const log = logAction('UPDATE', updatedProject.projectId, `Updated ${stageName} to ${newStatus}`, 'GAURAV PANCHAL');
        setAuditLogs(prev => [log, ...prev]);
    };

    const handleFullSync = async () => {
        try {
            console.log("FULL SYSTEM SYNC INITIATED...");
            const entriesSuccess = await syncLocalToFirebase(gateEntries);
            const projectsSuccess = await syncAllProjectsToFirebase(projects);
            return entriesSuccess && projectsSuccess;
        } catch (e) {
            console.error("Full System Sync failed:", e);
            return false;
        }
    };

    const handleNewGateEntry = async (entry: any) => {
        setGateEntries(prev => [entry, ...prev]);
        // Background Cloud Sync & Inventory Processing
        await Promise.all([
            saveGateEntry(entry),
            processInventoryUpdate(entry)
        ]);
    };

    const handleUpdateGateEntry = async (entry: any) => {
        setGateEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
        await Promise.all([
            saveGateEntry(entry),
            processInventoryUpdate(entry)
        ]);
    };

    const handleDeleteGateEntry = (id: string) => {
        setGateEntries(prev => prev.filter(e => e.id !== id));
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
                    <div className="flex items-center gap-4 mb-3">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl group-hover:bg-emerald-500/40 transition-all rounded-full" />
                            <div className="relative p-2.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-white tracking-tighter leading-none">ENGLABS INDIA</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">PVT LTD</span>
                        </div>
                    </div>
                    <p className="text-[9px] font-black text-emerald-500/80 tracking-[0.25em] uppercase pl-1">Enterprise Operational OS</p>
                </div>

                <div className="px-6 mb-8 flex flex-col gap-2.5">
                    <button 
                        onClick={() => setCurrentView('PROJECTS')}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] transition-all duration-300 ${currentView === 'PROJECTS' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_25px_rgba(16,185,129,0.35)] scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Layers className="w-4.5 h-4.5" /> PROJECTS
                    </button>
                    <button 
                        onClick={() => setCurrentView('GATE_REGISTER')}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] transition-all duration-300 ${currentView === 'GATE_REGISTER' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_25px_rgba(16,185,129,0.35)] scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Shield className="w-4.5 h-4.5" /> LOGISTICS COMMAND
                    </button>
                    <button 
                        onClick={() => setCurrentView('FOOD_REGISTER')}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] transition-all duration-300 ${currentView === 'FOOD_REGISTER' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_25px_rgba(16,185,129,0.35)] scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Utensils className="w-4.5 h-4.5" /> PANTRY CONTROL
                    </button>
                    <button 
                        onClick={() => setCurrentView('INVENTORY')}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] transition-all duration-300 ${currentView === 'INVENTORY' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_25px_rgba(16,185,129,0.35)] scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Box className="w-4.5 h-4.5" /> INVENTORY MASTER
                    </button>
                    <button 
                        onClick={() => setCurrentView('BILLING')}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] transition-all duration-300 ${currentView === 'BILLING' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_25px_rgba(16,185,129,0.35)] scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <CreditCard className="w-4.5 h-4.5" /> FINANCE COMMAND
                    </button>
                    <button 
                        onClick={() => setCurrentView('QA_TESTER')}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] transition-all duration-300 ${currentView === 'QA_TESTER' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_25px_rgba(16,185,129,0.35)] scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Shield className="w-4.5 h-4.5" /> ZERO-ERROR AUDIT
                    </button>

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <p className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-5">Vendor Channels</p>
                        <button 
                            onClick={() => setCurrentView('SKY5_TERMINAL')}
                            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] transition-all duration-300 ${currentView === 'SKY5_TERMINAL' ? 'bg-amber-500 text-slate-900 shadow-[0_0_25px_rgba(245,158,11,0.35)] scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <ChefHat className="w-4.5 h-4.5" /> SKY-5 KITCHEN
                        </button>
                    </div>
                </div>

                {currentView === 'PROJECTS' && (
                    <>
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
                                selectedProject?.projectId === project.projectId 
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

                    </>
                )}
                <div className="p-6 border-t border-slate-800 shrink-0">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                    >
                        <Plus className="w-5 h-5" /> NEW MISSION
                    </button>
                </div>
            </aside>

            {/* MAIN OPERATIONAL CORE */}
            {currentView === 'PROJECTS' ? (
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
                                    <p className="text-[10px] font-black text-slate-900 uppercase">GAURAV PANCHAL</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">PROJECT HEAD</p>
                                </div>
                                <img src={logo} alt="GP" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-slate-100 p-1" />
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
                            
                            {/* HERO CARD */}
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="bg-[#0F172A] text-emerald-500 text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase">{selectedProject?.projectId}</span>
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

                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                            <Users className="w-6 h-6 text-emerald-500" /> Project Team
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                "Thakur", "Rajinder", 
                                                "Arjun", "Kunwarlal", "Anurag", "Shubham", 
                                                "Ratnesh", "Devarshu", "Shiv Kumar", "Uditanshu", "RAM"
                                            ].map(name => (
                                                <div key={name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <span className="text-[10px] font-bold text-slate-700 uppercase">{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            ) : currentView === 'GATE_REGISTER' ? (
                <GateRegister 
                    entries={gateEntries} 
                    onNewEntry={handleNewGateEntry}
                    onUpdateEntry={handleUpdateGateEntry}
                    onDeleteEntry={handleDeleteGateEntry}
                    onLog={(log) => setAuditLogs(prev => [log, ...prev])} 
                    onFullSync={handleFullSync}
                />
            ) : currentView === 'SHOWROOM' ? (
                <Showroom />
            ) : currentView === 'FOOD_REGISTER' ? (
                <FoodRegister onLog={(log) => setAuditLogs(prev => [log, ...prev])} />
            ) : currentView === 'BILLING' ? (
                <BillingDashboard />
            ) : currentView === 'QA_TESTER' ? (
                <QADashboard currentData={gateEntries} />
            ) : currentView === 'SKY5_TERMINAL' ? (
                <Sky5Terminal />
            ) : currentView === 'INVENTORY' ? (
                <InventoryManager />
            ) : (
                <DigitalEvidence onAutoRegister={handleNewGateEntry} />
            )}

            <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={(newProj) => setProjects(prev => [...prev, newProj])} />
        </div>
    );
};

export default App;

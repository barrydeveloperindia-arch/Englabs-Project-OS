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
    ChefHat,
    Truck,
    MoreHorizontal,
    X
} from 'lucide-react';
import NewProjectModal from './components/NewProjectModal';
import GateRegister from './components/GateRegister';
import Showroom from './components/Showroom';
import FoodRegister from './components/FoodRegister';
import SystemGuardDashboard from './components/SystemGuardDashboard';
import BillingDashboard from './components/BillingDashboard';
import DigitalEvidence from './components/DigitalEvidence';
import GateDisplayScreen from './components/GateDisplayScreen';
import InventoryManager from './components/InventoryManager';
import Sky5Terminal from './components/Sky5Terminal';
import StoreStockReport from './components/StoreStockReport';
import PorterRegister from './components/PorterRegister';
import HandoverDashboard from './components/HandoverDashboard';
import ProjectLookupDashboard from './components/ProjectLookupDashboard';
import { ProjectBudgets } from './components/ProjectBudgets';
import { ProjectData, STAGES, ProjectStage } from './lib/project';
import { logAction, AuditLog } from './lib/system_guard';
import { fetchGateEntries, syncLocalToFirebase, syncAllProjectsToFirebase, saveGateEntry } from './lib/database_service';
import { processInventoryUpdate } from './lib/inventory_service';
import forensicRegistry from '../data/forensic_gate_registry.json';
import porterForensic from '../data/porter_missions_forensic.json';

import pC4235 from '../data/C4235.json';
import pC4465 from '../data/C4465.json';
import pC4693 from '../data/C4693.json';
import pC4811 from '../data/C4811.json';
import pC4851 from '../data/C4851.json';
import pC4860 from '../data/C4860.json';
import pC4883 from '../data/C4883.json';
import pC4891 from '../data/C4891.json';
import pC4894 from '../data/C4894.json';
import pC4895 from '../data/C4895.json';
import pC4909 from '../data/C4909.json';
import pC4913 from '../data/C4913.json';
import pC4922 from '../data/C4922.json';
import pC4925 from '../data/C4925.json';
import pC4927 from '../data/C4927.json';
import pC4929 from '../data/C4929.json';
import pC4935 from '../data/C4935.json';
import pC4940 from '../data/C4940.json';
import pC4950 from '../data/C4950.json';
import pC4958 from '../data/C4958.json';
import pC4963 from '../data/C4963.json';
import pC4965 from '../data/C4965.json';
import pC4967 from '../data/C4967.json';
import pC4985 from '../data/C4985.json';
import pC5005 from '../data/C5005.json';
import pC5008 from '../data/C5008.json';
import pC5010 from '../data/C5010.json';
import pC5014 from '../data/C5014.json';
import pC5023 from '../data/C5023.json';
import pC5029 from '../data/C5029.json';
import pC5033 from '../data/C5033.json';
import pC5039 from '../data/C5039.json';
import pC5040 from '../data/C5040.json';
import pC5048 from '../data/C5048.json';
import pC5054 from '../data/C5054.json';
import pC5069 from '../data/C5069.json';
import pC5075 from '../data/C5075.json';
import pC5077 from '../data/C5077.json';
import pC5080 from '../data/C5080.json';
import pC5086 from '../data/C5086.json';
import pC5090 from '../data/C5090.json';
import pC5092 from '../data/C5092.json';
import pC5095 from '../data/C5095.json';
import pC5098 from '../data/C5098.json';
import pC5103 from '../data/C5103.json';
import pC5108 from '../data/C5108.json';
import pC5110 from '../data/C5110.json';
import pC5115 from '../data/C5115.json';
import pC5120 from '../data/C5120.json';
import pC5124 from '../data/C5124.json';
import pC5128 from '../data/C5128.json';
import pC5130 from '../data/C5130.json';
import pC5131 from '../data/C5131.json';
import pC5133 from '../data/C5133.json';
import pC5135 from '../data/C5135.json';
import pC5137 from '../data/C5137.json';
import pC5138 from '../data/C5138.json';
import pC5140 from '../data/C5140.json';
import pC5142 from '../data/C5142.json';
import pC5144 from '../data/C5144.json';
import pC5153 from '../data/C5153.json';
import pC5154 from '../data/C5154.json';
import pC5159 from '../data/C5159.json';
import pC5162 from '../data/C5162.json';
import pC5172 from '../data/C5172.json';
import pC5174 from '../data/C5174.json';
import pC5176 from '../data/C5176.json';
import pC5179 from '../data/C5179.json';
import pC5184 from '../data/C5184.json';
import pC5185 from '../data/C5185.json';
import pC5187 from '../data/C5187.json';
import pC5190 from '../data/C5190.json';
import pC5191 from '../data/C5191.json';
import pC5192 from '../data/C5192.json';
import pC5193 from '../data/C5193.json';
import pC5195 from '../data/C5195.json';
import pC5197 from '../data/C5197.json';
import pC5198 from '../data/C5198.json';
import pC5207 from '../data/C5207.json';
import pC5209 from '../data/C5209.json';
import pC5210 from '../data/C5210.json';
import pC5212 from '../data/C5212.json';
import pC5213 from '../data/C5213.json';
import pC5216 from '../data/C5216.json';
import pC5223 from '../data/C5223.json';
import pC5224 from '../data/C5224.json';
import pC5227 from '../data/C5227.json';
import pC5228 from '../data/C5228.json';
import pC5229 from '../data/C5229.json';
const staticProjects: ProjectData[] = [
    pC4235 as any,
    pC4465 as any,
    pC4693 as any,
    pC4811 as any,
    pC4851 as any,
    pC4860 as any,
    pC4883 as any,
    pC4891 as any,
    pC4894 as any,
    pC4895 as any,
    pC4909 as any,
    pC4913 as any,
    pC4922 as any,
    pC4925 as any,
    pC4927 as any,
    pC4929 as any,
    pC4935 as any,
    pC4940 as any,
    pC4950 as any,
    pC4958 as any,
    pC4963 as any,
    pC4965 as any,
    pC4967 as any,
    pC4985 as any,
    pC5005 as any,
    pC5008 as any,
    pC5010 as any,
    pC5014 as any,
    pC5023 as any,
    pC5029 as any,
    pC5033 as any,
    pC5039 as any,
    pC5040 as any,
    pC5048 as any,
    pC5054 as any,
    pC5069 as any,
    pC5075 as any,
    pC5077 as any,
    pC5080 as any,
    pC5086 as any,
    pC5090 as any,
    pC5092 as any,
    pC5095 as any,
    pC5098 as any,
    pC5103 as any,
    pC5108 as any,
    pC5110 as any,
    pC5115 as any,
    pC5120 as any,
    pC5124 as any,
    pC5128 as any,
    pC5130 as any,
    pC5131 as any,
    pC5133 as any,
    pC5135 as any,
    pC5137 as any,
    pC5138 as any,
    pC5140 as any,
    pC5142 as any,
    pC5144 as any,
    pC5153 as any,
    pC5154 as any,
    pC5159 as any,
    pC5162 as any,
    pC5172 as any,
    pC5174 as any,
    pC5176 as any,
    pC5179 as any,
    pC5184 as any,
    pC5185 as any,
    pC5187 as any,
    pC5190 as any,
    pC5191 as any,
    pC5192 as any,
    pC5193 as any,
    pC5195 as any,
    pC5197 as any,
    pC5198 as any,
    pC5207 as any,
    pC5209 as any,
    pC5210 as any,
    pC5212 as any,
    pC5213 as any,
    pC5216 as any,
    pC5223 as any,
    pC5224 as any,
    pC5227 as any,
    pC5228 as any,
    pC5229 as any,
].filter(p => p && p.projectId);

const projectFiles = import.meta.glob('/data/*.json');

interface MobileTabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    color?: 'emerald' | 'amber';
}

const MobileTabButton: React.FC<MobileTabButtonProps> = ({ active, onClick, icon, label, color = 'emerald' }) => {
    const activeColor = color === 'emerald' ? 'text-emerald-400' : 'text-amber-400';
    return (
        <button 
            type="button"
            onClick={onClick}
            data-testid={`mobile-nav-btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all"
        >
            <div className={`p-1.5 rounded-lg ${active ? 'bg-slate-800 ' + activeColor : 'text-slate-500'}`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-wider mt-1 ${active ? activeColor : 'text-slate-500'}`}>{label}</span>
        </button>
    );
};

const MobileGridButton = ({ onClick, icon, label, active, color = 'emerald' }: any) => {
    const activeColor = color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return (
        <button 
            onClick={onClick}
            data-testid={`mobile-grid-btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                active 
                ? activeColor 
                : 'bg-slate-800/40 border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
        >
            {icon}
            <span className="text-[9px] font-black uppercase tracking-wider mt-2 text-center">{label}</span>
        </button>
    );
};

interface SidebarButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    color?: 'emerald' | 'amber';
}

type View = 'PROJECTS' | 'GATE_REGISTER' | 'FOOD_REGISTER' | 'BILLING' | 'EVIDENCE' | 'INVENTORY' | 'SKY5_TERMINAL' | 'STOCK_REPORT' | 'PORTER_SERVICE' | 'GATE_DISPLAY' | 'PROJECT_LOOKUP' | 'PROJECT_BUDGETS';

const SidebarButton: React.FC<SidebarButtonProps> = ({ active, onClick, icon, label, color = 'emerald' }) => {
    const activeClass = color === 'emerald' 
        ? 'bg-white/10 text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.25)] scale-[1.01] relative before:content-[""] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:bg-emerald-400 before:rounded-r-full' 
        : 'bg-white/10 text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.25)] scale-[1.01] relative before:content-[""] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:bg-amber-400 before:rounded-r-full';
        
    return (
        <button 
            type="button"
            onClick={onClick}
            data-testid={`sidebar-btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] transition-all duration-300 w-full text-left ${active ? activeClass : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
            {React.cloneElement(icon as React.ReactElement, { className: 'w-4.5 h-4.5' })}
            {label}
        </button>
    );
};

const App: React.FC = () => {
    const [showHandover, setShowHandover] = useState(() => {
        // Only show handover once per day by checking localStorage
        const today = new Date().toDateString();
        const lastSeen = localStorage.getItem('last_handover_seen');
        return lastSeen !== today;
    });

    const handleAcknowledgeHandover = () => {
        localStorage.setItem('last_handover_seen', new Date().toDateString());
        setShowHandover(false);
    };

    const [projects, setProjects] = useState<ProjectData[]>(staticProjects);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(staticProjects[0] || null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [porterTrips, setPorterTrips] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('englabs_porter_v1');
            const forensic = porterForensic as any[];
            let trips = saved && saved !== 'undefined' ? JSON.parse(saved) : [];
            
            const forensicMap = new Map(forensic.map(f => [f.id, f]));
            const userTrips = trips.filter((t: any) => !forensicMap.has(t.id));
            const merged = [...forensic, ...userTrips];
            
            return merged.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (e) {
            console.error("Porter initialization failed:", e);
            return porterForensic as any[];
        }
    });
    const [gateEntries, setGateEntries] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('englabs_gate_v2');
            const forensic = forensicRegistry as any[];
            let local = (saved && saved !== 'undefined') ? JSON.parse(saved) : [];
            
            const entryMap = new Map();
            forensic.forEach(e => entryMap.set(e.id, e));
            local.forEach((e: any) => {
                const existing = entryMap.get(e.id);
                if (existing) {
                    if (existing.isLocked) {
                        if (e.version > existing.version) {
                            entryMap.set(e.id, { ...existing, ...e });
                        }
                    } else {
                        entryMap.set(e.id, { ...existing, ...e });
                    }
                } else {
                    entryMap.set(e.id, e);
                }
            });
            
            return Array.from(entryMap.values()).sort((a: any, b: any) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
        } catch (e) {
            console.error("Failed to parse gate entries:", e);
            return forensicRegistry as any[];
        }
    });

    // REACTIVE FORENSIC SYNC: Ensures disk-based updates (like new JSON entries) are merged into state
    useEffect(() => {
        setPorterTrips(prev => {
            const forensic = porterForensic as any[];
            const entryMap = new Map();
            prev.forEach(e => entryMap.set(e.id, e));
            forensic.forEach(e => entryMap.set(e.id, e)); // Forensic takes priority for matched IDs
            return Array.from(entryMap.values()).sort((a: any, b: any) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
        });
    }, []);

    const [currentView, setCurrentView] = useState<View>('PROJECTS');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                const defaultProject = loadedProjects.find(p => p.projectId === 'C2718') || loadedProjects[0];
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
                    
                    // 2. Overlay Cloud Data (Field-level Merge to preserve Forensic metadata)
                    cloudEntries.forEach(e => {
                        const existing = entryMap.get(e.id);
                        if (existing) {
                            // Smart Merge: Don't overwrite existing positive financial data with 0 or undefined
                            const merged = { ...existing, ...e };
                            if (!e.paidAmount && existing.paidAmount) merged.paidAmount = existing.paidAmount;
                            if (!e.remainingAmount && existing.remainingAmount) merged.remainingAmount = existing.remainingAmount;
                            if (!e.paymentStatus && existing.paymentStatus) merged.paymentStatus = existing.paymentStatus;
                            entryMap.set(e.id, merged);
                        } else {
                            entryMap.set(e.id, e);
                        }
                    });
                    
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
                            
                            // If local has been updated or is same age, merge local fields
                            if (localTime >= cloudTime) {
                                if (existing.isLocked) {
                                    if (e.version > existing.version) {
                                        entryMap.set(e.id, { ...existing, ...e });
                                    }
                                } else {
                                    entryMap.set(e.id, { ...existing, ...e });
                                }
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

    if (showHandover) {
        return <HandoverDashboard onAcknowledge={handleAcknowledgeHandover} />;
    }

    return (
        <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white">
            {/* SIDEBAR LEDGER */}
            <aside 
                className="bg-[#0e4368] hidden md:flex flex-col shadow-2xl shrink-0 border-r border-slate-800 print:hidden"
                style={{ width: '320px', minWidth: '320px', maxWidth: '320px', zIndex: 50 }}
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

                <div className="px-6 mb-8 flex flex-col gap-2.5 overflow-y-auto max-h-[55vh] dark-scrollbar shrink-0">
                    <SidebarButton 
                        active={currentView === 'PROJECTS'} 
                        onClick={() => setCurrentView('PROJECTS')} 
                        icon={<Layers className="w-4.5 h-4.5" />} 
                        label="PROJECTS" 
                    />
                    <SidebarButton 
                        active={currentView === 'PROJECT_LOOKUP'} 
                        onClick={() => setCurrentView('PROJECT_LOOKUP')} 
                        icon={<Search className="w-4.5 h-4.5" />} 
                        label="PROJECT LOOKUP & MAPPING" 
                    />
                    <SidebarButton 
                        active={currentView === 'PROJECT_BUDGETS'} 
                        onClick={() => setCurrentView('PROJECT_BUDGETS')} 
                        icon={<DollarSign className="w-4.5 h-4.5" />} 
                        label="PROJECT BUDGETS" 
                    />
                    <SidebarButton 
                        active={currentView === 'GATE_REGISTER'} 
                        onClick={() => setCurrentView('GATE_REGISTER')} 
                        icon={<Shield className="w-4.5 h-4.5" />} 
                        label="LOGISTICS COMMAND" 
                    />
                    <SidebarButton 
                        active={currentView === 'GATE_DISPLAY'} 
                        onClick={() => setCurrentView('GATE_DISPLAY')} 
                        icon={<Activity className="w-4.5 h-4.5" />} 
                        label="GATE DISPLAY HUD" 
                        color="emerald"
                    />
                    <SidebarButton 
                        active={currentView === 'FOOD_REGISTER'} 
                        onClick={() => setCurrentView('FOOD_REGISTER')} 
                        icon={<Utensils className="w-4.5 h-4.5" />} 
                        label="PANTRY CONTROL" 
                    />
                    <SidebarButton 
                        active={currentView === 'INVENTORY'} 
                        onClick={() => setCurrentView('INVENTORY')} 
                        icon={<Box className="w-4.5 h-4.5" />} 
                        label="INVENTORY MASTER" 
                    />
                    <SidebarButton 
                        active={currentView === 'STOCK_REPORT'} 
                        onClick={() => setCurrentView('STOCK_REPORT')} 
                        icon={<FileText className="w-4.5 h-4.5" />} 
                        label="STORE STOCK REPORT" 
                    />
                    <SidebarButton 
                        active={currentView === 'BILLING'} 
                        onClick={() => setCurrentView('BILLING')} 
                        icon={<CreditCard className="w-4.5 h-4.5" />} 
                        label="FINANCE COMMAND" 
                    />

                    <SidebarButton 
                        active={currentView === 'PORTER_SERVICE'} 
                        onClick={() => setCurrentView('PORTER_SERVICE')} 
                        icon={<Truck className="w-4.5 h-4.5" />} 
                        label="PORTER SERVICE" 
                        color="emerald"
                    />

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <p className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-5">Vendor Channels</p>
                        <SidebarButton 
                            active={currentView === 'SKY5_TERMINAL'} 
                            onClick={() => setCurrentView('SKY5_TERMINAL')} 
                            icon={<ChefHat className="w-4.5 h-4.5" />} 
                            label="SKY-5 KITCHEN" 
                            color="amber"
                        />
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

                <div className="flex-grow overflow-y-auto px-4 space-y-2 pb-8 dark-scrollbar">
                    {filteredProjects.map(project => (
                        <button 
                            key={project.projectId}
                            onClick={() => setSelectedProject(project)}
                            className={`w-full text-left px-4 py-4 rounded-2xl transition-all border ${
                                selectedProject?.projectId === project.projectId 
                                ? 'bg-white/10 border-white/20 text-white shadow-lg shadow-black/25 relative before:content-[""] before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:bg-emerald-400 before:rounded-r-full' 
                                : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
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
                        data-testid="btn-new-mission"
                        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-950/20"
                    >
                        <Plus className="w-5 h-5" /> NEW MISSION
                    </button>
                </div>
            </aside>

            {/* MAIN OPERATIONAL CORE */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pb-16 md:pb-0">
                {currentView === 'PROJECTS' ? (
                    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
                    <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-10 shrink-0">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="flex flex-col">
                                <h1 className="text-sm md:text-lg font-black text-slate-900 leading-none">Mission Control</h1>
                                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Oversight Matrix</span>
                            </div>
                            <div className="h-6 md:h-8 w-px bg-slate-100"></div>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                <Clock className="w-3 h-3 text-emerald-500" />
                                <span className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="flex gap-2.5 md:gap-4 items-center">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase">GAURAV PANCHAL</p>
                                    <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">PROJECT HEAD</p>
                                </div>
                                <img src={logo} alt="GP" className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center border-2 border-slate-100 p-1" />
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                        <div className="max-w-[1400px] mx-auto flex flex-col gap-6 md:gap-8">
                            
                            {/* HERO CARD */}
                            <div className="bg-white p-5 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center">
                                <div>
                                    <div className="flex items-center gap-2.5 md:gap-3 mb-3 md:mb-4">
                                        <span className="bg-[#0e4368] text-emerald-500 text-[8px] md:text-[10px] font-black px-2.5 py-1.5 rounded-lg tracking-widest uppercase">{selectedProject?.projectId}</span>
                                        <span className="text-slate-400 font-black text-[8px] md:text-[10px] uppercase tracking-widest">In-Orbit Dynamics</span>
                                    </div>
                                    <h2 className="text-xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight md:leading-none">{selectedProject.client}</h2>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contract Valuation</p>
                                    <p className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter">₹{selectedProject.planning.value.toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            {/* SPLIT SECTION */}
                            <div className="flex flex-col xl:flex-row gap-6 md:gap-8">
                                
                                {/* PIPELINE (LEFT) */}
                                <div className="flex-1 bg-white p-5 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-6 md:mb-8 tracking-tight flex items-center gap-3">
                                        <Activity className="w-5.5 h-5.5 text-emerald-500" /> Production Pipeline
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
                                <div className="w-full xl:w-[400px] flex flex-col gap-6 md:gap-8">
                                    <div className="bg-[#0e4368] p-6 md:p-10 rounded-[1.75rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex-1">
                                        <div className="relative z-10">
                                            <h3 className="text-lg md:text-xl font-black text-slate-400 mb-4 md:mb-6 uppercase tracking-widest">Financial Health</h3>
                                            <div className="space-y-6 md:space-y-8">
                                                <div>
                                                    <div className="flex justify-between text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-3">
                                                        <span>Budget Utilization</span>
                                                        <span className="text-emerald-500">{((selectedProject.planning.budget / selectedProject.planning.value) * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(selectedProject.planning.budget / selectedProject.planning.value) * 100}%` }} />
                                                    </div>
                                                </div>
                                                <div className="p-4 md:p-5 bg-white/5 rounded-2xl border border-white/5">
                                                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vault Margin</p>
                                                    <p className="text-xl md:text-2xl font-black text-emerald-400">₹{(selectedProject.planning.value - selectedProject.planning.budget).toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                                        <h3 className="text-lg md:text-xl font-black text-slate-900 mb-4 md:mb-6 flex items-center gap-3">
                                            <Box className="w-5.5 h-5.5 text-emerald-500" /> Intelligence
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Material Integrity</p>
                                                <p className="font-bold text-slate-900 text-xs md:text-[13px]">{selectedProject.metrics.materialConsumption}</p>
                                            </div>
                                            <div className="flex gap-3 md:gap-4">
                                                <a href="https://in.linkedin.com/company/englabs-limited" target="_blank" className="flex-1 bg-slate-100 p-3 md:p-4 rounded-xl flex items-center justify-center gap-2 text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200">LinkedIn</a>
                                                <a href="https://www.instagram.com/englabs_india/" target="_blank" className="flex-1 bg-slate-100 p-3 md:p-4 rounded-xl flex items-center justify-center gap-2 text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200">Instagram</a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                                        <h3 className="text-lg md:text-xl font-black text-slate-900 mb-4 md:mb-6 flex items-center gap-3">
                                            <Users className="w-5.5 h-5.5 text-emerald-500" /> Project Team
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                                            {[
                                                "Thakur", "Rajinder", 
                                                "Arjun", "Kunwarlal", "Anurag", "Shubham", 
                                                "Ratnesh", "Devarshu", "Shiv Kumar", "Uditanshu", "RAM"
                                            ].map(name => (
                                                <div key={name} className="flex items-center gap-1.5 p-1.5 md:p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    <span className="text-[8px] md:text-[10px] font-bold text-slate-700 uppercase">{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            ) : currentView === 'PROJECT_LOOKUP' ? (
                <ProjectLookupDashboard />
            ) : currentView === 'PROJECT_BUDGETS' ? (
                <ProjectBudgets projects={projects} />
            ) : currentView === 'GATE_REGISTER' ? (
                <GateRegister 
                    entries={gateEntries} 
                    onNewEntry={handleNewGateEntry}
                    onUpdateEntry={handleUpdateGateEntry}
                    onDeleteEntry={handleDeleteGateEntry}
                    onLog={(log) => setAuditLogs(prev => [log, ...prev])} 
                    onFullSync={handleFullSync}
                />
            ) : currentView === 'GATE_DISPLAY' ? (
                <GateDisplayScreen entries={gateEntries} />
            ) : currentView === 'FOOD_REGISTER' ? (
                <FoodRegister onLog={(log) => setAuditLogs(prev => [log, ...prev])} />
            ) : currentView === 'BILLING' ? (
                <BillingDashboard />
            ) : currentView === 'SKY5_TERMINAL' ? (
                <Sky5Terminal />
            ) : currentView === 'INVENTORY' ? (
                <InventoryManager />
            ) : currentView === 'STOCK_REPORT' ? (
                <StoreStockReport />
            ) : currentView === 'PORTER_SERVICE' ? (
                <PorterRegister 
                    trips={porterTrips}
                    onNewTrip={(trip) => setPorterTrips(prev => [trip, ...prev])}
                    onUpdateTrip={(updated) => setPorterTrips(prev => prev.map(t => t.id === updated.id ? updated : t))}
                    onDeleteTrip={(id) => setPorterTrips(prev => prev.filter(t => t.id !== id))}
                />
            ) : (
                <DigitalEvidence onAutoRegister={handleNewGateEntry} />
            )}
            </div>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0e4368] border-t border-slate-800 flex items-center justify-around px-4 z-50 print:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
                <MobileTabButton 
                    active={currentView === 'PROJECTS'} 
                    onClick={() => setCurrentView('PROJECTS')} 
                    icon={<Layers className="w-5 h-5" />} 
                    label="Projects" 
                />
                <MobileTabButton 
                    active={currentView === 'GATE_REGISTER'} 
                    onClick={() => setCurrentView('GATE_REGISTER')} 
                    icon={<Shield className="w-5 h-5" />} 
                    label="Logistics" 
                />
                <MobileTabButton 
                    active={currentView === 'INVENTORY'} 
                    onClick={() => setCurrentView('INVENTORY')} 
                    icon={<Box className="w-5 h-5" />} 
                    label="Inventory" 
                />
                <MobileTabButton 
                    active={currentView === 'STOCK_REPORT'} 
                    onClick={() => setCurrentView('STOCK_REPORT')} 
                    icon={<FileText className="w-5 h-5" />} 
                    label="Report" 
                />
                <MobileTabButton 
                    active={currentView === 'PORTER_SERVICE'} 
                    onClick={() => setCurrentView('PORTER_SERVICE')} 
                    icon={<Truck className="w-5 h-5" />} 
                    label="Porter" 
                    color="emerald"
                />
                <button 
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    data-testid="mobile-nav-btn-more"
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-500 hover:text-white"
                >
                    <div className="p-1.5">
                        <MoreHorizontal className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider mt-1">More</span>
                </button>
            </nav>

            {/* MOBILE MORE SHEET MODAL */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden flex items-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="relative w-full max-h-[85vh] overflow-y-auto dark-scrollbar bg-[#0e4368] rounded-t-[2.5rem] border-t border-slate-800 p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">More Operations</h3>
                                <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Englabs Administrative Control</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                data-testid="btn-close-more-sheet"
                                className="p-2 bg-slate-850 rounded-full text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 py-2">
                            <MobileGridButton 
                                onClick={() => { setCurrentView('FOOD_REGISTER'); setIsMobileMenuOpen(false); }} 
                                icon={<Utensils className="w-6 h-6" />} 
                                label="Pantry" 
                                active={currentView === 'FOOD_REGISTER'}
                            />
                            <MobileGridButton 
                                onClick={() => { setCurrentView('BILLING'); setIsMobileMenuOpen(false); }} 
                                icon={<CreditCard className="w-6 h-6" />} 
                                label="Finance" 
                                active={currentView === 'BILLING'}
                            />

                            <MobileGridButton 
                                onClick={() => { setCurrentView('SKY5_TERMINAL'); setIsMobileMenuOpen(false); }} 
                                icon={<ChefHat className="w-6 h-6" />} 
                                label="Sky-5 Kitchen" 
                                active={currentView === 'SKY5_TERMINAL'}
                                color="amber"
                            />
                            <MobileGridButton 
                                onClick={() => { setCurrentView('GATE_DISPLAY'); setIsMobileMenuOpen(false); }} 
                                icon={<Activity className="w-6 h-6" />} 
                                label="Gate HUD" 
                                active={currentView === 'GATE_DISPLAY'}
                                color="emerald"
                            />
                            <MobileGridButton 
                                onClick={() => { setCurrentView('PROJECT_LOOKUP'); setIsMobileMenuOpen(false); }} 
                                icon={<Search className="w-6 h-6" />} 
                                label="Mapping" 
                                active={currentView === 'PROJECT_LOOKUP'}
                            />
                            <MobileGridButton 
                                onClick={() => { setCurrentView('PROJECT_BUDGETS'); setIsMobileMenuOpen(false); }} 
                                icon={<DollarSign className="w-6 h-6" />} 
                                label="Budgets" 
                                active={currentView === 'PROJECT_BUDGETS'}
                            />
                        </div>
                    </div>
                </div>
            )}

            <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={(newProj) => setProjects(prev => [...prev, newProj])} />
        </div>
    );
};

export default App;

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
    X,
    ArrowUpRight,
    ArrowDownRight,
    Lock
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
import { STAFF_ROSTER } from './lib/constants';
import AddStaffModal from './components/AddStaffModal';
import PorterRegister from './components/PorterRegister';
import HandoverDashboard from './components/HandoverDashboard';
import ProjectLookupDashboard from './components/ProjectLookupDashboard';
import { ProjectBudgets } from './components/ProjectBudgets';
import { ProjectData, STAGES, ProjectStage } from './lib/project';
import { logAction, AuditLog } from './lib/system_guard';
import { fetchGateEntries, syncLocalToFirebase, syncAllProjectsToFirebase, saveGateEntry } from './lib/database_service';
import { processInventoryUpdate, fetchInventoryMaster, fetchStockMovement, recordManualTransaction } from './lib/inventory_service';
import forensicRegistry from '../data/forensic_gate_registry.json';
import porterForensic from '../data/porter_missions_forensic.json';

const staticProjects: ProjectData[] = [];
const projectFiles = import.meta.glob('../data/*.json', { eager: true });

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

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('englabs_authenticated') === 'true';
    });
    const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF' | null>(() => {
        return localStorage.getItem('englabs_user_role') as 'ADMIN' | 'STAFF' | null;
    });
    const [pin, setPin] = useState("");
    const [pinError, setPinError] = useState(false);

    const handlePinInput = (num: string) => {
        if (pin.length >= 4) return;
        const newPin = pin + num;
        setPin(newPin);
        
        if (newPin.length === 4) {
            if (newPin === "0001") {
                setIsAuthenticated(true);
                setUserRole("ADMIN");
                localStorage.setItem("englabs_authenticated", "true");
                localStorage.setItem("englabs_user_role", "ADMIN");
                setPin("");
            } else if (newPin === "2580") {
                setIsAuthenticated(true);
                setUserRole("STAFF");
                setCurrentView("STOCK_REPORT");
                localStorage.setItem("englabs_authenticated", "true");
                localStorage.setItem("englabs_user_role", "STAFF");
                setPin("");
            } else {
                setPinError(true);
                setTimeout(() => {
                    setPinError(false);
                    setPin("");
                }, 500);
            }
        }
    };

    const handlePinBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserRole(null);
        localStorage.removeItem("englabs_authenticated");
        localStorage.removeItem("englabs_user_role");
    };

    const [projects, setProjects] = useState<ProjectData[]>(staticProjects);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(staticProjects[0] || null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [recentCheckouts, setRecentCheckouts] = useState<any[]>([]);
    const [checkoutRefreshTrigger, setCheckoutRefreshTrigger] = useState(0);
    const [checkoutItemCode, setCheckoutItemCode] = useState("");
    const [checkoutQty, setCheckoutQty] = useState(1);
    const [checkoutStaffName, setCheckoutStaffName] = useState("");
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [staffList, setStaffList] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem('englabs_staff_members');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return Array.from(new Set([...STAFF_ROSTER, ...parsed]));
                }
            }
        } catch (e) {
            console.error("Failed to load staff list from localStorage:", e);
        }
        return STAFF_ROSTER;
    });
    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);

    const handleAddStaff = (newStaffName: string) => {
        setStaffList(prev => {
            const updated = [...prev, newStaffName];
            localStorage.setItem('englabs_staff_members', JSON.stringify(updated));
            return updated;
        });
    };
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

    useEffect(() => {
        const loadInventoryForCheckout = async () => {
            try {
                const items = await fetchInventoryMaster();
                setInventoryItems(items);

                const logs = await fetchStockMovement();
                const checkouts = logs.filter((l: any) => l.type === 'OUTWARD');
                setRecentCheckouts(checkouts);
            } catch (e) {
                console.error("Failed to load inventory for checkout panel:", e);
            }
        };
        loadInventoryForCheckout();
    }, [checkoutRefreshTrigger]);

    const [currentView, setCurrentView] = useState<View>(() => {
        const role = localStorage.getItem('englabs_user_role');
        return role === 'STAFF' ? 'STOCK_REPORT' : 'PROJECTS';
    });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        console.log("Found project files:", Object.keys(projectFiles));
        
        const loadProjects = () => {
            const loadedProjects: ProjectData[] = [];
            for (const path in projectFiles) {
                try {
                    const module = projectFiles[path] as { default: any };
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

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkoutItemCode) {
            alert("Please select an item to check out.");
            return;
        }
        if (checkoutQty <= 0) {
            alert("Quantity must be greater than 0.");
            return;
        }
        if (!checkoutStaffName.trim()) {
            alert("Please enter the staff name.");
            return;
        }

        const selectedItem = inventoryItems.find(i => i.itemCode === checkoutItemCode);
        if (!selectedItem) {
            alert("Selected item not found.");
            return;
        }

        try {
            setCheckoutLoading(true);
            const res = await recordManualTransaction(
                selectedItem.name,
                checkoutQty,
                selectedItem.unit || "Nos",
                'OUTWARD',
                checkoutStaffName.trim(),
                "HOMEPAGE_CHECKOUT",
                undefined,
                undefined,
                selectedProject?.projectId
            ) as any;

            if (res.success) {
                setCheckoutQty(1);
                setCheckoutItemCode("");
                setCheckoutRefreshTrigger(prev => prev + 1);
            } else {
                alert(`Failed to check out: ${res.error || 'Unknown error'}`);
            }
        } catch (err: any) {
            alert(`Check-out error: ${err.message || err}`);
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (!selectedProject) return <div className="h-screen w-screen bg-[#092a42] flex items-center justify-center text-white font-black text-4xl">INITIALIZING...</div>;

    if (!isAuthenticated) {
        return (
            <div className="h-screen w-screen bg-[#092a42] flex items-center justify-center text-white font-sans p-6 overflow-hidden relative">
                {/* Decorative background grid and graphics */}
                <div className="absolute inset-0 industrial-grid opacity-20" />
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />

                <div className="w-full max-w-[400px] max-h-full overflow-y-auto bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-4 sm:p-8 flex flex-col items-center shadow-2xl relative z-10 animate-spring-zoom">
                    {/* Brand header */}
                    <div className="flex items-center gap-3.5 mb-1 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900 sm:w-5 sm:h-5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm sm:text-base font-black tracking-tighter text-white">ENGLABS STORE</span>
                            <span className="text-[7px] sm:text-[8px] font-black text-slate-400 tracking-[0.3em] uppercase">Enterprise Stock OS</span>
                        </div>
                    </div>

                    <div className="h-[1px] w-full bg-white/5 my-3 sm:my-6" />

                    <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 text-center">SYSTEM ACCESS LOCK</h2>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 sm:mb-8 text-center">Enter PIN to authorize access</p>

                    {/* PIN circular indicators */}
                    <div className={`flex gap-3 sm:gap-4 mb-4 sm:mb-10 ${pinError ? 'animate-shake' : ''}`}>
                        {[0, 1, 2, 3].map((index) => (
                            <div 
                                key={index} 
                                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                                    pinError 
                                    ? 'bg-rose-500 border border-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                                    : index < pin.length 
                                    ? 'bg-emerald-400 border border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.5)]' 
                                    : 'bg-slate-800 border border-slate-700/50'
                                }`} 
                            />
                        ))}
                    </div>

                    {/* Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-[240px] sm:max-w-[280px] mb-3 sm:mb-6">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handlePinInput(num)}
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/5 font-black text-lg sm:text-xl hover:bg-white/10 hover:border-white/10 transition-all flex items-center justify-center shadow-lg active:scale-95 cursor-pointer text-white"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setPin("")}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                        >
                            Clear
                        </button>
                        <button
                            key="0"
                            type="button"
                            onClick={() => handlePinInput("0")}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/5 font-black text-lg sm:text-xl hover:bg-white/10 hover:border-white/10 transition-all flex items-center justify-center shadow-lg active:scale-95 cursor-pointer text-white"
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onClick={handlePinBackspace}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                        >
                            Delete
                        </button>
                    </div>

                    {pinError && (
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider animate-bounce">
                            INCORRECT PIN. ACCESS DENIED.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (showHandover) {
        return <HandoverDashboard onAcknowledge={handleAcknowledgeHandover} />;
    }

    return (
        <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white">
            {/* SIDEBAR LEDGER */}
            <aside 
                className="bg-[#0e4368] hidden md:flex flex-col shadow-2xl shrink-0 border-r border-slate-800 print:hidden pt-safe"
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
                            <span className="text-lg font-black text-white tracking-tighter leading-none">ENGLABS STORE</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">PVT LTD</span>
                        </div>
                    </div>
                    <p className="text-[9px] font-black text-emerald-500/80 tracking-[0.25em] uppercase pl-1">Enterprise Store OS</p>
                    <div className="mt-4 pl-1">
                        {userRole === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Admin Mode
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black text-amber-400 uppercase tracking-widest">
                                <Lock className="w-3.5 h-3.5 text-amber-400" /> Staff Mode
                            </span>
                        )}
                    </div>
                </div>

                <div className="px-6 mb-8 flex flex-col gap-2.5 overflow-y-auto max-h-[55vh] dark-scrollbar shrink-0">
                    {userRole === 'ADMIN' ? (
                        <>
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
                        </>
                    ) : (
                        <SidebarButton 
                            active={currentView === 'STOCK_REPORT'} 
                            onClick={() => setCurrentView('STOCK_REPORT')} 
                            icon={<FileText className="w-4.5 h-4.5" />} 
                            label="STORE STOCK REPORT" 
                        />
                    )}
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
                <div className="p-6 border-t border-slate-800 shrink-0 space-y-3">
                    {userRole === 'ADMIN' && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            data-testid="btn-new-mission"
                            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-950/20 cursor-pointer"
                        >
                            <Plus className="w-5 h-5" /> NEW MISSION
                        </button>
                    )}
                    <button 
                        onClick={handleLogout}
                        className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer text-xs"
                    >
                        <Lock className="w-4 h-4" /> LOCK SYSTEM
                    </button>
                </div>
            </aside>

            {/* MAIN OPERATIONAL CORE */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pb-16 md:pb-0">
                {currentView === 'PROJECTS' ? (
                    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
                    <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-10 shrink-0 pt-safe">
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
                            {userRole === 'ADMIN' ? (
                                <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                    <Shield className="w-3 h-3 text-emerald-500" /> Admin Mode
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-[9px] font-black text-amber-600 uppercase tracking-widest">
                                    <Lock className="w-3 h-3 text-amber-500" /> Staff Mode
                                </span>
                            )}
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
                                <div className="flex-1 flex flex-col gap-6 md:gap-8">
                                    <div className="bg-white p-5 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
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

                                    {/* TODAY'S MATERIAL ISSUED */}
                                    <div className="bg-white p-5 md:p-10 rounded-[1.75rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] flex flex-col gap-6">
                                         <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                             <div>
                                                 <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                                     <Box className="w-5.5 h-5.5 text-amber-500" /> Today's Material Issued
                                                 </h3>
                                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Operations Release Registry</p>
                                             </div>
                                             <span className="bg-slate-100 rounded-xl px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                                                 {recentCheckouts.filter(tx => new Date(tx.timestamp).toDateString() === new Date().toDateString()).length} Items
                                             </span>
                                         </div>

                                         {recentCheckouts.filter(tx => new Date(tx.timestamp).toDateString() === new Date().toDateString()).length === 0 ? (
                                             <div className="p-16 text-center text-slate-300 flex flex-col items-center gap-3">
                                                 <Clock className="w-12 h-12 opacity-30" />
                                                 <p className="font-black text-sm uppercase tracking-widest">No Materials Issued Today</p>
                                                 <p className="text-xs text-slate-400 max-w-xs">Items checked out via the side panel will instantly appear here in real-time.</p>
                                             </div>
                                         ) : (
                                             <div className="overflow-x-auto">
                                                 <table className="w-full text-left border-collapse">
                                                     <thead>
                                                         <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">
                                                             <th className="pb-4 pr-4">Item Identity</th>
                                                             <th className="pb-4 px-4 text-center">Quantity</th>
                                                             <th className="pb-4 px-4">Staff Member</th>
                                                             <th className="pb-4 pl-4 text-right">Time</th>
                                                         </tr>
                                                     </thead>
                                                     <tbody className="divide-y divide-slate-50 text-xs">
                                                         {recentCheckouts.filter(tx => new Date(tx.timestamp).toDateString() === new Date().toDateString()).map((tx) => (
                                                             <tr key={tx.id} className="group hover:bg-slate-50/50 transition-colors">
                                                                 <td className="py-4 pr-4">
                                                                     <p className="font-black text-slate-900">{tx.itemId.replace(/_/g, ' ')}</p>
                                                                     <p className="text-[8px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">{tx.itemId}</p>
                                                                 </td>
                                                                 <td className="py-4 px-4 text-center">
                                                                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                                                         -{tx.quantity} {tx.unit || 'Nos'}
                                                                     </span>
                                                                 </td>
                                                                 <td className="py-4 px-4 font-bold text-slate-700 uppercase">
                                                                     {tx.partyName}
                                                                 </td>
                                                                 <td className="py-4 pl-4 text-right font-medium text-slate-400">
                                                                     {new Date(tx.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                                 </td>
                                                             </tr>
                                                         ))}
                                                     </tbody>
                                                 </table>
                                             </div>
                                         )}
                                    </div>
                                </div>

                                {/* INTEL (RIGHT) */}
                                <div className="w-full xl:w-[400px] flex flex-col gap-6 md:gap-8">
                                    {/* LIVE CHECK-OUT PANEL */}
                                    <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[1.75rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col gap-6 shrink-0">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                                        
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Check-Out Panel
                                                </h3>
                                                <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-black text-emerald-400 uppercase tracking-wider">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Live
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Store Inventory Release Center</p>
                                        </div>

                                        {/* QUICK FORM */}
                                        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Select Item</label>
                                                <select 
                                                    value={checkoutItemCode} 
                                                    onChange={(e) => setCheckoutItemCode(e.target.value)}
                                                    required 
                                                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
                                                >
                                                    <option value="">-- Select Material --</option>
                                                    {inventoryItems.map((item) => (
                                                        <option key={item.itemCode} value={item.itemCode}>
                                                            [{item.itemCode}] {item.name} ({item.currentStock} {item.unit} left)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        value={checkoutQty} 
                                                        onChange={(e) => setCheckoutQty(parseInt(e.target.value) || 1)}
                                                        required 
                                                        className="w-full bg-slate-800 border border-slate-700/50 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Staff Name</label>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setIsAddStaffModalOpen(true)}
                                                            className="text-[8px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest flex items-center gap-0.5 transition-all"
                                                        >
                                                            <Plus className="w-3 h-3" /> New Staff
                                                        </button>
                                                    </div>
                                                    <select 
                                                        value={checkoutStaffName} 
                                                        onChange={(e) => setCheckoutStaffName(e.target.value)}
                                                        required 
                                                        className="w-full bg-slate-800 border border-slate-700/50 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
                                                    >
                                                        <option value="">-- Staff --</option>
                                                        {staffList.map((name) => (
                                                            <option key={name} value={name}>
                                                                {name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={checkoutLoading}
                                                className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-xl hover:bg-emerald-400 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50 mt-2 shadow-lg shadow-emerald-500/10"
                                            >
                                                {checkoutLoading ? 'Processing...' : 'CHECK OUT'}
                                            </button>
                                        </form>

                                        {/* MINI RECENT TICKER */}
                                        <div className="border-t border-slate-800/80 pt-4">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">Live Checkout Feed</span>
                                            {recentCheckouts.length === 0 ? (
                                                <p className="text-[10px] font-bold text-slate-600 uppercase text-center py-4">No recent releases logged</p>
                                            ) : (
                                                <div className="space-y-2.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                                                    {recentCheckouts.slice(0, 3).map((tx) => (
                                                        <div key={tx.id} className="p-3 bg-slate-800/40 border border-slate-800/60 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                                                    <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] font-black text-white truncate">{tx.itemId.replace(/_/g, ' ')}</p>
                                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate">By: {tx.partyName}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-[11px] font-black text-amber-400">-{tx.quantity} {tx.unit || 'Nos'}</p>
                                                                <p className="text-[8px] font-medium text-slate-500 mt-0.5">{new Date(tx.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

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
                                            {staffList.map(name => (
                                                <div key={name} className="flex items-center gap-1.5 p-1.5 md:p-2 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
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
                <StoreStockReport 
                    userRole={userRole || 'STAFF'} 
                    projects={projects} 
                    staffList={staffList}
                    onAddStaff={handleAddStaff}
                    onAddProject={(newProj) => setProjects(prev => [...prev, newProj])}
                />
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
                {userRole === 'ADMIN' ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <MobileTabButton 
                            active={currentView === 'STOCK_REPORT'} 
                            onClick={() => setCurrentView('STOCK_REPORT')} 
                            icon={<FileText className="w-5 h-5" />} 
                            label="Report" 
                        />
                        <button 
                            type="button"
                            onClick={handleLogout}
                            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-rose-400 hover:text-rose-350"
                        >
                            <div className="p-1.5">
                                <Lock className="w-5 h-5" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-wider mt-1">Lock</span>
                        </button>
                    </>
                )}
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
            <AddStaffModal isOpen={isAddStaffModalOpen} onClose={() => setIsAddStaffModalOpen(false)} onAdd={handleAddStaff} existingStaff={staffList} />
        </div>
    );
};

export default App;

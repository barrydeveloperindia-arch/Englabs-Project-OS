import React, { useState, useEffect } from 'react';
import logo from '@/assets/englabs_logo.png';
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
    Lock,
    MapPin
} from 'lucide-react';
import NewProjectModal from '@common/NewProjectModal';
import GateRegister from '@features/porter/GateRegister';
import Showroom from '@features/dashboard/Showroom';
import FoodRegister from '@features/food/FoodRegister';
import SystemGuardDashboard from '@features/dashboard/SystemGuardDashboard';
import BillingDashboard from '@features/projects/BillingDashboard';
import { ManagementDashboard } from '@features/accounts/ManagementDashboard';
import { RequireRole } from './components/auth/RequireRole';
import DigitalEvidence from '@features/dashboard/DigitalEvidence';
import InventoryManager from '@features/store/InventoryManager';
import Sky5Terminal from '@features/dashboard/Sky5Terminal';
import StoreStockReport from '@features/reports/StoreStockReport';
import StoreGuardianDashboard from '@features/store/StoreGuardianDashboard';
import MobileDashboard from '@features/dashboard/MobileDashboard';
import HRDashboard from '@features/hr/HRDashboard';
import { PayrollTerminal } from '@features/hr/PayrollTerminal';
import { STAFF_ROSTER } from '@config/constants';
import AddStaffModal from '@common/AddStaffModal';
import PorterRegister from '@features/porter/PorterRegister';
import HandoverDashboard from '@features/projects/HandoverDashboard';
import ProjectLookupDashboard from '@features/projects/ProjectLookupDashboard';
import { ProjectBudgets } from '@features/projects/ProjectBudgets';
import { ProjectData, STAGES, ProjectStage } from '@domain/project';
import { logAction, AuditLog } from '@domain/system_guard';
import { fetchGateEntries, syncLocalToFirebase, syncAllProjectsToFirebase, saveGateEntry, deleteGateEntryFromFirebase } from '@services/database_service';
import { processInventoryUpdate, fetchInventoryMaster, fetchStockMovement, recordManualTransaction } from '@domain/inventory_service';
import forensicRegistry from '@data/forensic_gate_registry.json';
import porterForensic from '@data/porter_missions_forensic.json';
import { DesktopSidebar } from '@components/layout/DesktopSidebar';
import { MobileLayout } from '@components/layout/MobileLayout';
import { ProjectListGrid } from '@features/projects/ProjectListGrid';
import { ProjectDashboard } from '@features/projects/ProjectDashboard';
import { ProjectManagementDashboard } from '@features/projects/ProjectManagementDashboard';


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

type View = 'HOME' | 'PROJECTS' | 'PROJECT_MANAGEMENT_DASHBOARD' | 'GATE_REGISTER' | 'FOOD_REGISTER' | 'BILLING' | 'EVIDENCE' | 'INVENTORY' | 'SKY5_TERMINAL' | 'STOCK_REPORT' | 'PORTER_SERVICE' | 'PROJECT_LOOKUP' | 'PROJECT_BUDGETS' | 'STORE_GUARDIAN' | 'MANAGEMENT_DASHBOARD' | 'SETTINGS' | 'GATE_DISPLAY' | 'MASTER_TASK_REGISTER' | 'ATTENDANCE' | 'PAYROLL';

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
    const [projectFilter, setProjectFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING'>('ALL');
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
            const deletedSaved = localStorage.getItem('englabs_porter_deleted_ids');
            const deletedIds = deletedSaved ? JSON.parse(deletedSaved) : [];
            const deletedSet = new Set(deletedIds);

            const forensic = (porterForensic as any[]).filter((t: any) => !deletedSet.has(t.id));
            let trips = saved && saved !== 'undefined' ? JSON.parse(saved) : [];
            trips = trips.map((t: any) => {
                if ((t.id === 'PTR-2026-0020' && t.advanceAmount === 1000) || 
                    (t.id === 'PTR-2026-0021' && t.advanceAmount === 4000)) {
                    return { ...t, advanceAmount: 0, remainingBalance: t.grossAmount };
                }
                return t;
            });
            trips = trips.filter((t: any) => !deletedSet.has(t.id) && !(t.id === 'PTR-2026-0022' && t.grossAmount > 1000));
            
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

    // Cleanup complete. Removed.

    // REACTIVE FORENSIC SYNC: Ensures disk-based updates (like new JSON entries) are merged into state
    useEffect(() => {
        setPorterTrips(prev => {
            const deletedSaved = localStorage.getItem('englabs_porter_deleted_ids');
            const deletedIds = deletedSaved ? JSON.parse(deletedSaved) : [];
            const deletedSet = new Set(deletedIds);

            const forensic = (porterForensic as any[]).filter((t: any) => !deletedSet.has(t.id));
            const entryMap = new Map();
            prev.filter((t: any) => !deletedSet.has(t.id)).forEach(e => entryMap.set(e.id, e));
            forensic.forEach(e => entryMap.set(e.id, e)); // Forensic takes priority for matched IDs
            const old22 = Array.from(entryMap.values()).find((t: any) => t.id === 'PTR-2026-0022' && t.grossAmount > 1000);
            if (old22) {
                entryMap.delete('PTR-2026-0022');
            }
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
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        return role === 'STAFF' ? 'STOCK_REPORT' : (isMobile ? 'HOME' : 'PROJECT_MANAGEMENT_DASHBOARD');
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

    useEffect(() => {
        localStorage.setItem('englabs_porter_v1', JSON.stringify(porterTrips));
    }, [porterTrips]);

    // One-time startup cleanup of old, invalid PTR-2026-0022 (₹5,400) and wrong advances from localStorage
    useEffect(() => {
        try {
            setPorterTrips(prev => {
                let changed = false;
                const updated = prev.map(t => {
                    if ((t.id === 'PTR-2026-0020' && t.advanceAmount !== 0) || 
                        (t.id === 'PTR-2026-0021' && t.advanceAmount !== 0)) {
                        changed = true;
                        return { ...t, advanceAmount: 0, remainingBalance: t.grossAmount };
                    }
                    return t;
                }).filter((t: any) => !(t.id === 'PTR-2026-0022' && t.grossAmount > 1000));
                
                if (changed || updated.length !== prev.length) {
                    localStorage.setItem('englabs_porter_v1', JSON.stringify(updated));
                    localStorage.setItem('englabs_porter_backup_vault', JSON.stringify(updated));
                    return updated;
                }
                return prev;
            });
        } catch (e) {
            console.error("Cleanup of old invalid records failed:", e);
        }
    }, []);

    const filteredProjects = projects.filter(p => {
        const matchesSearch = (p.client || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.projectId.toLowerCase().includes(searchQuery.toLowerCase());
            
        if (!matchesSearch) return false;

        if (projectFilter === 'ACTIVE') {
            const allCompleted = p.production.stages.every(s => s.status === 'Completed');
            return p.planning.poConfirmed && !allCompleted;
        }
        if (projectFilter === 'UPCOMING') {
            const noneStarted = p.production.stages.every(s => s.status === 'Pending');
            return !p.planning.poConfirmed || noneStarted;
        }
        return true;
    });

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

    const handleDeleteGateEntry = async (id: string) => {
        setGateEntries(prev => prev.filter(e => e.id !== id));
        await deleteGateEntryFromFirebase(id);
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
                selectedProject?.projectId,
                undefined,
                undefined,
                selectedItem.itemCode
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
                            <span className="text-sm sm:text-base font-black tracking-tighter text-white">
                                {import.meta.env.VITE_APP_MODE === 'STORE' ? 'ENGLABS STORE' : import.meta.env.VITE_APP_MODE === 'PORTER_SERVICE' ? 'PORTER SERVICE' : 'ENGLABS PROJECTS'}
                            </span>
                            <span className="text-[7px] sm:text-[8px] font-black text-slate-400 tracking-[0.3em] uppercase">
                                {import.meta.env.VITE_APP_MODE === 'STORE' ? 'Enterprise Stock OS' : import.meta.env.VITE_APP_MODE === 'PORTER_SERVICE' ? 'Porter Logistics OS' : 'Enterprise Projects OS'}
                            </span>
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
            <DesktopSidebar 
                currentView={currentView}
                setCurrentView={setCurrentView}
                userRole={userRole}
                handleLogout={handleLogout}
                setIsModalOpen={setIsModalOpen}
                appMode={import.meta.env.VITE_APP_MODE || 'PROJECTS'}
            />

            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pb-16 md:pb-0">
                {currentView === 'PROJECT_MANAGEMENT_DASHBOARD' ? (
                    <ProjectManagementDashboard 
                        projects={projects}
                        onSelectProject={() => setCurrentView('PROJECTS')}
                    />
                ) : currentView === 'PROJECTS' ? (
                    !selectedProject ? (
                        <ProjectListGrid 
                            projects={projects}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            projectFilter={projectFilter}
                            setProjectFilter={setProjectFilter}
                            onSelectProject={setSelectedProject}
                        />
                    ) : (
                        <ProjectDashboard 
                            selectedProject={selectedProject}
                            onBack={() => setSelectedProject(null)}
                            userRole={userRole}
                            updateStage={(stageName, newStatus) => {
                                setProjects(prev => prev.map(p => {
                                    if (p.projectId === selectedProject.projectId) {
                                        return {
                                            ...p,
                                            production: {
                                                ...p.production,
                                                stages: p.production.stages.map(s => s.name === stageName ? { ...s, status: newStatus } : s)
                                            }
                                        };
                                    }
                                    return p;
                                }));
                                setSelectedProject(prev => prev ? {
                                    ...prev,
                                    production: {
                                        ...prev.production,
                                        stages: prev.production.stages.map(s => s.name === stageName ? { ...s, status: newStatus } : s)
                                    }
                                } : null);
                            }}
                            recentCheckouts={recentCheckouts}
                            handleCheckoutSubmit={handleCheckoutSubmit}
                            checkoutItemCode={checkoutItemCode}
                            setCheckoutItemCode={setCheckoutItemCode}
                            inventoryItems={inventoryItems}
                            checkoutQty={checkoutQty}
                            setCheckoutQty={setCheckoutQty}
                            checkoutStaffName={checkoutStaffName}
                            setCheckoutStaffName={setCheckoutStaffName}
                            staffList={staffList}
                            setIsAddStaffModalOpen={setIsAddStaffModalOpen}
                            checkoutLoading={checkoutLoading}
                        />
                    )
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
                ) : currentView === 'FOOD_REGISTER' ? (
                    <FoodRegister onLog={(log) => setAuditLogs(prev => [log, ...prev])} />
                ) : currentView === 'ATTENDANCE' ? (
                    <RequireRole allowedRoles={['HR_ADMIN']}>
                        <HRDashboard />
                    </RequireRole>
                ) : currentView === 'PAYROLL' ? (
                    <RequireRole allowedRoles={['HR_ADMIN']}>
                        <PayrollTerminal />
                    </RequireRole>
                ) : currentView === 'BILLING' ? (
                    <RequireRole allowedRoles={['ADMIN']}>
                        <BillingDashboard />
                    </RequireRole>
                ) : currentView === 'MANAGEMENT_DASHBOARD' ? (
                    <RequireRole allowedRoles={['ADMIN']}>
                        <ManagementDashboard />
                    </RequireRole>
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
                ) : currentView === 'STORE_GUARDIAN' ? (
                    <StoreGuardianDashboard />
                ) : currentView === 'PORTER_SERVICE' ? (
                    <PorterRegister 
                        trips={porterTrips}
                        onNewTrip={(trip) => setPorterTrips(prev => [trip, ...prev])}
                        onUpdateTrip={(updated) => setPorterTrips(prev => prev.map(t => t.id === updated.id ? updated : t))}
                        onDeleteTrip={(id) => {
                            setPorterTrips(prev => prev.filter(t => t.id !== id));
                            try {
                                const deletedSaved = localStorage.getItem('englabs_porter_deleted_ids');
                                const deletedIds = deletedSaved ? JSON.parse(deletedSaved) : [];
                                if (!deletedIds.includes(id)) {
                                    deletedIds.push(id);
                                    localStorage.setItem('englabs_porter_deleted_ids', JSON.stringify(deletedIds));
                                }
                            } catch (e) {
                                console.error("Failed to save deleted ID:", e);
                            }
                        }}
                    />
                ) : currentView === 'SETTINGS' ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-3xl m-6 shadow-sm">
                        <div className="bg-emerald-500/10 p-6 rounded-full mb-6">
                            <Settings className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">System Settings</h2>
                        <p className="text-slate-500 font-medium max-w-md text-center">Global configuration and administrative preferences are managed here.</p>
                    </div>
                ) : currentView === 'HOME' ? (
                    <div className="md:hidden h-full">
                        <MobileDashboard 
                            projects={projects} 
                            gateEntries={gateEntries} 
                            recentCheckouts={recentCheckouts} 
                            onQuickAction={(action) => {
                                if (action === 'GATE_ENTRY') setCurrentView('GATE_REGISTER');
                                if (action === 'CHECKOUT') setCurrentView('INVENTORY');
                                if (action === 'PORTER') setCurrentView('PORTER_SERVICE');
                                if (action === 'PROJECT_UPDATE') setCurrentView('PROJECTS');
                            }} 
                        />
                    </div>
                ) : (
                    <DigitalEvidence onAutoRegister={handleNewGateEntry} />
                )}
            </div>

            <MobileLayout 
                currentView={currentView}
                setCurrentView={setCurrentView}
                userRole={userRole}
                handleLogout={handleLogout}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={(newProj) => setProjects(prev => [...prev, newProj])} />
            <AddStaffModal isOpen={isAddStaffModalOpen} onClose={() => setIsAddStaffModalOpen(false)} onAdd={handleAddStaff} existingStaff={staffList} />
        </div>
    );
};

export default App;

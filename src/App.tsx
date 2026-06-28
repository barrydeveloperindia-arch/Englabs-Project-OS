import React, { useState, useEffect } from 'react';
import { Login } from '@shared/components/auth/Login';
import { AuthService } from '@shared/services/auth_service';
import { User } from '@shared/types/database.types';
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
import GateRegister from '@modules/inventory/porter/GateRegister';
import Showroom from '@modules/dashboard/main/Showroom';
import FoodRegister from '@modules/inventory/food/FoodRegister';
import SystemGuardDashboard from '@modules/dashboard/main/SystemGuardDashboard';
import BillingDashboard from '@modules/projects/main/BillingDashboard';
import { ManagementDashboard } from '@modules/finance/main/ManagementDashboard';
import { RequireRole } from '@shared/components/auth/RequireRole';
import DigitalEvidence from '@modules/dashboard/main/DigitalEvidence';
import InventoryManager from '@modules/inventory/store/InventoryManager';
import Sky5Terminal from '@modules/dashboard/main/Sky5Terminal';
import StoreStockReport from '@modules/inventory/reports/StoreStockReport';
import HotelRegister from '@modules/lodging/HotelRegister';
import StoreGuardianDashboard from '@modules/inventory/store/StoreGuardianDashboard';
import MobileDashboard from '@modules/dashboard/main/MobileDashboard';
import CommandCenterDashboard from '@modules/dashboard/main/CommandCenterDashboard';
import HRDashboard from '@modules/hr/main/HRDashboard';
import { PayrollTerminal } from '@modules/hr/main/PayrollTerminal';
import { STAFF_ROSTER } from '@config/constants';
import AddStaffModal from '@common/AddStaffModal';
import PorterRegister from '@modules/inventory/porter/PorterRegister';
import HandoverDashboard from '@modules/projects/main/HandoverDashboard';
import ProjectLookupDashboard from '@modules/projects/main/ProjectLookupDashboard';
import { ProjectBudgets } from '@modules/projects/main/ProjectBudgets';
import { ProjectsTracker } from '@modules/projects/main/ProjectsTracker';
import { DailyStandup } from '@modules/projects/main/DailyStandup';
import { PORelease } from '@modules/projects/main/PORelease';
import { InvoiceRelease } from '@modules/projects/main/InvoiceRelease';
import { ProjectData, STAGES, ProjectStage } from '@domain/project';
import { logAction, AuditLog } from '@domain/system_guard';
import { fetchGateEntries, syncLocalToFirebase, syncAllProjectsToFirebase, saveGateEntry, deleteGateEntryFromFirebase, saveProjectToFirebase, fetchProjectsFromFirebase, savePorterEntry, fetchPorterLedger } from '@services/database_service';
import { processInventoryUpdate, fetchInventoryMaster, fetchStockMovement, recordManualTransaction } from '@domain/inventory_service';
import forensicRegistry from '@data/forensic_gate_registry.json';
import porterForensic from '@data/porter_missions_forensic.json';
import porterAdvancesForensic from '@data/porter_advances_forensic.json';
import { PlaceholderModule } from '@components/common/PlaceholderModule';
import { DesktopSidebar } from '@components/layout/DesktopSidebar';
import { MobileLayout } from '@components/layout/MobileLayout';
import { ProjectListGrid } from '@modules/projects/main/ProjectListGrid';
import { ProjectDashboard } from '@modules/projects/main/ProjectDashboard';
import { ProjectManagementDashboard } from '@modules/projects/main/ProjectManagementDashboard';
import EditProjectModal from '@components/common/EditProjectModal';


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

type View = string;

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

    const [authInitializing, setAuthInitializing] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const speak = (text: string) => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v => v.lang.includes('GB') || v.lang.includes('US')) || voices[0];
            if (preferred) utterance.voice = preferred;
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        const handleFirstGesture = () => {
            if (!(window as any).__hasWelcomedEnglabs) {
                (window as any).__hasWelcomedEnglabs = true;
                speak("Welcome Englabs Team");
            }
            document.removeEventListener('click', handleFirstGesture);
            document.removeEventListener('touchstart', handleFirstGesture);
            document.removeEventListener('keydown', handleFirstGesture);
        };

        if (!(window as any).__hasWelcomedEnglabs) {
            document.addEventListener('click', handleFirstGesture);
            document.addEventListener('touchstart', handleFirstGesture);
            document.addEventListener('keydown', handleFirstGesture);
        }

        return () => {
            document.removeEventListener('click', handleFirstGesture);
            document.removeEventListener('touchstart', handleFirstGesture);
            document.removeEventListener('keydown', handleFirstGesture);
        };
    }, []);

    useEffect(() => {
        AuthService.init((user) => {
            setCurrentUser(user);
            setAuthInitializing(false);
        });
    }, []);

    const handleLogout = async () => {
        await AuthService.logout();
    };

    const [projects, setProjects] = useState<ProjectData[]>(staticProjects);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
    const handleSelectProject = (project: ProjectData | null) => {
        setSelectedProject(project);
        if (project) {
            localStorage.setItem('englabs_last_project_id', project.projectId);
        } else {
            localStorage.removeItem('englabs_last_project_id');
        }
    };
    const [dbSyncError, setDbSyncError] = useState<string | null>(null);
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
            trips = trips.filter((t: any) => !deletedSet.has(t.id) && !(t.id === 'PTR-2026-0022' && t.grossAmount > 1000));
            
            const entryMap = new Map();
            forensic.forEach(f => entryMap.set(f.id, f));
            trips.forEach((t: any) => {
                const existing = entryMap.get(t.id);
                entryMap.set(t.id, existing ? { ...existing, ...t } : t);
            });
            const merged = Array.from(entryMap.values());
            
            return merged.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (e) {
            console.error("Porter initialization failed:", e);
            return porterForensic as any[];
        }
    });
    const [porterAdvances, setPorterAdvances] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('englabs_porter_advances_v1');
            const deletedSaved = localStorage.getItem('englabs_porter_advances_deleted_ids');
            let deletedIds = deletedSaved ? JSON.parse(deletedSaved) : [];
            
            // Auto-restore ADV-2026-0002 if it was accidentally deleted
            if (deletedIds.includes('ADV-2026-0002')) {
                deletedIds = deletedIds.filter((id: string) => id !== 'ADV-2026-0002');
                localStorage.setItem('englabs_porter_advances_deleted_ids', JSON.stringify(deletedIds));
            }
            
            const deletedSet = new Set(deletedIds);

            const forensic = (porterAdvancesForensic as any[]).filter((a: any) => !deletedSet.has(a.id));
            let advances = saved && saved !== 'undefined' ? JSON.parse(saved) : [];
            advances = advances.filter((a: any) => !deletedSet.has(a.id));

            const entryMap = new Map();
            forensic.forEach(f => entryMap.set(f.id, f));
            advances.forEach((a: any) => {
                const existing = entryMap.get(a.id);
                entryMap.set(a.id, existing ? { ...existing, ...a } : a);
            });
            const merged = Array.from(entryMap.values());

            // Make sure ADV-2026-0002 is explicitly in the returned array
            if (!merged.some((a: any) => a.id === 'ADV-2026-0002')) {
                const item2 = (porterAdvancesForensic as any[]).find((a: any) => a.id === 'ADV-2026-0002');
                if (item2) merged.push(item2);
            }

            return merged.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (e) {
            console.error("Porter advances initialization failed:", e);
            return porterAdvancesForensic as any[];
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
            forensic.forEach(e => entryMap.set(e.id, e)); // Forensic is baseline
            prev.filter((t: any) => !deletedSet.has(t.id)).forEach(e => {
                const existing = entryMap.get(e.id);
                entryMap.set(e.id, existing ? { ...existing, ...e } : e); // State edits take priority
            });
            
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
        if (role === 'STAFF' || role === 'Store Manager') return 'STOCK_REPORT';
        if (role === 'HR') return 'ATTENDANCE';
        if (role === 'Accountant') return 'BILLING';
        return isMobile ? 'HOME' : 'PROJECTS';
    });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        console.log("Found project files:", Object.keys(projectFiles));
        
        const loadProjects = async () => {
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
            
            let finalProjects = loadedProjects;
            try {
                console.log("Fetching latest projects from Firestore...");
                const fbProjects = await fetchProjectsFromFirebase();
                if (fbProjects && fbProjects.length > 0) {
                    console.log(`Successfully fetched ${fbProjects.length} projects from Firestore.`);
                    const fbMap = new Map(fbProjects.map((p: any) => [p.projectId, p]));
                    
                    const mergedProjects = loadedProjects.map(staticProj => {
                        const fbProj = fbMap.get(staticProj.projectId);
                        if (fbProj) {
                            return { ...staticProj, ...fbProj } as ProjectData;
                        }
                        return staticProj;
                    });

                    // Append any new projects from Firestore not defined in local static JSON files
                    const staticIds = new Set(loadedProjects.map(p => p.projectId));
                    fbProjects.forEach((fbProj: any) => {
                        if (fbProj && fbProj.projectId && !staticIds.has(fbProj.projectId)) {
                            console.log(`Loading new Firestore-only project: ${fbProj.projectId}`);
                            mergedProjects.push(fbProj as ProjectData);
                        }
                    });

                    finalProjects = mergedProjects;
                    setDbSyncError(null);
                }
            } catch (fbErr) {
                console.error("Failed to load projects from Firestore, falling back to local files:", fbErr);
                setDbSyncError("Unable to connect to live database. Loading offline local data.");
            }

            // Overlay any localStorage overrides to protect manual standup entries from being lost/removed
            try {
                const localSaved = localStorage.getItem('englabs_project_overrides');
                if (localSaved) {
                    const localOverrides = JSON.parse(localSaved);
                    if (localOverrides['C5295']) {
                        delete localOverrides['C5295'];
                        localStorage.setItem('englabs_project_overrides', JSON.stringify(localOverrides));
                    }
                    if (localStorage.getItem('englabs_last_project_id') === 'C5295') {
                        localStorage.removeItem('englabs_last_project_id');
                    }
                    
                    // Apply override overlays to existing list
                    finalProjects = finalProjects.map(proj => {
                        const localOverride = localOverrides[proj.projectId];
                        if (localOverride) {
                            console.log(`Applying localStorage override for project ${proj.projectId} to preserve manual standup entries.`);
                            return {
                                ...proj,
                                ...localOverride,
                                dailyStandup: {
                                    ...proj.dailyStandup,
                                    ...localOverride.dailyStandup
                                },
                                planning: {
                                    ...proj.planning,
                                    ...localOverride.planning
                                },
                                production: {
                                    ...proj.production,
                                    ...localOverride.production
                                },
                                metrics: {
                                    ...proj.metrics,
                                    ...localOverride.metrics
                                }
                            } as ProjectData;
                        }
                        return proj;
                    });

                    // Append any manually created override projects that do not exist in the list
                    const finalIds = new Set(finalProjects.map(p => p.projectId));
                    Object.values(localOverrides).forEach((localProj: any) => {
                        if (localProj && localProj.projectId && !finalIds.has(localProj.projectId)) {
                            console.log(`Appending offline-created project override: ${localProj.projectId}`);
                            finalProjects.push(localProj as ProjectData);
                        }
                    });
                }
            } catch (e) {
                console.error("Failed to merge project overrides from localStorage:", e);
            }
            
            console.log("Loaded projects:", finalProjects.length);
            if (finalProjects.length > 0) {
                setProjects(finalProjects);
                const lastId = localStorage.getItem('englabs_last_project_id');
                const matched = lastId ? finalProjects.find(p => p.projectId === lastId) : null;
                setSelectedProject(matched || null);
            } else {
                console.warn("No projects loaded");
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
        const syncPorterFromCloud = async () => {
            try {
                const cloudLedger = await fetchPorterLedger();
                const forensicTrips = (porterForensic as any[]);
                const forensicAdvances = (porterAdvancesForensic as any[]);
                
                // Separate cloud trips and advances
                const cloudTrips = cloudLedger.filter((item: any) => item.id && item.id.startsWith('PTR-'));
                const cloudAdvances = cloudLedger.filter((item: any) => item.id && item.id.startsWith('ADV-'));
                
                setPorterTrips(prev => {
                    const deletedSaved = localStorage.getItem('englabs_porter_deleted_ids');
                    const deletedIds = deletedSaved ? JSON.parse(deletedSaved) : [];
                    const deletedSet = new Set(deletedIds);

                    const forensic = forensicTrips.filter((t: any) => !deletedSet.has(t.id));
                    const entryMap = new Map();
                    
                    // 1. Baseline forensic
                    forensic.forEach(e => entryMap.set(e.id, e));
                    // 2. Overlay Cloud
                    cloudTrips.forEach(e => {
                        const existing = entryMap.get(e.id);
                        entryMap.set(e.id, existing ? { ...existing, ...e } : e);
                    });
                    // 3. Merge local
                    prev.filter((t: any) => !deletedSet.has(t.id)).forEach(e => {
                        const existing = entryMap.get(e.id);
                        entryMap.set(e.id, existing ? { ...existing, ...e } : e);
                    });
                    
                    const old22 = Array.from(entryMap.values()).find((t: any) => t.id === 'PTR-2026-0022' && t.grossAmount > 1000);
                    if (old22) {
                        entryMap.delete('PTR-2026-0022');
                    }
                    
                    return Array.from(entryMap.values()).sort((a: any, b: any) => 
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                });

                setPorterAdvances(prev => {
                    const deletedSaved = localStorage.getItem('englabs_porter_advances_deleted_ids');
                    let deletedIds = deletedSaved ? JSON.parse(deletedSaved) : [];
                    
                    // Auto-restore ADV-2026-0002
                    if (deletedIds.includes('ADV-2026-0002')) {
                        deletedIds = deletedIds.filter((id: string) => id !== 'ADV-2026-0002');
                        localStorage.setItem('englabs_porter_advances_deleted_ids', JSON.stringify(deletedIds));
                    }
                    const deletedSet = new Set(deletedIds);

                    const forensic = forensicAdvances.filter((a: any) => !deletedSet.has(a.id));
                    const entryMap = new Map();
                    
                    // 1. Baseline forensic
                    forensic.forEach(e => entryMap.set(e.id, e));
                    // 2. Overlay Cloud
                    cloudAdvances.forEach(e => {
                        const existing = entryMap.get(e.id);
                        entryMap.set(e.id, existing ? { ...existing, ...e } : e);
                    });
                    // 3. Merge local
                    prev.filter((a: any) => !deletedSet.has(a.id)).forEach(e => {
                        const existing = entryMap.get(e.id);
                        entryMap.set(e.id, existing ? { ...existing, ...e } : e);
                    });
                    
                    const merged = Array.from(entryMap.values());
                    if (!merged.some((a: any) => a.id === 'ADV-2026-0002')) {
                        const item2 = forensicAdvances.find((a: any) => a.id === 'ADV-2026-0002');
                        if (item2) merged.push(item2);
                    }

                    return merged.sort((a: any, b: any) => 
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                });

            } catch (e) {
                console.error("Porter cloud hydration failed:", e);
            }
        };
        syncPorterFromCloud();
    }, []);

    useEffect(() => {
        localStorage.setItem('englabs_gate_v2', JSON.stringify(gateEntries));
    }, [gateEntries]);

    useEffect(() => {
        localStorage.setItem('englabs_porter_v1', JSON.stringify(porterTrips));
    }, [porterTrips]);

    useEffect(() => {
        localStorage.setItem('englabs_porter_advances_v1', JSON.stringify(porterAdvances));
    }, [porterAdvances]);

    // One-time startup cleanup of old, invalid PTR-2026-0022 (₹5,400) from localStorage
    useEffect(() => {
        try {
            setPorterTrips(prev => {
                const updated = prev.filter((t: any) => !(t.id === 'PTR-2026-0022' && t.grossAmount > 1000));
                
                if (updated.length !== prev.length) {
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

    if (projects.length === 0) return <div className="h-screen w-screen bg-[#092a42] flex items-center justify-center text-white font-black text-4xl">INITIALIZING...</div>;

    if (authInitializing) {
        return <div className="h-screen w-screen bg-[#092a42] flex items-center justify-center text-white font-black text-2xl animate-pulse">AUTHORIZING SECURITY...</div>;
    }

    if (!currentUser) {
        return <Login />;
    }

    if (showHandover) {
        return <HandoverDashboard onAcknowledge={handleAcknowledgeHandover} />;
    }



    return (
        <div className="flex h-screen w-screen bg-[#f1f5f9] digital-console-room overflow-hidden text-slate-900 font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white">
            <DesktopSidebar 
                currentView={currentView}
                setCurrentView={setCurrentView}
                userRole={currentUser?.role as string || 'Engineer'}
                handleLogout={handleLogout}
                setIsModalOpen={setIsModalOpen}
                appMode={import.meta.env.VITE_APP_MODE || 'PROJECTS'}
            />

            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pb-16 md:pb-0 md:m-4 md:rounded-[2.5rem] console-bezel-recessed relative">
                {dbSyncError && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 px-4 py-2.5 flex items-center justify-between text-xs font-bold gap-3 flex-shrink-0 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
                            <span>{dbSyncError}</span>
                        </div>
                        <button 
                            type="button"
                            onClick={async () => {
                                try {
                                    setDbSyncError(null);
                                    const localSaved = localStorage.getItem('englabs_project_overrides');
                                    if (localSaved) {
                                        const localOverrides = JSON.parse(localSaved);
                                        const overrideList = Object.values(localOverrides);
                                        if (overrideList.length > 0) {
                                            const success = await syncAllProjectsToFirebase(overrideList);
                                            if (success) {
                                                alert("All local updates successfully synchronized to the live database!");
                                                // Reload projects from Firestore to align everything
                                                const fbProjects = await fetchProjectsFromFirebase();
                                                const fbMap = new Map(fbProjects.map((p: any) => [p.projectId, p]));
                                                setProjects(prev => prev.map(proj => {
                                                    const fbProj = fbMap.get(proj.projectId);
                                                    return fbProj ? { ...proj, ...fbProj } : proj;
                                                }));
                                            } else {
                                                throw new Error("Failed to sync some projects");
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.error("Manual sync failed:", e);
                                    setDbSyncError("Sync failed. The live database might still be unreachable or quota exceeded.");
                                }
                            }}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded transition-all text-[10px] uppercase tracking-wider font-black"
                        >
                            Retry Sync
                        </button>
                    </div>
                )}
                {currentView === 'COMMAND_CENTER' || currentView.startsWith('DASHBOARD_') ? (
                    <CommandCenterDashboard 
                        projects={projects}
                        gateEntries={gateEntries}
                        porterTrips={porterTrips}
                        inventoryItems={inventoryItems}
                    />
                ) : currentView === 'PROJECT_MANAGEMENT_DASHBOARD' ? (
                    <ProjectManagementDashboard 
                        projects={projects}
                        onSelectProject={() => setCurrentView('PROJECTS')}
                    />
                ) : currentView === 'PROJECTS_TRACKER' ? (
                    <ProjectsTracker projects={projects} onSelectProject={handleSelectProject} />
                ) : currentView === 'DAILY_STANDUP' ? (
                    <DailyStandup 
                        projects={projects} 
                        onUpdateProject={async (updatedProj) => {
                            setProjects(prev => prev.map(p => p.projectId === updatedProj.projectId ? updatedProj : p));
                            const res = await saveProjectToFirebase(updatedProj);
                            if (!res.success) {
                                setDbSyncError("Failed to sync change to live database. Saved locally.");
                            } else {
                                setDbSyncError(null);
                            }
                        }}
                    />
                ) : currentView === 'PO_RELEASE' ? (
                    <PORelease projects={projects} />
                ) : currentView === 'INVOICE_RELEASE' ? (
                    <InvoiceRelease projects={projects} />
                ) : (currentView === 'PROJECTS' || currentView.startsWith('PROJECTS_')) && 
                    currentView !== 'PROJECT_LOOKUP' && currentView !== 'PROJECT_BUDGETS' ? (
                    !selectedProject ? (
                        <ProjectListGrid 
                            projects={projects}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            projectFilter={projectFilter}
                            setProjectFilter={setProjectFilter}
                            onSelectProject={handleSelectProject}
                        />
                    ) : (
                        <ProjectDashboard 
                            selectedProject={selectedProject}
                            onBack={() => handleSelectProject(null)}
                            userRole={currentUser?.role as string || 'Engineer'}
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
                            onEditProject={() => setIsEditProjectModalOpen(true)}
                        />
                    )
                ) : currentView === 'PROJECT_LOOKUP' ? (
                    <ProjectLookupDashboard />
                ) : currentView === 'PROJECT_BUDGETS' ? (
                    <ProjectBudgets projects={projects} />
                ) : (currentView === 'GATE_REGISTER' || currentView === 'STORE_INWARD' || currentView === 'STORE_OUTWARD') ? (
                    <GateRegister 
                        entries={gateEntries} 
                        onNewEntry={handleNewGateEntry}
                        onUpdateEntry={handleUpdateGateEntry}
                        onDeleteEntry={handleDeleteGateEntry}
                        onLog={(log) => setAuditLogs(prev => [log, ...prev])} 
                        onFullSync={handleFullSync}
                    />
                ) : (currentView === 'FOOD_REGISTER' || currentView === 'FOOD_MEALS') ? (
                    <FoodRegister onLog={(log) => setAuditLogs(prev => [log, ...prev])} />
                ) : (currentView === 'ATTENDANCE' || currentView === 'HR_MASTER' || currentView === 'HR_DOCUMENTS' || currentView === 'HR_LEAVE' || currentView === 'HR_PERFORMANCE' || currentView === 'HR_IDCARD' || currentView === 'HR_ALLOCATION' || currentView === 'HR_LOGS') ? (
                    <RequireRole allowedRoles={['ADMIN', 'HR'] as any}>
                        <HRDashboard currentView={currentView} setCurrentView={setCurrentView} />
                    </RequireRole>
                ) : (currentView === 'PAYROLL' || currentView === 'HR_PAYROLL') ? (
                    <RequireRole allowedRoles={['ADMIN', 'HR'] as any}>
                        <PayrollTerminal />
                    </RequireRole>
                ) : currentView === 'BILLING' ? (
                    <RequireRole allowedRoles={['ADMIN', 'Accountant'] as any}>
                        <BillingDashboard />
                    </RequireRole>
                ) : currentView === 'MANAGEMENT_DASHBOARD' ? (
                    <RequireRole allowedRoles={['ADMIN', 'Accountant'] as any}>
                        <ManagementDashboard />
                    </RequireRole>
                ) : currentView === 'SKY5_TERMINAL' ? (
                    <Sky5Terminal />
                ) : currentView === 'INVENTORY' ? (
                    <InventoryManager />
                ) : currentView === 'STOCK_REPORT' ? (
                    <StoreStockReport 
                        userRole={(currentUser?.role === 'ADMIN' || currentUser?.role === 'Admin') ? 'ADMIN' : 'STAFF'} 
                        projects={projects} 
                        staffList={staffList}
                        onAddStaff={handleAddStaff}
                        onAddProject={(newProj) => setProjects(prev => [...prev, newProj])}
                    />
                ) : currentView === 'HOTEL_LOGS' ? (
                    <HotelRegister 
                        projects={projects}
                        staffList={staffList}
                        onAddProject={(newProj) => setProjects(prev => [...prev, newProj])}
                    />
                ) : currentView === 'STORE_GUARDIAN' ? (
                    <StoreGuardianDashboard />
                ) : (currentView === 'PORTER_SERVICE' || currentView.startsWith('PORTER_')) ? (
                    <PorterRegister 
                        trips={porterTrips}
                        advances={porterAdvances}
                        onNewTrip={async (trip) => {
                            setPorterTrips(prev => [trip, ...prev]);
                            await savePorterEntry(trip);
                        }}
                        onUpdateTrip={async (updated) => {
                            setPorterTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
                            await savePorterEntry(updated);
                        }}
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
                        onNewAdvance={async (adv) => {
                            setPorterAdvances(prev => [adv, ...prev]);
                            await savePorterEntry(adv);
                        }}
                        onUpdateAdvance={async (updated) => {
                            setPorterAdvances(prev => prev.map(a => a.id === updated.id ? updated : a));
                            await savePorterEntry(updated);
                        }}
                        onDeleteAdvance={(id) => {
                            setPorterAdvances(prev => prev.filter(a => a.id !== id));
                            try {
                                const deletedSaved = localStorage.getItem('englabs_porter_advances_deleted_ids');
                                const deletedIds = deletedSaved ? JSON.parse(deletedSaved) : [];
                                if (!deletedIds.includes(id)) {
                                    deletedIds.push(id);
                                    localStorage.setItem('englabs_porter_advances_deleted_ids', JSON.stringify(deletedIds));
                                }
                            } catch (e) {
                                console.error("Failed to save deleted advance ID:", e);
                            }
                        }}
                    />
                ) : (currentView === 'SETTINGS' || currentView.startsWith('SETTINGS_')) ? (
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
                ) : currentView === 'EVIDENCE' ? (
                    <DigitalEvidence onAutoRegister={handleNewGateEntry} />
                ) : (
                    <PlaceholderModule title={currentView} />
                )}
            </div>

            <MobileLayout 
                currentView={currentView}
                setCurrentView={setCurrentView}
                userRole={currentUser?.role as string || 'Engineer'}
                handleLogout={handleLogout}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            <NewProjectModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onAdd={(newProj) => setProjects(prev => [...prev, newProj])} 
                existingProjects={projects.map(p => p.projectId)}
            />
            <AddStaffModal isOpen={isAddStaffModalOpen} onClose={() => setIsAddStaffModalOpen(false)} onAdd={handleAddStaff} existingStaff={staffList} />
            <EditProjectModal 
                isOpen={isEditProjectModalOpen}
                onClose={() => setIsEditProjectModalOpen(false)}
                project={selectedProject}
                onUpdate={(updatedProject) => {
                    setSelectedProject(updatedProject);
                    setProjects(prev => prev.map(p => p.projectId === updatedProject.projectId ? updatedProject : p));
                }}
            />
        </div>
    );
};

export default App;

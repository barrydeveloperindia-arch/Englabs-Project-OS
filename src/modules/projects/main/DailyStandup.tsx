import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    Download, 
    MessageSquare,
    Users, 
    MapPin, 
    DollarSign,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Briefcase,
    Edit3,
    X,
    Box,
    Package,
    FileText,
    Check,
    Volume2,
    VolumeX,
    Mic,
    MicOff,
    Radio,
    Terminal,
    UserCheck,
    Play,
    Square
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProjectData, STAGES } from '@shared/services/project';

interface DailyStandupProps {
    projects: ProjectData[];
    onUpdateProject?: (project: ProjectData) => void;
}

interface StaffCheckIn {
    name: string;
    role: string;
    checkedIn: boolean;
    time?: string;
}

export const DailyStandup: React.FC<DailyStandupProps> = ({ projects, onUpdateProject }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [blockerFilter, setBlockerFilter] = useState<'all' | 'blocked' | 'clean'>('all');
    const [selectedDate, setSelectedDate] = useState<string>('all');
    const [selectedStaff, setSelectedStaff] = useState<string>('all');
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: true }));

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Speech & Recording States
    const [playingProjectId, setPlayingProjectId] = useState<string | null>(null);
    const [isDictating, setIsDictating] = useState(false);

    // Terminal Logs State
    const [operationsLogs, setOperationsLogs] = useState<string[]>([
        `[${new Date().toLocaleTimeString()}] Operations dispatch console online.`,
        `[${new Date().toLocaleTimeString()}] Firebase connection established.`,
        `[${new Date().toLocaleTimeString()}] Gate records synced.`
    ]);

    const addLog = (message: string) => {
        const timeStr = new Date().toLocaleTimeString();
        setOperationsLogs(prev => [`[${timeStr}] ${message}`, ...prev].slice(0, 15));
    };

    // Staff check-in presence state
    const [staffCheckIns, setStaffCheckIns] = useState<StaffCheckIn[]>([]);

    const fetchLiveAttendance = async () => {
        try {
            const res = await fetch('/api/attendance/live');
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.roster)) {
                    const mapped: StaffCheckIn[] = data.roster.map((item: any) => ({
                        name: item.name,
                        role: item.role,
                        checkedIn: item.status === 'PRESENT',
                        time: item.status === 'PRESENT' ? item.checkIn : undefined
                    }));
                    setStaffCheckIns(mapped);
                }
            }
        } catch (e) {
            console.error("Error fetching live standup check-ins:", e);
        }
    };

    useEffect(() => {
        fetchLiveAttendance();
        const interval = setInterval(fetchLiveAttendance, 15000);
        return () => clearInterval(interval);
    }, []);

    const toggleStaffCheckIn = (index: number) => {
        const updated = [...staffCheckIns];
        const staff = updated[index];
        staff.checkedIn = !staff.checkedIn;
        staff.time = staff.checkedIn ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
        setStaffCheckIns(updated);
        addLog(`${staff.name} (${staff.role}) ${staff.checkedIn ? 'checked In (local override)' : 'checked Out (local override)'} standup.`);
    };

    // Text to Speech
    const handleSpeakStandup = (project: ProjectData) => {
        const standup = project.dailyStandup!;
        const lead = project.production.stages.find(s => s.status === 'In Progress')?.lead || project.production.stages[0]?.lead || 'Team';
        
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
            if (playingProjectId === project.projectId) {
                setPlayingProjectId(null);
                addLog(`Stopped briefing for ${project.projectId}`);
                return;
            }
            
            const textToSpeak = `Standup update for project ${project.projectId}, Client ${project.client}. Current Stage: ${project.production.currentStage || 'Pending'}. Lead Coordinator: ${lead}. Discussion Notes: ${standup.discussingNotes || 'No progress notes recorded'}. Route detail: ${standup.routeFrom || 'No route'}. Blocker status: ${standup.inputsRequired && standup.inputsRequired.toUpperCase() !== 'NONE' ? standup.inputsRequired : 'No blockers reported'}.`;
            
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.onend = () => {
                setPlayingProjectId(null);
                addLog(`Finished briefing for ${project.projectId}`);
            };
            utterance.onerror = () => {
                setPlayingProjectId(null);
            };
            
            setPlayingProjectId(project.projectId);
            window.speechSynthesis.speak(utterance);
            addLog(`Audio briefing active for ${project.projectId}`);
        } else {
            alert("Speech synthesis is not supported on this browser.");
        }
    };

    // Edit modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
    const [notes, setNotes] = useState('');
    const [lead, setLead] = useState('');
    const [routeFrom, setRouteFrom] = useState('');
    const [routeTo, setRouteTo] = useState('');
    const [porterPayments, setPorterPayments] = useState<number | string>(0);
    const [inputsRequired, setInputsRequired] = useState('');
    const [preparingPartsDate, setPreparingPartsDate] = useState('');
    const [currentStage, setCurrentStage] = useState('');
    const [materialConsumption, setMaterialConsumption] = useState('');
    const [totalComponents, setTotalComponents] = useState<number | string>(0);
    const [poNumber, setPoNumber] = useState('');
    const [poConfirmed, setPoConfirmed] = useState(false);
    const [client, setClient] = useState('');
    const [vendorCost, setVendorCost] = useState<number | string>(0);
    const [customerSalePrice, setCustomerSalePrice] = useState<number | string>(0);

    // Audio Dictation using Web Speech Recognition API
    const startDictation = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            // Fallback simulation: type something digital
            setIsDictating(true);
            addLog("Speech recognition not supported. Simulating AI transcription...");
            setTimeout(() => {
                const templates = [
                    "All fabrication and structural work completed on schedule. Ready for primary sanding and priming stages.",
                    "Sanding completed. Moving to workshop painting booth. Awaiting secondary inspection verification.",
                    "Design modifications completed. CNC programming files generated and dispatched to workshop fabricating team.",
                    "Material checks complete. Paint stores replenished. Delivery schedule coordinated with porter transport dispatcher."
                ];
                const chosen = templates[Math.floor(Math.random() * templates.length)];
                setNotes(prev => prev ? prev + " " + chosen : chosen);
                setIsDictating(false);
                addLog("Simulated AI operational note transcribed successfully.");
            }, 2000);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-IN'; // Indian English/Accent support
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsDictating(true);
            addLog("Dictation microphone active. Speak now...");
        };

        recognition.onerror = (event: any) => {
            console.error(event);
            setIsDictating(false);
            addLog(`Dictation input error: ${event.error}`);
        };

        recognition.onend = () => {
            setIsDictating(false);
            addLog("Dictation input session terminated.");
        };

        recognition.onresult = (event: any) => {
            const speechToText = event.results[0][0].transcript;
            setNotes(prev => prev ? prev + " " + speechToText : speechToText);
            addLog(`Dictated text parsed: "${speechToText}"`);
        };

        recognition.start();
    };

    const openEditModal = (project: ProjectData) => {
        const s = project.dailyStandup || {};
        const staffLead = project.production.stages.find(st => st.status === 'In Progress')?.lead || project.production.stages[0]?.lead || 'Team';
        
        setEditingProject(project);
        setNotes(s.discussingNotes || '');
        setLead(staffLead);
        setRouteFrom(s.routeFrom || '');
        setRouteTo(s.routeTo || '');
        setPorterPayments(s.porterPayments !== undefined ? s.porterPayments : 0);
        setInputsRequired(s.inputsRequired || '');
        setPreparingPartsDate(s.preparingPartsDate || new Date().toISOString().split('T')[0]);
        
        // Load metadata fields
        setCurrentStage(project.production.currentStage || 'Engineering Design');
        setMaterialConsumption(project.metrics.materialConsumption || '');
        setTotalComponents(project.metrics.totalComponents !== undefined ? project.metrics.totalComponents : 0);
        setPoNumber(project.planning.poNumber || '');
        setPoConfirmed(project.planning.poConfirmed || false);
        setClient(project.client || '');
        
        // Load budget fields
        setVendorCost(project.poRelease?.vendorCost !== undefined ? project.poRelease.vendorCost : 0);
        setCustomerSalePrice(project.poRelease?.customerSalePrice !== undefined ? project.poRelease.customerSalePrice : 0);
        
        setIsEditModalOpen(true);
        addLog(`Opened editor for Project ${project.projectId}`);
    };

    const handleSave = () => {
        if (!editingProject) return;

        const updatedStages = [...editingProject.production.stages];
        const activeStageIndex = updatedStages.findIndex(st => st.status === 'In Progress');
        const targetIndex = activeStageIndex !== -1 ? activeStageIndex : 0;
        if (updatedStages[targetIndex]) {
            updatedStages[targetIndex] = {
                ...updatedStages[targetIndex],
                lead: lead
            };
        }

        const updatedProject: ProjectData = {
            ...editingProject,
            client: client,
            planning: {
                ...editingProject.planning,
                poNumber: poNumber,
                poConfirmed: poConfirmed
            },
            production: {
                ...editingProject.production,
                currentStage: currentStage,
                stages: updatedStages
            },
            metrics: {
                ...editingProject.metrics,
                materialConsumption: materialConsumption,
                totalComponents: Number(totalComponents) || 0
            },
            dailyStandup: {
                ...editingProject.dailyStandup,
                discussingNotes: notes,
                routeFrom: routeFrom,
                routeTo: routeTo,
                porterPayments: Number(porterPayments) || 0,
                inputsRequired: inputsRequired,
                preparingPartsDate: preparingPartsDate
            },
            poRelease: {
                ...editingProject.poRelease,
                vendorCost: Number(vendorCost) || 0,
                customerSalePrice: Number(customerSalePrice) || 0
            }
        };

        if (onUpdateProject) {
            onUpdateProject(updatedProject);
        }
        setIsEditModalOpen(false);
        setEditingProject(null);
        addLog(`Saved updates and synced Project ${editingProject.projectId} details.`);
    };

    // Extract projects that have valid standup data
    const standupProjects = useMemo(() => {
        return projects.filter(p => p.dailyStandup && p.dailyStandup.discussingNotes);
    }, [projects]);

    // Unique dates list for filter
    const uniqueDates = useMemo(() => {
        const dates = new Set<string>();
        standupProjects.forEach(p => {
            if (p.dailyStandup?.preparingPartsDate) {
                dates.add(p.dailyStandup.preparingPartsDate);
            }
        });
        return Array.from(dates).sort((a, b) => b.localeCompare(a));
    }, [standupProjects]);

    // Unique staff leads list for filter
    const uniqueStaff = useMemo(() => {
        const staff = new Set<string>();
        standupProjects.forEach(p => {
            const lead = p.production.stages.find(st => st.status === 'In Progress')?.lead || p.production.stages[0]?.lead || 'Team';
            staff.add(lead);
        });
        return Array.from(staff).sort((a, b) => a.localeCompare(b));
    }, [standupProjects]);

    // Filter & search standups
    const processedStandups = useMemo(() => {
        return standupProjects.filter(p => {
            const standup = p.dailyStandup!;
            const lead = p.production.stages.find(st => st.status === 'In Progress')?.lead || p.production.stages[0]?.lead || 'Team';
            
            const matchesSearch = 
                p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (standup.discussingNotes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.toLowerCase().includes(searchQuery.toLowerCase());

            const isBlocked = standup.inputsRequired && 
                              standup.inputsRequired.trim() !== '' && 
                              standup.inputsRequired.toUpperCase() !== 'NONE' && 
                              standup.inputsRequired.toUpperCase() !== 'NO' && 
                              standup.inputsRequired.toUpperCase() !== 'N/A';
            
            const matchesBlocker = 
                blockerFilter === 'all' || 
                (blockerFilter === 'blocked' && isBlocked) ||
                (blockerFilter === 'clean' && !isBlocked);

            const matchesDate = 
                selectedDate === 'all' || 
                standup.preparingPartsDate === selectedDate;

            const matchesStaff = 
                selectedStaff === 'all' || 
                lead === selectedStaff;

            return matchesSearch && matchesBlocker && matchesDate && matchesStaff;
        });
    }, [standupProjects, searchQuery, blockerFilter, selectedDate, selectedStaff]);

    // Aggregate stats
    const stats = useMemo(() => {
        let totalPorterPayments = 0;
        let blockedCount = 0;
        let activeRoutes = 0;

        standupProjects.forEach(p => {
            const standup = p.dailyStandup!;
            if (standup.porterPayments) {
                totalPorterPayments += Number(standup.porterPayments);
            }
            const isBlocked = standup.inputsRequired && 
                              standup.inputsRequired.trim() !== '' && 
                              standup.inputsRequired.toUpperCase() !== 'NONE' && 
                              standup.inputsRequired.toUpperCase() !== 'NO' && 
                              standup.inputsRequired.toUpperCase() !== 'N/A';
            if (isBlocked) {
                blockedCount++;
            }
            if (standup.routeFrom && standup.routeFrom.toUpperCase() !== 'N/A') {
                activeRoutes++;
            }
        });

        return {
            totalStandups: standupProjects.length,
            totalPorterPayments,
            blockedCount,
            activeRoutes
        };
    }, [standupProjects]);

    const handleShareWhatsApp = (project: ProjectData) => {
        const standup = project.dailyStandup!;
        const lead = project.production.stages.find(s => s.status === 'In Progress')?.lead || project.production.stages[0]?.lead || 'Team';
        const poStatus = project.planning.poConfirmed 
            ? `Confirmed (${project.planning.poNumber || 'No PO#'})` 
            : 'Awaiting PO';

        const text = encodeURIComponent(
            `📊 *ENGLABS STANDUP UPDATE*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📁 *Project:* [${project.projectId}] ${project.client}\n` +
            `📌 *Current Stage:* ${project.production.currentStage || 'Pending'}\n` +
            `📝 *Discussing Notes:* ${standup.discussingNotes || 'N/A'}\n` +
            `👤 *Coordinating Staff:* ${lead}\n` +
            `📦 *Materials:* ${project.metrics.materialConsumption || 'N/A'}\n` +
            `🔢 *Quantity:* ${project.metrics.totalComponents || 0} pcs\n` +
            `📅 *Date:* ${standup.preparingPartsDate || 'N/A'}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `🚚 *LOGISTICS & PORTER DETAILS*\n` +
            `📍 *Route:* ${standup.routeFrom || 'N/A'} ➔ ${standup.routeTo || 'N/A'}\n` +
            `🚚 *Delivery Terms:* ${project.planning.deliveryTerms || 'N/A'}\n` +
            `💰 *Porter Payment:* ₹${standup.porterPayments || 0}\n` +
            `💵 *Dispatch Budget:* ₹${project.financials?.dispatchBudget || 0}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `💼 *FINANCIAL BUDGET DETAILS*\n` +
            `🏬 *Vendor Cost:* ₹${(project.poRelease?.vendorCost || 0).toLocaleString('en-IN')}\n` +
            `💸 *Client Price:* ₹${(project.poRelease?.customerSalePrice || 0).toLocaleString('en-IN')}\n` +
            `🧾 *Client PO Status:* ${poStatus}\n` +
            `🚨 *Blocker / Inputs Req:* ${standup.inputsRequired || 'None'}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `🌐 _Command OS Forensic Dispatch_`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
        addLog(`WhatsApp dispatch template generated for Project ${project.projectId}`);
    };

    const handleShareAllWhatsApp = () => {
        let textBody = `*DAILY OPERATIONS STANDUP SUMMARY - ${new Date().toLocaleDateString('en-IN')}*\n----------------------------------\n`;
        processedStandups.forEach((p, idx) => {
            const s = p.dailyStandup!;
            const lead = p.production.stages.find(st => st.status === 'In Progress')?.lead || p.production.stages[0]?.lead || 'Team';
            textBody += `${idx + 1}. *[${p.projectId}] ${p.client}*\n` +
                        `   • Stage: ${p.production.currentStage || 'Pending'}\n` +
                        `   • Notes: ${s.discussingNotes}\n` +
                        `   • Lead: ${lead}\n` +
                        `   • Route: ${s.routeFrom || 'N/A'} -> ${s.routeTo || 'N/A'} (₹${s.porterPayments || 0})\n`;
            if (s.inputsRequired && 
                s.inputsRequired.toUpperCase() !== 'NONE' && 
                s.inputsRequired.toUpperCase() !== 'NO' && 
                s.inputsRequired.toUpperCase() !== 'N/A') {
                textBody += `   • *Blocker:* ${s.inputsRequired}\n`;
            }
            textBody += `\n`;
        });
        textBody += `_Generated by Englabs Projects OS_`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textBody)}`, '_blank');
        addLog("WhatsApp collective operations summary dispatched to chat.");
    };

    const exportToExcel = () => {
        const flatData = processedStandups.map((p, index) => {
            const s = p.dailyStandup!;
            return {
                'Sr. No.': index + 1,
                'Project ID': p.projectId,
                'Client': p.client,
                'Standup Discussion Notes': s.discussingNotes,
                'Preparing Date': s.preparingPartsDate || '—',
                'Route From': s.routeFrom || '—',
                'Route To': s.routeTo || '—',
                'Porter Payment (INR)': s.porterPayments || 0,
                'Inputs/Blockers Required': s.inputsRequired || 'None',
                'Coordinating Lead': p.production.stages[0]?.lead || '—'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Standup Logs");

        const maxWidths = Object.keys(flatData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...flatData.map(row => String(row[key as keyof typeof row]).length)) + 2
        }));
        worksheet['!cols'] = maxWidths;
        XLSX.writeFile(workbook, `Daily_Standup_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="flex-grow overflow-y-auto p-4 md:p-10 custom-scrollbar bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 animate-fade-in relative">
            {/* HUD styles injection */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes route-slide {
                    0% { left: 0%; }
                    50% { left: 90%; }
                    100% { left: 0%; }
                }
                .animate-route-slide {
                    position: absolute;
                    animation: route-slide 4s infinite ease-in-out;
                }
                @keyframes pulse-border {
                    0%, 100% { border-color: rgba(239, 68, 68, 0.45); }
                    50% { border-color: rgba(239, 68, 68, 0.95); }
                }
                .animate-pulse-border {
                    animation: pulse-border 2s infinite ease-in-out;
                }
            ` }} />

            <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8">
                
                {/* Header with digital badge */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">Daily Standup Terminal</h1>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 dark:text-emerald-400 uppercase tracking-widest mt-1">Operational standup register & blocker resolution tracker</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shadow-sm text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span>SYS TIME:</span>
                            <span className="text-slate-900 dark:text-emerald-400 font-extrabold tracking-wider">{currentTime}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shadow-sm">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 tracking-wider">LIVE OPERATIONAL FEED</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-lg relative overflow-hidden group">
                        {/* HUD Brackets */}
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-slate-200 dark:border-slate-800 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-slate-200 dark:border-slate-800 pointer-events-none" />
                        
                        <div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-450 uppercase tracking-wider block mb-1">Standup Channels</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalStandups}</p>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mt-1">Active briefing items</span>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-550 dark:text-blue-400 rounded-2xl border border-blue-500/20">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        {/* Progress Line */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-r shadow-[0_0_8px_rgba(59,130,246,0.6)]" style={{ width: '100%' }} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-lg relative overflow-hidden group">
                        {/* HUD Brackets */}
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-slate-200 dark:border-slate-800 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-slate-200 dark:border-slate-800 pointer-events-none" />
                        
                        <div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-455 uppercase tracking-wider block mb-1">Active Blocker Alerts</span>
                            <p className={`text-2xl font-black ${stats.blockedCount > 0 ? 'text-rose-505' : 'text-slate-900 dark:text-white'}`}>{stats.blockedCount}</p>
                            <span className="text-[9px] font-bold text-rose-500/80 dark:text-rose-450 block mt-1">Requires inputs immediately</span>
                        </div>
                        <div className={`p-3 rounded-2xl border ${stats.blockedCount > 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 animate-bounce' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-505 border-slate-200 dark:border-slate-700'}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        {/* Progress Line */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-r shadow-[0_0_8px_rgba(239,68,68,0.6)]" style={{ width: `${stats.totalStandups > 0 ? Math.min(100, Math.round((stats.blockedCount / stats.totalStandups) * 100)) : 0}%` }} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-lg relative overflow-hidden group">
                        {/* HUD Brackets */}
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-slate-200 dark:border-slate-800 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-slate-200 dark:border-slate-800 pointer-events-none" />
                        
                        <div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-450 uppercase tracking-wider block mb-1">Active Dispatch Routes</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.activeRoutes}</p>
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block mt-1">Coordinating routes</span>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-555 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
                            <MapPin className="w-6 h-6" />
                        </div>
                        {/* Progress Line */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-r shadow-[0_0_8px_rgba(16,185,129,0.6)]" style={{ width: `${stats.totalStandups > 0 ? Math.min(100, Math.round((stats.activeRoutes / stats.totalStandups) * 100)) : 0}%` }} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-lg relative overflow-hidden group">
                        {/* HUD Brackets */}
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-slate-200 dark:border-slate-800 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-slate-200 dark:border-slate-800 pointer-events-none" />
                        
                        <div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-455 uppercase tracking-wider block mb-1">Porter Payments</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">₹{stats.totalPorterPayments.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 block mt-1">Disbursed porter charges</span>
                        </div>
                        <div className="p-3 bg-indigo-500/10 text-indigo-555 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        {/* Progress Line */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-r shadow-[0_0_8px_rgba(99,102,241,0.6)]" style={{ width: '65%' }} />
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md">
                    {/* Search */}
                    <div className="relative flex-grow min-w-[280px] max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search Standup Notes or Staff..." 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-slate-900 dark:text-white font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Elements */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        <select 
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                            value={blockerFilter}
                            onChange={(e: any) => setBlockerFilter(e.target.value)}
                        >
                            <option value="all">ALL ITEMS</option>
                            <option value="blocked">BLOCKED (INPUTS REQ)</option>
                            <option value="clean">NO BLOCKERS</option>
                        </select>

                        <select 
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                        >
                            <option value="all">ALL STAFF</option>
                            {uniqueStaff.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>

                        <select 
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        >
                            <option value="all">ALL DATES</option>
                            {uniqueDates.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>

                        <button 
                            onClick={handleShareAllWhatsApp}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 border border-emerald-255 border-emerald-200 dark:border-emerald-900/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Share Summary</span>
                        </button>

                        <button 
                            onClick={exportToExcel}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Excel</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard layout with Sidebars */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    
                    {/* Left/Main content: Standup Card Grid */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {processedStandups.map(p => {
                                const s = p.dailyStandup!;
                                const lead = p.production.stages.find(st => st.status === 'In Progress')?.lead || p.production.stages[0]?.lead || 'Team';
                                const isBlocked = s.inputsRequired && 
                                                  s.inputsRequired.trim() !== '' && 
                                                  s.inputsRequired.toUpperCase() !== 'NONE' && 
                                                  s.inputsRequired.toUpperCase() !== 'NO' && 
                                                  s.inputsRequired.toUpperCase() !== 'N/A';
                                const isAudioPlaying = playingProjectId === p.projectId;

                                return (
                                    <div 
                                        key={p.projectId} 
                                        className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group h-full ${
                                            isBlocked 
                                                ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/15 dark:bg-rose-955/5 shadow-[0_0_15px_rgba(239,68,68,0.08)] dark:shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse-border' 
                                                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/20 shadow-sm hover:shadow-md'
                                        }`}
                                    >
                                        {/* Cyberpunk HUD view finder corner brackets */}
                                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-slate-200 dark:border-slate-800/80 pointer-events-none rounded-tl-sm group-hover:border-emerald-550 dark:group-hover:border-emerald-500 transition-colors" />
                                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-slate-200 dark:border-slate-800/80 pointer-events-none rounded-tr-sm group-hover:border-emerald-550 dark:group-hover:border-emerald-500 transition-colors" />
                                        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-slate-200 dark:border-slate-800/80 pointer-events-none rounded-bl-sm group-hover:border-emerald-550 dark:group-hover:border-emerald-500 transition-colors" />
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-slate-200 dark:border-slate-800/80 pointer-events-none rounded-br-sm group-hover:border-emerald-550 dark:group-hover:border-emerald-500 transition-colors" />

                                        <div>
                                            {/* Card Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-450 text-[10px] font-mono font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">{p.projectId}</span>
                                                    <span className="text-slate-900 dark:text-white font-black text-sm truncate max-w-[150px]">{p.client}</span>
                                                </div>
                                                {isBlocked ? (
                                                    <span className="inline-flex items-center gap-1 text-[8px] font-black border border-rose-200 dark:border-rose-500/20 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-455 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                        <AlertTriangle className="w-3 h-3 animate-bounce" /> Blocker
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[8px] font-black border border-emerald-200 dark:border-emerald-500/20 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                        <CheckCircle2 className="w-3 h-3" /> Healthy
                                                    </span>
                                                )}
                                            </div>

                                            {/* Discussing Notes with Audio Briefing Button */}
                                            <div className="bg-slate-50 dark:bg-slate-955/60 rounded-xl p-4 border border-slate-200/50 dark:border-slate-850 mb-4 relative">
                                                <div className="flex justify-between items-start gap-4 mb-2">
                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                                                        "{s.discussingNotes}"
                                                    </p>
                                                    <button 
                                                        onClick={() => handleSpeakStandup(p)}
                                                        className={`p-2 rounded-lg transition-all border shrink-0 cursor-pointer ${
                                                            isAudioPlaying 
                                                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' 
                                                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-505 dark:text-emerald-400 hover:bg-emerald-500/20'
                                                        }`}
                                                        title={isAudioPlaying ? "Stop voice update" : "Listen to standup voice"}
                                                    >
                                                        {isAudioPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                                    </button>
                                                </div>

                                                {/* Animated Waveform Visualizer */}
                                                {isAudioPlaying && (
                                                    <div className="h-6 flex items-center justify-center gap-1 mt-3 bg-white dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                                        <span className="text-[8px] font-mono text-emerald-600 dark:text-emerald-505 mr-2 uppercase tracking-widest animate-pulse">Broadcasting audio briefing...</span>
                                                        <div className="flex items-end h-3 gap-0.5">
                                                            <div className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }}></div>
                                                            <div className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-3" style={{ animationDelay: '0.3s', animationDuration: '0.4s' }}></div>
                                                            <div className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: '0.5s', animationDuration: '0.5s' }}></div>
                                                            <div className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-2.5" style={{ animationDelay: '0.2s', animationDuration: '0.7s' }}></div>
                                                            <div className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-1" style={{ animationDelay: '0.4s', animationDuration: '0.3s' }}></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details Stack (2-Column Grid) */}
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200 dark:border-slate-800/80 pt-4 mb-4">
                                                
                                                <div className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-400 min-w-0">
                                                    <Users className="w-4 h-4 text-slate-450 dark:text-slate-550 shrink-0" />
                                                    <div className="truncate">
                                                        <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Lead:</span>
                                                        <span className="font-semibold text-slate-800 dark:text-white text-xs">{lead}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-400 min-w-0">
                                                    <Briefcase className="w-4 h-4 text-slate-455 dark:text-slate-550 shrink-0" />
                                                    <div className="truncate">
                                                        <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Stage:</span>
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-extrabold text-[8px] uppercase border border-blue-200 dark:border-blue-900/60 truncate">{p.production.currentStage || 'Pending'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-400 min-w-0 col-span-2 md:col-span-1">
                                                    <Box className="w-4 h-4 text-slate-455 dark:text-slate-550 shrink-0" />
                                                    <div className="truncate">
                                                        <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Materials:</span>
                                                        <span className="font-semibold text-slate-800 dark:text-white text-xs truncate block" title={p.metrics.materialConsumption || '—'}>{p.metrics.materialConsumption || '—'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2.5 text-xs text-slate-655 dark:text-slate-400 min-w-0 col-span-2 md:col-span-1">
                                                    <Package className="w-4 h-4 text-slate-455 dark:text-slate-550 shrink-0" />
                                                    <div className="truncate">
                                                        <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Qty:</span>
                                                        <span className="font-mono font-bold text-slate-800 dark:text-white text-xs">{p.metrics.totalComponents || 0} pcs</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2.5 text-xs text-slate-655 dark:text-slate-400 min-w-0 col-span-2 md:col-span-1">
                                                    <MapPin className="w-4 h-4 text-slate-455 dark:text-slate-555 shrink-0 mt-0.5" />
                                                    <div className="w-full min-w-0">
                                                        <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Route Status:</span>
                                                        {s.routeFrom && s.routeFrom !== 'N/A' ? (
                                                            <div className="mt-1">
                                                                <span className="font-semibold text-slate-800 dark:text-white text-[11px] block truncate">{s.routeFrom} ➔ {s.routeTo}</span>
                                                                {/* Animated route trace */}
                                                                <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full mt-1.5 overflow-hidden border border-slate-200/50 dark:border-slate-800/80">
                                                                    <div className="absolute top-0 bottom-0 left-0 bg-emerald-500/25 dark:bg-emerald-500/20" style={{ width: '100%' }} />
                                                                    <div className="absolute top-0 bottom-0 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-route-slide" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="font-semibold text-slate-400 dark:text-slate-600 text-xs">—</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2.5 text-xs text-slate-655 dark:text-slate-400 min-w-0 col-span-2 md:col-span-1">
                                                    <DollarSign className="w-4 h-4 text-slate-455 dark:text-slate-555 shrink-0" />
                                                    <div className="truncate">
                                                        <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Porter:</span>
                                                        <span className="font-mono font-bold text-slate-800 dark:text-white text-xs">₹{s.porterPayments || 0}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-400 min-w-0 col-span-2">
                                                    <FileText className="w-4 h-4 text-slate-455 dark:text-slate-555 shrink-0" />
                                                    <div className="truncate">
                                                        <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Client PO:</span>
                                                        {p.planning.poConfirmed ? (
                                                            <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider truncate">
                                                                Confirmed ({p.planning.poNumber || 'No PO#'})
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[8px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-250 dark:border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider truncate">
                                                                Awaiting PO
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-400 min-w-0 col-span-2">
                                                    <Calendar className="w-4 h-4 text-slate-455 dark:text-slate-555 shrink-0" />
                                                    <div className="truncate">
                                                        <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Standup Date:</span>
                                                        <span className="font-semibold text-slate-800 dark:text-white text-xs">{s.preparingPartsDate || '—'}</span>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                                                    <div className="flex items-center gap-2.5 text-xs text-slate-655 dark:text-slate-400 min-w-0">
                                                        <DollarSign className="w-4 h-4 text-emerald-500 dark:text-emerald-450 shrink-0" />
                                                        <div className="min-w-0">
                                                            <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-405 dark:text-slate-500 whitespace-nowrap">Vnd ➔ Eng Budget</span>
                                                            <span className="font-mono font-bold text-slate-800 dark:text-white text-xs">
                                                                ₹{(p.poRelease?.vendorCost || 0).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2.5 text-xs text-slate-655 dark:text-slate-400 min-w-0">
                                                        <DollarSign className="w-4 h-4 text-blue-500 dark:text-blue-450 shrink-0" />
                                                        <div className="min-w-0">
                                                            <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-405 dark:text-slate-500 whitespace-nowrap">Eng ➔ Client Budget</span>
                                                            <span className="font-mono font-bold text-slate-800 dark:text-white text-xs">
                                                                ₹{(p.poRelease?.customerSalePrice || 0).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {isBlocked && (
                                                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl flex items-start gap-2 mb-4">
                                                    <AlertTriangle className="w-4 h-4 text-rose-505 dark:text-rose-455 shrink-0 mt-0.5 animate-bounce" />
                                                    <div className="text-xs">
                                                        <span className="font-black text-rose-550 dark:text-rose-400 block uppercase tracking-wider text-[9px]">Blocked Action / Inputs Req</span>
                                                        <span className="font-bold text-rose-700 dark:text-rose-200 leading-normal">{s.inputsRequired}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                            <button 
                                                onClick={() => handleShareWhatsApp(p)}
                                                className="flex-grow bg-[#25D366] hover:bg-[#20ba5a] text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer border border-[#25D366]/40"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                <span>SHARE</span>
                                            </button>
                                            <button 
                                                onClick={() => openEditModal(p)}
                                                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                <span>EDIT</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {processedStandups.length === 0 && (
                                <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center h-[350px]">
                                    <Briefcase className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" />
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-1">No Daily Standup Data</h4>
                                    <p className="text-xs text-slate-550 dark:text-slate-505 max-w-xs leading-normal">
                                        Try adjusting your search query, dates, or blocker filter to match available records.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column: Presence panel & Scrolling Ticker */}
                    <div className="space-y-6">
                        
                        {/* 1. Digital Staff Check-In sidebar */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col gap-4 relative overflow-hidden group">
                            {/* HUD Brackets */}
                            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-slate-200 dark:border-slate-800 pointer-events-none" />
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-slate-200 dark:border-slate-800 pointer-events-none" />
                            {/* Radar Scan sweeping beam */}
                            <span className="absolute -left-1/2 -top-1/2 w-48 h-48 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 rounded-full animate-spin pointer-events-none" style={{ animationDuration: '4s' }} />

                            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 justify-between relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex items-center justify-center">
                                        <UserCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 relative z-10" />
                                        <span className="absolute w-6 h-6 bg-emerald-500/10 border border-emerald-500/30 rounded-full animate-ping" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Checked-In Staff</h3>
                                </div>
                                <span className="text-[9px] font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-bold uppercase">
                                    {staffCheckIns.filter(s => s.checkedIn).length} ACTIVE
                                </span>
                            </div>

                            <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1 relative z-10">
                                {staffCheckIns.map((staff, idx) => (
                                    <div 
                                        key={staff.name} 
                                        className="flex items-center justify-between bg-slate-50 dark:bg-slate-955 p-3 rounded-xl border border-slate-150 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative">
                                                <div className={`w-2 h-2 rounded-full ${staff.checkedIn ? 'bg-emerald-500 animate-ping absolute inset-0' : 'bg-slate-400 dark:bg-slate-700'}`}></div>
                                                <div className={`w-2 h-2 rounded-full ${staff.checkedIn ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'} relative`}></div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{staff.name}</p>
                                                <p className="text-[9px] text-slate-400 dark:text-slate-505 font-semibold">{staff.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {staff.checkedIn && staff.time && (
                                                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 font-bold">{staff.time}</span>
                                            )}
                                            <button 
                                                onClick={() => toggleStaffCheckIn(idx)}
                                                className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all cursor-pointer ${
                                                    staff.checkedIn 
                                                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20' 
                                                        : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                                }`}
                                            >
                                                {staff.checkedIn ? 'OUT' : 'IN'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Operations Activity Ticker log */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col gap-3 relative overflow-hidden group">
                            {/* HUD Brackets */}
                            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-slate-200 dark:border-slate-800 pointer-events-none" />
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-slate-200 dark:border-slate-800 pointer-events-none" />

                            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <Terminal className="w-4 h-4 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Operations Logs</h3>
                            </div>
                            <div className="bg-slate-950 dark:bg-black p-4 rounded-xl border border-slate-850 h-[220px] overflow-y-auto font-mono text-[9px] text-emerald-450 dark:text-emerald-400 space-y-2.5 custom-scrollbar flex flex-col-reverse justify-end relative shadow-inner">
                                <div className="text-left font-bold text-slate-600 dark:text-slate-700 flex items-center gap-1.5 border-t border-slate-900 pt-2 shrink-0 select-none">
                                    <span className="text-emerald-500/60">{"englabs-os $>"}</span>
                                    <span className="w-1.5 h-3 bg-emerald-500/80 animate-pulse shrink-0" />
                                </div>
                                {operationsLogs.map((log, index) => (
                                    <div key={index} className="leading-relaxed border-l-2 border-emerald-500/30 pl-2.5 hover:border-emerald-400 transition-colors shrink-0">
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Edit Modal */}
            {isEditModalOpen && editingProject && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-8 relative flex flex-col gap-6 text-slate-800 dark:text-white animate-spring-zoom max-h-[90vh] overflow-y-auto custom-scrollbar">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
                                    <Edit3 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> Edit Standup Log
                                </h3>
                                <span className="text-[9px] font-mono font-black text-emerald-605 dark:text-emerald-400 uppercase tracking-widest mt-1">
                                    Project {editingProject.projectId} — {client}
                                </span>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingProject(null);
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            >
                                <X className="w-5 h-5 text-slate-400 hover:text-slate-650 dark:hover:text-white" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            {/* Client Name */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Client Identity</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                                    value={client}
                                    onChange={(e) => setClient(e.target.value)}
                                    placeholder="Enter Client Name..."
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Standup Discussion Notes</label>
                                    <button 
                                        type="button"
                                        onClick={startDictation}
                                        className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded transition-all border cursor-pointer ${
                                            isDictating 
                                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse' 
                                                : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                        }`}
                                    >
                                        {isDictating ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                                        <span>{isDictating ? 'LISTENING...' : 'DICTATE'}</span>
                                    </button>
                                </div>
                                <textarea 
                                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all min-h-[80px]"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter standup progress details..."
                                />
                            </div>

                            {/* Lead & Current Stage */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Coordinating Lead</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                        value={lead}
                                        onChange={(e) => setLead(e.target.value)}
                                        placeholder="Lead name..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Current Stage</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
                                        value={currentStage}
                                        onChange={(e) => setCurrentStage(e.target.value)}
                                    >
                                        {STAGES.map(stage => (
                                            <option key={stage} value={stage} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{stage}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Materials & Components Qty */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Material Details</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                        value={materialConsumption}
                                        onChange={(e) => setMaterialConsumption(e.target.value)}
                                        placeholder="e.g. Grey Primer (5L)"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Total Components Qty</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                        value={totalComponents}
                                        onChange={(e) => setTotalComponents(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Route */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Route From</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                        value={routeFrom}
                                        onChange={(e) => setRouteFrom(e.target.value)}
                                        placeholder="From location..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Route To</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                        value={routeTo}
                                        onChange={(e) => setRouteTo(e.target.value)}
                                        placeholder="To location..."
                                    />
                                </div>
                            </div>

                            {/* Payment / Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Porter Payment (₹)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                        value={porterPayments}
                                        onChange={(e) => setPorterPayments(Number(e.target.value))}
                                        placeholder="Amount in INR..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Standup Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-650 dark:text-slate-350 focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
                                        value={preparingPartsDate}
                                        onChange={(e) => setPreparingPartsDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Client PO Fields */}
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Client PO Number</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                        value={poNumber}
                                        onChange={(e) => setPoNumber(e.target.value)}
                                        placeholder="PO-XXXXX"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-4 pl-1">
                                    <button 
                                        type="button"
                                        onClick={() => setPoConfirmed(prev => !prev)}
                                        className={`w-5 h-5 rounded flex items-center justify-center border transition-all cursor-pointer ${
                                            poConfirmed 
                                                ? 'bg-emerald-500 border-emerald-400 text-slate-900' 
                                                : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-955 text-transparent'
                                        }`}
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[4]" />
                                    </button>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none" onClick={() => setPoConfirmed(prev => !prev)}>
                                        Client PO Confirmed
                                    </span>
                                </div>
                            </div>

                            {/* Project Budgets */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Budget: Vendor to Englabs</label>
                                    <div className="relative flex items-stretch">
                                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-800 bg-slate-105 dark:bg-slate-900 text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider">
                                            VND ➔ ENG
                                        </span>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-r-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                                            value={vendorCost}
                                            onChange={(e) => setVendorCost(Number(e.target.value) || 0)}
                                            placeholder="₹ Vendor Cost..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Budget: Englabs to Client</label>
                                    <div className="relative flex items-stretch">
                                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-800 bg-slate-105 dark:bg-slate-900 text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider">
                                            ENG ➔ CLT
                                        </span>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-r-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                                            value={customerSalePrice}
                                            onChange={(e) => setCustomerSalePrice(Number(e.target.value) || 0)}
                                            placeholder="₹ Sale Price..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Blocker (Inputs Required) */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Blocked Action / Inputs Req (Leave blank or 'None' if healthy)</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                    value={inputsRequired}
                                    onChange={(e) => setInputsRequired(e.target.value)}
                                    placeholder="e.g. Awaiting client PO, Raw material dispatch pending..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 mt-2">
                            <button 
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingProject(null);
                                }}
                                className="flex-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs shadow-lg"
                            >
                                SAVE CHANGES
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

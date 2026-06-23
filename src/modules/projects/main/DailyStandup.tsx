import React, { useState, useMemo } from 'react';
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
    Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProjectData, STAGES } from '@shared/services/project';

interface DailyStandupProps {
    projects: ProjectData[];
    onUpdateProject?: (project: ProjectData) => void;
}

export const DailyStandup: React.FC<DailyStandupProps> = ({ projects, onUpdateProject }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [blockerFilter, setBlockerFilter] = useState<'all' | 'blocked' | 'clean'>('all');
    const [selectedDate, setSelectedDate] = useState<string>('all');
    const [selectedStaff, setSelectedStaff] = useState<string>('all');

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
        
        setIsEditModalOpen(true);
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
            }
        };

        if (onUpdateProject) {
            onUpdateProject(updatedProject);
        }
        setIsEditModalOpen(false);
        setEditingProject(null);
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
        const text = encodeURIComponent(
            `*Daily Standup Update*\n` +
            `*Project ID:* ${project.projectId}\n` +
            `*Client:* ${project.client}\n` +
            `*Discussing Notes:* ${standup.discussingNotes}\n` +
            `*Coordinating Staff:* ${lead}\n` +
            `*Route:* ${standup.routeFrom || 'N/A'} ➔ ${standup.routeTo || 'N/A'}\n` +
            `*Porter Payment:* ₹${standup.porterPayments || 0}\n` +
            `*Inputs Required:* ${standup.inputsRequired || 'None'}\n` +
            `*Date:* ${standup.preparingPartsDate || 'N/A'}`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    const handleShareAllWhatsApp = () => {
        let textBody = `*DAILY OPERATIONS STANDUP SUMMARY - ${new Date().toLocaleDateString('en-IN')}*\n----------------------------------\n`;
        processedStandups.forEach((p, idx) => {
            const s = p.dailyStandup!;
            const lead = p.production.stages.find(st => st.status === 'In Progress')?.lead || p.production.stages[0]?.lead || 'Team';
            textBody += `${idx + 1}. *[${p.projectId}] ${p.client}*\n` +
                        `   • Notes: ${s.discussingNotes}\n` +
                        `   • Lead: ${lead}\n` +
                        `   • Route: ${s.routeFrom || 'N/A'} -> ${s.routeTo || 'N/A'} (₹${s.porterPayments || 0})\n`;
            if (s.inputsRequired && s.inputsRequired.toUpperCase() !== 'NONE' && s.inputsRequired.toUpperCase() !== 'N/A') {
                textBody += `   • *Blocker:* ${s.inputsRequired}\n`;
            }
            textBody += `\n`;
        });
        textBody += `_Generated by Englabs Projects OS_`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textBody)}`, '_blank');
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
        <div className="flex-grow overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#F8FAFC]">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-none">Daily Standup</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Operational standup register & blocker resolution tracker</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Standup Channels</span>
                            <p className="text-2xl font-black text-slate-950">{stats.totalStandups}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Logged standup items</span>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                            <Briefcase className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Active Blocker Alerts</span>
                            <p className={`text-2xl font-black ${stats.blockedCount > 0 ? 'text-rose-600' : 'text-slate-950'}`}>{stats.blockedCount}</p>
                            <span className="text-[9px] font-bold text-rose-500 block mt-1">Requires inputs immediately</span>
                        </div>
                        <div className={`p-3 rounded-2xl ${stats.blockedCount > 0 ? 'bg-rose-500/10 text-rose-600 animate-bounce' : 'bg-slate-100 text-slate-400'}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Active Dispatch Routes</span>
                            <p className="text-2xl font-black text-slate-950">{stats.activeRoutes}</p>
                            <span className="text-[9px] font-bold text-emerald-500 block mt-1">Coordinating routes</span>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                            <MapPin className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Porter Payments</span>
                            <p className="text-2xl font-black text-slate-950">₹{stats.totalPorterPayments.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Disbursed porter charges</span>
                        </div>
                        <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm">
                    {/* Search */}
                    <div className="relative flex-grow min-w-[280px] max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search Standup Notes or Staff..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Elements */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        <select 
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                            value={blockerFilter}
                            onChange={(e: any) => setBlockerFilter(e.target.value)}
                        >
                            <option value="all">ALL ITEMS</option>
                            <option value="blocked">BLOCKED (INPUTS REQ)</option>
                            <option value="clean">NO BLOCKERS</option>
                        </select>

                        <select 
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                        >
                            <option value="all">ALL STAFF</option>
                            {uniqueStaff.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>

                        <select 
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
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
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 hover:border-emerald-200 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Share Summary</span>
                        </button>

                        <button 
                            onClick={exportToExcel}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Excel</span>
                        </button>
                    </div>
                </div>

                {/* Standup Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {processedStandups.map(p => {
                        const s = p.dailyStandup!;
                        const lead = p.production.stages.find(st => st.status === 'In Progress')?.lead || p.production.stages[0]?.lead || 'Team';
                        const isBlocked = s.inputsRequired && 
                                          s.inputsRequired.trim() !== '' && 
                                          s.inputsRequired.toUpperCase() !== 'NONE' && 
                                          s.inputsRequired.toUpperCase() !== 'N/A';

                        return (
                            <div 
                                key={p.projectId} 
                                className={`bg-white p-6 rounded-[1.75rem] border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                                    isBlocked ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100'
                                }`}
                            >
                                <div>
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-[#0e4368] text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase">{p.projectId}</span>
                                            <span className="text-slate-900 font-bold text-sm truncate max-w-[150px]">{p.client}</span>
                                        </div>
                                        {isBlocked ? (
                                            <span className="inline-flex items-center gap-1 text-[8px] font-black border border-rose-500/20 bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                <AlertTriangle className="w-3 h-3" /> Blocker
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[8px] font-black border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                <CheckCircle2 className="w-3 h-3" /> Healthy
                                            </span>
                                        )}
                                    </div>

                                    {/* Discussing Notes */}
                                    <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-6">
                                        "{s.discussingNotes}"
                                    </p>

                                    {/* Details Stack */}
                                    <div className="space-y-3 border-t border-slate-100 pt-4 mb-6">
                                        <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                            <Users className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="font-bold">Coordinating Lead:</span>
                                            <span className="font-medium text-slate-800">{lead}</span>
                                        </div>

                                        <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="font-bold">Current Stage:</span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-extrabold text-[9px] uppercase border border-blue-100">{p.production.currentStage || 'Pending'}</span>
                                        </div>

                                        {p.metrics.materialConsumption && (
                                            <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                                <Box className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="font-bold">Materials:</span>
                                                <span className="font-medium text-slate-800 truncate max-w-[200px]" title={p.metrics.materialConsumption}>{p.metrics.materialConsumption}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                            <Package className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="font-bold">Total Qty:</span>
                                            <span className="font-mono font-bold text-slate-800">{p.metrics.totalComponents || 0} pcs</span>
                                        </div>

                                        {(s.routeFrom && s.routeFrom !== 'N/A') && (
                                            <div className="flex items-start gap-2.5 text-xs text-slate-600">
                                                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="font-bold block">Route:</span>
                                                    <span className="font-medium text-slate-800">{s.routeFrom} ➔ {s.routeTo}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                            <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="font-bold">Porter Payment:</span>
                                            <span className="font-mono font-bold text-slate-800">₹{s.porterPayments || 0}</span>
                                        </div>

                                        <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="font-bold">Client PO Status:</span>
                                            {p.planning.poConfirmed ? (
                                                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    Confirmed ({p.planning.poNumber || 'No PO#'})
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    Awaiting PO
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="font-bold">Standup Date:</span>
                                            <span className="font-medium text-slate-800">{s.preparingPartsDate || '—'}</span>
                                        </div>

                                        {isBlocked && (
                                            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 mt-3">
                                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                <div className="text-xs">
                                                    <span className="font-black text-rose-600 block uppercase tracking-wider text-[9px]">Blocked Action / Inputs Req</span>
                                                    <span className="font-bold text-rose-700 leading-normal">{s.inputsRequired}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-auto">
                                    <button 
                                        onClick={() => handleShareWhatsApp(p)}
                                        className="flex-grow bg-[#25D366] hover:bg-[#20ba5a] text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span>SHARE UPDATE</span>
                                    </button>
                                    <button 
                                        onClick={() => openEditModal(p)}
                                        className="bg-[#0e4368] hover:bg-[#0a324e] text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        <span>EDIT</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {processedStandups.length === 0 && (
                        <div className="col-span-full bg-slate-50 p-12 rounded-[1.75rem] border border-dashed border-slate-300 flex flex-col items-center justify-center text-center h-[350px]">
                            <Briefcase className="w-12 h-12 text-slate-400 mb-3" />
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">No Daily Standup Data</h4>
                            <p className="text-xs text-slate-400 max-w-xs leading-normal">
                                Try adjusting your search query, dates, or blocker filter to match available records.
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* Edit Modal */}
            {isEditModalOpen && editingProject && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0e4368] border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-lg p-8 relative flex flex-col gap-6 text-white animate-spring-zoom max-h-[90vh] overflow-y-auto custom-scrollbar">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h3 className="text-lg font-black tracking-tight text-white uppercase">Edit Standup Log</h3>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">
                                    Project {editingProject.projectId} — {editingProject.client}
                                </span>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingProject(null);
                                }}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                            >
                                <X className="w-5 h-5 text-slate-300 hover:text-white" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            {/* Notes */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Standup Discussion Notes</label>
                                <textarea 
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all min-h-[70px]"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter standup progress details..."
                                />
                            </div>

                            {/* Lead & Current Stage */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Coordinating Lead</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        value={lead}
                                        onChange={(e) => setLead(e.target.value)}
                                        placeholder="Lead name..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Current Stage</label>
                                    <select 
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        value={currentStage}
                                        onChange={(e) => setCurrentStage(e.target.value)}
                                    >
                                        {STAGES.map(stage => (
                                            <option key={stage} value={stage} className="bg-[#0e4368] text-white">{stage}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Materials & Components Qty */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Material Details</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        value={materialConsumption}
                                        onChange={(e) => setMaterialConsumption(e.target.value)}
                                        placeholder="e.g. Grey Primer (5L)"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Total Components Qty</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        value={totalComponents}
                                        onChange={(e) => setTotalComponents(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Route */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Route From</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        value={routeFrom}
                                        onChange={(e) => setRouteFrom(e.target.value)}
                                        placeholder="From location..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Route To</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        value={routeTo}
                                        onChange={(e) => setRouteTo(e.target.value)}
                                        placeholder="To location..."
                                    />
                                </div>
                            </div>

                            {/* Payment / Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Porter Payment (₹)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        value={porterPayments}
                                        onChange={(e) => setPorterPayments(e.target.value)}
                                        placeholder="Amount in INR..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Standup Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        value={preparingPartsDate}
                                        onChange={(e) => setPreparingPartsDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Client PO Fields */}
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Client PO Number</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        value={poNumber}
                                        onChange={(e) => setPoNumber(e.target.value)}
                                        placeholder="PO-XXXXX"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-4 pl-1">
                                    <button 
                                        type="button"
                                        onClick={() => setPoConfirmed(prev => !prev)}
                                        className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                            poConfirmed 
                                                ? 'bg-emerald-500 border-emerald-400 text-slate-900' 
                                                : 'border-slate-600 bg-slate-900/50 text-transparent'
                                        }`}
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[4]" />
                                    </button>
                                    <span className="text-xs font-bold text-slate-300 cursor-pointer select-none" onClick={() => setPoConfirmed(prev => !prev)}>
                                        Client PO Confirmed
                                    </span>
                                </div>
                            </div>

                            {/* Blocker (Inputs Required) */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Blocked Action / Inputs Req (Leave blank or 'None' if healthy)</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
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
                                className="flex-1 border border-white/10 hover:bg-white/5 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs shadow-lg shadow-emerald-950/20"
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

import React, { useState, useEffect } from 'react';
import { X, Plus, Target, DollarSign, Calendar } from 'lucide-react';
import { ProjectData, STAGES, isCXXXFormat } from '@shared/services/project';
import { saveProjectToFirebase } from '@services/database_service';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (project: ProjectData) => void;
    existingProjects?: string[];
}

interface BulkProjectEntry {
    projectId: string;
    client: string;
    value: string;
    budget: string;
}

const getNextProjectId = (existing: string[]): string => {
    let maxNum = 0;
    existing.forEach(id => {
        if (!id) return;
        const cleanId = id.trim().toUpperCase();
        if (cleanId.startsWith('C')) {
            const numStr = cleanId.substring(1);
            const num = parseInt(numStr, 10);
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        }
    });
    const nextNum = maxNum > 0 ? maxNum + 1 : 5000;
    return `C${nextNum}`;
};

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onAdd, existingProjects = [] }) => {
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [formData, setFormData] = useState({
        projectId: '',
        client: '',
        value: '',
        budget: ''
    });

    const [bulkText, setBulkText] = useState('');
    const [defaultVal, setDefaultVal] = useState('0');
    const [defaultBudget, setDefaultBudget] = useState('0');
    const [bulkProjects, setBulkProjects] = useState<BulkProjectEntry[]>([]);

    useEffect(() => {
        if (isOpen) {
            const nextId = getNextProjectId(existingProjects);
            setFormData(prev => ({ ...prev, projectId: nextId }));
        }
    }, [isOpen, existingProjects]);

    if (!isOpen) return null;

    const isIdDuplicate = (id: string, index?: number) => {
        if (!id) return false;
        const cleanId = id.trim().toUpperCase();
        
        // Check against existing projects
        if (existingProjects.some(proj => proj.toUpperCase() === cleanId)) {
            return true;
        }
        
        // Check against other entries in bulk list
        if (index !== undefined) {
            return bulkProjects.some((p, idx) => idx !== index && p.projectId.trim().toUpperCase() === cleanId);
        }
        
        return false;
    };

    const handleBulkTextChange = (text: string) => {
        setBulkText(text);
        const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
        const nextId = getNextProjectId(existingProjects);
        const nextIdNum = parseInt(nextId.substring(1), 10) || 5000;

        setBulkProjects(prev => {
            return lines.map((line, index) => {
                const existing = prev[index];
                if (existing) {
                    return {
                        ...existing,
                        client: existing.client === (prev[index]?.client || '') ? line : existing.client
                    };
                }
                return {
                    projectId: `C${nextIdNum + index}`,
                    client: line,
                    value: defaultVal,
                    budget: defaultBudget
                };
            });
        });
    };

    const handleDefaultValChange = (val: string) => {
        setDefaultVal(val);
        setBulkProjects(prev => prev.map(p => {
            if (p.value === defaultVal || p.value === '') {
                return { ...p, value: val };
            }
            return p;
        }));
    };

    const handleDefaultBudgetChange = (val: string) => {
        setDefaultBudget(val);
        setBulkProjects(prev => prev.map(p => {
            if (p.budget === defaultBudget || p.budget === '') {
                return { ...p, budget: val };
            }
            return p;
        }));
    };

    const handleClose = () => {
        setFormData({
            projectId: '',
            client: '',
            value: '',
            budget: ''
        });
        setBulkText('');
        setBulkProjects([]);
        setDefaultVal('0');
        setDefaultBudget('0');
        setMode('single');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (mode === 'single') {
            if (isIdDuplicate(formData.projectId)) {
                alert(`Project ID ${formData.projectId} already exists! Please use a unique ID.`);
                return;
            }
            const newProject: ProjectData = {
                projectId: formData.projectId || `C${Math.floor(Math.random() * 1000)}`,
                client: formData.client,
                planning: {
                    value: Number(formData.value) || 0,
                    budget: Number(formData.budget) || 0,
                    deliveryTerms: "ToPay",
                    poConfirmed: true,
                    startDate: new Date().toISOString().split('T')[0]
                },
                production: {
                    currentStage: "Engineering Design",
                    stages: STAGES.map(name => ({
                        name,
                        status: 'Pending'
                    }))
                },
                metrics: {
                    totalComponents: 0,
                    materialConsumption: "Pending Ingestion",
                    workforce: ["TBD"]
                }
            };
            await saveProjectToFirebase(newProject);
            onAdd(newProject);
        } else {
            // Check duplicates in bulkProjects
            const hasDuplicate = bulkProjects.some((p, idx) => isIdDuplicate(p.projectId, idx));
            const hasInvalidFormat = bulkProjects.some(p => p.projectId && !isCXXXFormat(p.projectId));
            
            if (hasDuplicate) {
                alert("Duplicate project IDs detected! Please correct them before initializing.");
                return;
            }
            if (hasInvalidFormat) {
                alert("Some project IDs have invalid format! Must be like CXXXX.");
                return;
            }

            for (const entry of bulkProjects) {
                if (!entry.client) continue;
                const newProject: ProjectData = {
                    projectId: entry.projectId,
                    client: entry.client,
                    planning: {
                        value: Number(entry.value) || 0,
                        budget: Number(entry.budget) || 0,
                        deliveryTerms: "ToPay",
                        poConfirmed: true,
                        startDate: new Date().toISOString().split('T')[0]
                    },
                    production: {
                        currentStage: "Engineering Design",
                        stages: STAGES.map(name => ({
                            name,
                            status: 'Pending'
                        }))
                    },
                    metrics: {
                        totalComponents: 0,
                        materialConsumption: "Pending Ingestion",
                        workforce: ["TBD"]
                    }
                };
                await saveProjectToFirebase(newProject);
                onAdd(newProject);
            }
        }
        handleClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />
            
            <div className={`relative w-full ${mode === 'single' ? 'max-w-lg' : 'max-w-3xl'} bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in duration-300`}>
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Initialize Project</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Project Command Registration</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex border-b border-slate-100 px-8 bg-slate-50">
                    <button
                        type="button"
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                            mode === 'single'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                        onClick={() => setMode('single')}
                    >
                        Single Project
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                            mode === 'bulk'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                        onClick={() => setMode('bulk')}
                    >
                        Bulk Add Projects
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {mode === 'single' ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Project ID (CXXX)</label>
                                <div className="relative">
                                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        required
                                        className={`w-full bg-slate-50 border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 transition-all ${
                                            isIdDuplicate(formData.projectId)
                                                ? 'border-rose-300 focus:ring-rose-200'
                                                : 'border-slate-100 focus:ring-[#0e4368]/10 focus:border-[#0e4368]'
                                        }`}
                                        placeholder="e.g. C001"
                                        value={formData.projectId}
                                        onChange={e => setFormData({...formData, projectId: e.target.value})}
                                    />
                                    {isIdDuplicate(formData.projectId) && (
                                        <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">Warning: ID already exists!</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Client Identity</label>
                                <input 
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0e4368]/10 focus:border-[#0e4368] transition-all"
                                    placeholder="Full Corporate Name"
                                    value={formData.client}
                                    onChange={e => setFormData({...formData, client: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Project Value</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            required
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0e4368]/10 focus:border-[#0e4368] transition-all"
                                            placeholder="Total ₹"
                                            value={formData.value}
                                            onChange={e => setFormData({...formData, value: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Allocated Budget</label>
                                    <div className="relative">
                                        <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            required
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0e4368]/10 focus:border-[#0e4368] transition-all"
                                            placeholder="Limit ₹"
                                            value={formData.budget}
                                            onChange={e => setFormData({...formData, budget: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Client Names (one per line)</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0e4368]/10 focus:border-[#0e4368] transition-all resize-none"
                                    placeholder="e.g.&#10;Google India&#10;Microsoft Corporation&#10;Amazon Web Services"
                                    value={bulkText}
                                    onChange={e => handleBulkTextChange(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Default Value (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0e4368]/10 focus:border-[#0e4368] transition-all"
                                        placeholder="Default Total"
                                        value={defaultVal}
                                        onChange={e => handleDefaultValChange(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Default Budget (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0e4368]/10 focus:border-[#0e4368] transition-all"
                                        placeholder="Default Limit"
                                        value={defaultBudget}
                                        onChange={e => handleDefaultBudgetChange(e.target.value)}
                                    />
                                </div>
                            </div>

                            {bulkProjects.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Review & Customize Generated Projects</label>
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 max-h-64 overflow-y-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-100/80 border-b border-slate-200">
                                                    <th className="p-3 text-[9px] font-black text-slate-500 uppercase tracking-wider">Project ID</th>
                                                    <th className="p-3 text-[9px] font-black text-slate-500 uppercase tracking-wider">Client</th>
                                                    <th className="p-3 text-[9px] font-black text-slate-500 uppercase tracking-wider">Value (₹)</th>
                                                    <th className="p-3 text-[9px] font-black text-slate-500 uppercase tracking-wider">Budget (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {bulkProjects.map((proj, idx) => {
                                                    const duplicate = isIdDuplicate(proj.projectId, idx);
                                                    const invalidFormat = proj.projectId && !isCXXXFormat(proj.projectId);
                                                    return (
                                                        <tr key={idx} className="hover:bg-white transition-colors">
                                                            <td className="p-2 w-28">
                                                                <input
                                                                    required
                                                                    type="text"
                                                                    className={`w-full bg-white border rounded-xl py-1.5 px-2 text-xs font-bold focus:outline-none transition-all ${
                                                                        duplicate || invalidFormat
                                                                            ? 'border-rose-400 bg-rose-50/50 text-rose-700 focus:ring-2 focus:ring-rose-200'
                                                                            : 'border-slate-200 focus:ring-2 focus:ring-slate-100'
                                                                    }`}
                                                                    value={proj.projectId}
                                                                    onChange={e => {
                                                                        const updatedVal = e.target.value;
                                                                        setBulkProjects(prev => prev.map((p, i) => i === idx ? { ...p, projectId: updatedVal } : p));
                                                                    }}
                                                                    title={duplicate ? "Duplicate ID detected" : invalidFormat ? "Format must be CXXXX" : ""}
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    required
                                                                    type="text"
                                                                    className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                                                                    value={proj.client}
                                                                    onChange={e => {
                                                                        const updatedVal = e.target.value;
                                                                        setBulkProjects(prev => prev.map((p, i) => i === idx ? { ...p, client: updatedVal } : p));
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="p-2 w-28">
                                                                <input
                                                                    required
                                                                    type="number"
                                                                    className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                                                                    value={proj.value}
                                                                    onChange={e => {
                                                                        const updatedVal = e.target.value;
                                                                        setBulkProjects(prev => prev.map((p, i) => i === idx ? { ...p, value: updatedVal } : p));
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="p-2 w-28">
                                                                <input
                                                                    required
                                                                    type="number"
                                                                    className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                                                                    value={proj.budget}
                                                                    onChange={e => {
                                                                        const updatedVal = e.target.value;
                                                                        setBulkProjects(prev => prev.map((p, i) => i === idx ? { ...p, budget: updatedVal } : p));
                                                                    }}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-[#0e4368] hover:shadow-[0_10px_30px_rgba(14,67,104,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
                    >
                        <Calendar className="w-5 h-5" /> {mode === 'single' ? 'INITIALIZE PROJECT' : `INITIALIZE ${bulkProjects.length} PROJECTS`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewProjectModal;

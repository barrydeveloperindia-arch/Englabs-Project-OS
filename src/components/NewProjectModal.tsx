import React, { useState } from 'react';
import { X, Plus, Target, DollarSign, Calendar } from 'lucide-react';
import { ProjectData, STAGES } from '../lib/project';
import { saveProjectToFirebase } from '../lib/database_service';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (project: ProjectData) => void;
    existingProjects?: string[];
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onAdd, existingProjects = [] }) => {
    const [formData, setFormData] = useState({
        projectId: '',
        client: '',
        value: '',
        budget: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newProject: ProjectData = {
            projectId: formData.projectId || `C${Math.floor(Math.random() * 1000)}`,
            client: formData.client,
            planning: {
                value: Number(formData.value),
                budget: Number(formData.budget),
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
        saveProjectToFirebase(newProject);
        onAdd(newProject);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Initialize Mission</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Project Command Registration</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Project ID (CXXX)</label>
                        <div className="relative">
                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                required
                                list="existing-projects-list"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0e4368]/10 focus:border-[#0e4368] transition-all"
                                placeholder="e.g. C001"
                                value={formData.projectId}
                                onChange={e => setFormData({...formData, projectId: e.target.value})}
                            />
                            <datalist id="existing-projects-list">
                                {existingProjects.map(proj => (
                                    <option key={proj} value={proj}>{proj}</option>
                                ))}
                            </datalist>
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

                    <button 
                        type="submit"
                        className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-[#0e4368] hover:shadow-[0_10px_30px_rgba(14,67,104,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
                    >
                        <Calendar className="w-5 h-5" /> INITIALIZE PROJECT
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewProjectModal;

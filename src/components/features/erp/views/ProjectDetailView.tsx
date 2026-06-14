import React from 'react';
import { ERPProject } from '@domain/erp_beta_types';

interface ProjectDetailViewProps {
    project: ERPProject;
    onBack: () => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, onBack }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-slate-800">
                &larr; Back to Dashboard
            </button>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">{project.projectName}</h2>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{project.clientName} | {project.id}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-3 py-1.5 rounded tracking-widest">
                        {project.status}
                    </span>
                </div>

                <div className="grid grid-cols-4 gap-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Budget</p>
                        <p className="text-lg font-black text-slate-800">₹{project.budgetAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
                        <p className="text-lg font-black text-slate-800">₹{project.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Current Profit</p>
                        <p className="text-lg font-black text-emerald-600">₹{project.profit.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Current Loss</p>
                        <p className="text-lg font-black text-rose-600">₹{project.loss.toLocaleString()}</p>
                    </div>
                </div>
                
                <div className="mt-8">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Sub-Modules Overview</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {['Enquiry & Quotation', 'PO & Budget', 'Procurement & Vendors', 'Materials & Store', 'Production', 'Packing & Dispatch', 'Porter & Logistics', 'Food & Site Ops', 'Invoices & Reports'].map(module => (
                            <div key={module} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
                                <span className="text-xs font-bold text-slate-600">{module}</span>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">READY</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

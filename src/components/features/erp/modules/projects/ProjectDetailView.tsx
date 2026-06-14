import React, { useState } from 'react';
import { ERPProject } from '@domain/erp_beta_types';
import { 
    CheckCircle2, 
    Circle, 
    ArrowRight, 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    PieChart, 
    Receipt, 
    PackageSearch,
    Truck,
    HardHat
} from 'lucide-react';

interface ProjectDetailViewProps {
    project: ERPProject;
}

// ----------------------------------------------------------------------
// Project Workflow Tracker
// ----------------------------------------------------------------------
const ProjectWorkflowTracker: React.FC<{ project: ERPProject }> = ({ project }) => {
    const workflowSteps = [
        'Enquiry', 'Quotation', 'PO', 'Budget', 'Vendor', 'Procurement', 
        'Materials', 'Production', 'Packing', 'Dispatch', 'Site Work', 'Invoice', 'Payment'
    ];
    
    // Simple heuristic for demo: calculate active step based on progress
    const activeStepIndex = Math.floor((project.progressPercentage / 100) * workflowSteps.length);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-fade-in">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Workflow Pipeline</h3>
            <div className="flex items-center justify-between overflow-x-auto dark-scrollbar pb-4 gap-2">
                {workflowSteps.map((step, idx) => {
                    const isCompleted = idx < activeStepIndex;
                    const isActive = idx === activeStepIndex;
                    const isPending = idx > activeStepIndex;
                    
                    return (
                        <div key={step} className="flex items-center gap-2 shrink-0">
                            <div className={`flex flex-col items-center gap-2 \${isCompleted ? 'text-emerald-600' : isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 \${isCompleted ? 'bg-emerald-50 border-emerald-500' : isActive ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200'}`}>
                                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3 fill-current" />}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider">{step}</span>
                            </div>
                            {idx < workflowSteps.length - 1 && (
                                <ArrowRight className={`w-4 h-4 mb-5 \${isCompleted ? 'text-emerald-300' : 'text-slate-200'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// Project Dashboard
// ----------------------------------------------------------------------
const ProjectDashboard: React.FC<{ project: ERPProject }> = ({ project }) => {
    const kpis = [
        { label: 'Quotation Amount', value: project.poAmount * 1.1, icon: Receipt, color: 'text-slate-700', bg: 'bg-slate-100' },
        { label: 'PO Amount', value: project.poAmount, icon: DollarSign, color: 'text-blue-700', bg: 'bg-blue-100' },
        { label: 'Budget Amount', value: project.budgetAmount, icon: Wallet, color: 'text-purple-700', bg: 'bg-purple-100' },
        { label: 'Actual Expenses', value: project.totalExpenses, icon: PieChart, color: 'text-amber-700', bg: 'bg-amber-100' },
        { label: 'Revenue', value: project.revenue, icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-100' },
        { label: 'Profit / Loss', value: project.profit - project.loss, icon: project.profit >= 0 ? TrendingUp : TrendingDown, color: project.profit >= 0 ? 'text-emerald-600' : 'text-rose-600', bg: project.profit >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
        { label: 'Pending Client Pay', value: project.pendingClientPayments, icon: ArrowRight, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Pending Vendor Pay', value: project.pendingVendorPayments, icon: ArrowRight, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    return (
        <div className="grid grid-cols-4 gap-4 animate-fade-in">
            {kpis.map(kpi => (
                <div key={kpi.label} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center \${kpi.bg}`}>
                        <kpi.icon className={`w-6 h-6 \${kpi.color}`} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                        <h4 className={`text-lg font-black mt-1 \${kpi.label === 'Profit / Loss' ? kpi.color : 'text-slate-800'}`}>
                            ₹{Math.abs(kpi.value).toLocaleString()}
                        </h4>
                    </div>
                </div>
            ))}
            
            <div className="col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-6">
                <div className="w-24 h-24 shrink-0 rounded-full border-8 border-slate-100 flex items-center justify-center relative">
                    {/* SVG Circle for Progress would go here, simplified for now */}
                    <span className="text-xl font-black text-slate-800">{project.progressPercentage}%</span>
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Project Completion Progress</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">This project is currently marked as <strong className="text-slate-700">{project.status}</strong>. Ensure all required dependencies in the workflow pipeline are cleared before moving to the next stage.</p>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// Project Costing Engine
// ----------------------------------------------------------------------
const ProjectCostingEngine: React.FC<{ project: ERPProject }> = ({ project }) => {
    const costs = [
        { label: 'Material Cost', value: project.materialCost, icon: PackageSearch },
        { label: 'Vendor Cost', value: project.vendorCost, icon: Truck },
        { label: 'Labour Cost', value: project.labourCost, icon: HardHat },
        { label: 'Sanding Cost', value: project.sandingCost, icon: Circle },
        { label: 'Painting Cost', value: project.paintingCost, icon: Circle },
        { label: 'Packing Cost', value: project.packingCost, icon: PackageSearch },
        { label: 'Porter Cost', value: project.porterCost, icon: Truck },
        { label: 'Food Cost', value: project.foodCost, icon: PieChart },
        { label: 'Logistics Cost', value: project.logisticsCost, icon: Truck },
        { label: 'Site Cost', value: project.siteCost, icon: HardHat },
        { label: 'Miscellaneous Cost', value: project.miscellaneousCost, icon: Circle },
    ];

    const total = costs.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Costing Engine</h3>
                    <p className="text-xs text-slate-500 mt-1">Breakdown of all registered expenses</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Engine Calculation</p>
                    <h4 className="text-xl font-black text-rose-600">₹{total.toLocaleString()}</h4>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {costs.map(cost => (
                    <div key={cost.label} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <cost.icon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-700">{cost.label}</span>
                        </div>
                        <span className="text-sm font-black text-slate-800">₹{cost.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// Main Detail View
// ----------------------------------------------------------------------
export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project }) => {
    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Costing'>('Dashboard');

    return (
        <div className="flex flex-col h-full space-y-6">
            <ProjectWorkflowTracker project={project} />

            <div className="flex gap-2 border-b border-slate-200 pb-px">
                <button 
                    onClick={() => setActiveTab('Dashboard')}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all \${activeTab === 'Dashboard' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                    Project Dashboard
                </button>
                <button 
                    onClick={() => setActiveTab('Costing')}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all \${activeTab === 'Costing' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                    Costing Engine
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 dark-scrollbar">
                {activeTab === 'Dashboard' ? (
                    <ProjectDashboard project={project} />
                ) : (
                    <ProjectCostingEngine project={project} />
                )}
            </div>
        </div>
    );
};

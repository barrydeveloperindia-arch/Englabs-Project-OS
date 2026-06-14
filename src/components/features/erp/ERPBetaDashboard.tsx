import React, { useState, useEffect } from 'react';
import { Download, Filter, Search, Database } from 'lucide-react';
import { db } from '@services/firebase';
import { collection, query, orderBy, getDocs, getCountFromServer, where, limit } from 'firebase/firestore';
import { migrateProjectsToFirestore } from '@services/scripts/migrate_to_firestore';

export const ERPBetaDashboard: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);

    // HR Metrics State
    const [hrMetrics, setHrMetrics] = useState({
        totalStaff: 0,
        presentToday: 0,
        absentToday: 0,
        pendingLeaves: 0,
        monthlyLabourCost: 0
    });

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Projects (Limit 20 to prevent cost escalation)
            const projQuery = query(collection(db, 'projects_master'), orderBy('createdAt', 'desc'), limit(20));
            const projSnapshot = await getDocs(projQuery);
            const liveData = projSnapshot.docs.map(doc => {
                const data = doc.data();
                const matCost = data.costTotals?.materialCost || 0;
                const venCost = data.costTotals?.vendorCost || 0;
                const portCost = data.costTotals?.porterCost || 0;
                const foodCost = data.costTotals?.foodCost || 0;
                const logCost = data.costTotals?.logisticsCost || 0;
                const miscCost = data.costTotals?.miscellaneousCost || 0;
                const labourCost = data.costTotals?.labourCost || 0;
                const totalExp = matCost + venCost + portCost + foodCost + logCost + miscCost + labourCost;
                const rev = data.revenueRealized || data.poAmount || 0;

                return {
                    id: doc.id,
                    projectName: data.projectName || data.id || 'Unknown Project',
                    clientName: data.clientName || 'Unknown',
                    quotationNumber: data.quotationNo || 'N/A',
                    poNumber: data.poNumber || 'N/A',
                    poAmount: data.poAmount || 0,
                    budgetAmount: data.budget || 0,
                    materialCost: matCost,
                    vendorCost: venCost,
                    porterCost: portCost,
                    foodCost: foodCost,
                    labourCost: labourCost,
                    logisticsCost: logCost,
                    miscellaneousCost: miscCost,
                    totalExpenses: totalExp,
                    revenue: rev,
                    profit: rev - totalExp,
                    loss: totalExp > rev ? totalExp - rev : 0,
                    progressPercentage: data.progress || 0,
                    status: data.status === 'ACTIVE' ? 'Running' : data.status === 'COMPLETED' ? 'Completed' : 'Under Progress',
                    pendingClientPayments: 0,
                    pendingVendorPayments: 0
                };
            });
            setProjects(liveData);

            // 2. Fetch HR Metrics via efficient getCountFromServer (Cost Optimization)
            const todayStr = new Date().toISOString().split('T')[0];
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

            // Total Staff
            const staffSnap = await getCountFromServer(collection(db, 'staff_master'));
            
            // Present Today
            const presentQuery = query(collection(db, 'attendance_ledger'), where('date', '==', todayStr), where('status', 'in', ['PRESENT', 'HALF-DAY']));
            const presentSnap = await getCountFromServer(presentQuery);
            
            // Absent Today
            const absentQuery = query(collection(db, 'attendance_ledger'), where('date', '==', todayStr), where('status', '==', 'ABSENT'));
            const absentSnap = await getCountFromServer(absentQuery);

            // Pending Leaves
            const pendingLeavesQuery = query(collection(db, 'leave_ledger'), where('status', '==', 'PENDING'));
            const pendingLeavesSnap = await getCountFromServer(pendingLeavesQuery);

            // Monthly Labour Cost (sum via manual limited getDocs since sum() is not easily exposed without full scan, but we filter by month)
            const payrollQuery = query(collection(db, 'salary_ledger'), where('createdAt', '>=', currentMonth));
            const payrollSnap = await getDocs(payrollQuery);
            let monthlyTotal = 0;
            payrollSnap.docs.forEach(d => {
                monthlyTotal += d.data().amount || 0;
            });

            setHrMetrics({
                totalStaff: staffSnap.data().count,
                presentToday: presentSnap.data().count,
                absentToday: absentSnap.data().count,
                pendingLeaves: pendingLeavesSnap.data().count,
                monthlyLabourCost: monthlyTotal
            });

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const intervalId = setInterval(fetchDashboardData, 60000); // 60-second polling interval
        return () => clearInterval(intervalId);
    }, []);

    const handleMigration = async () => {
        setMigrating(true);
        await migrateProjectsToFirestore();
        setMigrating(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Final Dashboard</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Project Portfolio Overview</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleMigration}
                        disabled={migrating}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        <Database className="w-4 h-4" />
                        {migrating ? 'Migrating...' : 'Run Migration to Staging'}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                        <Filter className="w-4 h-4 text-slate-400" /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#0b1b29] text-white rounded-lg text-xs font-bold hover:bg-[#132a40] transition-colors">
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>

            {/* HR Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Staff</p>
                    <p className="text-2xl font-black text-slate-800">{hrMetrics.totalStaff}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Present Today</p>
                    <p className="text-2xl font-black text-emerald-700">{hrMetrics.presentToday}</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 shadow-sm">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Absent Today</p>
                    <p className="text-2xl font-black text-rose-700">{hrMetrics.absentToday}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pending Leaves</p>
                    <p className="text-2xl font-black text-amber-700">{hrMetrics.pendingLeaves}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Monthly Labour Cost</p>
                    <p className="text-2xl font-black text-blue-700">₹{hrMetrics.monthlyLabourCost.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Master Projects Ledger</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search projects..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                </div>
                
                {loading ? (
                    <div className="p-12 text-center text-slate-500 font-bold">Loading live data from Firestore...</div>
                ) : (
                <div className="overflow-x-auto dark-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Project ID</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Client Name</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Project Name</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Quotation No</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">PO Number</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 text-right">PO Amount</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 text-right">Budget</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 text-right">Material</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 text-right">Vendor</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 text-right">Labour</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 text-right">Porter</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 text-right">Food</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 text-right">Misc (Fin)</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-800 uppercase tracking-widest border-r border-slate-200 bg-slate-100 text-right">Total Expenses</th>
                                <th className="px-4 py-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-r border-slate-200 text-right">Realized Rev</th>
                                <th className="px-4 py-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-r border-slate-200 text-right">Profit</th>
                                <th className="px-4 py-3 text-[10px] font-black text-rose-600 uppercase tracking-widest border-r border-slate-200 text-right">Loss</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 text-center">Progress %</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Status</th>
                                <th className="px-4 py-3 text-[10px] font-black text-amber-600 uppercase tracking-widest border-r border-slate-200 text-right">Pending Client Pay</th>
                                <th className="px-4 py-3 text-[10px] font-black text-amber-600 uppercase tracking-widest text-right">Pending Vendor Pay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(project => (
                                <tr key={project.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-xs font-bold text-slate-700 border-r border-slate-100">{project.id}</td>
                                    <td className="px-4 py-3 text-xs font-bold text-slate-800 border-r border-slate-100">{project.clientName}</td>
                                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 border-r border-slate-100 truncate max-w-[200px]" title={project.projectName}>{project.projectName}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 font-mono border-r border-slate-100">{project.quotationNumber}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 font-mono border-r border-slate-100">{project.poNumber}</td>
                                    <td className="px-4 py-3 text-xs font-black text-slate-700 text-right border-r border-slate-100">₹{project.poAmount.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-black text-slate-700 text-right border-r border-slate-100">₹{project.budgetAmount.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right border-r border-slate-100">₹{project.materialCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right border-r border-slate-100">₹{project.vendorCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right border-r border-slate-100">₹{project.labourCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right border-r border-slate-100">₹{project.porterCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right border-r border-slate-100">₹{project.foodCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-medium text-slate-600 text-right border-r border-slate-100">₹{project.miscellaneousCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-black text-slate-800 bg-slate-50 text-right border-r border-slate-100">₹{project.totalExpenses.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-black text-emerald-600 text-right border-r border-slate-100">₹{project.revenue.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-black text-emerald-600 text-right border-r border-slate-100">₹{project.profit.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-black text-rose-600 text-right border-r border-slate-100">₹{project.loss.toLocaleString()}</td>
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-xs font-black text-slate-700">{project.progressPercentage}%</span>
                                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${project.progressPercentage}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                            project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                            project.status === 'Running' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {project.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-black text-amber-600 text-right border-r border-slate-100">₹{project.pendingClientPayments.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-black text-amber-600 text-right">₹{project.pendingVendorPayments.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
        </div>
    );
};

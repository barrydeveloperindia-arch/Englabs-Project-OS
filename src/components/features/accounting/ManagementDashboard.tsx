import React, { useEffect, useState } from 'react';
import { ProjectRecord } from '@domain/accounting_schema';
import { collection, getDocs, query, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@services/firebase';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Briefcase, RefreshCw, Calendar } from 'lucide-react';
import masterDb from '@data/master_projects_db.json';
const PROJECTS_COLLECTION = "accounting_projects";

export const ManagementDashboard: React.FC = () => {
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

    const fetchProjects = async () => {
        if (!db) return;
        try {
            const q = query(collection(db, PROJECTS_COLLECTION));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(d => d.data() as ProjectRecord);
            setProjects(data);
        } catch (e) {
            console.error("Failed to load projects", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cleanupAndFetch = async () => {
            if (!db) return;
            try {
                // Auto-remove C001, C002, C003 immediately as requested
                await deleteDoc(doc(db, PROJECTS_COLLECTION, "C001"));
                await deleteDoc(doc(db, PROJECTS_COLLECTION, "C002"));
                await deleteDoc(doc(db, PROJECTS_COLLECTION, "C003"));
            } catch(e) {}
            await fetchProjects();
        };
        cleanupAndFetch();
    }, []);

    const handleSimulateExtraction = async () => {
        setLoading(true);
        if (!db) return;
        try {
            // Process ALL 2026 projects from the unified master DB (Outlook + Excel)
            const projectsToAdd: ProjectRecord[] = masterDb.map((msg: any) => {
                return {
                    id: msg.id,
                    projectName: msg.projectName,
                    clientId: msg.clientId,
                    poNumber: msg.poNumber,
                    poAmount: msg.poAmount || 0,
                    status: msg.status as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD',
                    siteLocation: msg.siteLocation,
                    contactPerson: msg.contactPerson,
                    email: msg.email,
                    mobileNumber: msg.mobileNumber,
                    address: msg.address,
                    city: msg.city,
                    state: msg.state,
                    totalCost: msg.totalCost || 0,
                    netProfit: (msg.poAmount || 0) - (msg.totalCost || 0),
                    profitPercentage: msg.poAmount ? (((msg.poAmount || 0) - (msg.totalCost || 0)) / msg.poAmount) * 100 : 0,
                    isLossProject: msg.poAmount > 0 && ((msg.poAmount || 0) - (msg.totalCost || 0)) < 0,
                    createdAt: msg.date,
                    updatedAt: new Date().toISOString(),
                    poDate: msg.date,
                    deliveryDate: new Date(new Date(msg.date).getTime() + 30*24*60*60*1000).toISOString()
                };
            });

            // Save all 2026 extracted projects to Firebase
            const batchPromises = projectsToAdd.map(p => setDoc(doc(db, PROJECTS_COLLECTION, p.id), p));
            await Promise.all(batchPromises);
            
            // Cleanup old mock projects
            await deleteDoc(doc(db, PROJECTS_COLLECTION, "C001")).catch(() => {});
            await deleteDoc(doc(db, PROJECTS_COLLECTION, "C002")).catch(() => {});
            await deleteDoc(doc(db, PROJECTS_COLLECTION, "C003")).catch(() => {});

            await fetchProjects();
        } catch (e) {
            console.error("Failed to mock seed", e);
        } finally {
            setLoading(false);
        }
    };

    const uniqueMonths = Array.from(new Set(projects.map(p => p.poDate ? p.poDate.substring(0, 7) : 'Unknown'))).sort().reverse();
    const displayedProjects = selectedMonth === 'ALL' ? projects : projects.filter(p => (p.poDate ? p.poDate.substring(0, 7) : 'Unknown') === selectedMonth);

    const totalRevenue = displayedProjects.reduce((sum, p) => sum + p.poAmount, 0);
    const totalExpenses = displayedProjects.reduce((sum, p) => sum + p.totalCost, 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalProjects = displayedProjects.length;
    const activeProjects = displayedProjects.filter(p => p.status === 'ACTIVE').length;
    const completedProjects = displayedProjects.filter(p => p.status === 'COMPLETED').length;
    const lossProjects = displayedProjects.filter(p => p.isLossProject);

    const monthlyData = projects.reduce((acc, p) => {
        const month = p.poDate ? p.poDate.substring(0, 7) : 'Unknown';
        if (!acc[month]) acc[month] = { month, count: 0, revenue: 0, cost: 0, profit: 0 };
        acc[month].count += 1;
        acc[month].revenue += p.poAmount;
        acc[month].cost += p.totalCost;
        acc[month].profit += p.netProfit;
        return acc;
    }, {} as Record<string, any>);
    const monthlyReport = Object.values(monthlyData).sort((a: any, b: any) => b.month.localeCompare(a.month));
    
    // Mock logic for outstanding payments based on poAmount vs received
    const outstandingClientPayments = projects.reduce((sum, p) => sum + (p.poAmount * 0.2), 0); // Assuming 20% pending
    const outstandingVendorPayments = projects.reduce((sum, p) => sum + (p.totalCost * 0.1), 0); // Assuming 10% pending


    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="p-6 bg-gray-50 h-screen overflow-y-auto flex-1">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Englabs Management Dashboard</h1>
                    <p className="text-gray-500 mt-1">Real-time accounting and project profitability</p>
                </div>
                <button 
                    onClick={handleSimulateExtraction}
                    className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-100 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Simulate AI Extraction (OneDrive)
                </button>
            </div>

            {/* Primary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Projects (Act / Comp)</p>
                        <p className="text-2xl font-bold text-gray-900">{activeProjects} / {completedProjects}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">₹{Math.round(totalRevenue).toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-3 rounded-full bg-red-50 text-red-600 mr-4">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
                        <p className="text-2xl font-bold text-gray-900">₹{Math.round(totalExpenses).toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className={`p-3 rounded-full mr-4 ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Net Profit</p>
                        <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ₹{Math.round(netProfit).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Secondary KPI Cards (Outstanding Payments) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center bg-orange-50">
                    <div>
                        <p className="text-sm text-orange-600 font-medium">Outstanding Client Payments</p>
                        <p className="text-2xl font-bold text-orange-900">₹{Math.round(outstandingClientPayments).toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 flex items-center bg-purple-50">
                    <div>
                        <p className="text-sm text-purple-600 font-medium">Outstanding Vendor Payments</p>
                        <p className="text-2xl font-bold text-purple-900">₹{Math.round(outstandingVendorPayments).toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>


            {/* Alerts Section */}
            {lossProjects.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <AlertCircle className="text-red-500 mr-2" /> Action Required: Loss Projects
                    </h2>
                    <div className="grid gap-4">
                        {lossProjects.map(p => (
                            <div key={p.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-red-800">{p.id} - {p.projectName}</h3>
                                    <p className="text-red-600 text-sm">Client: {p.clientId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-red-600">Loss Amount</p>
                                    <p className="font-bold text-red-800 text-lg">₹{Math.round(Math.abs(p.netProfit)).toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Monthly Report Table */}
            {monthlyReport.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-blue-50/50">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">2026 Monthly Performance Report</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Month</th>
                                    <th className="px-6 py-3 text-center">Total Projects</th>
                                    <th className="px-6 py-3 text-right">Revenue</th>
                                    <th className="px-6 py-3 text-right">Cost</th>
                                    <th className="px-6 py-3 text-right">Net Profit</th>
                                    <th className="px-6 py-3 text-right">Profit Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyReport.map((m: any) => {
                                    const margin = m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0;
                                    const monthStr = m.month !== 'Unknown' ? new Date(m.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Unspecified Date';
                                    return (
                                    <tr key={m.month} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-gray-900">{monthStr}</td>
                                        <td className="px-6 py-4 text-center font-medium">{m.count}</td>
                                        <td className="px-6 py-4 text-right font-medium">₹{Math.round(m.revenue).toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 text-right text-gray-400">₹{Math.round(m.cost).toLocaleString('en-IN')}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${m.profit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>₹{Math.round(m.profit).toLocaleString('en-IN')}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${margin < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{margin.toFixed(1)}%</td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Projects Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">Project Master Ledger</h2>
                    <select 
                        className="bg-white border border-gray-200 text-sm font-bold text-gray-700 py-2 px-4 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <option value="ALL">All Months</option>
                        {uniqueMonths.map(m => (
                            <option key={m} value={m}>
                                {m !== 'Unknown' ? new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Unspecified Date'}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <table className="w-full text-left text-sm text-gray-500 relative">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 text-center w-16">Sr. No.</th>
                                    <th className="px-6 py-3">Project ID</th>
                                    <th className="px-6 py-3">PO Number</th>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Client & GST</th>
                                    <th className="px-6 py-3">Full Address</th>
                                    <th className="px-6 py-3 text-right">Total Revenue</th>
                                    <th className="px-6 py-3 text-right border-l border-gray-100">Material Cost</th>
                                    <th className="px-6 py-3 text-right">Labor Cost</th>
                                    <th className="px-6 py-3 text-right">Rent/Other</th>
                                    <th className="px-6 py-3 text-right font-bold text-gray-900 border-r border-gray-100">Total Cost</th>
                                    <th className="px-6 py-3 text-right">Net Profit</th>
                                </tr>
                        </thead>
                        <tbody>
                            {displayedProjects.map((p, index) => (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50 cursor-pointer">
                                    <td className="px-6 py-4 text-center text-[10px] font-black text-slate-400">{index + 1}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.id}</td>
                                    <td className="px-6 py-4 text-[11px] text-gray-500 font-mono font-bold tracking-tight">{p.poNumber || '-'}</td>
                                    <td className="px-6 py-4">{p.projectName}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{p.clientId}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{p.contactPerson} • {p.mobileNumber}</p>
                                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">GST: Pending</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col max-w-[200px]">
                                            <span className="text-[10px] text-gray-600 leading-tight">{p.address || p.siteLocation} {p.city ? `, ${p.city}` : ''} {p.state ? `, ${p.state}` : ''}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">₹{Math.round(p.poAmount).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 text-right text-gray-500 text-[11px] border-l border-gray-50">₹{Math.round(p.totalCost * 0.6).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 text-right text-gray-500 text-[11px]">₹{Math.round(p.totalCost * 0.3).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 text-right text-gray-500 text-[11px]">₹{Math.round(p.totalCost * 0.1).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 border-r border-gray-50">₹{Math.round(p.totalCost).toLocaleString('en-IN')}</td>
                                    <td className={`px-6 py-4 text-right font-black ${p.netProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        ₹{Math.round(p.netProfit).toLocaleString('en-IN')}
                                        <span className="block text-[10px] font-medium mt-0.5">{p.profitPercentage.toFixed(1)}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

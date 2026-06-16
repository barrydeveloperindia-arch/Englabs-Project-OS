import React, { useEffect, useState } from 'react';
import { ProjectRecord, ExpenseLedgerEntry } from '@domain/accounting_schema';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@services/firebase';
import { FileText, Tag, Truck, Users, PenTool, AlertTriangle } from 'lucide-react';

const PROJECTS_COLLECTION = "accounting_projects";
const LEDGER_COLLECTION = "accounting_ledger";

export const ProjectDashboard: React.FC<{ projectId: string }> = ({ projectId }) => {
    const [project, setProject] = useState<ProjectRecord | null>(null);
    const [ledger, setLedger] = useState<ExpenseLedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            if (!db || !projectId) return;
            try {
                // Fetch Project
                const pDoc = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));
                if (pDoc.exists()) {
                    setProject(pDoc.data() as ProjectRecord);
                }

                // Fetch Ledger
                const q = query(collection(db, LEDGER_COLLECTION), where("projectId", "==", projectId));
                const snapshot = await getDocs(q);
                const entries = snapshot.docs.map(d => d.data() as ExpenseLedgerEntry);
                
                // Sort by date
                entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                // Calculate running balance
                let currentBalance = 0;
                entries.forEach(e => {
                    currentBalance += (e.credit - e.debit);
                    e.balance = currentBalance;
                });
                
                setLedger(entries);
            } catch (e) {
                console.error("Failed to load project details", e);
            } finally {
                setLoading(false);
            }
        };
        fetchProjectDetails();
    }, [projectId]);

    if (loading) return <div className="p-8 text-center">Loading Project Details...</div>;
    if (!project) return <div className="p-8 text-center text-red-500">Project not found.</div>;

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Material': return <Tag size={16} className="text-blue-500" />;
            case 'Labour': return <Users size={16} className="text-orange-500" />;
            case 'Logistics': return <Truck size={16} className="text-purple-500" />;
            case 'Site Expenses': return <FileText size={16} className="text-emerald-500" />;
            default: return <PenTool size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{project.id} - {project.projectName}</h1>
                    <p className="text-gray-500 mt-1">Client: {project.clientId} | PO: {project.poNumber}</p>
                </div>
                {project.isLossProject && (
                    <div className="flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-lg font-bold border border-red-200">
                        <AlertTriangle className="mr-2" size={20} />
                        LOSS PROJECT
                    </div>
                )}
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 font-medium">Project Value (Revenue)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{project.poAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 font-medium">Total Cost</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{project.totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 font-medium">Profitability</p>
                    <p className={`text-3xl font-bold mt-2 ${project.profitPercentage < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {project.profitPercentage.toFixed(1)}% (₹{project.netProfit.toLocaleString()})
                    </p>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Project Expense Ledger</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3 text-right">Debit (Cost)</th>
                                <th className="px-6 py-3 text-right">Credit (Revenue)</th>
                                <th className="px-6 py-3 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.map((entry) => (
                                <tr key={entry.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{entry.description}</div>
                                        {entry.vendorId && <div className="text-xs text-gray-400">Vendor: {entry.vendorId}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            {getCategoryIcon(entry.category)}
                                            <span>{entry.category}</span>
                                            {entry.subcategory && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{entry.subcategory}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-red-600 font-medium">
                                        {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                                        {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        ₹{entry.balance.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {ledger.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No transactions found for this project.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

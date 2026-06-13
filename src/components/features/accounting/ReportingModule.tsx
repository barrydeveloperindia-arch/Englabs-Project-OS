import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { ProjectRecord } from '@domain/accounting_schema';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@config/firebase';

const PROJECTS_COLLECTION = "accounting_projects";

export const ReportingModule: React.FC = () => {
    const [reportType, setReportType] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchReportData = async () => {
        if (!db) return [];
        let dateLimit = new Date();
        
        if (reportType === 'Daily') {
            dateLimit.setDate(dateLimit.getDate() - 1);
        } else if (reportType === 'Weekly') {
            dateLimit.setDate(dateLimit.getDate() - 7);
        } else if (reportType === 'Monthly') {
            dateLimit.setMonth(dateLimit.getMonth() - 1);
        }

        const q = query(
            collection(db, PROJECTS_COLLECTION),
            where('updatedAt', '>=', dateLimit.toISOString())
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data() as ProjectRecord);
    };

    const exportToPDF = async () => {
        setIsGenerating(true);
        try {
            const data = await fetchReportData();
            const doc = new jsPDF();
            
            doc.setFontSize(20);
            doc.text(`Englabs ${reportType} Accounting Report`, 14, 22);
            doc.setFontSize(12);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);

            let yPos = 45;
            let totalRev = 0;
            let totalCost = 0;

            data.forEach((p, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.setFont("helvetica", "bold");
                doc.text(`${p.id} - ${p.projectName}`, 14, yPos);
                doc.setFont("helvetica", "normal");
                
                doc.text(`Revenue: Rs. ${p.poAmount}`, 14, yPos + 7);
                doc.text(`Cost: Rs. ${p.totalCost}`, 80, yPos + 7);
                doc.text(`Profit: Rs. ${p.netProfit} (${p.profitPercentage.toFixed(1)}%)`, 140, yPos + 7);
                
                totalRev += p.poAmount;
                totalCost += p.totalCost;
                yPos += 20;
            });

            doc.line(14, yPos, 196, yPos);
            yPos += 10;
            doc.setFont("helvetica", "bold");
            doc.text(`Total Revenue: Rs. ${totalRev}`, 14, yPos);
            doc.text(`Total Cost: Rs. ${totalCost}`, 80, yPos);
            doc.text(`Net Profit: Rs. ${totalRev - totalCost}`, 140, yPos);

            doc.save(`Englabs_${reportType}_Report_${new Date().getTime()}.pdf`);
        } catch (e) {
            console.error("PDF Export failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    const exportToExcel = async () => {
        setIsGenerating(true);
        try {
            const data = await fetchReportData();
            
            const wsData = data.map(p => ({
                'Project ID': p.id,
                'Project Name': p.projectName,
                'Client': p.clientId,
                'Status': p.status,
                'PO Date': new Date(p.poDate).toLocaleDateString(),
                'Revenue (Rs)': p.poAmount,
                'Total Cost (Rs)': p.totalCost,
                'Net Profit (Rs)': p.netProfit,
                'Profit %': p.profitPercentage.toFixed(2),
                'Loss Alert': p.isLossProject ? 'YES' : 'NO'
            }));

            const ws = XLSX.utils.json_to_sheet(wsData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Projects");
            XLSX.writeFile(wb, `Englabs_${reportType}_Report_${new Date().getTime()}.xlsx`);
        } catch (e) {
            console.error("Excel Export failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Download className="mr-2 text-blue-600" />
                Export Reports
            </h2>
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Period</label>
                <div className="flex space-x-4">
                    {['Daily', 'Weekly', 'Monthly'].map(type => (
                        <button
                            key={type}
                            onClick={() => setReportType(type as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                reportType === type 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex space-x-4">
                <button
                    onClick={exportToPDF}
                    disabled={isGenerating}
                    className="flex-1 flex justify-center items-center px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors disabled:opacity-50"
                >
                    <FileText className="mr-2" size={20} />
                    Export as PDF
                </button>
                <button
                    onClick={exportToExcel}
                    disabled={isGenerating}
                    className="flex-1 flex justify-center items-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors disabled:opacity-50"
                >
                    <FileSpreadsheet className="mr-2" size={20} />
                    Export as Excel
                </button>
            </div>
        </div>
    );
};

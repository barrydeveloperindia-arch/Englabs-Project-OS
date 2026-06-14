import React, { useState } from 'react';
import { Download, FileText, Filter, Search, Database } from 'lucide-react';
import { auth } from '@services/firebase';
import { ReportDataFetcher, REPORT_TYPES, ReportFilter, ReportPayload } from '@services/reports/ReportDataFetcher';
import { ExportManager } from '@services/reports/ExportManager';

export const ReportingEngine: React.FC = () => {
    const [selectedReportId, setSelectedReportId] = useState<string>('PNL');
    const [filters, setFilters] = useState<ReportFilter>({});
    const [loading, setLoading] = useState(false);
    const [reportPayload, setReportPayload] = useState<ReportPayload | null>(null);
    const [error, setError] = useState<string>('');

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setReportPayload(null);
        try {
            const email = auth.currentUser?.email || 'Unknown User';
            const payload = await ReportDataFetcher.fetchReport(selectedReportId, filters, email);
            setReportPayload(payload);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!reportPayload) return;
        const reportName = REPORT_TYPES.find(r => r.id === selectedReportId)?.name || 'Report';
        ExportManager.exportToExcel(reportPayload.data, reportName.replace(/\s+/g, '_'));
    };

    const handleExportPDF = () => {
        if (!reportPayload) return;
        const reportName = REPORT_TYPES.find(r => r.id === selectedReportId)?.name || 'Report';
        ExportManager.exportToPDF('report-print-area', reportName.replace(/\s+/g, '_'));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Reporting Engine</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Analytics & Export</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Control Panel (Left Column) */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Report Selection</h3>
                        <select 
                            value={selectedReportId}
                            onChange={(e) => { setSelectedReportId(e.target.value); setReportPayload(null); }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                            {REPORT_TYPES.map(rt => (
                                <option key={rt.id} value={rt.id}>{rt.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Filter className="w-3 h-3" /> Filters
                        </h3>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Project ID</label>
                                <input 
                                    type="text" 
                                    value={filters.projectId || ''}
                                    onChange={e => setFilters({...filters, projectId: e.target.value})}
                                    placeholder="e.g. PRJ-001"
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={filters.startDate || ''}
                                        onChange={e => setFilters({...filters, startDate: e.target.value})}
                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">End Date</label>
                                    <input 
                                        type="date" 
                                        value={filters.endDate || ''}
                                        onChange={e => setFilters({...filters, endDate: e.target.value})}
                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vendor ID / Name</label>
                                <input 
                                    type="text" 
                                    value={filters.vendorId || ''}
                                    onChange={e => setFilters({...filters, vendorId: e.target.value})}
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Staff ID</label>
                                <input 
                                    type="text" 
                                    value={filters.staffId || ''}
                                    onChange={e => setFilters({...filters, staffId: e.target.value})}
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full mt-4 py-2 bg-[#0b1b29] hover:bg-[#132a40] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-lg"
                        >
                            {loading ? 'Processing Data...' : 'Generate Report'}
                        </button>
                    </div>
                </div>

                {/* Preview Matrix (Right Column) */}
                <div className="md:col-span-3">
                    {error && (
                        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl mb-4 text-xs font-bold">
                            {error}
                        </div>
                    )}

                    {!reportPayload && !loading && !error && (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                            <Database className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-slate-500">Configure filters and generate report to view data</p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}

                    {reportPayload && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                    {REPORT_TYPES.find(r => r.id === selectedReportId)?.name}
                                </h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleExportExcel}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black uppercase tracking-widest transition-colors"
                                    >
                                        <Download className="w-3 h-3" /> XLSX
                                    </button>
                                    <button 
                                        onClick={handleExportPDF}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black uppercase tracking-widest transition-colors"
                                    >
                                        <FileText className="w-3 h-3" /> PDF
                                    </button>
                                </div>
                            </div>

                            {/* Printable Area starts here */}
                            <div id="report-print-area" className="p-6 bg-white">
                                {/* Validation Meta Block */}
                                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Target</p>
                                        <p className="text-xs font-mono font-bold text-slate-700">{reportPayload.metadata.sourceCollection}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Record Count</p>
                                        <p className="text-xs font-mono font-bold text-slate-700">{reportPayload.metadata.recordCount} rows</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aggregation Logic</p>
                                        <p className="text-xs font-mono font-bold text-slate-700 truncate">{reportPayload.metadata.aggregationLogic}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated By</p>
                                        <p className="text-xs font-mono font-bold text-slate-700">{reportPayload.metadata.generatedBy}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Timestamp</p>
                                        <p className="text-xs font-mono font-bold text-slate-700">{reportPayload.metadata.generatedTimestamp}</p>
                                    </div>
                                </div>

                                {/* Dynamic Table */}
                                {reportPayload.data.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b-2 border-slate-800">
                                                    {Object.keys(reportPayload.data[0]).map(key => (
                                                        <th key={key} className="px-3 py-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportPayload.data.map((row, i) => (
                                                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                        {Object.entries(row).map(([key, val]: [string, any], j) => (
                                                            <td key={j} className="px-3 py-2 text-xs font-semibold text-slate-600">
                                                                {typeof val === 'number' && key.toLowerCase().includes('cost') || typeof val === 'number' && key.toLowerCase().includes('amount') || typeof val === 'number' && key.toLowerCase().includes('revenue') || typeof val === 'number' && key.toLowerCase().includes('profit') 
                                                                    ? `₹${val.toLocaleString()}` 
                                                                    : val}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-sm font-bold text-slate-500">
                                        No data found for the selected filters.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { 
    LogIn, 
    LogOut, 
    FileText, 
    ClipboardList, 
    Search, 
    Filter, 
    Download, 
    Printer, 
    Plus,
    CheckCircle2,
    Clock,
    AlertTriangle,
    TrendingUp,
    Shield,
    Edit2,
    MessageSquare,
    Image as ImageIcon,
    Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import GateEntryForm from './GateEntryForm';
import GatePassSlip from './GatePassSlip';
import GateInvoiceSlip from './GateInvoiceSlip';
import { GateEntry, generateId, generateGatePassId, UNITS, DELIVERY_TYPES } from '../lib/gate_system';
import { syncLocalToFirebase } from '../lib/database_service';
import { AuditLog } from '../lib/system_guard';

interface Props {
    entries: GateEntry[];
    onNewEntry: (entry: GateEntry) => void;
    onUpdateEntry: (entry: GateEntry) => void;
    onDeleteEntry: (id: string) => void;
    onLog?: (log: AuditLog) => void;
    onFullSync?: () => Promise<boolean>;
}

const GateRegister: React.FC<Props> = ({ entries, onNewEntry, onUpdateEntry, onDeleteEntry, onLog, onFullSync }) => {
    const [view, setView] = useState<'DASHBOARD' | 'INWARD_LIST' | 'OUTWARD_LIST' | 'NEW_ENTRY'>('DASHBOARD');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingEntry, setEditingEntry] = useState<GateEntry | null>(null);
    const [selectedSlip, setSelectedSlip] = useState<GateEntry | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<GateEntry | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'SYNCING' | 'SECURE'>('SECURE');
    const [showDeleteModal, setShowDeleteModal] = useState<GateEntry | null>(null);
    const [deletePasscode, setDeletePasscode] = useState('');

    const executeDelete = () => {
        if (deletePasscode === 'ADMIN2026') {
            const entry = showDeleteModal!;
            onDeleteEntry(entry.id);
            if (onLog) {
                onLog({
                    id: `LOG-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    user: 'ADMIN-OVERRIDE',
                    action: 'DELETE',
                    targetId: entry.id,
                    details: `PERMANENT DELETION: ${entry.materialName} record for ${entry.partyName} removed from registry.`
                });
            }
            setShowDeleteModal(null);
            setDeletePasscode('');
        } else {
            alert("INVALID PROTOCOL KEY. ACCESS DENIED.");
        }
    };

    const handleDelete = (entry: GateEntry) => {
        setShowDeleteModal(entry);
    };
    
    // Summary Stats
    const stats = {
        totalInwardToday: entries.filter(e => e.type === 'INWARD').length,
        totalOutwardToday: entries.filter(e => e.type === 'OUTWARD').length,
        totalValue: entries.reduce((acc, curr) => acc + (curr.amount || 0), 0),
        pendingApprovals: entries.filter(e => e.type === 'OUTWARD' && !e.gatePassNumber).length
    };

    const shareOnWhatsApp = (entry: GateEntry) => {
        let itemsDetail = '';
        const entryAny = entry as any;
        if (entryAny.items && entryAny.items.length > 0) {
            itemsDetail = '\n*ITEMIZED BREAKDOWN:*\n';
            entryAny.items.forEach((item: any, idx: number) => {
                const hsn = item.hsnCode ? ` [HSN: ${item.hsnCode}]` : '';
                itemsDetail += `${idx + 1}. ${item.name}${hsn} | ${item.quantity} ${item.unit} @ ₹${item.rate || 0} = ₹${(item.amount || 0).toLocaleString()}\n`;
            });
            itemsDetail += `--------------------------------\n`;
        }

        const text = encodeURIComponent(
            `*ENGLABS GATE PASS - ${entry.id}*\n` +
            `--------------------------------\n` +
            `*Type:* ${entry.type}\n` +
            `*Date:* ${new Date(entry.timestamp).toLocaleDateString()}\n` +
            `*Vendor/Party:* ${entry.partyName}\n` +
            `*Vehicle:* ${entry.vehicleNumber}\n` +
            `*Invoice:* ${entry.invoiceNumber}\n` +
            itemsDetail +
            `*GRAND TOTAL: ₹${(entry.amount || 0).toLocaleString()}*\n` +
            `--------------------------------\n` +
            `*Verified By:* ${entry.employeeName}\n` +
            `*Supervisor:* ${entry.supervisorName}\n` +
            `--------------------------------\n` +
            `_Official Gate Registry System_`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const exportToExcel = () => {
        const flatData = entries.flatMap(entry => {
            const entryAny = entry as any;
            if (entryAny.items && entryAny.items.length > 0) {
                return entryAny.items.map((item: any) => ({
                    'Date': new Date(entry.timestamp).toLocaleDateString(),
                    'Entry ID': entry.id,
                    'Type': entry.type,
                    'Party Name': entry.partyName,
                    'Vehicle/Mode': entry.vehicleNumber,
                    'Item Name': item.name,
                    'HSN Code': item.hsnCode || '',
                    'Qty': item.quantity,
                    'Unit': item.unit,
                    'Rate': item.rate || 0,
                    'Amount': item.amount || 0,
                    'Invoice No': entry.invoiceNumber,
                    'Verified By': entry.employeeName,
                    'Supervisor': entry.supervisorName
                }));
            }
            return [{
                'Date': new Date(entry.timestamp).toLocaleDateString(),
                'Entry ID': entry.id,
                'Type': entry.type,
                'Party Name': entry.partyName,
                'Vehicle/Mode': entry.vehicleNumber,
                'Item Name': entry.materialName,
                'HSN Code': '',
                'Qty': entry.quantity,
                'Unit': entry.unit || 'Nos',
                'Rate': 0,
                'Amount': entry.amount || 0,
                'Invoice No': entry.invoiceNumber,
                'Verified By': entry.employeeName,
                'Supervisor': entry.supervisorName
            }];
        });

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Logistics Registry");
        
        // Auto-size columns
        const maxWidths = Object.keys(flatData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...flatData.map(row => String(row[key as keyof typeof row]).length)) + 2
        }));
        worksheet['!cols'] = maxWidths;

        XLSX.writeFile(workbook, `Englabs_Logistics_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const shareMonthlySummary = () => {
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const monthEntries = entries.filter(e => {
            const date = new Date(e.timestamp);
            return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
        });

        const totalIn = monthEntries.filter(e => e.type === 'INWARD').length;
        const totalOut = monthEntries.filter(e => e.type === 'OUTWARD').length;
        const totalVal = monthEntries.reduce((acc, curr) => acc + (curr.amount || 0), 0);

        const text = encodeURIComponent(
            `*ENGLABS MONTHLY LOGISTICS SUMMARY - ${currentMonth.toUpperCase()}*\n` +
            `--------------------------------\n` +
            `*Total Inward:* ${totalIn} Entries\n` +
            `*Total Outward:* ${totalOut} Entries\n` +
            `*Total Material Value:* ₹${totalVal.toLocaleString()}\n` +
            `*Verification Status:* 100% AUDITED\n` +
            `--------------------------------\n` +
            `_Generated by Englabs System Guard_`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const syncDatabase = async () => {
        setIsSyncing(true);
        setDbStatus('SYNCING');
        try {
            const success = onFullSync ? await onFullSync() : await syncLocalToFirebase(entries);
            if (success) {
                setDbStatus('SECURE');
                alert("DATABASE SYNC COMPLETE: All records backed up to Firebase Cloud.");
            } else {
                setDbStatus('CONNECTED');
                alert("SYNC PARTIAL: Local data saved. Firebase requires configuration.");
            }
        } catch (e) {
            setDbStatus('CONNECTED');
            alert("SYNC FAILED: Check internet connection or Firebase configuration.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
            <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-slate-900 leading-none">Logistics Command Center</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Englabs India Pvt Ltd • Official Movement Registry</span>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${view === 'DASHBOARD' ? 'bg-emerald-500 border-emerald-400 text-slate-900' : 'bg-white border-slate-200 text-slate-400'}`} onClick={() => setView('DASHBOARD')}>Dashboard</div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${view === 'INWARD_LIST' ? 'bg-emerald-500 border-emerald-400 text-slate-900' : 'bg-white border-slate-200 text-slate-400'}`} onClick={() => setView('INWARD_LIST')}>Inward Register</div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${view === 'OUTWARD_LIST' ? 'bg-emerald-500 border-emerald-400 text-slate-900' : 'bg-white border-slate-200 text-slate-400'}`} onClick={() => setView('OUTWARD_LIST')}>Outward Register</div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <div className={`w-2 h-2 rounded-full ${dbStatus === 'SECURE' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Database: {dbStatus}</span>
                    </div>
                    <button 
                        onClick={syncDatabase}
                        disabled={isSyncing}
                        className={`p-3 border border-slate-200 rounded-xl transition-all ${isSyncing ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-500 shadow-sm'}`}
                        title="Sync with Forensic Database"
                    >
                        <Shield className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={exportToExcel}
                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-2 px-4"
                        title="Master Excel Export (All Invoices)"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Master Export</span>
                    </button>
                    <button 
                        onClick={() => setView('NEW_ENTRY')}
                        className="bg-[#0F172A] text-emerald-500 hover:bg-slate-800 font-black px-6 py-3 rounded-xl flex items-center gap-2 text-xs transition-all shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> NEW LOG ENTRY
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {editingEntry || view === 'NEW_ENTRY' ? (
                    <GateEntryForm 
                        onClose={() => {
                            setView('DASHBOARD');
                            setEditingEntry(null);
                        }}
                        currentCount={entries.length}
                        gpCount={entries.filter(e => e.gatePassNumber).length}
                        initialData={editingEntry || undefined}
                        onSave={(entry) => {
                            if (editingEntry) {
                                onUpdateEntry(entry);
                            } else {
                                onNewEntry(entry);
                            }
                            setView('DASHBOARD');
                            setEditingEntry(null);
                        }}
                        onLog={onLog}
                    />
                ) : (
                    <>
                        {view === 'DASHBOARD' && (
                            <div className="max-w-[1400px] mx-auto space-y-10">
                                {/* STATS GRID */}
                                <div className="grid grid-cols-4 gap-8">
                                    <StatCard icon={<LogIn />} label="Inward Entries" value={stats.totalInwardToday} color="emerald" onClick={() => setView('INWARD_LIST')} />
                                    <StatCard icon={<LogOut />} label="Outward Entries" value={stats.totalOutwardToday} color="blue" onClick={() => setView('OUTWARD_LIST')} />
                                    <StatCard icon={<TrendingUp />} label="Total Valuation" value={`₹${stats.totalValue.toLocaleString('en-IN')}`} color="purple" />
                                    <StatCard icon={<AlertTriangle />} label="Pending Pass" value={stats.pendingApprovals} color="amber" />
                                </div>

                                {/* LIVE FEED */}
                                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden">
                                    <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                            <Shield className="w-6 h-6 text-emerald-500" /> Recent Movements
                                        </h2>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={shareMonthlySummary}
                                                className="px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                            >
                                                <MessageSquare className="w-4 h-4" /> MONTHLY SHARE
                                            </button>
                                            <button className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all text-slate-500">
                                                <Printer className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-10 overflow-x-auto">
                                        <EntryTable 
                                            entries={entries.slice(0, 10)}
                                            onEdit={setEditingEntry}
                                            onDelete={handleDelete}
                                            onPrint={setSelectedSlip}
                                            onInvoice={setSelectedInvoice}
                                            onShare={shareOnWhatsApp}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {(view === 'INWARD_LIST' || view === 'OUTWARD_LIST') && (
                            <div className="max-w-[1400px] mx-auto space-y-10">
                                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden">
                                    <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                            <Shield className="w-6 h-6 text-emerald-500" /> 
                                            {view === 'INWARD_LIST' ? 'Inward Registry' : 'Outward Registry'}
                                        </h2>
                                        <div className="relative w-96">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text"
                                                placeholder="Search by ID, Material or Party..."
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="p-10 overflow-x-auto">
                                        <EntryTable 
                                            entries={entries.filter(e => 
                                                (view === 'INWARD_LIST' ? e.type === 'INWARD' : e.type === 'OUTWARD') &&
                                                (e.materialName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                e.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                e.id.toLowerCase().includes(searchQuery.toLowerCase()))
                                            )}
                                            onEdit={setEditingEntry}
                                            onDelete={handleDelete}
                                            onPrint={setSelectedSlip}
                                            onInvoice={setSelectedInvoice}
                                            onShare={shareOnWhatsApp}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {selectedSlip && (
                    <GatePassSlip 
                        entry={selectedSlip} 
                        onClose={() => setSelectedSlip(null)} 
                    />
                )}

                {selectedInvoice && (
                    <GateInvoiceSlip 
                        entry={selectedInvoice} 
                        onClose={() => setSelectedInvoice(null)} 
                    />
                )}

                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-red-50/30">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                                    <AlertTriangle className="w-6 h-6 text-red-500" /> Authorized Deletion
                                </h3>
                                <button onClick={() => setShowDeleteModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400">
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>
                            <div className="p-10 space-y-6 text-center">
                                <p className="text-sm text-slate-500">You are about to permanently remove entry <span className="font-black text-slate-900">{showDeleteModal.id}</span> from the forensic registry.</p>
                                
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Enter Deletion Protocol Key</label>
                                    <input 
                                        type="password" 
                                        value={deletePasscode}
                                        onChange={(e) => setDeletePasscode(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-xl font-black text-slate-900 outline-none focus:border-red-500 transition-all text-center tracking-[0.5em]"
                                        placeholder="••••••••"
                                        autoFocus
                                    />
                                </div>

                                <button 
                                    onClick={executeDelete}
                                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                                >
                                    Confirm Permanent Deletion
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const StatCard = ({ icon, label, value, color, onClick }: any) => {
    const colors: any = {
        emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
        blue: "text-blue-500 bg-blue-50 border-blue-100",
        purple: "text-purple-500 bg-purple-50 border-purple-100",
        amber: "text-amber-500 bg-amber-50 border-amber-100"
    };

    return (
        <div 
            onClick={onClick}
            className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.01)] hover:shadow-lg transition-all group ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}>
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    );
};

export default GateRegister;

const EntryTable = ({ entries, onEdit, onDelete, onPrint, onInvoice, onShare }: any) => (
    <table className="w-full text-left border-collapse">
        <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="pb-6 px-4">Entry ID</th>
                <th className="pb-6 px-4">Type</th>
                <th className="pb-6 px-4">Material</th>
                <th className="pb-6 px-4">Party / Vehicle</th>
                <th className="pb-6 px-4">Payment</th>
                <th className="pb-6 px-4 text-right">Gate Pass</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
            {entries.length === 0 ? (
                <tr>
                    <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                            <ClipboardList className="w-16 h-16 opacity-20" />
                            <p className="font-black text-lg uppercase tracking-widest">No matching records found</p>
                        </div>
                    </td>
                </tr>
            ) : (
                entries.map((entry: any) => (
                    <tr key={entry.id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="py-6 px-4">
                            <div className="flex items-center gap-3">
                                {entry.photoUrl ? (
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                                        <img src={entry.photoUrl} className="w-full h-full object-cover" alt="Material" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                        <ImageIcon className="w-4 h-4 text-slate-300" />
                                    </div>
                                )}
                                <div>
                                    <span className="font-black text-slate-900">{entry.id}</span>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1">{entry.timestamp}</p>
                                </div>
                            </div>
                        </td>
                        <td className="py-6 px-4">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${entry.type === 'INWARD' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {entry.type}
                            </span>
                        </td>
                        <td className="py-6 px-4">
                            <p className="font-bold text-slate-900 text-sm leading-tight">{entry.materialName}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{entry.quantity} {entry.unit}</p>
                        </td>
                        <td className="py-6 px-4">
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 text-sm leading-tight">{entry.partyName}</p>
                                {entry.invoicePhotoUrl && <FileText className="w-3 h-3 text-emerald-500" />}
                            </div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase mt-1 tracking-widest">{entry.vehicleNumber}</p>
                        </td>
                        <td className="py-6 px-4">
                            <div className="flex flex-col gap-1">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest w-fit ${
                                    entry.paymentStatus === 'PAID' ? 'bg-emerald-500 text-white' : 
                                    entry.paymentStatus === 'PARTIAL' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'
                                }`}>
                                    {entry.paymentStatus || 'UNPAID'}
                                </span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    {entry.paymentMode || 'UPI'}
                                </span>
                            </div>
                        </td>
                        <td className="py-6 px-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => onInvoice(entry)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                    title="Generate Professional Invoice"
                                >
                                    <FileText className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => onPrint(entry)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                                    title="View Receipt Slip"
                                >
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => onShare(entry)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                                    title="Share Slip on WhatsApp"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => onEdit(entry)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                                    title="Edit Entry"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => onDelete(entry)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                    title="Admin Delete (Requires Authorization)"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                {entry.gatePassNumber && (
                                    <span className="font-black text-slate-900 text-xs self-center ml-2">{entry.gatePassNumber}</span>
                                )}
                            </div>
                        </td>
                    </tr>
                ))
            )}
        </tbody>
    </table>
);

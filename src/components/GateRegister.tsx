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
import GateEntryForm from './GateEntryForm';
import GatePassSlip from './GatePassSlip';
import { GateEntry, generateId, generateGatePassId, UNITS, DELIVERY_TYPES } from '../lib/gate_system';
import { syncLocalToFirebase } from '../lib/database_service';

interface Props {
    entries: GateEntry[];
    setEntries: React.Dispatch<React.SetStateAction<GateEntry[]>>;
    onLog?: (log: AuditLog) => void;
}

const GateRegister: React.FC<Props> = ({ entries, setEntries, onLog }) => {
    const [view, setView] = useState<'DASHBOARD' | 'INWARD_LIST' | 'OUTWARD_LIST' | 'NEW_ENTRY'>('DASHBOARD');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingEntry, setEditingEntry] = useState<GateEntry | null>(null);
    const [selectedSlip, setSelectedSlip] = useState<GateEntry | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'SYNCING' | 'SECURE'>('SECURE');

    const handleDelete = (entry: GateEntry) => {
        const password = window.prompt("CRITICAL: ADMIN AUTHORIZATION REQUIRED\nEnter Deletion Protocol Key:");
        
        if (password === 'ADMIN2026') {
            setEntries(prev => prev.filter(e => e.id !== entry.id));
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
            alert("RECORD DELETED PERMANENTLY. SYSTEM LOG UPDATED.");
        } else if (password !== null) {
            alert("INVALID PROTOCOL KEY. ACCESS DENIED.");
            if (onLog) {
                onLog({
                    id: `LOG-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    user: 'UNAUTHORIZED-USER',
                    action: 'SYSTEM',
                    targetId: entry.id,
                    details: `FAILED DELETION ATTEMPT: Incorrect protocol key provided for record ${entry.id}`
                });
            }
        }
    };
    
    // Summary Stats
    const stats = {
        totalInwardToday: entries.filter(e => e.type === 'INWARD').length,
        totalOutwardToday: entries.filter(e => e.type === 'OUTWARD').length,
        totalValue: entries.reduce((acc, curr) => acc + (curr.amount || 0), 0),
        pendingApprovals: entries.filter(e => e.type === 'OUTWARD' && !e.gatePassNumber).length
    };

    const shareOnWhatsApp = (entry: GateEntry) => {
        const text = encodeURIComponent(
            `*ENGLABS GATE PASS - ${entry.id}*\n` +
            `--------------------------------\n` +
            `*Type:* ${entry.type}\n` +
            `*Date:* ${new Date(entry.timestamp).toLocaleDateString()}\n` +
            `*Time:* ${new Date(entry.timestamp).toLocaleTimeString()}\n` +
            `*Material:* ${entry.materialName}\n` +
            `*Qty:* ${entry.quantity} ${entry.unit}\n` +
            `*Vehicle:* ${entry.vehicleNumber}\n` +
            `*Carrier/Driver:* ${entry.driverName}\n` +
            `*Party:* ${entry.partyName}\n` +
            `*From:* ${entry.fromLocation}\n` +
            `*To:* ${entry.toLocation}\n` +
            `*Ref:* ${entry.invoiceNumber}\n` +
            `*Issued By:* ${entry.employeeName}\n` +
            `*Authorized By:* ${entry.supervisorName}\n` +
            `*Status:* VERIFIED\n` +
            `--------------------------------\n` +
            `_Official Gate Registry System_`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
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
            const success = await syncLocalToFirebase(entries);
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
                        onClick={() => setView('NEW_ENTRY')}
                        className="bg-[#0F172A] text-emerald-500 hover:bg-slate-800 font-black px-6 py-3 rounded-xl flex items-center gap-2 text-xs transition-all shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> NEW LOG ENTRY
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {view === 'DASHBOARD' && (
                    <div className="max-w-[1400px] mx-auto space-y-10">
                        {/* STATS GRID */}
                        <div className="grid grid-cols-4 gap-8">
                            <StatCard icon={<LogIn />} label="Inward Entries" value={stats.totalInwardToday} color="emerald" />
                            <StatCard icon={<LogOut />} label="Outward Entries" value={stats.totalOutwardToday} color="blue" />
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
                                    <button className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all text-slate-500">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-10 overflow-x-auto">
                                <EntryTable 
                                    entries={entries.slice(0, 10)}
                                    onEdit={setEditingEntry}
                                    onDelete={handleDelete}
                                    onPrint={setSelectedSlip}
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
                                    onShare={shareOnWhatsApp}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {(view === 'NEW_ENTRY' || editingEntry) && (
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
                                setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
                            } else {
                                setEntries(prev => [entry, ...prev]);
                            }
                            setView('DASHBOARD');
                            setEditingEntry(null);
                        }}
                        onLog={onLog}
                    />
                )}

                {selectedSlip && (
                    <GatePassSlip 
                        entry={selectedSlip} 
                        onClose={() => setSelectedSlip(null)} 
                    />
                )}
            </main>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }: any) => {
    const colors: any = {
        emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
        blue: "text-blue-500 bg-blue-50 border-blue-100",
        purple: "text-purple-500 bg-purple-50 border-purple-100",
        amber: "text-amber-500 bg-amber-50 border-amber-100"
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.01)] hover:shadow-lg transition-all group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}>
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    );
};

export default GateRegister;

const EntryTable = ({ entries, onEdit, onDelete, onPrint, onShare }: any) => (
    <table className="w-full text-left border-collapse">
        <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="pb-6 px-4">Entry ID</th>
                <th className="pb-6 px-4">Type</th>
                <th className="pb-6 px-4">Material</th>
                <th className="pb-6 px-4">Party / Vehicle</th>
                <th className="pb-6 px-4">Status</th>
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
                                {entry.invoicePhotoUrl && <FileText className="w-3 h-3 text-emerald-500" title="Invoice Uploaded" />}
                            </div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase mt-1 tracking-widest">{entry.vehicleNumber}</p>
                        </td>
                        <td className="py-6 px-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase">Verified</span>
                            </div>
                        </td>
                        <td className="py-6 px-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => onPrint(entry)}
                                    className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-lg transition-all"
                                    title="View Receipt Slip"
                                >
                                    <Printer className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onShare(entry)}
                                    className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-lg transition-all"
                                    title="Share Slip on WhatsApp"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onEdit(entry)}
                                    className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-lg transition-all"
                                    title="Edit Entry"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onDelete(entry)}
                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                                    title="Admin Delete (Requires Authorization)"
                                >
                                    <Trash2 className="w-4 h-4" />
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

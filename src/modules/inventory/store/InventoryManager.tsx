import React, { useState, useEffect } from 'react';
import { 
    Package, 
    ArrowUpRight, 
    ArrowDownRight, 
    AlertCircle, 
    History, 
    Search, 
    Filter,
    TrendingUp,
    Box,
    Clock,
    Activity,
    Database,
    ShieldCheck,
    Share2,
    Download
} from 'lucide-react';
import { InventoryItem, StockTransaction } from '@shared/services/gate_system';
import { fetchInventoryMaster, fetchStockMovement } from '@shared/services/inventory_service';

const InventoryManager: React.FC = () => {
    const [view, setView] = useState<'DASHBOARD' | 'MASTER' | 'MOVEMENT' | 'ALERTS'>('DASHBOARD');
    const [stock, setStock] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<StockTransaction[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
            const stockDataPromise = Promise.race([fetchInventoryMaster(), timeoutPromise]).catch(() => []);
            const logDataPromise = Promise.race([fetchStockMovement(), timeoutPromise]).catch(() => []);
            
            const [stockData, logData] = await Promise.all([
                stockDataPromise,
                logDataPromise
            ]);
            setStock(stockData);
            setLogs(logData);
        } catch (e) {
            console.error("Failed to load inventory data:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const headers = ["Timestamp", "Operation", "Item Details", "Party / Source", "Previous Stock", "New Stock", "Reference ID"];
        const csvContent = [
            headers.join(","),
            ...logs.map(log => [
                new Date(log.timestamp).toLocaleString().replace(/,/g, ''),
                log.type,
                `"${(log.itemId || '').replace(/_/g, ' ')}"`,
                `"${log.partyName}"`,
                log.previousStock,
                log.newStock,
                log.referenceId
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Stock_Movement_Registry_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleWhatsAppShare = () => {
        const text = `*Stock Movement Registry*\nTotal Operations Today: ${logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}\nLink: ${window.location.href}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleShareIndividualWhatsApp = (log: StockTransaction) => {
        const dateStr = new Date(log.timestamp).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        }).replace(/ /g, '-');
        
        let text = "";
        if (log.type === 'INWARD') {
            text = `STORE RECEIPT SLIP\n\nDate: ${dateStr}\nMaterial: ${(log.itemId || '').replace(/_/g, ' ')}\nQuantity: ${log.quantity}\nReceived From: ${log.partyName}\n\nCurrent Balance: ${log.newStock}\n\nENGLABS STORE`;
        } else {
            text = `STORE ISSUE SLIP\n\nDate: ${dateStr}\nMaterial: ${(log.itemId || '').replace(/_/g, ' ')}\nQuantity: ${log.quantity}\nIssued To: ${log.partyName}\nProject: ${log.projectId || 'N/A'}\n\nCurrent Balance: ${log.newStock}\n\nENGLABS STORE`;
        }
        
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const stats = {
        totalItems: stock.length,
        totalStockVal: stock.reduce((acc, curr) => acc + curr.currentStock, 0),
        lowStockItems: stock.filter(item => item.currentStock <= item.minThreshold).length,
        movementsToday: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length
    };

    const filteredStock = stock.filter(s => 
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const lowStock = stock.filter(s => s.currentStock <= s.minThreshold);

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
            <header className="h-auto md:h-20 bg-white border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-10 py-4 md:py-0 shrink-0 gap-4 md:gap-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-slate-900 leading-none">Inventory Command</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-Time Stock Synchronization & Audit</span>
                    </div>
                    <div className="hidden md:block h-8 w-px bg-slate-100"></div>
                    <nav className="flex flex-wrap gap-2">
                        <NavButton active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} icon={<Activity />} label="Dashboard" />
                        <NavButton active={view === 'MASTER'} onClick={() => setView('MASTER')} icon={<Box />} label="Master Register" />
                        <NavButton active={view === 'MOVEMENT'} onClick={() => setView('MOVEMENT')} icon={<History />} label="Movement Log" />
                        <NavButton active={view === 'ALERTS'} onClick={() => setView('ALERTS')} icon={<AlertCircle />} label="Low Stock" />
                    </nav>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search Vault..." 
                            className="w-full md:w-64 bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold focus:border-emerald-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button onClick={loadData} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all">
                        <Clock className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                {isLoading ? (
                    <div className="flex-1 h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Database className="w-12 h-12 text-emerald-500 animate-pulse" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing Vault...</p>
                        </div>
                    </div>
                ) : view === 'DASHBOARD' && (
                    <div className="max-w-[1400px] mx-auto space-y-10">
                        {/* HERO STATS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <SummaryCard icon={<Package />} label="Unique Items" value={stats.totalItems} color="emerald" />
                            <SummaryCard icon={<TrendingUp />} label="Total Stock" value={stats.totalStockVal} color="blue" />
                            <SummaryCard icon={<AlertCircle />} label="Critical Low" value={stats.lowStockItems} color="amber" />
                            <SummaryCard icon={<ShieldCheck />} label="Ops Today" value={stats.movementsToday} color="purple" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                            {/* RECENT MOVEMENTS */}
                            <div className="xl:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                        <History className="w-6 h-6 text-emerald-500" /> Recent Operations
                                    </h3>
                                    <button onClick={() => setView('MOVEMENT')} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">View All</button>
                                </div>
                                <div className="p-8">
                                    <div className="space-y-4">
                                        {logs.slice(0, 8).map(log => (
                                            <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl ${log.type === 'INWARD' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                        {log.type === 'INWARD' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{(log.itemId || '').replace(/_/g, ' ')}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{log.partyName} • {log.invoiceNumber}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-black text-sm ${log.type === 'INWARD' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {log.type === 'INWARD' ? '+' : '-'}{log.quantity}
                                                    </p>
                                                    <p className="text-[9px] font-black text-slate-300 uppercase">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* LOW STOCK SIDEBAR */}
                            <div className="bg-[#0e4368] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                <h3 className="text-xl font-black text-slate-400 mb-8 uppercase tracking-widest flex items-center gap-3">
                                    <AlertCircle className="w-6 h-6 text-amber-500" /> Critical Alerts
                                </h3>
                                <div className="space-y-6">
                                    {lowStock.length === 0 ? (
                                        <div className="py-20 text-center text-slate-500">
                                            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">All Stock Secure</p>
                                        </div>
                                    ) : (
                                        lowStock.map(item => (
                                            <div key={item.itemCode} className="p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-black text-sm text-slate-100 leading-tight pr-4">{item.name}</h4>
                                                    <span className="bg-amber-500 text-slate-900 text-[8px] font-black px-2 py-1 rounded uppercase">LOW</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Balance</p>
                                                        <p className="text-2xl font-black text-amber-400">{item.currentStock} <span className="text-xs text-slate-500">{item.unit}</span></p>
                                                    </div>
                                                    <button className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400">Restock</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'MASTER' && (
                    <div className="max-w-[1400px] mx-auto bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900">Inventory Master Ledger</h2>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">{filteredStock.length} Items Indexed</span>
                        </div>
                        <div className="p-10 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                        <th className="pb-6 px-4">Item Identity</th>
                                        <th className="pb-6 px-4">Category</th>
                                        <th className="pb-6 px-4">Total In</th>
                                        <th className="pb-6 px-4">Total Out</th>
                                        <th className="pb-6 px-4">Balance</th>
                                        <th className="pb-6 px-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStock.map(item => (
                                        <tr key={item.itemCode} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="py-6 px-4">
                                                <p className="font-black text-slate-900 text-sm">{item.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest">{item.itemCode}</p>
                                            </td>
                                            <td className="py-6 px-4 font-black text-[11px] text-slate-500 uppercase tracking-widest">{item.category}</td>
                                            <td className="py-6 px-4 font-black text-sm text-emerald-500">+{item.totalInward}</td>
                                            <td className="py-6 px-4 font-black text-sm text-amber-500">-{item.totalOutward}</td>
                                            <td className="py-6 px-4">
                                                <p className="font-black text-slate-900 text-lg tracking-tighter">{item.currentStock}</p>
                                                <p className="text-[9px] font-black text-slate-300 uppercase">{item.unit}</p>
                                            </td>
                                            <td className="py-6 px-4 text-right">
                                                <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.currentStock > item.minThreshold ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {item.currentStock > item.minThreshold ? 'Secure' : 'Replenish'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {view === 'MOVEMENT' && (
                    <div className="max-w-[1400px] mx-auto bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900">Stock Movement Registry</h2>
                            <div className="flex gap-3">
                                <button onClick={handleWhatsAppShare} className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-[#25D366]/30">
                                    <Share2 className="w-4 h-4" /> WhatsApp
                                </button>
                                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-emerald-200">
                                    <Download className="w-4 h-4" /> Export
                                </button>
                            </div>
                        </div>
                        <div className="p-10 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                        <th className="pb-6 px-4">Timestamp</th>
                                        <th className="pb-6 px-4">Operation</th>
                                        <th className="pb-6 px-4">Item Details</th>
                                        <th className="pb-6 px-4">Party / Source</th>
                                        <th className="pb-6 px-4">Stock Delta</th>
                                        <th className="pb-6 px-4 text-right">Ref ID</th>
                                        <th className="pb-6 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.map(log => (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="py-6 px-4">
                                                <p className="font-black text-slate-900 text-xs">{new Date(log.timestamp).toLocaleDateString()}</p>
                                                <p className="text-[10px] font-black text-slate-400 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                            </td>
                                            <td className="py-6 px-4">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${log.type === 'INWARD' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="py-6 px-4 font-black text-slate-900 text-sm">{(log.itemId || '').replace(/_/g, ' ')}</td>
                                            <td className="py-6 px-4 font-black text-[11px] text-slate-500 uppercase tracking-widest">{log.partyName}</td>
                                            <td className="py-6 px-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase">{log.previousStock}</span>
                                                    <ArrowRight className="w-3 h-3 text-slate-200" />
                                                    <span className={`font-black text-sm ${log.type === 'INWARD' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {log.newStock}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 text-right">
                                                <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 uppercase">{log.referenceId}</span>
                                            </td>
                                            <td className="py-6 px-4 text-center">
                                                <button
                                                    onClick={() => handleShareIndividualWhatsApp(log)}
                                                    className="inline-flex items-center justify-center p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all border border-emerald-100"
                                                    title="Share on WhatsApp"
                                                >
                                                    <Share2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${active ? 'bg-[#0e4368] text-white shadow-lg shadow-[#0e4368]/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
    >
        {React.cloneElement(icon, { className: "w-4 h-4" })} {label}
    </button>
);

const SummaryCard = ({ icon, label, value, color }: any) => {
    const colors: any = {
        emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
        blue: "text-blue-500 bg-blue-50 border-blue-100",
        amber: "text-amber-500 bg-amber-50 border-amber-100",
        purple: "text-purple-500 bg-purple-50 border-purple-100"
    };
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}>
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    );
};

const ArrowRight = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

export default InventoryManager;

import React, { useState, useEffect } from 'react';
import { 
    Shield, 
    Activity, 
    RefreshCw, 
    Eye, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Clock, 
    User, 
    Truck, 
    FileText, 
    CheckCircle2, 
    AlertTriangle, 
    Calendar, 
    ChevronRight,
    Layers,
    UserCheck,
    HelpCircle
} from 'lucide-react';
import { GateEntry, InventoryItem } from '@domain/gate_system';
import { fetchGateEntries } from '@services/database_service';
import { fetchInventoryMaster } from '@domain/inventory_service';

interface Props {
    entries: GateEntry[];
}

const GateDisplayScreen: React.FC<Props> = ({ entries: initialEntries }) => {
    const [localEntries, setLocalEntries] = useState<GateEntry[]>(initialEntries);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(true);
    const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(false);

    // Security Gate State for Store Incharge Role
    const [passcode, setPasscode] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return sessionStorage.getItem('englabs_gatehud_auth') === 'true';
    });
    const [errorMessage, setErrorMessage] = useState('');

    const handleAuth = (codeToTest?: string) => {
        const code = codeToTest !== undefined ? codeToTest : passcode;
        if (code === '0001') {
            sessionStorage.setItem('englabs_gatehud_auth', 'true');
            setIsAuthenticated(true);
            setErrorMessage('');
        } else {
            setErrorMessage('ACCESS DENIED: INVALID INCHARGE PROTOCOL KEY');
            setPasscode('');
        }
    };

    // Initial and periodic loading of database
    const syncData = async () => {
        setIsLoading(true);
        try {
            const [cloudEntries, liveInventory] = await Promise.all([
                fetchGateEntries(),
                fetchInventoryMaster()
            ]);

            setInventoryItems(liveInventory);

            // Merge prop entries with cloud entries to ensure we have the absolute latest
            setLocalEntries(prev => {
                const entryMap = new Map<string, GateEntry>();
                
                // Add cloud entries
                cloudEntries.forEach(e => entryMap.set(e.id, e));
                
                // Overlay prop entries (which might have unsaved memory changes)
                initialEntries.forEach(e => entryMap.set(e.id, e));
                
                // Sort by timestamp descending
                return Array.from(entryMap.values()).sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
            });

            setLastSyncTime(new Date());
        } catch (error) {
            console.error("GateDisplayScreen polling failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Trigger sync on mount
    useEffect(() => {
        syncData();
    }, [initialEntries]);

    // Handle 5-second polling interval
    useEffect(() => {
        if (!isPolling) return;

        const interval = setInterval(() => {
            syncData();
        }, 5000);

        return () => clearInterval(interval);
    }, [isPolling]);

    // Format timestamps beautifully
    const formatTimestamp = (isoString: string) => {
        try {
            const date = new Date(isoString);
            return {
                time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                date: date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
            };
        } catch (e) {
            return { time: '--:--', date: '--- --, ----' };
        }
    };

    // Calculate current active entry
    const getActiveEntry = () => {
        if (localEntries.length === 0) return null;
        if (selectedEntryId) {
            return localEntries.find(e => e.id === selectedEntryId) || localEntries[0];
        }
        return localEntries[0];
    };

    const activeEntry = getActiveEntry();
    const isInspectingArchive = selectedEntryId !== null && activeEntry && activeEntry.id !== localEntries[0]?.id;

    // Convert items into standardized list (handling singular old entries and bulk entries)
    const getTransitItems = (entry: GateEntry) => {
        if (entry.items && entry.items.length > 0) {
            return entry.items;
        }
        return [{
            id: 0,
            name: entry.materialName,
            hsnCode: 'N/A',
            quantity: entry.quantity,
            unit: entry.unit,
            rate: 0,
            amount: entry.amount
        }];
    };

    // Find stock level in master inventory for a given item name
    const getItemStockDetails = (itemName: string) => {
        const itemCode = itemName.toUpperCase().replace(/\s+/g, '_');
        const item = inventoryItems.find(i => i.itemCode === itemCode);
        return item || null;
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4 md:p-6 relative overflow-hidden industrial-grid">
                {/* Background ambient glow */}
                <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
                
                <div className="glass-card max-w-md w-full rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 relative z-10 border border-slate-800 shadow-2xl animate-spring-zoom">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse">
                        <Shield className="w-10 h-10 text-emerald-400" />
                    </div>

                    <div className="text-center">
                        <h2 className="text-lg md:text-xl font-black tracking-widest text-white uppercase">GATEHUD SECURITY</h2>
                        <p className="text-[10px] md:text-xs text-slate-400 font-mono tracking-wider uppercase mt-1">STORE INCHARGE VALIDATION REQUIRED</p>
                    </div>

                    <div className="w-full flex flex-col gap-4">
                        <div className="relative">
                            <input 
                                type="password"
                                value={passcode}
                                onChange={(e) => {
                                    setPasscode(e.target.value);
                                    if (errorMessage) setErrorMessage('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAuth();
                                }}
                                placeholder="ENTER SECURITY PIN"
                                className="w-full bg-slate-950/80 border border-slate-850 px-4 py-3.5 rounded-xl font-mono text-center text-lg tracking-widest text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                                autoFocus
                            />
                        </div>

                        {errorMessage && (
                            <p className="text-[10px] font-mono text-rose-400 text-center font-bold uppercase tracking-wider animate-bounce">
                                ⚠️ {errorMessage}
                            </p>
                        )}

                        {/* Onscreen Keypad for Kiosk Displays */}
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => {
                                        setPasscode(prev => prev + num);
                                        if (errorMessage) setErrorMessage('');
                                    }}
                                    className="bg-slate-900/80 border border-slate-800/40 hover:bg-slate-800 text-white font-mono font-bold text-base py-3.5 rounded-xl transition active:scale-95 shadow-md hover:border-slate-700"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setPasscode('')}
                                className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-mono font-bold text-xs py-3.5 rounded-xl transition active:scale-95 uppercase tracking-wider"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setPasscode(prev => prev + '0');
                                    if (errorMessage) setErrorMessage('');
                                }}
                                className="bg-slate-900/80 border border-slate-800/40 hover:bg-slate-800 text-white font-mono font-bold text-base py-3.5 rounded-xl transition active:scale-95"
                            >
                                0
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAuth()}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-mono font-bold text-xs py-3.5 rounded-xl transition active:scale-95 uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            >
                                Enter
                            </button>
                        </div>
                    </div>

                    <div className="text-[9px] font-mono text-slate-500 text-center tracking-wide uppercase border-t border-slate-850 w-full pt-4">
                        Secure Gate Terminal ID: HUB-MONITOR-01
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 flex flex-col gap-6 relative overflow-hidden industrial-grid">
            
            {/* Header Area */}
            <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 md:px-6 shadow-2xl backdrop-blur-md relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg md:text-xl font-black tracking-wider text-white uppercase">ENGLABS GATEHUD</h1>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">KIOSK MONITOR</span>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-400 tracking-wide font-mono uppercase">REAL-TIME PORTAL TRANSIT & SHOP STOCK CORRELATOR</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-3 md:mt-0 font-mono text-xs">
                    {/* Live Sync Status indicator */}
                    <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-lg shadow-inner">
                        <span className={`w-2 h-2 rounded-full ${isPolling && !isInspectingArchive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`}></span>
                        <span className="text-[11px] font-bold tracking-wide uppercase">
                            {isInspectingArchive 
                                ? 'PAUSED (ARCHIVE INSPECTION)' 
                                : isPolling ? 'LIVE SYNC ACTIVE' : 'LIVE PAUSED'}
                        </span>
                    </div>

                    {/* Sync action / timestamp details */}
                    <div className="text-right text-[10px] text-slate-400 flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Last Sync: {lastSyncTime.toLocaleTimeString()}</span>
                        </div>
                        <button 
                            onClick={syncData}
                            disabled={isLoading}
                            className={`flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold tracking-wider hover:underline transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                            FORCE REFRESH
                        </button>
                    </div>
                </div>
            </header>

            {/* Archive inspect alert banner */}
            {isInspectingArchive && (
                <div className="bg-gradient-to-r from-amber-600/20 to-amber-900/10 border border-amber-500/30 text-amber-200 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-sm z-10 animate-spring-zoom">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span><strong>ARCHIVE PLAYBACK MODE:</strong> Showing historical gate movement. Live updates are paused on screen.</span>
                    </div>
                    <button 
                        onClick={() => setSelectedEntryId(null)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1 rounded-lg font-bold tracking-wider transition uppercase text-[10px]"
                    >
                        Resume Live HUD
                    </button>
                </div>
            )}

            {/* Main Content Layout */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 relative z-10">
                
                {/* Left Side: Recent Movement Log Chronicle */}
                <section className="lg:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col shadow-2xl backdrop-blur-md overflow-hidden max-h-[calc(100vh-190px)]">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-400" />
                            <h2 className="text-xs font-black text-white uppercase tracking-wider">CHRONICLE LOG FEED</h2>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{localEntries.length} Records</span>
                    </div>

                    <div className="flex-1 overflow-y-auto dark-scrollbar p-3 flex flex-col gap-2">
                        {localEntries.length === 0 ? (
                            <div className="h-full flex items-center justify-center flex-col text-slate-500 p-4">
                                <Clock className="w-8 h-8 opacity-20 mb-2 animate-pulse" />
                                <span className="text-[10px] font-mono text-center uppercase tracking-wide">No transits logged</span>
                            </div>
                        ) : (
                            localEntries.map((e, index) => {
                                const { time, date } = formatTimestamp(e.timestamp);
                                const isSelected = selectedEntryId === e.id || (!selectedEntryId && index === 0);
                                const isInward = e.type === 'INWARD';

                                return (
                                    <button
                                        key={e.id}
                                        onClick={() => setSelectedEntryId(e.id)}
                                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group flex flex-col gap-1.5 ${
                                            isSelected 
                                                ? 'bg-slate-800/80 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.06)]' 
                                                : 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-800/30 hover:border-slate-700/80'
                                        }`}
                                    >
                                        {/* Colored edge indicators */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isInward ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-mono font-bold text-white group-hover:text-emerald-400 transition-colors uppercase">
                                                {e.id}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
                                                {time}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {isInward ? (
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                                                    INWARD
                                                </div>
                                            ) : (
                                                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                                                    OUTWARD
                                                </div>
                                            )}
                                            <span className="text-[9px] font-mono text-slate-500">{date}</span>
                                        </div>

                                        <p className="text-xs font-bold text-slate-300 line-clamp-1 group-hover:text-white transition-colors uppercase">
                                            {e.materialName}
                                        </p>

                                        <div className="flex justify-between items-center mt-0.5 pt-1.5 border-t border-slate-800/40">
                                            <span className="text-[9px] font-mono text-slate-400 max-w-[80%] truncate uppercase">
                                                {e.partyName}
                                            </span>
                                            <ChevronRight className={`w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all ${isSelected ? 'text-emerald-400' : ''}`} />
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Right Side: Active Monitor Panel HUD */}
                <section className="lg:col-span-3 flex flex-col gap-6 max-h-[calc(100vh-190px)] overflow-y-auto dark-scrollbar pr-1">
                    {activeEntry ? (
                        <div className="flex flex-col gap-6 animate-spring-zoom">
                            
                            {/* HUD Top Card Banner */}
                            <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                                {/* Spotlight background glow */}
                                <div className={`absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] opacity-10 pointer-events-none ${activeEntry.type === 'INWARD' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-xl border ${
                                        activeEntry.type === 'INWARD' 
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                    }`}>
                                        {activeEntry.type === 'INWARD' ? (
                                            <ArrowDownLeft className="w-8 h-8 animate-bounce" />
                                        ) : (
                                            <ArrowUpRight className="w-8 h-8 animate-bounce" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-xl md:text-2xl font-black text-white tracking-widest font-mono">{activeEntry.id}</span>
                                            <div className={`text-[10px] md:text-xs font-black px-3 py-1 rounded-lg border tracking-wider uppercase ${
                                                activeEntry.type === 'INWARD'
                                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                                            }`}>
                                                {activeEntry.type === 'INWARD' ? 'INWARD MATERIAL TRANSIT' : 'OUTWARD MATERIAL TRANSIT'}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-mono mt-1 uppercase">
                                            Registered Timestamp: {formatTimestamp(activeEntry.timestamp).date} @ {formatTimestamp(activeEntry.timestamp).time}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-950/60 border border-slate-800 px-4 py-2.5 rounded-xl font-mono text-right flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gate Clearance</span>
                                    <span className="text-emerald-400 font-black text-xs tracking-wider uppercase mt-0.5 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4.5 h-4.5" />
                                        SECURE PASS
                                    </span>
                                </div>
                            </div>

                            {/* Middle Grid: Photo Showcase & Material stock correlation */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                
                                {/* Photo Container Panel */}
                                <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl backdrop-blur-md min-h-[300px]">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                        Cargo Camera Capture
                                    </span>

                                    <div className="flex-1 bg-slate-950/80 border border-slate-850 rounded-xl relative overflow-hidden flex items-center justify-center group shadow-inner">
                                        {activeEntry.photoUrl ? (
                                            <img 
                                                src={activeEntry.photoUrl} 
                                                alt="Material Cargo" 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            /* Gorgeous Interactive Schematic Fallback SVG */
                                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-600 select-none">
                                                {activeEntry.type === 'INWARD' ? (
                                                    <svg className="w-36 h-36 opacity-30 text-emerald-400 animate-pulse" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <rect x="25" y="45" width="50" height="25" rx="3" strokeWidth="2"/>
                                                        <rect x="75" y="53" width="15" height="17" rx="2" strokeWidth="2"/>
                                                        <circle cx="37" cy="75" r="7" strokeWidth="2"/>
                                                        <circle cx="68" cy="75" r="7" strokeWidth="2"/>
                                                        <circle cx="83" cy="75" r="7" strokeWidth="2"/>
                                                        <path d="M75 53 L83 45 L92 45 L92 53" strokeWidth="2" strokeLinecap="round"/>
                                                        <path d="M10 50 L20 50 M15 45 L20 50 L15 55" strokeLinecap="round" strokeWidth="2"/>
                                                        <path d="M35 25 L50 40 M65 25 L50 40" strokeLinecap="round" strokeWidth="2" strokeDasharray="3 3"/>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-36 h-36 opacity-30 text-rose-400 animate-pulse" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <rect x="20" y="40" width="55" height="30" rx="3" strokeWidth="2"/>
                                                        <circle cx="35" cy="75" r="7" strokeWidth="2"/>
                                                        <circle cx="60" cy="75" r="7" strokeWidth="2"/>
                                                        <line x1="75" y1="45" x2="88" y2="45" strokeWidth="2" strokeLinecap="round"/>
                                                        <path d="M85 40 L92 45 L85 50" strokeLinecap="round" strokeWidth="2"/>
                                                        <rect x="30" y="22" width="12" height="18" strokeDasharray="2 2"/>
                                                        <rect x="47" y="15" width="15" height="25" strokeDasharray="2 2"/>
                                                    </svg>
                                                )}
                                                <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase mt-4 text-center">
                                                    NO CARGO PHOTO ATTACHED.<br/>
                                                    <span className="text-slate-600 font-bold">{activeEntry.type === 'INWARD' ? 'INCOMING SHIPMENT' : 'OUTGOING CARGO'} DIAGRAM</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Capture Details footer inside photo container */}
                                    <div className="mt-3 flex justify-between items-center text-[9px] font-mono text-slate-500">
                                        <span>DEVICE: HUB-CAM-01</span>
                                        <span>STATUS: READY</span>
                                    </div>
                                </div>

                                {/* Materials list & post-transit store stock calculation */}
                                <div className="md:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 md:p-5 flex flex-col shadow-xl backdrop-blur-md">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                        Transit Materials & Store Stock Correlation
                                    </span>

                                    <div className="flex-1 overflow-x-auto dark-scrollbar">
                                        <table className="w-full text-left border-collapse text-xs font-mono">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-slate-400 text-[10px] tracking-wider uppercase bg-slate-950/40">
                                                    <th className="py-2.5 px-3">Item Particulars</th>
                                                    <th className="py-2.5 px-3 text-center">Transit Qty</th>
                                                    <th className="py-2.5 px-3 text-right">Post-Transit Shop Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getTransitItems(activeEntry).map((item, index) => {
                                                    const stockItem = getItemStockDetails(item.name);
                                                    const isLowStock = stockItem && stockItem.currentStock <= stockItem.minThreshold;

                                                    return (
                                                        <tr key={index} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                                                            <td className="py-3 px-3">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-white uppercase text-[12px]">{item.name}</span>
                                                                    {item.hsnCode && item.hsnCode !== 'N/A' && (
                                                                        <span className="text-[9px] text-slate-500 mt-0.5">HSN: {item.hsnCode}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className="text-white font-extrabold text-sm tracking-wide">
                                                                    {item.quantity}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 ml-1 uppercase">{item.unit}</span>
                                                            </td>
                                                            <td className="py-3 px-3 text-right">
                                                                {stockItem ? (
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
                                                                            <span className={`text-[13px] font-black tracking-wide ${isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                                                {stockItem.currentStock}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400 uppercase">{stockItem.unit}</span>
                                                                        </div>
                                                                        {isLowStock ? (
                                                                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1 tracking-wider">
                                                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                                                Low Stock Alert (Min: {stockItem.minThreshold})
                                                                            </span>
                                                                        ) : (
                                                                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                                Stock Level Secure
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-end gap-0.5">
                                                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">NEW STORE ITEM</span>
                                                                        <span className="text-[9px] text-slate-500 max-w-[150px] text-right">Created post-transit in central directory.</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>

                            {/* Logistics & Personnel Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                
                                {/* Section 1: Carrier / Buyer Details */}
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4.5 flex flex-col gap-4 shadow-xl backdrop-blur-md">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
                                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                                        Logistics Carrier & Vendor
                                    </span>
                                    
                                    <div className="flex flex-col gap-3 font-mono">
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Principal Vendor / Client</label>
                                            <p className="text-sm font-black text-white uppercase truncate">{activeEntry.partyName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Carrier / Driver Name</label>
                                            <p className="text-xs font-bold text-slate-300 uppercase">{activeEntry.driverName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase font-black">License / Vehicle Number</label>
                                            {activeEntry.vehicleNumber ? (
                                                <div className="mt-1 inline-block bg-gradient-to-r from-amber-400 to-yellow-500 border border-slate-950 text-slate-950 font-bold px-3 py-1 rounded shadow-md tracking-widest text-xs select-none">
                                                    {activeEntry.vehicleNumber.toUpperCase()}
                                                </div>
                                            ) : (
                                                <p className="text-xs font-bold text-slate-500">N/A</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Gate Operators & Personnel */}
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4.5 flex flex-col gap-4 shadow-xl backdrop-blur-md">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
                                        <User className="w-3.5 h-3.5 text-emerald-400" />
                                        Authorized Personnel
                                    </span>

                                    <div className="flex flex-col gap-3 font-mono">
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Transit Action By</label>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                                                    <UserCheck className="w-3 h-3 text-emerald-400" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-300 uppercase">{activeEntry.employeeName || 'System'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Authorized Supervisor</label>
                                            <p className="text-xs font-bold text-slate-300 uppercase">{activeEntry.supervisorName || 'System Verified'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Security Protocol status</label>
                                            <p className="text-[10px] text-emerald-400 font-extrabold uppercase mt-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> SECURE CHECKPOINT PASSED
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Reference Credentials */}
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4.5 flex flex-col gap-4 shadow-xl backdrop-blur-md">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
                                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                        Reference Credentials
                                    </span>

                                    <div className="flex flex-col gap-3 font-mono">
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Slip / Invoice Number</label>
                                            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">{activeEntry.invoiceNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Gate Pass Number</label>
                                            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">{activeEntry.gatePassNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Transit Dispatch Method</label>
                                            <p className="text-xs font-bold text-slate-300 uppercase">{activeEntry.deliveryType || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Full width Usage Purpose Remarks Card */}
                            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-2.5 shadow-xl backdrop-blur-md">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">MOVEMENT REMARKS & INTENDED PURPOSE</span>
                                <div className="bg-slate-950/60 border border-slate-800/50 p-4 rounded-xl relative shadow-inner">
                                    <p className="text-sm font-medium italic text-slate-300 leading-relaxed uppercase">
                                        "{activeEntry.remarks || 'No remarks recorded for this gate movement.'}"
                                    </p>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 p-12 glass-card rounded-2xl min-h-[400px]">
                            <Activity className="w-16 h-16 opacity-10 mb-4 text-emerald-400 animate-pulse" />
                            <span className="text-sm font-mono tracking-wider uppercase font-bold text-slate-400">WAITING FOR GATE ACTIVITY...</span>
                            <p className="text-xs font-mono text-slate-500 mt-1 max-w-sm text-center">
                                Connect gate entry form or submit a new transit entry. The monitor HUD will automatically display movement and stock details.
                            </p>
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
};

export default GateDisplayScreen;

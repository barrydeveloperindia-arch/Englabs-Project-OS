import React, { useState, useEffect } from 'react';
import { 
    Archive, Download, Calendar, Upload, Search, Share2, Layers, Clock, AlertCircle, FileText
} from 'lucide-react';
import { InventoryArchive, fetchInventoryArchives, saveInventoryArchive } from '../lib/inventory_archive_service';

const InventoryArchiveSystem: React.FC = () => {
    const [archives, setArchives] = useState<InventoryArchive[]>([]);
    const [selectedArchive, setSelectedArchive] = useState<InventoryArchive | null>(null);
    const [selectedRack, setSelectedRack] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadArchives();
    }, []);

    const loadArchives = async () => {
        setIsLoading(true);
        const data = await fetchInventoryArchives();
        setArchives(data);
        if (data.length > 0) {
            setSelectedArchive(data[0]);
        }
        setIsLoading(false);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const json = JSON.parse(text);
                
                // Handle different JSON structures
                let items = [];
                if (Array.isArray(json)) {
                    if (json[0]?.items) items = json[0].items; // englabs legacy structure
                    else items = json;
                } else if (json.items) {
                    items = json.items;
                }

                if (items.length === 0) throw new Error("No items found in uploaded file.");

                const result = await saveInventoryArchive(items);
                if (result.success) {
                    alert("Inventory Archive Saved Successfully!");
                    loadArchives();
                } else {
                    alert("Failed to save archive.");
                }
            } catch (err) {
                alert("Invalid JSON file format. Please upload a valid inventory export.");
                console.error(err);
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleAutoMigrate = async () => {
        setIsUploading(true);
        try {
            // Fetch the local JSON file dynamically
            const response = await fetch('/src/data/master_inventory_may_2026.json');
            if (!response.ok) {
                // Try alternate path if using Vite
                const dataModule = await import('../../data/master_inventory_may_2026.json');
                const json = dataModule.default;
                const items = Array.isArray(json) && json[0]?.items ? json[0].items : json;
                
                const result = await saveInventoryArchive(items);
                if (result.success) {
                    alert("Legacy Data Successfully Migrated to Firebase!");
                    loadArchives();
                }
                return;
            }
            const json = await response.json();
            let items = [];
            if (Array.isArray(json)) {
                if (json[0]?.items) items = json[0].items;
                else items = json;
            } else if (json.items) {
                items = json.items;
            }
            const result = await saveInventoryArchive(items);
            if (result.success) {
                alert("Legacy Data Successfully Migrated to Firebase!");
                loadArchives();
            }
        } catch (e) {
            console.error(e);
            alert("Failed to auto-migrate. Please use the Upload button.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleExportExcel = () => {
        if (!selectedArchive) return;
        
        // Simple CSV generation
        const headers = ["Rack Location", "Item Code", "Item Name", "Category", "Quantity", "Unit", "Status"];
        const rows = [];
        rows.push(headers.join(','));

        const racksToExport = selectedRack === 'ALL' 
            ? Object.keys(selectedArchive.racks) 
            : [selectedRack];

        racksToExport.forEach(rackName => {
            const items = selectedArchive.racks[rackName] || [];
            items.forEach(item => {
                rows.push([
                    `"${item.location}"`,
                    `"${item.itemCode}"`,
                    `"${item.itemName}"`,
                    `"${item.category || 'General'}"`,
                    item.quantity,
                    `"${item.unit}"`,
                    `"${item.stockStatus}"`
                ].join(','));
            });
        });

        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Inventory_Archive_${selectedArchive.date}_${selectedRack.replace(/\s+/g, '_')}.csv`;
        link.click();
    };

    const handleWhatsAppShare = () => {
        if (!selectedArchive) return;
        
        let text = `*Inventory Archive Report*\n📅 Date: ${selectedArchive.date}\n⏰ Time: ${selectedArchive.time}\n\n`;
        
        const racksToExport = selectedRack === 'ALL' 
            ? Object.keys(selectedArchive.racks) 
            : [selectedRack];

        racksToExport.forEach(rackName => {
            const items = selectedArchive.racks[rackName] || [];
            text += `*${rackName}* (${items.length} items)\n`;
            items.slice(0, 5).forEach(item => {
                text += `- ${item.itemName}: ${item.quantity} ${item.unit}\n`;
            });
            if (items.length > 5) text += `- ...and ${items.length - 5} more.\n`;
            text += `\n`;
        });

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    if (isLoading) return <div className="p-10 text-center">Loading Historical Archives...</div>;

    const availableRacks = selectedArchive ? Object.keys(selectedArchive.racks).sort() : [];
    
    // Filter Items
    let displayItems: any[] = [];
    if (selectedArchive) {
        const racksToExport = selectedRack === 'ALL' 
            ? Object.keys(selectedArchive.racks) 
            : [selectedRack];
            
        racksToExport.forEach(r => {
            const items = selectedArchive.racks[r] || [];
            items.forEach(i => displayItems.push({...i, _rack: r}));
        });
    }

    if (searchQuery) {
        displayItems = displayItems.filter(i => i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || i.itemCode.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
            <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-slate-900 leading-none">Time Machine Archive</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Date-Wise & Rack-Wise Storage</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {archives.length === 0 && (
                        <button onClick={handleAutoMigrate} disabled={isUploading} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
                            Migrate Legacy Data
                        </button>
                    )}
                    <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg">
                        {isUploading ? <Clock className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isUploading ? 'Saving Archive...' : 'Upload New Snapshot'}
                        <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar flex gap-8">
                {/* SIDEBAR: DATE SELECTOR */}
                <div className="w-72 flex flex-col gap-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Timeline History
                    </h3>
                    
                    <div className="flex flex-col gap-3">
                        {archives.length === 0 && <p className="text-xs text-slate-400">No archives found.</p>}
                        {archives.map(arch => (
                            <button 
                                key={arch.id}
                                onClick={() => { setSelectedArchive(arch); setSelectedRack('ALL'); }}
                                className={`p-4 text-left rounded-2xl border transition-all ${selectedArchive?.id === arch.id ? 'bg-emerald-50 border-emerald-200 shadow-md shadow-emerald-500/10' : 'bg-white border-slate-100 hover:border-emerald-200'}`}
                            >
                                <p className="font-black text-slate-900">{new Date(arch.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{arch.time} • {arch.totalItems} Items</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* MAIN CONTENT: ARCHIVE VIEWER */}
                {selectedArchive && (
                    <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
                        {/* VIEWER HEADER */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                    <Archive className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Snapshot: {new Date(selectedArchive.timestamp).toLocaleDateString('en-GB')}</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        ID: {selectedArchive.id} • {selectedArchive.totalRacks} Racks Recorded
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button onClick={handleWhatsAppShare} className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-[#25D366]/30">
                                    <Share2 className="w-4 h-4" /> WhatsApp
                                </button>
                                <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-emerald-200">
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                            </div>
                        </div>

                        {/* FILTER BAR */}
                        <div className="p-6 border-b border-slate-100 flex gap-4 bg-white">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search items in this snapshot..." 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-xs font-bold focus:border-emerald-500 outline-none"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="relative min-w-[200px]">
                                <select 
                                    value={selectedRack}
                                    onChange={e => setSelectedRack(e.target.value)}
                                    className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl py-3 pl-4 pr-10 text-xs font-black uppercase tracking-widest text-slate-600 focus:border-emerald-500 outline-none"
                                >
                                    <option value="ALL">All Racks</option>
                                    {availableRacks.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* RACK-WISE TABLE */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                        <th className="pb-4 px-4">Rack / Location</th>
                                        <th className="pb-4 px-4">Item Identity</th>
                                        <th className="pb-4 px-4">Category</th>
                                        <th className="pb-4 px-4 text-right">Saved Qty</th>
                                        <th className="pb-4 px-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {displayItems.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-white transition-all">
                                            <td className="py-4 px-4">
                                                <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2.5 py-1 rounded-md tracking-widest uppercase">
                                                    {item._rack}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="font-black text-slate-900 text-sm">{item.itemName}</p>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{item.itemCode}</p>
                                            </td>
                                            <td className="py-4 px-4 font-black text-[10px] text-slate-500 uppercase tracking-widest">
                                                {item.category || 'General'}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <span className="font-black text-slate-900 text-lg tracking-tighter">{item.quantity}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase ml-1">{item.unit}</span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${item.stockStatus === 'Secure' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {item.stockStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayItems.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                No items found matching the criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InventoryArchiveSystem;

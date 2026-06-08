import React, { useState, useEffect, useRef } from 'react';
import { 
    FileText, 
    Download, 
    Share2, 
    Search, 
    Filter, 
    MoreVertical, 
    Trash2, 
    Edit3, 
    Plus, 
    RefreshCcw,
    Folder,
    File,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Clock,
    Printer,
    X,
    Package,
    Camera,
    Upload,
    Video,
    TrendingUp,
    AlertTriangle,
    MinusCircle,
    Calendar,
    ArrowDownCircle,
    ArrowUpCircle,
    User
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { InventoryItem, StockTransaction } from '../lib/gate_system';
import { 
    fetchCurrentStock, 
    fetchMasterRegister, 
    fetchMonthlyRegister, 
    updateInventoryItemStock, 
    deleteInventoryItem, 
    addInventoryItem, 
    recordManualTransaction,
    MasterRegisterEntry,
    CurrentStockItem,
    getEstimatedPrice
} from '../lib/inventory_service';
import logo from '../assets/englabs_logo.png';
import { STAFF_ROSTER } from '../lib/constants';
import AddStaffModal from './AddStaffModal';

interface StoreStockReportProps {
    userRole?: 'ADMIN' | 'STAFF';
    projects?: any[];
    staffList?: string[];
    onAddStaff?: (name: string) => void;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const StoreStockReport: React.FC<StoreStockReportProps> = ({ 
    userRole = 'ADMIN', 
    projects = [],
    staffList: propStaffList,
    onAddStaff
}) => {
    // View state: 'DASHBOARD' | 'MASTER' | 'CURRENT_STOCK' | 'MONTHLY'
    const [view, setView] = useState<'DASHBOARD' | 'MASTER' | 'CURRENT_STOCK' | 'MONTHLY'>('DASHBOARD');
    
    // Roster and Staff Name states
    const [localStaffList, setLocalStaffList] = useState<string[]>(() => {
        if (propStaffList) return propStaffList;
        try {
            const stored = localStorage.getItem('englabs_staff_members');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return Array.from(new Set([...STAFF_ROSTER, ...parsed]));
                }
            }
        } catch (e) {
            console.error("Failed to load staff list:", e);
        }
        return STAFF_ROSTER;
    });
    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);

    useEffect(() => {
        if (propStaffList) {
            setLocalStaffList(propStaffList);
        }
    }, [propStaffList]);

    const handleAddStaffInternal = (newStaffName: string) => {
        if (onAddStaff) {
            onAddStaff(newStaffName);
        } else {
            setLocalStaffList(prev => {
                const updated = [...prev, newStaffName];
                localStorage.setItem('englabs_staff_members', JSON.stringify(updated));
                return updated;
            });
        }
    };

    // Live Database States
    const [currentStock, setCurrentStock] = useState<CurrentStockItem[]>([]);
    const [masterTransactions, setMasterTransactions] = useState<MasterRegisterEntry[]>([]);
    const [monthlyTransactions, setMonthlyTransactions] = useState<MasterRegisterEntry[]>([]);
    
    // Filters and Search
    const [searchQuery, setSearchQuery] = useState("");
    const [masterMonthFilter, setMasterMonthFilter] = useState<string>("All"); // "All", "January", ...
    const [monthlyViewMonth, setMonthlyViewMonth] = useState<string>(MONTH_NAMES[new Date().getMonth()]);
    
    // UI state loaders
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // manual transactions configurations
    const [isCheckOutOnly, setIsCheckOutOnly] = useState(false);
    const [isCheckInOnly, setIsCheckInOnly] = useState(false);
    const [selectedItemCode, setSelectedItemCode] = useState<string>('');
    const [txItemSearchText, setTxItemSearchText] = useState<string>('');
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
    const [activeSearchIndex, setActiveSearchIndex] = useState<number>(0);
    const [selectedUnit, setSelectedUnit] = useState<string>('Pcs');
    const [selectedProjectTx, setSelectedProjectTx] = useState<string>('');
    const [checkoutPhoto, setCheckoutPhoto] = useState<string>('');
    
    // Success state for transaction modal
    const [isTxSuccess, setIsTxSuccess] = useState(false);
    const [txSuccessDetails, setTxSuccessDetails] = useState<{
        materialName: string;
        itemCode: string;
        quantity: number;
        unit: string;
        type: 'INWARD' | 'OUTWARD';
        staffName: string;
        remarks: string;
        projectId: string;
        photoUrl?: string;
    } | null>(null);

    const handleCloseTxModal = () => {
        setIsTxModalOpen(false);
        setIsCheckOutOnly(false);
        setIsCheckInOnly(false);
        setSelectedItemCode('');
        setTxItemSearchText('');
        setSelectedUnit('Pcs');
        setSelectedProjectTx('');
        setCheckoutPhoto('');
        setIsTxSuccess(false);
        setTxSuccessDetails(null);
    };

    // Add Item Modal states
    const [addItemCode, setAddItemCode] = useState<string>('');
    const [addItemCodeMode, setAddItemCodeMode] = useState<'SELECT' | 'CUSTOM'>('SELECT');
    const [addCategory, setAddCategory] = useState<string>('');
    const [addCategoryMode, setAddCategoryMode] = useState<'SELECT' | 'CUSTOM'>('SELECT');
    const [addLocation, setAddLocation] = useState<string>('');
    const [addLocationMode, setAddLocationMode] = useState<'SELECT' | 'CUSTOM'>('SELECT');
    const [addUnit, setAddUnit] = useState<string>('Pcs');
    const [newItemPhoto, setNewItemPhoto] = useState<string>('');
    
    const comboboxRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const webcamStreamRef = useRef<MediaStream | null>(null);
    const [webcamTarget, setWebcamTarget] = useState<'NEW_ITEM' | 'EDIT_ITEM' | 'TRANSIT' | null>(null);
    const [modalConfig, setModalConfig] = useState<{ type: 'ITEM' | 'DELETE', data: any } | null>(null);
    const [editItemPhoto, setEditItemPhoto] = useState<string>('');

    // Fetch and sync data
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                // Fetch Current Stock
                const stock = await fetchCurrentStock();
                setCurrentStock(stock);

                // Fetch Master Register
                const master = await fetchMasterRegister();
                setMasterTransactions(master);

                // Fetch Monthly Register for the selected monthly view month
                const monthly = await fetchMonthlyRegister(monthlyViewMonth);
                setMonthlyTransactions(monthly);
            } catch (err) {
                console.error("Error loading register data:", err);
                
                // Offline Local Fallbacks
                const localMasterSaved = localStorage.getItem('local_master_register');
                if (localMasterSaved) {
                    setMasterTransactions(JSON.parse(localMasterSaved));
                }
                const localCurrentStockSaved = localStorage.getItem('local_current_stock');
                if (localCurrentStockSaved) {
                    setCurrentStock(Object.values(JSON.parse(localCurrentStockSaved)));
                }
                const localMonthlySaved = localStorage.getItem('local_monthly_registers');
                if (localMonthlySaved) {
                    const parsed = JSON.parse(localMonthlySaved);
                    setMonthlyTransactions(parsed[monthlyViewMonth] || []);
                }
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [refreshTrigger, monthlyViewMonth]);

    // Setup project lists
    const DEFAULT_PROJECT_IDS = ['C2718', 'C2737', 'C2931', 'C3020', 'C4867', 'C5178', 'C5191', 'C5192', 'C5193', 'C5195', 'C5197', 'C5198', 'C5207', 'C5209', 'C5210', 'C5212', 'C5213', 'C5216', 'C5223', 'C5224', 'C5227', 'C5228', 'C5229'];
    const projectList = (projects && projects.length > 0)
        ? projects.map((p: any) => p.projectId)
        : DEFAULT_PROJECT_IDS;

    // Webcam integration
    const startWebcam = async (target: 'NEW_ITEM' | 'EDIT_ITEM' | 'TRANSIT') => {
        try {
            if (webcamStreamRef.current) {
                webcamStreamRef.current.getTracks().forEach(track => track.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            webcamStreamRef.current = stream;
            setWebcamTarget(target);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 50);
        } catch (err) {
            console.error("Camera access error:", err);
            alert("Could not access camera. Please check camera permissions.");
        }
    };

    const stopWebcam = () => {
        if (webcamStreamRef.current) {
            webcamStreamRef.current.getTracks().forEach(track => track.stop());
            webcamStreamRef.current = null;
        }
        setWebcamTarget(null);
    };

    const capturePhoto = (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!webcamTarget) return;
        try {
            if (!videoRef.current) return;
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            const width = video.videoWidth || video.clientWidth || 640;
            const height = video.videoHeight || video.clientHeight || 480;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                if (webcamTarget === 'NEW_ITEM') {
                    setNewItemPhoto(dataUrl);
                } else if (webcamTarget === 'EDIT_ITEM') {
                    setEditItemPhoto(dataUrl);
                } else if (webcamTarget === 'TRANSIT') {
                    setCheckoutPhoto(dataUrl);
                }
                stopWebcam();
            }
        } catch (err) {
            console.error("Webcam capture error:", err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
                setIsSearchDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isTxModalOpen) {
            setTxItemSearchText('');
            setIsSearchDropdownOpen(false);
            setActiveSearchIndex(0);
        }
    }, [isTxModalOpen]);

    useEffect(() => {
        if (!isAddModalOpen && !isTxModalOpen && !modalConfig) {
            stopWebcam();
        }
    }, [isAddModalOpen, isTxModalOpen, modalConfig]);

    const openAddModal = () => {
        setAddItemCode('');
        setAddCategory('');
        setAddLocation('');
        setAddUnit('Pcs');
        setAddItemCodeMode('SELECT');
        setAddCategoryMode('SELECT');
        setAddLocationMode('SELECT');
        setNewItemPhoto('');
        setIsAddModalOpen(true);
    };

    // Auto-calculates for dashboard statistics
    const statsTotalStockValue = currentStock.reduce((sum, item) => {
        const price = item.unitPrice || getEstimatedPrice(item.category || '');
        return sum + (item.availableStock * price);
    }, 0);

    const currentMonthName = MONTH_NAMES[new Date().getMonth()];
    const statsTotalMaterialIssuedThisMonth = masterTransactions
        .filter(tx => {
            if (tx.type !== 'OUTWARD') return false;
            const txDate = new Date(tx.timestamp);
            return MONTH_NAMES[txDate.getMonth()] === currentMonthName && txDate.getFullYear() === new Date().getFullYear();
        })
        .reduce((sum, tx) => sum + tx.quantity, 0);

    // Compute most used material based on total outward quantity
    const materialOutwardCounts: Record<string, number> = {};
    masterTransactions.forEach(tx => {
        if (tx.type === 'OUTWARD') {
            materialOutwardCounts[tx.materialName] = (materialOutwardCounts[tx.materialName] || 0) + tx.quantity;
        }
    });
    let mostUsedMaterialName = "None";
    let maxOutwardQty = 0;
    Object.entries(materialOutwardCounts).forEach(([name, qty]) => {
        if (qty > maxOutwardQty) {
            maxOutwardQty = qty;
            mostUsedMaterialName = name;
        }
    });

    const statsLowStockAlertCount = currentStock.filter(i => i.availableStock > 0 && i.availableStock <= (i.minThreshold || 5)).length;
    const statsOutOfStockAlertCount = currentStock.filter(i => i.availableStock === 0).length;

    // Excel Export implementation
    const handleExportExcel = () => {
        let sheetName = "";
        let dataList: any[] = [];
        
        if (view === 'MASTER') {
            sheetName = "Master Register";
            const filtered = masterTransactions.filter(tx => {
                const matchesSearch = tx.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tx.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tx.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (tx.projectId && tx.projectId.toLowerCase().includes(searchQuery.toLowerCase()));
                if (!matchesSearch) return false;
                if (masterMonthFilter !== 'All') {
                    return MONTH_NAMES[new Date(tx.timestamp).getMonth()] === masterMonthFilter;
                }
                return true;
            });
            dataList = filtered.map((tx, idx) => ({
                'Sr No.': idx + 1,
                'Timestamp': new Date(tx.timestamp).toLocaleString(),
                'Project ID': tx.projectId,
                'Material Code': tx.itemCode,
                'Material Name': tx.materialName,
                'Category': tx.category,
                'Flow Type': tx.type,
                'Quantity': tx.quantity,
                'Unit': tx.unit,
                'Staff / Operator': tx.staffName,
                'Issued By': tx.issuedBy,
                'Running Stock Balance': tx.balanceStockAfterIssue,
                'Remarks': tx.remarks
            }));
        } else if (view === 'CURRENT_STOCK') {
            sheetName = "Current Stock";
            const filtered = currentStock.filter(i => {
                return i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    i.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    i.category.toLowerCase().includes(searchQuery.toLowerCase());
            });
            dataList = filtered.map((item, idx) => ({
                'Sr No.': idx + 1,
                'Material Code': item.itemCode,
                'Material Name': item.name,
                'Category': item.category,
                'Opening Stock': item.openingStock,
                'Total Inward': item.totalInward,
                'Total Outward': item.totalOutward,
                'Available Stock': item.availableStock,
                'Unit': item.unit,
                'Estimated Unit Price (INR)': item.unitPrice || getEstimatedPrice(item.category),
                'Total Value (INR)': item.availableStock * (item.unitPrice || getEstimatedPrice(item.category)),
                'Last Updated': new Date(item.lastUpdated).toLocaleString()
            }));
        } else if (view === 'MONTHLY') {
            sheetName = `${monthlyViewMonth} Register`;
            const filtered = monthlyTransactions.filter(tx => {
                return tx.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tx.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tx.staffName.toLowerCase().includes(searchQuery.toLowerCase());
            });
            dataList = filtered.map((tx, idx) => ({
                'Sr No.': idx + 1,
                'Timestamp': new Date(tx.timestamp).toLocaleString(),
                'Project ID': tx.projectId,
                'Material Code': tx.itemCode,
                'Material Name': tx.materialName,
                'Category': tx.category,
                'Flow Type': tx.type,
                'Quantity': tx.quantity,
                'Unit': tx.unit,
                'Staff / Operator': tx.staffName,
                'Issued By': tx.issuedBy,
                'Running Stock Balance': tx.balanceStockAfterIssue,
                'Remarks': tx.remarks
            }));
        } else {
            alert("Please select a Register tab to export.");
            return;
        }

        if (dataList.length === 0) {
            alert("No data available to export.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(dataList);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `ENGLABS_Store_${sheetName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // PDF printing
    const handleExportPDF = () => {
        window.print();
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC] print:bg-white print:block">
            {/* TOP BAR */}
            <header className="h-auto md:h-20 bg-white border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-10 py-4 md:py-0 shrink-0 gap-4 md:gap-0 print:hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full md:w-auto">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-slate-900 leading-none">Store Stock Registry</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Forensic Inventory Management & Audit</span>
                    </div>
                    <div className="hidden md:block h-8 w-px bg-slate-100"></div>
                    <nav className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                        <button onClick={() => setView('DASHBOARD')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'DASHBOARD' ? 'bg-[#0e4368] text-white shadow-md shadow-[#0e4368]/20' : 'text-slate-500 hover:text-slate-800'}`}>Dashboard</button>
                        <button onClick={() => setView('MASTER')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'MASTER' ? 'bg-[#0e4368] text-white shadow-md shadow-[#0e4368]/20' : 'text-slate-500 hover:text-slate-800'}`}>Master Register</button>
                        <button onClick={() => setView('CURRENT_STOCK')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'CURRENT_STOCK' ? 'bg-[#0e4368] text-white shadow-md shadow-[#0e4368]/20' : 'text-slate-500 hover:text-slate-800'}`}>Current Stock</button>
                        <button onClick={() => setView('MONTHLY')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'MONTHLY' ? 'bg-[#0e4368] text-white shadow-md shadow-[#0e4368]/20' : 'text-slate-500 hover:text-slate-800'}`}>Monthly Registers</button>
                    </nav>
                </div>
                
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                    {view !== 'DASHBOARD' && (
                        <div className="relative w-full md:w-48 flex-1 md:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="w-full bg-slate-50 border border-slate-100 rounded-lg py-1.5 pl-9 pr-3 text-[11px] font-bold focus:border-indigo-500 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="flex gap-2">
                        {userRole === 'ADMIN' && (
                            <>
                                <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10">
                                    <Plus className="w-3.5 h-3.5" /> Add Material
                                </button>
                                <button onClick={() => { setSelectedItemCode(''); setIsCheckOutOnly(false); setIsCheckInOnly(true); setIsTxModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-[#0e4368] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0b3350] transition-all shadow-md shadow-[#0e4368]/10">
                                    <Plus className="w-3.5 h-3.5" /> Check In
                                </button>
                            </>
                        )}
                        <button onClick={() => { setSelectedItemCode(''); setIsCheckOutOnly(true); setIsCheckInOnly(false); setIsTxModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md shadow-amber-600/10">
                            <Plus className="w-3.5 h-3.5" /> Check Out
                        </button>
                        {view !== 'DASHBOARD' && (
                            <>
                                <button onClick={handleExportExcel} className="p-2 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm" title="Export Excel">
                                    <Download className="w-4 h-4" />
                                </button>
                                <button onClick={handleExportPDF} className="p-2 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm" title="Export PDF">
                                    <Printer className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        <button onClick={() => setRefreshTrigger(p => p + 1)} className="p-2 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm" title="Refresh">
                            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar print:overflow-visible print:p-0 print:block">
                {/* 1. DASHBOARD VIEW */}
                {view === 'DASHBOARD' && (
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 print:hidden">
                        {/* Summary Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Stock Value</span>
                                    <h3 className="text-xl font-black text-slate-900">₹{statsTotalStockValue.toLocaleString('en-IN')}</h3>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
                            </div>
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Issued This Month</span>
                                    <h3 className="text-xl font-black text-slate-900">{statsTotalMaterialIssuedThisMonth} Units</h3>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><TrendingUp className="w-5 h-5" /></div>
                            </div>
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Most Used Material</span>
                                    <h3 className="text-xs font-black text-slate-900 truncate max-w-[140px]" title={mostUsedMaterialName}>{mostUsedMaterialName}</h3>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><Package className="w-5 h-5" /></div>
                            </div>
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Low Stock Alert</span>
                                    <h3 className="text-xl font-black text-amber-600">{statsLowStockAlertCount} Items</h3>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><AlertTriangle className="w-5 h-5" /></div>
                            </div>
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Out of Stock Alert</span>
                                    <h3 className="text-xl font-black text-rose-600">{statsOutOfStockAlertCount} Items</h3>
                                </div>
                                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><MinusCircle className="w-5 h-5" /></div>
                            </div>
                        </div>

                        {/* Split Panels: Low Stock & Out of Stock */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Out of Stock panel */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 text-rose-600 flex items-center gap-2">
                                    <MinusCircle className="w-4 h-4" /> Out of Stock Alerts ({statsOutOfStockAlertCount})
                                </h3>
                                <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                                    {currentStock.filter(i => i.availableStock === 0).length === 0 ? (
                                        <p className="text-slate-400 text-xs py-8 text-center font-bold">No out of stock items. Stock levels normal.</p>
                                    ) : (
                                        currentStock.filter(i => i.availableStock === 0).map(item => (
                                            <div key={item.itemCode} className="py-3 flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="font-bold text-slate-900 block">{item.name}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.itemCode} • {item.category}</span>
                                                </div>
                                                <span className="px-2 py-1 bg-rose-50 text-rose-600 font-black rounded-lg text-[9px] uppercase">Reorder Immediately</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Low Stock panel */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 text-amber-600 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Low Stock Alerts ({statsLowStockAlertCount})
                                </h3>
                                <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                                    {currentStock.filter(i => i.availableStock > 0 && i.availableStock <= (i.minThreshold || 5)).length === 0 ? (
                                        <p className="text-slate-400 text-xs py-8 text-center font-bold">No low stock items. All items well stocked.</p>
                                    ) : (
                                        currentStock.filter(i => i.availableStock > 0 && i.availableStock <= (i.minThreshold || 5)).map(item => (
                                            <div key={item.itemCode} className="py-3 flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="font-bold text-slate-900 block">{item.name}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.itemCode} • {item.category}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black text-slate-700 block">{item.availableStock} {item.unit} left</span>
                                                    <span className="text-[9px] text-slate-400 block font-bold">Threshold: {item.minThreshold || 5}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions List */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" /> Recent Material Check-Outs & Transits
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/50">
                                            <th className="py-3 px-4">Date & Time</th>
                                            <th className="py-3 px-4">Flow</th>
                                            <th className="py-3 px-4">Material</th>
                                            <th className="py-3 px-4 text-center">Qty</th>
                                            <th className="py-3 px-4">Project</th>
                                            <th className="py-3 px-4">Operator / Staff</th>
                                            <th className="py-3 px-4">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {masterTransactions.slice(0, 5).map(tx => (
                                            <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="py-3 px-4 text-slate-500 font-medium">{new Date(tx.timestamp).toLocaleString('en-IN')}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${tx.type === 'INWARD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                        {tx.type === 'INWARD' ? 'Check-In' : 'Check-Out'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-slate-900 block">{tx.materialName}</span>
                                                    <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase block">{tx.itemCode}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-black text-slate-700">{tx.quantity} {tx.unit}</td>
                                                <td className="py-3 px-4 font-bold text-slate-700 uppercase">{tx.projectId}</td>
                                                <td className="py-3 px-4 text-slate-600 font-medium">{tx.staffName}</td>
                                                <td className="py-3 px-4 text-slate-400 italic truncate max-w-[150px]">{tx.remarks}</td>
                                            </tr>
                                        ))}
                                        {masterTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">No transactions logged.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. MASTER REGISTER VIEW */}
                {view === 'MASTER' && (
                    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 print:block">
                        {/* Month Selector Tabs for Master Register */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm print:hidden">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Filter Master Register By Month</span>
                            <div className="flex flex-wrap gap-1.5">
                                <button onClick={() => setMasterMonthFilter('All')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${masterMonthFilter === 'All' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>All Months</button>
                                {MONTH_NAMES.map(month => (
                                    <button key={month} onClick={() => setMasterMonthFilter(month)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${masterMonthFilter === month ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{month.substring(0, 3)}</button>
                                ))}
                            </div>
                        </div>

                        {/* Transaction Table */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8 print:p-0 print:border-none print:shadow-none">
                            <div className="flex justify-between items-center mb-6 print:hidden">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Master Stock Registry Table</h3>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-1">Financial Year {new Date().getFullYear()} - Monthly Filter: {masterMonthFilter}</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                                    <thead>
                                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50 print:bg-slate-100">
                                            <th className="py-4 px-4">Date & Time</th>
                                            <th className="py-4 px-4">Project Name</th>
                                            <th className="py-4 px-4">Material Name</th>
                                            <th className="py-4 px-4 text-center">Flow Type</th>
                                            <th className="py-4 px-4 text-center">Qty Issued</th>
                                            <th className="py-4 px-4">Unit</th>
                                            <th className="py-4 px-4">Staff Name</th>
                                            <th className="py-4 px-4">Issued By</th>
                                            <th className="py-4 px-4 text-center">Balance Stock</th>
                                            <th className="py-4 px-4">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {masterTransactions
                                            .filter(tx => {
                                                const matchesSearch = tx.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    tx.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    tx.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    tx.projectId.toLowerCase().includes(searchQuery.toLowerCase());
                                                if (!matchesSearch) return false;
                                                if (masterMonthFilter !== 'All') {
                                                    const txDate = new Date(tx.timestamp);
                                                    return MONTH_NAMES[txDate.getMonth()] === masterMonthFilter;
                                                }
                                                return true;
                                            })
                                            .map(tx => (
                                                <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="py-4 px-4 text-slate-500 font-medium">{new Date(tx.timestamp).toLocaleString('en-IN')}</td>
                                                    <td className="py-4 px-4 font-bold text-slate-700 uppercase">{tx.projectId}</td>
                                                    <td className="py-4 px-4">
                                                        <span className="font-bold text-slate-900 block">{tx.materialName}</span>
                                                        <span className="text-[9px] text-slate-400 font-black block tracking-wider uppercase">{tx.itemCode}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase ${
                                                            tx.type === 'INWARD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                        }`}>
                                                            {tx.type === 'INWARD' ? 'INWARD' : 'OUTWARD'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-black text-slate-700">{tx.quantity}</td>
                                                    <td className="py-4 px-4 font-bold text-slate-500 uppercase">{tx.unit}</td>
                                                    <td className="py-4 px-4 text-slate-600 font-medium">{tx.staffName}</td>
                                                    <td className="py-4 px-4 text-slate-500 font-medium">{tx.issuedBy}</td>
                                                    <td className="py-4 px-4 text-center font-black text-slate-900 bg-slate-50/30">{tx.balanceStockAfterIssue}</td>
                                                    <td className="py-4 px-4 text-slate-400 italic">{tx.remarks}</td>
                                                </tr>
                                            ))}
                                        {masterTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={10} className="py-10 text-center text-slate-400 font-bold">No entries found for the selected criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. CURRENT STOCK REGISTER VIEW */}
                {view === 'CURRENT_STOCK' && (
                    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 print:block">
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8 print:p-0 print:border-none print:shadow-none">
                            <div className="flex justify-between items-center mb-6 print:hidden">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Current Available Stock Register</h3>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-1">Live stock aggregates compiled from Firestore</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                                    <thead>
                                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50 print:bg-slate-100">
                                            <th className="py-4 px-4">Material Code</th>
                                            <th className="py-4 px-4">Material Name</th>
                                            <th className="py-4 px-4">Category</th>
                                            <th className="py-4 px-4 text-center">Opening Stock</th>
                                            <th className="py-4 px-4 text-center">Total Inward</th>
                                            <th className="py-4 px-4 text-center">Total Outward</th>
                                            <th className="py-4 px-4 text-center">Available Stock</th>
                                            <th className="py-4 px-4">Unit</th>
                                            <th className="py-4 px-4">Estimated Unit Price</th>
                                            <th className="py-4 px-4">Total Stock Value</th>
                                            <th className="py-4 px-4">Last Updated Date</th>
                                            {userRole === 'ADMIN' && <th className="py-4 px-4 text-right print:hidden">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {currentStock
                                            .filter(item => {
                                                return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    item.category.toLowerCase().includes(searchQuery.toLowerCase());
                                            })
                                            .map(item => {
                                                const price = item.unitPrice || getEstimatedPrice(item.category || '');
                                                const totalVal = item.availableStock * price;
                                                const isLowStock = item.availableStock > 0 && item.availableStock <= (item.minThreshold || 5);
                                                const isOutOfStock = item.availableStock === 0;
                                                
                                                return (
                                                    <tr key={item.itemCode} className={`hover:bg-slate-50/30 transition-colors ${isOutOfStock ? 'bg-rose-50/10' : isLowStock ? 'bg-amber-50/10' : ''}`}>
                                                        <td className="py-4 px-4 font-black text-slate-900">{item.itemCode}</td>
                                                        <td className="py-4 px-4">
                                                            <span className="font-bold text-slate-900 block">{item.name}</span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold uppercase">{item.category}</span>
                                                        </td>
                                                        <td className="py-4 px-4 text-center text-slate-500 font-medium">{item.openingStock}</td>
                                                        <td className="py-4 px-4 text-center text-emerald-600 font-bold">+{item.totalInward}</td>
                                                        <td className="py-4 px-4 text-center text-amber-600 font-bold">-{item.totalOutward}</td>
                                                        <td className="py-4 px-4 text-center font-black">
                                                            <span className={`px-2.5 py-1 rounded-lg ${
                                                                isOutOfStock ? 'bg-rose-50 text-rose-600' :
                                                                isLowStock ? 'bg-amber-50 text-amber-600' :
                                                                'bg-emerald-50 text-emerald-700'
                                                            }`}>
                                                                {item.availableStock}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 font-bold text-slate-500 uppercase">{item.unit}</td>
                                                        <td className="py-4 px-4 text-slate-600 font-bold">₹{price}</td>
                                                        <td className="py-4 px-4 font-black text-slate-800">₹{totalVal.toLocaleString('en-IN')}</td>
                                                        <td className="py-4 px-4 text-slate-400 font-medium">{new Date(item.lastUpdated).toLocaleString('en-IN')}</td>
                                                        {userRole === 'ADMIN' && (
                                                            <td className="py-4 px-4 text-right print:hidden">
                                                                <div className="flex justify-end gap-1.5">
                                                                    <button onClick={() => setModalConfig({ type: 'ITEM', data: item })} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all" title="Adjust Stock">
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button onClick={() => setModalConfig({ type: 'DELETE', data: item })} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all" title="Delete Material">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        {currentStock.length === 0 && (
                                            <tr>
                                                <td colSpan={userRole === 'ADMIN' ? 12 : 11} className="py-10 text-center text-slate-400 font-bold">No stock items cataloged.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. MONTHLY REGISTERS VIEW */}
                {view === 'MONTHLY' && (
                    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 print:block">
                        {/* Month Selector for subcollection view */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm print:hidden">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Monthly Firestore Register</span>
                            <div className="flex flex-wrap gap-1.5">
                                {MONTH_NAMES.map(month => (
                                    <button key={month} onClick={() => setMonthlyViewMonth(month)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${monthlyViewMonth === month ? 'bg-[#0e4368] text-white shadow-md shadow-[#0e4368]/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{month}</button>
                                ))}
                            </div>
                        </div>

                        {/* Transaction Table */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8 print:p-0 print:border-none print:shadow-none">
                            <div className="flex justify-between items-center mb-6 print:hidden">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">{monthlyViewMonth} Firestore Sub-Register</h3>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-1">Fetched directly from: monthly_registers/{monthlyViewMonth}/entries</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                                    <thead>
                                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50 print:bg-slate-100">
                                            <th className="py-4 px-4">Date & Time</th>
                                            <th className="py-4 px-4">Project Name</th>
                                            <th className="py-4 px-4">Material Name</th>
                                            <th className="py-4 px-4 text-center">Flow Type</th>
                                            <th className="py-4 px-4 text-center">Qty Issued</th>
                                            <th className="py-4 px-4">Unit</th>
                                            <th className="py-4 px-4">Staff Name</th>
                                            <th className="py-4 px-4">Issued By</th>
                                            <th className="py-4 px-4 text-center">Balance Stock</th>
                                            <th className="py-4 px-4">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {monthlyTransactions
                                            .filter(tx => {
                                                return tx.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    tx.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    tx.staffName.toLowerCase().includes(searchQuery.toLowerCase());
                                            })
                                            .map(tx => (
                                                <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="py-4 px-4 text-slate-500 font-medium">{new Date(tx.timestamp).toLocaleString('en-IN')}</td>
                                                    <td className="py-4 px-4 font-bold text-slate-700 uppercase">{tx.projectId}</td>
                                                    <td className="py-4 px-4">
                                                        <span className="font-bold text-slate-900 block">{tx.materialName}</span>
                                                        <span className="text-[9px] text-slate-400 font-black block tracking-wider uppercase">{tx.itemCode}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase ${
                                                            tx.type === 'INWARD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                        }`}>
                                                            {tx.type === 'INWARD' ? 'INWARD' : 'OUTWARD'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-black text-slate-700">{tx.quantity}</td>
                                                    <td className="py-4 px-4 font-bold text-slate-500 uppercase">{tx.unit}</td>
                                                    <td className="py-4 px-4 text-slate-600 font-medium">{tx.staffName}</td>
                                                    <td className="py-4 px-4 text-slate-500 font-medium">{tx.issuedBy}</td>
                                                    <td className="py-4 px-4 text-center font-black text-slate-900 bg-slate-50/30">{tx.balanceStockAfterIssue}</td>
                                                    <td className="py-4 px-4 text-slate-400 italic">{tx.remarks}</td>
                                                </tr>
                                            ))}
                                        {monthlyTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={10} className="py-10 text-center text-slate-400 font-bold">No subcollection records found in {monthlyViewMonth}.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* RECORD TRANSIT MODAL */}
            {isTxModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md max-h-[85vh] sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 min-h-0">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    {isTxSuccess ? 'Transaction Confirmed' : (isCheckOutOnly ? 'Material Check-Out Panel' : isCheckInOnly ? 'Material Check-In Panel' : 'Record Stock Transit')}
                                </h3>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">
                                    {isTxSuccess ? 'Inventory registry updated' : (isCheckOutOnly ? 'Immediate Store Inventory Release' : isCheckInOnly ? 'Immediate Store Inventory Addition' : 'Manual Check-In & Check-Out Entry')}
                                </span>
                            </div>
                            <button type="button" onClick={handleCloseTxModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        
                        {isTxSuccess && txSuccessDetails ? (
                            <div className="p-6 flex flex-col items-center justify-between flex-1 min-h-0">
                                <div className="w-full text-center space-y-4 my-auto overflow-y-auto custom-scrollbar pr-1 py-2">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 animate-bounce">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">
                                            {txSuccessDetails.type === 'OUTWARD' ? 'Material Checked Out!' : 'Material Checked In!'}
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                                            Forensic digital log has been permanently signed and saved to Firestore.
                                        </p>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 text-left divide-y divide-slate-100 text-[10px]">
                                        <div className="py-2 flex justify-between">
                                            <span className="font-black text-slate-400 uppercase tracking-wider">Material</span>
                                            <span className="font-bold text-slate-800 text-right max-w-[180px] truncate">{txSuccessDetails.materialName} ({txSuccessDetails.itemCode})</span>
                                        </div>
                                        <div className="py-2 flex justify-between">
                                            <span className="font-black text-slate-400 uppercase tracking-wider">Quantity</span>
                                            <span className="font-black text-slate-800">{txSuccessDetails.quantity} {txSuccessDetails.unit}</span>
                                        </div>
                                        <div className="py-2 flex justify-between">
                                            <span className="font-black text-slate-400 uppercase tracking-wider">Operator / Staff</span>
                                            <span className="font-bold text-slate-800">{txSuccessDetails.staffName}</span>
                                        </div>
                                        <div className="py-2 flex justify-between">
                                            <span className="font-black text-slate-400 uppercase tracking-wider">Project ID</span>
                                            <span className="font-bold text-slate-800 uppercase">{txSuccessDetails.projectId}</span>
                                        </div>
                                        <div className="py-2 flex justify-between">
                                            <span className="font-black text-slate-400 uppercase tracking-wider">Ref / Invoice</span>
                                            <span className="font-bold text-slate-800">{txSuccessDetails.remarks}</span>
                                        </div>
                                        {txSuccessDetails.photoUrl && (
                                            <div className="py-2 flex justify-between items-center">
                                                <span className="font-black text-slate-400 uppercase tracking-wider">Attached Photo</span>
                                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200">
                                                    <img src={txSuccessDetails.photoUrl} className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={handleCloseTxModal} 
                                    className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 mt-6"
                                >
                                    DONE
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const itemCodeVal = (form.elements.namedItem('itemCode') as any).value;
                                const typeVal = isCheckOutOnly ? 'OUTWARD' : isCheckInOnly ? 'INWARD' : ((form.elements.namedItem('type') as HTMLSelectElement).value as 'INWARD' | 'OUTWARD');
                                const quantityVal = parseInt((form.elements.namedItem('quantity') as HTMLInputElement).value) || 0;
                                const partyVal = (form.elements.namedItem('partyName') as HTMLSelectElement).value;
                                const invoiceVal = (form.elements.namedItem('invoiceNumber') as HTMLInputElement).value;

                                const selectedItem = currentStock.find(i => i.itemCode === itemCodeVal);
                                if (!selectedItem) {
                                    alert("Please select a valid item.");
                                    return;
                                }

                                try {
                                    setIsLoading(true);
                                    // Call live recordManualTransaction directly
                                    const res: any = await recordManualTransaction(
                                        selectedItem.name,
                                        quantityVal,
                                        selectedUnit,
                                        typeVal,
                                        partyVal,
                                        invoiceVal,
                                        undefined,
                                        checkoutPhoto,
                                        selectedProjectTx
                                    );
                                    
                                    if (res.success) {
                                        setRefreshTrigger(prev => prev + 1);
                                        setTxSuccessDetails({
                                            materialName: selectedItem.name,
                                            itemCode: itemCodeVal,
                                            quantity: quantityVal,
                                            unit: selectedUnit,
                                            type: typeVal,
                                            staffName: partyVal,
                                            remarks: invoiceVal,
                                            projectId: selectedProjectTx || 'GENERAL',
                                            photoUrl: checkoutPhoto || undefined
                                        });
                                        setIsTxSuccess(true);
                                    } else {
                                        alert(`Failed to save: ${res.error || 'Unknown error'}`);
                                    }
                                } catch (err: any) {
                                    alert(`Error saving transaction: ${err.message || err}`);
                                } finally {
                                    setIsLoading(false);
                                }
                            }} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                                
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Item / Asset</label>
                                        <button type="button" onClick={openAddModal} className="text-[9px] font-black text-[#0e4368] hover:text-[#0b3350] uppercase tracking-widest flex items-center gap-1 transition-all">
                                            <Plus className="w-3.5 h-3.5" /> New Item
                                        </button>
                                    </div>
                                    <div ref={comboboxRef} className="relative">
                                        <input 
                                            type="text"
                                            placeholder="-- Type to Search Stock Item --"
                                            value={txItemSearchText}
                                            onFocus={() => setIsSearchDropdownOpen(true)}
                                            onChange={(e) => {
                                                setTxItemSearchText(e.target.value);
                                                setIsSearchDropdownOpen(true);
                                                if (!e.target.value) setSelectedItemCode('');
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold focus:border-indigo-500 outline-none"
                                            required
                                        />
                                        <input type="hidden" name="itemCode" value={selectedItemCode} />
                                        {isSearchDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 divide-y divide-slate-50 custom-scrollbar">
                                                {currentStock
                                                    .filter(item => `[${item.itemCode}] ${item.name}`.toLowerCase().includes(txItemSearchText.toLowerCase()))
                                                    .map((item, idx) => (
                                                        <div 
                                                            key={item.itemCode} 
                                                            onClick={() => {
                                                                setSelectedItemCode(item.itemCode);
                                                                setTxItemSearchText(`[${item.itemCode}] ${item.name}`);
                                                                setSelectedUnit(item.unit || 'Pcs');
                                                                setIsSearchDropdownOpen(false);
                                                            }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-slate-50 flex justify-between items-center ${activeSearchIndex === idx ? 'bg-slate-50' : ''}`}
                                                        >
                                                            <span>{item.name}</span>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase">{item.itemCode} ({item.availableStock} left)</span>
                                                        </div>
                                                    ))}
                                                {currentStock.filter(item => `[${item.itemCode}] ${item.name}`.toLowerCase().includes(txItemSearchText.toLowerCase())).length === 0 && (
                                                    <div className="p-3 text-xs text-slate-400 font-bold text-center">No items found matching search.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                                        <input type="number" name="quantity" min="1" defaultValue="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-black text-slate-900 focus:border-indigo-500 outline-none" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit</label>
                                        <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:border-indigo-500 outline-none">
                                            <option value="Pcs">Pcs</option>
                                            <option value="Ltr">Ltr</option>
                                            <option value="Kg">Kg</option>
                                            <option value="NOS">NOS</option>
                                            <option value="Pack">Pack</option>
                                            <option value="Box">Box</option>
                                            <option value="Can">Can</option>
                                            <option value="Nos">Nos</option>
                                        </select>
                                    </div>
                                </div>

                                {!isCheckOutOnly && !isCheckInOnly && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Flow Direction</label>
                                        <select name="type" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:border-indigo-500 outline-none">
                                            <option value="OUTWARD">Check-Out (Outward)</option>
                                            <option value="INWARD">Check-In (Inward)</option>
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            {isCheckOutOnly ? 'Assigned Operator / Staff' : isCheckInOnly ? 'Receiving Operator / Supplier' : 'Assigned Operator / Party'}
                                        </label>
                                        <button type="button" onClick={() => setIsAddStaffModalOpen(true)} className="text-[9px] font-black text-[#0e4368] hover:text-[#0b3350] uppercase tracking-widest flex items-center gap-1 transition-all">
                                            <Plus className="w-3.5 h-3.5" /> New Staff
                                        </button>
                                    </div>
                                    <select name="partyName" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required>
                                        {localStaffList.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Remarks / Reference / Invoice No.</label>
                                    <input type="text" name="invoiceNumber" placeholder="e.g. ENG-01-0002" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Project ID / Use Case</label>
                                    <select value={selectedProjectTx} onChange={(e) => setSelectedProjectTx(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required>
                                        <option value="">-- Select Project ID --</option>
                                        <option value="GENERAL">GENERAL STORE</option>
                                        {projectList.map(pId => (
                                            <option key={pId} value={pId}>{pId}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Camera snapshot feature */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cargo / Reference Photo</label>
                                    <div className="flex flex-col gap-2">
                                        {checkoutPhoto ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border relative">
                                                    <img src={checkoutPhoto} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setCheckoutPhoto('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-bold">Photo attached successfully.</span>
                                            </div>
                                        ) : (
                                            <div>
                                                {webcamTarget === 'TRANSIT' ? (
                                                    <div className="flex flex-col items-center gap-3 p-3 bg-slate-900 rounded-2xl border border-slate-800">
                                                        <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-[280px] h-48 rounded-xl bg-black object-cover" />
                                                        <div className="flex gap-2 w-full justify-center">
                                                            <button type="button" onMouseDown={capturePhoto} onTouchStart={capturePhoto} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Capture</button>
                                                            <button type="button" onClick={stopWebcam} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-2 w-full">
                                                        <label className="h-14 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                                                            <Upload className="w-4 h-4 text-slate-500" />
                                                            <span className="text-[7px] font-black uppercase text-slate-500 mt-1">Upload File</span>
                                                            <input type="file" accept="image/*" onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const r = new FileReader();
                                                                    r.onload = (ev) => setCheckoutPhoto(ev.target?.result as string);
                                                                    r.readAsDataURL(file);
                                                                }
                                                            }} className="hidden" />
                                                        </label>
                                                        <button type="button" onClick={() => startWebcam('TRANSIT')} className="h-14 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                                                            <Camera className="w-4 h-4 text-slate-500" />
                                                            <span className="text-[7px] font-black uppercase text-slate-500 mt-1">Live Camera</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#0e4368] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0b3350] transition-all shadow-md shadow-[#0e4368]/20 disabled:opacity-50 mt-4">
                                    {isLoading ? 'Processing Transaction...' : isCheckOutOnly ? 'CONFIRM CHECK-OUT' : isCheckInOnly ? 'CONFIRM CHECK-IN' : 'RECORD TRANSIT'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ADD MATERIAL MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 min-h-0">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">Register New Material / Stock Item</h3>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Add to general store inventory catalog</span>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setNewItemPhoto(''); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const nameVal = (form.elements.namedItem('itemName') as HTMLInputElement).value;
                            const itemCodeVal = addItemCodeMode === 'SELECT' ? addItemCode : (form.elements.namedItem('customItemCode') as HTMLInputElement).value;
                            const categoryVal = addCategoryMode === 'SELECT' ? addCategory : (form.elements.namedItem('customCategory') as HTMLInputElement).value;
                            const locationVal = addLocationMode === 'SELECT' ? addLocation : (form.elements.namedItem('customLocation') as HTMLInputElement).value;
                            const minVal = parseInt((form.elements.namedItem('minThreshold') as HTMLInputElement).value) || 5;
                            const openVal = parseInt((form.elements.namedItem('openingStock') as HTMLInputElement).value) || 0;

                            if (!nameVal.trim() || !itemCodeVal.trim()) {
                                alert("Material Name and Code are required.");
                                return;
                            }

                            try {
                                setIsLoading(true);
                                const item: InventoryItem = {
                                    itemCode: itemCodeVal.trim().toUpperCase(),
                                    name: nameVal.trim(),
                                    category: categoryVal.trim(),
                                    unit: addUnit,
                                    currentStock: openVal,
                                    totalInward: 0,
                                    totalOutward: 0,
                                    minThreshold: minVal,
                                    location: locationVal.trim(),
                                    photoUrl: newItemPhoto || undefined,
                                    lastUpdated: new Date().toISOString()
                                };

                                await addInventoryItem(item);
                                setRefreshTrigger(prev => prev + 1);
                                setIsAddModalOpen(false);
                                setNewItemPhoto('');
                            } catch (err: any) {
                                alert(`Failed to add item: ${err.message || err}`);
                            } finally {
                                setIsLoading(false);
                            }
                        }} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                            
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Material / Item Name</label>
                                <input type="text" name="itemName" placeholder="e.g. Chemilac Gloss Red Paint" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Material Code</label>
                                    <div className="flex gap-2 text-[8px] font-black uppercase tracking-wider">
                                        <button type="button" onClick={() => setAddItemCodeMode('SELECT')} className={`px-2 py-0.5 rounded ${addItemCodeMode === 'SELECT' ? 'bg-[#0e4368] text-white' : 'text-slate-400'}`}>Select Existing</button>
                                        <button type="button" onClick={() => setAddItemCodeMode('CUSTOM')} className={`px-2 py-0.5 rounded ${addItemCodeMode === 'CUSTOM' ? 'bg-[#0e4368] text-white' : 'text-slate-400'}`}>Custom Code</button>
                                    </div>
                                </div>
                                {addItemCodeMode === 'SELECT' ? (
                                    <select value={addItemCode} onChange={(e) => setAddItemCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required>
                                        <option value="">-- Select Code Prefix --</option>
                                        <option value="PAI-CUSTOM">PAI (Paints)</option>
                                        <option value="THI-CUSTOM">THI (Chemicals/Thinners)</option>
                                        <option value="TOO-CUSTOM">TOO (Tools/Hardware)</option>
                                        <option value="PAP-CUSTOM">PAP (Stationery/Paper)</option>
                                        <option value="CEL-CUSTOM">CEL (General/Batteries)</option>
                                        <option value="MIS-CUSTOM">MIS (Miscellaneous)</option>
                                    </select>
                                ) : (
                                    <input type="text" name="customItemCode" placeholder="e.g. PAI-999" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required />
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                                    <div className="flex gap-2 text-[8px] font-black uppercase tracking-wider">
                                        <button type="button" onClick={() => setAddCategoryMode('SELECT')} className={`px-2 py-0.5 rounded ${addCategoryMode === 'SELECT' ? 'bg-[#0e4368] text-white' : 'text-slate-400'}`}>Select Existing</button>
                                        <button type="button" onClick={() => setAddCategoryMode('CUSTOM')} className={`px-2 py-0.5 rounded ${addCategoryMode === 'CUSTOM' ? 'bg-[#0e4368] text-white' : 'text-slate-400'}`}>Custom Category</button>
                                    </div>
                                </div>
                                {addCategoryMode === 'SELECT' ? (
                                    <select value={addCategory} onChange={(e) => setAddCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required>
                                        <option value="">-- Select Category --</option>
                                        <option value="Paints">Paints</option>
                                        <option value="Chemicals">Chemicals</option>
                                        <option value="Stationery">Stationery</option>
                                        <option value="General">General</option>
                                    </select>
                                ) : (
                                    <input type="text" name="customCategory" placeholder="e.g. Electrical" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Opening Stock</label>
                                    <input type="number" name="openingStock" defaultValue="0" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit</label>
                                    <select value={addUnit} onChange={(e) => setAddUnit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:border-indigo-500 outline-none">
                                        <option value="Pcs">Pcs</option>
                                        <option value="Ltr">Ltr</option>
                                        <option value="Kg">Kg</option>
                                        <option value="NOS">NOS</option>
                                        <option value="Pack">Pack</option>
                                        <option value="Box">Box</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Location / Rack</label>
                                    {addLocationMode === 'SELECT' ? (
                                        <select value={addLocation} onChange={(e) => setAddLocation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required>
                                            <option value="">-- Select Location --</option>
                                            <option value="Rack No. 1">Rack No. 1</option>
                                            <option value="Rack-2">Rack-2</option>
                                            <option value="Rack-3">Rack-3</option>
                                            <option value="Rack No. 4">Rack No. 4</option>
                                            <option value="Rack-5">Rack-5</option>
                                            <option value="Rack-6">Rack-6</option>
                                        </select>
                                    ) : (
                                        <input type="text" name="customLocation" placeholder="e.g. Tool Cabinet B" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required />
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Min Threshold Alert</label>
                                    <input type="number" name="minThreshold" defaultValue="5" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold focus:border-indigo-500 outline-none" required />
                                </div>
                            </div>

                            {/* Camera snapshot for new items */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Material Reference Photo</label>
                                <div className="flex flex-col gap-2">
                                    {newItemPhoto ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border relative">
                                                <img src={newItemPhoto} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setNewItemPhoto('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-bold">Attached successfully.</span>
                                        </div>
                                    ) : (
                                        <div>
                                            {webcamTarget === 'NEW_ITEM' ? (
                                                <div className="flex flex-col items-center gap-3 p-3 bg-slate-900 rounded-2xl border border-slate-800">
                                                    <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-[280px] h-48 rounded-xl bg-black object-cover" />
                                                    <div className="flex gap-2 w-full justify-center">
                                                        <button type="button" onMouseDown={capturePhoto} onTouchStart={capturePhoto} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Capture</button>
                                                        <button type="button" onClick={stopWebcam} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2 w-full">
                                                    <label className="h-14 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                                                        <Upload className="w-4 h-4 text-slate-500" />
                                                        <span className="text-[7px] font-black uppercase text-slate-500 mt-1">Upload File</span>
                                                        <input type="file" accept="image/*" onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const r = new FileReader();
                                                                r.onload = (ev) => setNewItemPhoto(ev.target?.result as string);
                                                                r.readAsDataURL(file);
                                                            }
                                                        }} className="hidden" />
                                                    </label>
                                                    <button type="button" onClick={() => startWebcam('NEW_ITEM')} className="h-14 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                                                        <Camera className="w-4 h-4 text-slate-500" />
                                                        <span className="text-[7px] font-black uppercase text-slate-500 mt-1">Live Camera</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#0e4368] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0b3350] transition-all shadow-md shadow-[#0e4368]/20 disabled:opacity-50 mt-4">
                                {isLoading ? 'Adding Item...' : 'REGISTER MATERIAL'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT STOCK LEVEL MODAL */}
            {modalConfig && modalConfig.type === 'ITEM' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">Adjust Stock: {modalConfig.data.name}</h3>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Audit correction for {modalConfig.data.itemCode}</span>
                            </div>
                            <button onClick={() => setModalConfig(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Available Stock Level</label>
                                <input 
                                    type="number" 
                                    defaultValue={modalConfig.data.availableStock}
                                    id="stock-adjust-input"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xl font-black text-slate-900 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <button 
                                onClick={async () => {
                                    const input = document.getElementById('stock-adjust-input') as HTMLInputElement;
                                    const newQty = parseInt(input.value);
                                    if (isNaN(newQty) || newQty < 0) {
                                        alert("Please enter a valid stock number.");
                                        return;
                                    }
                                    try {
                                        setIsLoading(true);
                                        await updateInventoryItemStock(modalConfig.data.itemCode, newQty);
                                        setRefreshTrigger(prev => prev + 1);
                                        setModalConfig(null);
                                    } catch (err: any) {
                                        alert(`Failed to update stock: ${err.message || err}`);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }} 
                                disabled={isLoading} 
                                className="w-full py-3 bg-[#0e4368] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0b3350] transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Updating Stock...' : 'APPLY CORRECTION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MATERIAL MODAL */}
            {modalConfig && modalConfig.type === 'DELETE' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 p-8 text-center space-y-6">
                        <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">Delete Material Record?</h3>
                            <p className="text-xs text-slate-400 mt-2 font-medium">Are you sure you want to permanently delete <strong className="text-slate-700">{modalConfig.data.name}</strong> ({modalConfig.data.itemCode})? This action is irreversible.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setModalConfig(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                            <button 
                                onClick={async () => {
                                    try {
                                        setIsLoading(true);
                                        await deleteInventoryItem(modalConfig.data.itemCode);
                                        setRefreshTrigger(prev => prev + 1);
                                        setModalConfig(null);
                                    } catch (err: any) {
                                        alert(`Failed to delete: ${err.message || err}`);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }} 
                                disabled={isLoading} 
                                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Deleting...' : 'DELETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Staff Modal */}
            <AddStaffModal 
                isOpen={isAddStaffModalOpen} 
                onClose={() => setIsAddStaffModalOpen(false)} 
                onAdd={handleAddStaffInternal} 
                existingStaff={localStaffList}
            />
        </div>
    );
};

export default StoreStockReport;

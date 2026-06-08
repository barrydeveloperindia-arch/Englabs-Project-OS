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
    User,
    Settings,
    Smartphone,
    Menu
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
    // Navigation state matching folder structure: Dashboard, Check In, Check Out, Live Register, Current Stock, Reports, Settings
    const [view, setView] = useState<'DASHBOARD' | 'CHECK_IN' | 'CHECK_OUT' | 'LIVE_REGISTER' | 'CURRENT_STOCK' | 'REPORTS' | 'SETTINGS'>('DASHBOARD');
    
    // Live Register Filter state
    const [liveFilter, setLiveFilter] = useState<'TODAY' | 'WEEK' | 'MONTH'>('MONTH');

    // Roster and Staff states
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

    // Database registers states
    const [currentStock, setCurrentStock] = useState<CurrentStockItem[]>([]);
    const [masterTransactions, setMasterTransactions] = useState<MasterRegisterEntry[]>([]);
    const [monthlyTransactions, setMonthlyTransactions] = useState<MasterRegisterEntry[]>([]);
    
    // Filtering / Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [monthlyViewMonth, setMonthlyViewMonth] = useState<string>(MONTH_NAMES[new Date().getMonth()]);
    
    // Loading and reload triggers
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Check-in form states
    const [checkInItemCode, setCheckInItemCode] = useState('');
    const [checkInItemName, setCheckInItemName] = useState('');
    const [checkInQty, setCheckInQty] = useState(1);
    const [checkInUnit, setCheckInUnit] = useState('Nos');
    const [checkInCategory, setCheckInCategory] = useState('General');
    const [checkInSupplier, setCheckInSupplier] = useState('');
    const [checkInProject, setCheckInProject] = useState('');
    const [checkInReceivedBy, setCheckInReceivedBy] = useState('');
    const [checkInRemarks, setCheckInRemarks] = useState('');
    const [checkInSuccess, setCheckInSuccess] = useState(false);
    const [checkInTxDetails, setCheckInTxDetails] = useState<any>(null);
    const [isNewItemMode, setIsNewItemMode] = useState(false);

    // Check-out form states
    const [checkOutItemCode, setCheckOutItemCode] = useState('');
    const [checkOutQty, setCheckOutQty] = useState(1);
    const [checkOutStaffName, setCheckOutStaffName] = useState('');
    const [checkOutProjectName, setCheckOutProjectName] = useState('');
    const [checkOutIssuedBy, setCheckOutIssuedBy] = useState('');
    const [checkOutRemarks, setCheckOutRemarks] = useState('');
    const [checkOutSuccess, setCheckOutSuccess] = useState(false);
    const [checkOutTxDetails, setCheckOutTxDetails] = useState<any>(null);
    const [checkoutPhoto, setCheckoutPhoto] = useState('');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ type: 'ITEM' | 'DELETE', data: any } | null>(null);

    // Webcam / Camera Capture states (Optional Feature inside Checkout & Settings)
    const [webcamTarget, setWebcamTarget] = useState<'CHECKOUT' | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const webcamStreamRef = useRef<MediaStream | null>(null);

    // Project List from props
    const DEFAULT_PROJECT_IDS = ['C2718', 'C2737', 'C2931', 'C3020', 'C4867', 'C5178', 'C5191', 'C5192', 'C5193', 'C5195', 'C5197', 'C5198', 'C5207', 'C5209', 'C5210', 'C5212', 'C5213', 'C5216', 'C5223', 'C5224', 'C5227', 'C5228', 'C5229'];
    const projectList = (projects && projects.length > 0)
        ? projects.map((p: any) => p.projectId)
        : DEFAULT_PROJECT_IDS;

    // Load staff list on prop change
    useEffect(() => {
        if (propStaffList) {
            setLocalStaffList(propStaffList);
        }
    }, [propStaffList]);

    // Handle staff creation
    const handleAddStaffSuccess = (name: string) => {
        const newList = Array.from(new Set([...localStaffList, name]));
        setLocalStaffList(newList);
        localStorage.setItem('englabs_staff_members', JSON.stringify(newList));
        if (onAddStaff) onAddStaff(name);
        setIsAddStaffModalOpen(false);
    };

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const stockData = await fetchCurrentStock();
                setCurrentStock(stockData);
                
                const masterData = await fetchMasterRegister();
                setMasterTransactions(masterData);

                const monthlyData = await fetchMonthlyRegister(monthlyViewMonth);
                setMonthlyTransactions(monthlyData);
            } catch (err) {
                console.error("Error loading registry data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [refreshTrigger, monthlyViewMonth]);

    // Auto-calculates for dashboard statistics
    const statsTotalStockValue = currentStock.reduce((sum, item) => {
        const price = item.unitPrice || getEstimatedPrice(item.category || '');
        return sum + (item.availableStock * price);
    }, 0);

    // Today's Activity Stats
    const todayTransactions = masterTransactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        const today = new Date();
        return txDate.toDateString() === today.toDateString();
    });

    const todayCheckInCount = todayTransactions.filter(tx => tx.type === 'INWARD').length;
    const todayCheckInQty = todayTransactions.filter(tx => tx.type === 'INWARD').reduce((sum, tx) => sum + tx.quantity, 0);

    const todayCheckOutCount = todayTransactions.filter(tx => tx.type === 'OUTWARD').length;
    const todayCheckOutQty = todayTransactions.filter(tx => tx.type === 'OUTWARD').reduce((sum, tx) => sum + tx.quantity, 0);

    // Most Issued Material TODAY (or all-time if none today)
    const computeMostIssuedMaterial = () => {
        const counts: Record<string, number> = {};
        const targets = todayTransactions.length > 0 
            ? todayTransactions.filter(tx => tx.type === 'OUTWARD')
            : masterTransactions.filter(tx => tx.type === 'OUTWARD');
            
        targets.forEach(tx => {
            counts[tx.materialName] = (counts[tx.materialName] || 0) + tx.quantity;
        });
        
        let mostIssued = "None";
        let maxQty = 0;
        Object.entries(counts).forEach(([name, qty]) => {
            if (qty > maxQty) {
                maxQty = qty;
                mostIssued = name;
            }
        });
        return mostIssued;
    };

    const mostIssuedMaterialName = computeMostIssuedMaterial();

    const statsLowStockAlertCount = currentStock.filter(i => i.availableStock > 0 && i.availableStock <= (i.minThreshold || 5)).length;
    const statsOutOfStockAlertCount = currentStock.filter(i => i.availableStock === 0).length;

    // Excel Export implementation
    const handleExportExcel = () => {
        let sheetName = "";
        let dataList: any[] = [];
        
        if (view === 'LIVE_REGISTER') {
            sheetName = "Live Register";
            const filtered = getFilteredTransactions(masterTransactions);
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
        } else if (view === 'REPORTS') {
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
            alert("Please select a Register or Stock tab to export.");
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

    // WhatsApp Message Formatter
    const formatWhatsAppMessage = (tx: any) => {
        const dateStr = new Date(tx.timestamp || Date.now()).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        }).replace(/ /g, '-');
        
        let text = "";
        if (tx.type === 'INWARD') {
            text = `STORE RECEIPT SLIP

Date: ${dateStr}
Material: ${tx.materialName}
Quantity: ${tx.quantity} ${tx.unit || 'Nos'}
Received From: ${tx.staffName}
Project: ${tx.projectId || 'N/A'}

Current Balance: ${tx.balanceStockAfterIssue} ${tx.unit || 'Nos'}

ENGLABS STORE`;
        } else {
            text = `STORE ISSUE SLIP

Date: ${dateStr}
Material: ${tx.materialName}
Quantity: ${tx.quantity} ${tx.unit || 'Nos'}
Issued To: ${tx.staffName}
Project: ${tx.projectId}

Current Balance: ${tx.balanceStockAfterIssue} ${tx.unit || 'Nos'}

ENGLABS STORE`;
        }
        
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
    };

    // Shared WhatsApp trigger
    const handleShareWhatsApp = (tx: any) => {
        const url = formatWhatsAppMessage(tx);
        window.open(url, '_blank');
    };

    // Live Register Filter Query helper
    const getFilteredTransactions = (txs: MasterRegisterEntry[]) => {
        return txs.filter(tx => {
            const matchesSearch = tx.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tx.projectId && tx.projectId.toLowerCase().includes(searchQuery.toLowerCase()));
                
            if (!matchesSearch) return false;

            const txDate = new Date(tx.timestamp);
            const now = new Date();

            if (liveFilter === 'TODAY') {
                return txDate.toDateString() === now.toDateString();
            } else if (liveFilter === 'WEEK') {
                return (now.getTime() - txDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
            } else {
                // Month filter matches the current month
                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            }
        });
    };

    // Webcam integration
    const startWebcam = async (target: 'CHECKOUT') => {
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

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCheckoutPhoto(dataUrl);
                stopWebcam();
            }
        }
    };

    // Handle staff creation
    const renderSidebarContent = () => (
        <>
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <img src={logo} alt="ENGLABS" className="w-6 h-6 object-contain" />
                <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500">ENGLABS STORE</h2>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">Simple Stock System</p>
                </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
                {[
                    { id: 'DASHBOARD', label: 'Dashboard', icon: <TrendingUp className="w-4 h-4" /> },
                    { id: 'CHECK_IN', label: 'Check In', icon: <ArrowDownCircle className="w-4 h-4" /> },
                    { id: 'CHECK_OUT', label: 'Check Out', icon: <ArrowUpCircle className="w-4 h-4" /> },
                    { id: 'LIVE_REGISTER', label: 'Live Register', icon: <Clock className="w-4 h-4" /> },
                    { id: 'CURRENT_STOCK', label: 'Current Stock', icon: <Package className="w-4 h-4" /> },
                    { id: 'REPORTS', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
                    { id: 'SETTINGS', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => { 
                            setView(item.id as any); 
                            setCheckInSuccess(false); 
                            setCheckOutSuccess(false);
                            setIsMobileSidebarOpen(false); 
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                            view === item.id 
                                ? 'bg-[#0e4368] text-white shadow-lg shadow-[#0e4368]/20 border border-slate-700' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>
            
            <div className="p-4 border-t border-slate-800 text-center">
                <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">MISSION CONTROL SYSTEM</span>
            </div>
        </>
    );

    return (
        <div className="flex-1 flex flex-col md:flex-row min-w-0 min-h-0 bg-[#F8FAFC] print:bg-white print:block relative">
            
            {/* MOBILE SIDEBAR DRAWER OVERLAY */}
            {isMobileSidebarOpen && (
                <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={() => setIsMobileSidebarOpen(false)} />
            )}

            {/* MOBILE SIDEBAR DRAWER PANEL */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-300 transform md:hidden ${
                isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="absolute top-4 right-4 md:hidden">
                    <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {renderSidebarContent()}
            </aside>

            {/* STATIC SUB-SIDEBAR (Desktop) */}
            <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col shrink-0 border-r border-slate-800 print:hidden">
                {renderSidebarContent()}
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* TOP BAR / HEADER */}
                <header className="h-auto md:h-20 bg-white border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-4 md:py-0 shrink-0 gap-4 md:gap-0 print:hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full md:w-auto">
                        <div className="flex items-center gap-3">
                            {/* Mobile Hamburger toggle button */}
                            <button 
                                type="button"
                                onClick={() => setIsMobileSidebarOpen(true)}
                                className="p-2 hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-600 md:hidden transition-all shadow-sm"
                                title="Open Sidebar Menu"
                            >
                                <Menu className="w-4 h-4" />
                            </button>
                            <div className="flex flex-col">
                                <h1 className="text-base font-black text-slate-900 leading-none">
                                    {view === 'DASHBOARD' && 'Dashboard Overview'}
                                    {view === 'CHECK_IN' && 'Material Check-In'}
                                    {view === 'CHECK_OUT' && 'Material Check-Out'}
                                    {view === 'LIVE_REGISTER' && 'Live Transaction Register'}
                                    {view === 'CURRENT_STOCK' && 'Current Stock Inventory'}
                                    {view === 'REPORTS' && 'Monthly Audit Reports'}
                                    {view === 'SETTINGS' && 'System Settings'}
                                </h1>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Forensic Store Audits & Slips</span>
                            </div>
                        </div>
                        
                        <div className="hidden md:block h-6 w-px bg-slate-100"></div>
                        
                        {/* Mobile Header Sub-Navigation (Horizontal Scroll) */}
                        <nav className="flex gap-1 bg-slate-50 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar shrink-0 md:hidden border border-slate-150">
                            {[
                                { id: 'DASHBOARD', label: 'Dashboard' },
                                { id: 'CHECK_IN', label: 'Check In' },
                                { id: 'CHECK_OUT', label: 'Check Out' },
                                { id: 'LIVE_REGISTER', label: 'Live Register' },
                                { id: 'CURRENT_STOCK', label: 'Stock' },
                                { id: 'REPORTS', label: 'Reports' },
                                { id: 'SETTINGS', label: 'Settings' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setView(item.id as any); setCheckInSuccess(false); setCheckOutSuccess(false); }}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                        view === item.id 
                                            ? 'bg-[#0e4368] text-white shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    
                    {/* Top Right Quick Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                        {/* Search Bar for Table Views */}
                        {(view === 'LIVE_REGISTER' || view === 'CURRENT_STOCK' || view === 'REPORTS') && (
                            <div className="relative w-full md:w-44 flex-1 md:flex-none">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-[11px] font-bold focus:border-indigo-500 outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        )}
                        
                        <div className="flex gap-2">
                            {(view === 'LIVE_REGISTER' || view === 'CURRENT_STOCK' || view === 'REPORTS') && (
                                <>
                                    <button onClick={handleExportExcel} className="p-2.5 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm" title="Export Excel">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleExportPDF} className="p-2.5 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm" title="Export PDF">
                                        <Printer className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button onClick={() => setRefreshTrigger(p => p + 1)} className="p-2.5 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm" title="Refresh Database">
                                <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar print:overflow-visible print:p-0 print:block">
                    
                    {/* 1. DASHBOARD VIEW */}
                    {view === 'DASHBOARD' && (
                        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 print:hidden">
                            {/* Summary Metrics Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Items</span>
                                        <h3 className="text-xl font-black text-slate-900">{currentStock.length} Items</h3>
                                    </div>
                                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Package className="w-5 h-5" /></div>
                                </div>
                                
                                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Stock Value</span>
                                        <h3 className="text-xl font-black text-slate-900">₹{statsTotalStockValue.toLocaleString('en-IN')}</h3>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Today Check-In</span>
                                        <h3 className="text-xl font-black text-slate-900">{todayCheckInCount} Entries</h3>
                                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{todayCheckInQty} units added</span>
                                    </div>
                                    <div className="p-3 bg-teal-50 rounded-2xl text-teal-600"><ArrowDownCircle className="w-5 h-5" /></div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Today Check-Out</span>
                                        <h3 className="text-xl font-black text-slate-900">{todayCheckOutCount} Entries</h3>
                                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{todayCheckOutQty} units issued</span>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><ArrowUpCircle className="w-5 h-5" /></div>
                                </div>
                            </div>

                            {/* Split Panels: Daily Summary & Low Stock list */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Daily Summary Panel */}
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:col-span-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                                            <Calendar className="w-4 h-4 text-emerald-600" /> Daily Summary
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Today's Activity</h4>
                                                <div className="grid grid-cols-2 gap-3 mt-1.5">
                                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">Check-In</span>
                                                        <span className="text-base font-black text-slate-800 block mt-0.5">{todayCheckInCount} Entries</span>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                        <span className="text-[8px] font-black text-amber-600 uppercase tracking-wider block">Check-Out</span>
                                                        <span className="text-base font-black text-slate-800 block mt-0.5">{todayCheckOutCount} Entries</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-50 pt-3">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Most Issued Material (Today)</span>
                                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                    <Package className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-xs font-black text-slate-800 truncate" title={mostIssuedMaterialName}>{mostIssuedMaterialName}</span>
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-50 pt-3 grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Total Store Items</span>
                                                    <span className="text-sm font-black text-slate-700">{currentStock.length} Items</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Low Stock Alerts</span>
                                                    <span className="text-sm font-black text-rose-600">{statsLowStockAlertCount + statsOutOfStockAlertCount} Alerts</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Low Stock list Panel */}
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:col-span-2">
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                                        <AlertTriangle className="w-4 h-4 text-rose-500" /> Low & Out-Of-Stock Items ({statsLowStockAlertCount + statsOutOfStockAlertCount})
                                    </h3>
                                    
                                    <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-slate-50 pr-2">
                                        {currentStock.filter(i => i.availableStock <= (i.minThreshold || 5)).length === 0 ? (
                                            <p className="text-slate-400 text-xs py-12 text-center font-bold">All stock levels normal. No alerts.</p>
                                        ) : (
                                            currentStock.filter(i => i.availableStock <= (i.minThreshold || 5)).map(item => (
                                                <div key={item.itemCode} className="py-3.5 flex justify-between items-center text-xs">
                                                    <div>
                                                        <span className="font-bold text-slate-900 block">{item.name}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.itemCode} • {item.category}</span>
                                                    </div>
                                                    <div className="text-right flex items-center gap-3">
                                                        <div>
                                                            <span className={`font-black text-xs block ${item.availableStock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                                                                {item.availableStock} {item.unit} left
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 block font-bold">Min Limit: {item.minThreshold || 5}</span>
                                                        </div>
                                                        <span className={`px-2 py-1 font-black rounded-lg text-[9px] uppercase ${
                                                            item.availableStock === 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                        }`}>
                                                            {item.availableStock === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Transactions List (Mini Register) */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                                    <Clock className="w-4 h-4 text-indigo-600" /> Recent Activity Logs
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

                    {/* 2. CHECK-IN PAGE */}
                    {view === 'CHECK_IN' && (
                        <div className="max-w-xl mx-auto bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 animate-in fade-in duration-300">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                    <ArrowDownCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900 leading-none">Material Check-In</h2>
                                    <span className="text-[10px] font-bold text-slate-400 block mt-1">Record incoming stock into the Main Store</span>
                                </div>
                            </div>

                            {checkInSuccess ? (
                                <div className="space-y-6 text-center py-4">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Check-In Successful!</h3>
                                        <p className="text-xs text-slate-400 font-bold mt-1">The store inventory has been updated.</p>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs space-y-2.5 border border-slate-100 max-w-sm mx-auto font-medium text-slate-600">
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Material:</span> {checkInTxDetails.materialName}</div>
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Quantity:</span> {checkInTxDetails.quantity} {checkInTxDetails.unit}</div>
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Supplier:</span> {checkInTxDetails.staffName}</div>
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Received By:</span> {checkInTxDetails.issuedBy}</div>
                                        {checkInTxDetails.projectId && <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Project:</span> {checkInTxDetails.projectId}</div>}
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">New Balance:</span> {checkInTxDetails.balanceStockAfterIssue} {checkInTxDetails.unit}</div>
                                    </div>

                                    <div className="flex flex-col gap-2 max-w-sm mx-auto">
                                        <button
                                            onClick={() => handleShareWhatsApp({
                                                type: 'INWARD',
                                                materialName: checkInTxDetails.materialName,
                                                quantity: checkInTxDetails.quantity,
                                                unit: checkInTxDetails.unit,
                                                staffName: checkInTxDetails.staffName,
                                                projectId: checkInTxDetails.projectId,
                                                balanceStockAfterIssue: checkInTxDetails.balanceStockAfterIssue
                                            })}
                                            className="w-full py-3 bg-[#25D366] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#20ba59] transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
                                        >
                                            📱 Share on WhatsApp
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCheckInSuccess(false);
                                                setView('LIVE_REGISTER');
                                            }}
                                            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setIsLoading(true);
                                    try {
                                        let finalItemName = "";
                                        let finalItemCode = "";
                                        let finalUnit = "";

                                        if (isNewItemMode) {
                                            if (!checkInItemName.trim()) {
                                                alert("Please enter a valid material name.");
                                                return;
                                            }
                                            finalItemName = checkInItemName.trim();
                                            finalItemCode = checkInItemName.toUpperCase().trim().replace(/\s+/g, '_');
                                            finalUnit = checkInUnit;

                                            // Write catalog item
                                            await addInventoryItem({
                                                itemCode: finalItemCode,
                                                name: finalItemName,
                                                category: checkInCategory,
                                                unit: finalUnit,
                                                currentStock: 0,
                                                totalInward: 0,
                                                totalOutward: 0,
                                                minThreshold: 5,
                                                lastUpdated: new Date().toISOString()
                                            });
                                        } else {
                                            const existing = currentStock.find(i => i.itemCode === checkInItemCode);
                                            if (!existing) {
                                                alert("Please select a valid material.");
                                                return;
                                            }
                                            finalItemName = existing.name;
                                            finalItemCode = existing.itemCode;
                                            finalUnit = existing.unit;
                                        }

                                        // Write Transaction
                                        const res: any = await recordManualTransaction(
                                            finalItemName,
                                            checkInQty,
                                            finalUnit,
                                            'INWARD',
                                            checkInSupplier,
                                            checkInRemarks || 'Check-In Slip Entry',
                                            undefined,
                                            undefined,
                                            checkInProject || 'GENERAL'
                                        );

                                        if (res.success) {
                                            setRefreshTrigger(p => p + 1);
                                            const currentBalance = (currentStock.find(i => i.itemCode === finalItemCode)?.availableStock || 0) + checkInQty;
                                            setCheckInTxDetails({
                                                materialName: finalItemName,
                                                quantity: checkInQty,
                                                unit: finalUnit,
                                                staffName: checkInSupplier,
                                                issuedBy: checkInReceivedBy || 'Store Manager',
                                                projectId: checkInProject || 'GENERAL',
                                                balanceStockAfterIssue: currentBalance
                                            });
                                            setCheckInSuccess(true);
                                            // Reset
                                            setCheckInItemCode('');
                                            setCheckInItemName('');
                                            setCheckInQty(1);
                                            setCheckInSupplier('');
                                            setCheckInProject('');
                                            setCheckInRemarks('');
                                            setIsNewItemMode(false);
                                        } else {
                                            alert("Failed to save transaction: " + (res.error || 'Unknown error'));
                                        }
                                    } catch (err: any) {
                                        alert("Error checking in material: " + err.message);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }} className="space-y-4">
                                    
                                    {/* Material Name Selector */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Material Name</label>
                                            <button
                                                type="button"
                                                onClick={() => setIsNewItemMode(!isNewItemMode)}
                                                className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800"
                                            >
                                                {isNewItemMode ? "Select Existing Item" : "＋ Register New Material"}
                                            </button>
                                        </div>

                                        {isNewItemMode ? (
                                            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Material Name"
                                                        required
                                                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                        value={checkInItemName}
                                                        onChange={(e) => setCheckInItemName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Unit</label>
                                                        <select
                                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                            value={checkInUnit}
                                                            onChange={(e) => setCheckInUnit(e.target.value)}
                                                        >
                                                            <option value="Nos">Nos</option>
                                                            <option value="Kg">Kg</option>
                                                            <option value="Mtr">Mtr</option>
                                                            <option value="Ltr">Ltr</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Category</label>
                                                        <select
                                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                            value={checkInCategory}
                                                            onChange={(e) => setCheckInCategory(e.target.value)}
                                                        >
                                                            <option value="General">General</option>
                                                            <option value="Paints">Paints</option>
                                                            <option value="Chemicals">Chemicals</option>
                                                            <option value="Stationery">Stationery</option>
                                                            <option value="PPE">PPE</option>
                                                            <option value="Tools">Tools</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <select
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                value={checkInItemCode}
                                                onChange={(e) => setCheckInItemCode(e.target.value)}
                                            >
                                                <option value="">Select Material...</option>
                                                {currentStock.map(item => (
                                                    <option key={item.itemCode} value={item.itemCode}>{item.name} ({item.unit})</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Quantity */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                            value={checkInQty}
                                            onChange={(e) => setCheckInQty(parseInt(e.target.value) || 0)}
                                        />
                                    </div>

                                    {/* Supplier */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Supplier / Vendor</label>
                                        <input
                                            type="text"
                                            placeholder="Enter Supplier Name"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                            value={checkInSupplier}
                                            onChange={(e) => setCheckInSupplier(e.target.value)}
                                        />
                                    </div>

                                    {/* Project (Optional) */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Project Name (Optional)</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                            value={checkInProject}
                                            onChange={(e) => setCheckInProject(e.target.value)}
                                        >
                                            <option value="">General Store / None</option>
                                            {projectList.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Received By */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Received By</label>
                                        <select
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                            value={checkInReceivedBy}
                                            onChange={(e) => setCheckInReceivedBy(e.target.value)}
                                        >
                                            <option value="">Select Receiver...</option>
                                            {localStaffList.map(staff => (
                                                <option key={staff} value={staff}>{staff}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Remarks */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Remarks</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Audit details or invoice notes..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none resize-none"
                                            value={checkInRemarks}
                                            onChange={(e) => setCheckInRemarks(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/15 mt-6 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "+ Check In"}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* 3. CHECK-OUT PAGE */}
                    {view === 'CHECK_OUT' && (
                        <div className="max-w-xl mx-auto bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 animate-in fade-in duration-300">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                                    <ArrowUpCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900 leading-none">Material Check-Out</h2>
                                    <span className="text-[10px] font-bold text-slate-400 block mt-1">Issue materials and track project deployment</span>
                                </div>
                            </div>

                            {checkOutSuccess ? (
                                <div className="space-y-6 text-center py-4">
                                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Material Issued!</h3>
                                        <p className="text-xs text-slate-400 font-bold mt-1">Transaction logged and stock deducted.</p>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs space-y-2.5 border border-slate-100 max-w-sm mx-auto font-medium text-slate-600">
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Material:</span> {checkOutTxDetails.materialName}</div>
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Quantity:</span> {checkOutTxDetails.quantity} {checkOutTxDetails.unit}</div>
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Issued To:</span> {checkOutTxDetails.staffName}</div>
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Issued By:</span> {checkOutTxDetails.issuedBy}</div>
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Project:</span> {checkOutTxDetails.projectId}</div>
                                        <div><span className="font-black text-slate-400 mr-2 uppercase tracking-wider">Current Balance:</span> {checkOutTxDetails.balanceStockAfterIssue} {checkOutTxDetails.unit}</div>
                                    </div>

                                    {checkOutTxDetails.photoUrl && (
                                        <div className="max-w-[200px] mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-sm mt-3">
                                            <img src={checkOutTxDetails.photoUrl} alt="Receipt Snapshot" className="w-full h-auto object-cover" />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 max-w-sm mx-auto">
                                        <button
                                            onClick={() => handleShareWhatsApp({
                                                type: 'OUTWARD',
                                                materialName: checkOutTxDetails.materialName,
                                                quantity: checkOutTxDetails.quantity,
                                                unit: checkOutTxDetails.unit,
                                                staffName: checkOutTxDetails.staffName,
                                                projectId: checkOutTxDetails.projectId,
                                                balanceStockAfterIssue: checkOutTxDetails.balanceStockAfterIssue
                                            })}
                                            className="w-full py-3 bg-[#25D366] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#20ba59] transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
                                        >
                                            📱 Share on WhatsApp
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCheckOutSuccess(false);
                                                setView('LIVE_REGISTER');
                                            }}
                                            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const selectedItem = currentStock.find(i => i.itemCode === checkOutItemCode);
                                    if (!selectedItem) {
                                        alert("Please select a valid material.");
                                        return;
                                    }

                                    if (selectedItem.availableStock < checkOutQty) {
                                        alert(`Insufficient stock! Only ${selectedItem.availableStock} ${selectedItem.unit} available.`);
                                        return;
                                    }

                                    setIsLoading(true);
                                    try {
                                        const timestamp = new Date().toISOString();
                                        const res: any = await recordManualTransaction(
                                            selectedItem.name,
                                            checkOutQty,
                                            selectedItem.unit,
                                            'OUTWARD',
                                            checkOutStaffName,
                                            checkOutRemarks || 'Check-Out Slip Entry',
                                            undefined,
                                            checkoutPhoto || undefined,
                                            checkOutProjectName
                                        );

                                        if (res.success) {
                                            setRefreshTrigger(p => p + 1);
                                            const currentBalance = selectedItem.availableStock - checkOutQty;
                                            setCheckOutTxDetails({
                                                timestamp,
                                                materialName: selectedItem.name,
                                                quantity: checkOutQty,
                                                unit: selectedItem.unit,
                                                staffName: checkOutStaffName,
                                                issuedBy: checkOutIssuedBy || 'Gate Operator',
                                                projectId: checkOutProjectName,
                                                balanceStockAfterIssue: currentBalance,
                                                photoUrl: checkoutPhoto || undefined
                                            });
                                            setCheckOutSuccess(true);
                                            // Reset
                                            setCheckOutItemCode('');
                                            setCheckOutQty(1);
                                            setCheckOutStaffName('');
                                            setCheckOutProjectName('');
                                            setCheckOutRemarks('');
                                            setCheckoutPhoto('');
                                        } else {
                                            alert("Failed to issue material: " + (res.error || 'Unknown error'));
                                        }
                                    } catch (err: any) {
                                        alert("Error issuing material: " + err.message);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }} className="space-y-4">
                                    
                                    {/* Material Selector */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Select Material</label>
                                        <select
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                            value={checkOutItemCode}
                                            onChange={(e) => setCheckOutItemCode(e.target.value)}
                                        >
                                            <option value="">Select Material...</option>
                                            {currentStock
                                                .filter(item => item.availableStock > 0)
                                                .map(item => (
                                                    <option key={item.itemCode} value={item.itemCode}>
                                                        {item.name} (Available: {item.availableStock} {item.unit})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* Quantity */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                                            {checkOutItemCode && (
                                                <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
                                                    Max Available: {currentStock.find(i => i.itemCode === checkOutItemCode)?.availableStock || 0}
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            max={checkOutItemCode ? currentStock.find(i => i.itemCode === checkOutItemCode)?.availableStock : undefined}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                            value={checkOutQty}
                                            onChange={(e) => setCheckOutQty(parseInt(e.target.value) || 0)}
                                        />
                                    </div>

                                    {/* Issued To Staff */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Issued To (Staff Name)</label>
                                        <select
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                            value={checkOutStaffName}
                                            onChange={(e) => setCheckOutStaffName(e.target.value)}
                                        >
                                            <option value="">Select Staff...</option>
                                            {localStaffList.map(staff => (
                                                <option key={staff} value={staff}>{staff}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Project Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Project Name</label>
                                        <select
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                            value={checkOutProjectName}
                                            onChange={(e) => setCheckOutProjectName(e.target.value)}
                                        >
                                            <option value="">Select Project...</option>
                                            {projectList.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Issued By */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Issued By (Store Keeper)</label>
                                        <select
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                            value={checkOutIssuedBy}
                                            onChange={(e) => setCheckOutIssuedBy(e.target.value)}
                                        >
                                            <option value="">Select Issuer...</option>
                                            {localStaffList.map(staff => (
                                                <option key={staff} value={staff}>{staff}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Remarks */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Remarks</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Issue slip notes or audit observations..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none resize-none"
                                            value={checkOutRemarks}
                                            onChange={(e) => setCheckOutRemarks(e.target.value)}
                                        />
                                    </div>

                                    {/* Optional Camera Capture */}
                                    <div className="space-y-2 pt-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Digital Evidence (Optional)</label>
                                        {checkoutPhoto ? (
                                            <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200">
                                                <img src={checkoutPhoto} alt="Snapshot Preview" className="w-40 h-auto" />
                                                <button
                                                    type="button"
                                                    onClick={() => setCheckoutPhoto('')}
                                                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : webcamTarget === 'CHECKOUT' ? (
                                            <div className="space-y-2">
                                                <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm rounded-xl border border-slate-300 bg-black" />
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={capturePhoto} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Take Snapshot</button>
                                                    <button type="button" onClick={stopWebcam} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">Cancel</button>
                                                </div>
                                                <canvas ref={canvasRef} className="hidden" />
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => startWebcam('CHECKOUT')}
                                                className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-bold"
                                            >
                                                <Camera className="w-4 h-4" /> Capture Photo
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3.5 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md shadow-amber-600/15 mt-6 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "Issue Material"}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* 4. LIVE REGISTER VIEW */}
                    {view === 'LIVE_REGISTER' && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
                            {/* Filter Bar & Search */}
                            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                                    {[
                                        { id: 'TODAY', label: 'Today' },
                                        { id: 'WEEK', label: 'This Week' },
                                        { id: 'MONTH', label: 'This Month' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setLiveFilter(f.id as any)}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                liveFilter === f.id 
                                                    ? 'bg-[#0e4368] text-white shadow-sm' 
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Showing {getFilteredTransactions(masterTransactions).length} transactions
                                </span>
                            </div>

                            {/* Main Live Register Table */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                                        <thead>
                                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                                <th className="py-4 px-4">Date</th>
                                                <th className="py-4 px-4">Material</th>
                                                <th className="py-4 px-4 text-center">In</th>
                                                <th className="py-4 px-4 text-center">Out</th>
                                                <th className="py-4 px-4 text-center">Balance</th>
                                                <th className="py-4 px-4">Staff / Supplier</th>
                                                <th className="py-4 px-4">Remarks</th>
                                                <th className="py-4 px-4 text-center">WhatsApp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {getFilteredTransactions(masterTransactions).map(tx => (
                                                <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="py-4 px-4 text-slate-500 font-medium">
                                                        {new Date(tx.timestamp).toLocaleString('en-IN', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="font-bold text-slate-900 block">{tx.materialName}</span>
                                                        <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase block">{tx.itemCode}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        {tx.type === 'INWARD' ? (
                                                            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">+{tx.quantity}</span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        {tx.type === 'OUTWARD' ? (
                                                            <span className="font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">-{tx.quantity}</span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-black text-slate-800 bg-slate-50/30">{tx.balanceStockAfterIssue} {tx.unit}</td>
                                                    <td className="py-4 px-4">
                                                        <span className="font-bold text-slate-700 block">{tx.staffName}</span>
                                                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Issued by: {tx.issuedBy}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-slate-400 italic">{tx.remarks}</td>
                                                    <td className="py-4 px-4 text-center">
                                                        <button
                                                            onClick={() => handleShareWhatsApp(tx)}
                                                            className="inline-flex items-center justify-center p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all border border-emerald-150"
                                                            title="Share slip on WhatsApp"
                                                        >
                                                            <Smartphone className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {getFilteredTransactions(masterTransactions).length === 0 && (
                                                <tr>
                                                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">No register entries found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. CURRENT STOCK VIEW */}
                    {view === 'CURRENT_STOCK' && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                                        <thead>
                                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                                <th className="py-4 px-4">Sr No.</th>
                                                <th className="py-4 px-4">Material Code</th>
                                                <th className="py-4 px-4">Material Name</th>
                                                <th className="py-4 px-4">Category</th>
                                                <th className="py-4 px-4 text-center">Available Qty</th>
                                                <th className="py-4 px-4">Unit</th>
                                                <th className="py-4 px-4 text-center">Status</th>
                                                <th className="py-4 px-4 text-center print:hidden">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {currentStock
                                                .filter(item => {
                                                    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        item.category.toLowerCase().includes(searchQuery.toLowerCase());
                                                })
                                                .map((item, idx) => {
                                                    const isLowStock = item.availableStock <= (item.minThreshold || 5);
                                                    return (
                                                        <tr key={item.itemCode} className={`transition-colors ${
                                                            isLowStock 
                                                                ? 'bg-rose-50/20 text-rose-700 hover:bg-rose-50/40' 
                                                                : 'hover:bg-slate-50/30'
                                                        }`}>
                                                            <td className="py-4 px-4 font-bold text-slate-500">{String(idx + 1).padStart(3, '0')}</td>
                                                            <td className="py-4 px-4 font-bold text-slate-600">{item.itemCode}</td>
                                                            <td className="py-4 px-4 font-black">{item.name}</td>
                                                            <td className="py-4 px-4 font-bold text-slate-500 uppercase">{item.category}</td>
                                                            <td className="py-4 px-4 text-center font-black text-sm">{item.availableStock}</td>
                                                            <td className="py-4 px-4 font-bold text-slate-500 uppercase">{item.unit}</td>
                                                            <td className="py-4 px-4 text-center">
                                                                {isLowStock ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">
                                                                        {item.availableStock === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                        SECURE
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4 text-center print:hidden">
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setModalConfig({ type: 'ITEM', data: item })}
                                                                        className="p-1.5 hover:bg-slate-100 rounded-xl text-indigo-600 hover:text-indigo-800 transition-all border border-transparent hover:border-slate-150"
                                                                        title="Adjust stock level"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    {userRole === 'ADMIN' && (
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => setModalConfig({ type: 'DELETE', data: item })}
                                                                            className="p-1.5 hover:bg-slate-100 rounded-xl text-rose-600 hover:text-rose-800 transition-all border border-transparent hover:border-slate-150"
                                                                            title="Delete material"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            {currentStock.length === 0 && (
                                                <tr>
                                                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">No stock items in catalog.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 6. REPORTS VIEW */}
                    {view === 'REPORTS' && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
                            {/* Month switcher tabs */}
                            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl w-full overflow-x-auto no-scrollbar">
                                    {MONTH_NAMES.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setMonthlyViewMonth(m)}
                                            className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                                monthlyViewMonth === m 
                                                    ? 'bg-[#0e4368] text-white shadow-sm' 
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Monthly Register Details */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 overflow-hidden">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                        {monthlyViewMonth} Monthly Register Entries
                                    </h3>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                        Total: {monthlyTransactions.length} Entries
                                    </span>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                                <th className="py-4 px-4">Date & Time</th>
                                                <th className="py-4 px-4">Material</th>
                                                <th className="py-4 px-4 text-center">Flow Type</th>
                                                <th className="py-4 px-4 text-center">Quantity</th>
                                                <th className="py-4 px-4 text-center">Balance Stock</th>
                                                <th className="py-4 px-4">Staff / Operator</th>
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
                                                        <td className="py-4 px-4">
                                                            <span className="font-bold text-slate-900 block">{tx.materialName}</span>
                                                            <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase block">{tx.itemCode}</span>
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                                                                tx.type === 'INWARD' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                            }`}>
                                                                {tx.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-center font-bold">{tx.quantity} {tx.unit}</td>
                                                        <td className="py-4 px-4 text-center font-black text-slate-700 bg-slate-50/30">{tx.balanceStockAfterIssue} {tx.unit}</td>
                                                        <td className="py-4 px-4 text-slate-600 font-medium">{tx.staffName}</td>
                                                        <td className="py-4 px-4 text-slate-400 italic">{tx.remarks}</td>
                                                    </tr>
                                                ))}
                                            {monthlyTransactions.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">No entries found for {monthlyViewMonth}.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. SETTINGS VIEW */}
                    {view === 'SETTINGS' && (
                        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
                            {/* Roster / Staff settings */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                                <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Operator & Staff Roster</h3>
                                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Manage active staff members authorized for check-out</p>
                                    </div>
                                    <button
                                        onClick={() => setIsAddStaffModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                                    >
                                        <Plus className="w-3 h-3" /> Add Staff
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {localStaffList.map(name => (
                                        <div key={name} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-200 transition-colors">
                                            <span>{name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Project registry settings */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-3 mb-4">Active Projects</h3>
                                <div className="flex flex-wrap gap-2">
                                    {projectList.map(proj => (
                                        <span key={proj} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black tracking-wide uppercase border border-slate-150">
                                            {proj}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>

            {/* Modals */}
            {isAddStaffModalOpen && (
                <AddStaffModal 
                    isOpen={isAddStaffModalOpen}
                    onClose={() => setIsAddStaffModalOpen(false)}
                    onAdd={handleAddStaffSuccess}
                    existingStaff={localStaffList}
                />
            )}

            {/* EDIT STOCK LEVEL MODAL */}
            {modalConfig && modalConfig.type === 'ITEM' && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Adjust Stock: {modalConfig.data.name}</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Audit Correction ({modalConfig.data.itemCode})</p>
                            </div>
                            <button onClick={() => setModalConfig(null)} className="p-1.5 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Available Stock Level</label>
                                <input 
                                    type="number" 
                                    defaultValue={modalConfig.data.availableStock}
                                    id="stock-adjust-input"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xl font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-850"
                                />
                            </div>
                            <button 
                                onClick={async () => {
                                    const input = document.getElementById('stock-adjust-input') as HTMLInputElement;
                                    const newQty = parseInt(input.value);
                                    if (isNaN(newQty) || newQty < 0) {
                                        alert("Please enter a valid stock level.");
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
                                className="w-full py-3.5 bg-[#0e4368] hover:bg-[#0b3350] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-[10px] uppercase tracking-widest disabled:opacity-50"
                            >
                                {isLoading ? 'Updating Stock...' : 'APPLY CORRECTION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MATERIAL RECORD MODAL */}
            {modalConfig && modalConfig.type === 'DELETE' && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 p-8 text-center space-y-6">
                        <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Delete Material Record?</h3>
                            <p className="text-xs text-slate-400 mt-2 font-bold leading-normal">Are you sure you want to permanently delete <strong className="text-slate-700">{modalConfig.data.name}</strong> ({modalConfig.data.itemCode})? This action cannot be undone.</p>
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

        </div>
    );
};

export default StoreStockReport;

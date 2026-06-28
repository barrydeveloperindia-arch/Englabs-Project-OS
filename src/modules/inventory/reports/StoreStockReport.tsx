import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { storeGuardian } from '@shared/services/store_guardian';
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
    ClipboardList,
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
import { InventoryItem, StockTransaction } from '@shared/services/gate_system';
import { 
    fetchCurrentStock, 
    fetchMasterRegister, 
    fetchMonthlyRegister, 
    updateInventoryItemStock, 
    deleteInventoryItem, 
    addInventoryItem, 
    recordManualTransaction,
    migrateJune11Transactions,
    MasterRegisterEntry,
    CurrentStockItem,
    getEstimatedPrice,
    deleteTransaction,
    editTransaction,
    updateInventoryItemDetails,
    MaterialRequirement,
    fetchMaterialRequirements,
    addMaterialRequirement,
    updateMaterialRequirementStatus,
    deleteMaterialRequirement,
    updateMaterialRequirement
} from '@shared/services/inventory_service';
import logo from '@/assets/englabs_logo.png';
import { STAFF_ROSTER } from '@shared/utils/config/constants';
import AddStaffModal from '@shared/components/common/AddStaffModal';
import NewProjectModal from '@shared/components/common/NewProjectModal';

export const normalizeRackLocation = (loc: string): string => {
    if (!loc) return 'MAIN STORE';
    const trimmed = loc.trim();
    if (trimmed.toUpperCase() === 'MAIN STORE' || trimmed.toUpperCase() === 'ALL' || trimmed.toUpperCase() === 'N/A' || trimmed.toUpperCase() === 'UNASSIGNED') {
        return trimmed;
    }
    const match = trimmed.match(/rack\s*(?:no\.?|-|\s)?\s*(\d+)/i);
    if (match) {
        return `Rack No. ${match[1]}`;
    }
    return trimmed;
};

const copyToClipboard = (text: string): Promise<void> => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    } else {
        return new Promise((resolve, reject) => {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.top = "0";
                textArea.style.left = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    resolve();
                } else {
                    reject(new Error("Fallback copy failed"));
                }
            } catch (err) {
                reject(err);
            }
        });
    }
};

interface StoreStockReportProps {
    userRole?: 'ADMIN' | 'STAFF';
    projects?: any[];
    staffList?: string[];
    onAddStaff?: (name: string) => void;
    onAddProject?: (newProj: any) => void;
    externalRefreshTrigger?: number;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const STANDARD_UNITS = ['Nos', 'Pcs', 'Box', 'Packet', 'Ltr', 'Mtr', 'Mini', 'Max', 'Kg', 'Roll', 'Set', 'ml', 'Balti'];

const StoreStockReport: React.FC<StoreStockReportProps> = ({ 
    userRole = 'ADMIN', 
    projects = [],
    staffList: propStaffList,
    onAddStaff,
    onAddProject,
    externalRefreshTrigger = 0
}) => {
    // Navigation state matching folder structure: Dashboard, Check In, Check Out, Live Register, Current Stock, Reports, Settings
    const [view, setView] = useState<'DASHBOARD' | 'CHECK_IN' | 'CHECK_OUT' | 'LIVE_REGISTER' | 'CURRENT_STOCK' | 'REPORTS' | 'SETTINGS' | 'REQUIREMENTS'>('DASHBOARD');
    const hasMigratedRef = useRef(false);
    
    // Live Register Filter state
    const [liveFilter, setLiveFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('MONTH');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [liveCategoryFilter, setLiveCategoryFilter] = useState<string>('ALL');
    const [liveRackFilter, setLiveRackFilter] = useState<string>('ALL');
    const [liveTypeFilter, setLiveTypeFilter] = useState<string>('ALL');

    // Monthly Register Filter state
    const [monthlyCategoryFilter, setMonthlyCategoryFilter] = useState<string>('ALL');
    const [monthlyRackFilter, setMonthlyRackFilter] = useState<string>('ALL');
    const [monthlyTypeFilter, setMonthlyTypeFilter] = useState<string>('ALL');

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
    const [selectedStockCategory, setSelectedStockCategory] = useState("ALL");
    const [selectedStockRack, setSelectedStockRack] = useState("ALL");
    const [selectedStockStatus, setSelectedStockStatus] = useState("ALL");
    const [isCreateMaterialModalOpen, setIsCreateMaterialModalOpen] = useState(false);
    // Create Material modal form states
    const [createCategory, setCreateCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [createUnit, setCreateUnit] = useState('');
    const [customUnit, setCustomUnit] = useState('');
    const [createLocation, setCreateLocation] = useState('');
    const [customLocation, setCustomLocation] = useState('');
    
    // Loading and reload triggers
    const [isLoading, setIsLoading] = useState(false);
    const isSubmittingRef = useRef(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Sync external refresh triggers (like App.tsx checkouts) to our internal refresh
    useEffect(() => {
        if (externalRefreshTrigger > 0) {
            setRefreshTrigger(p => p + 1);
        }
    }, [externalRefreshTrigger]);

    // Check-in form states
    const [checkInItemCode, setCheckInItemCode] = useState('');
    const [checkInItemName, setCheckInItemName] = useState('');
    const [checkInQty, setCheckInQty] = useState<number>(1);
    const [checkInUnitMode, setCheckInUnitMode] = useState<'L' | 'ML'>('L');
    const [checkInUnit, setCheckInUnit] = useState('Nos');
    const [checkInCategory, setCheckInCategory] = useState('General');
    const [checkInSupplier, setCheckInSupplier] = useState('');
    const [checkInProject, setCheckInProject] = useState('');
    const [checkInReceivedBy, setCheckInReceivedBy] = useState('Arjun Tiwari');
    const [checkInRemarks, setCheckInRemarks] = useState('');
    const [checkInSuccess, setCheckInSuccess] = useState(false);
    const [checkInTxDetails, setCheckInTxDetails] = useState<any>(null);
    const [isNewItemMode, setIsNewItemMode] = useState(false);
    const [showAdvancedCheckIn, setShowAdvancedCheckIn] = useState(false);

    // Check-out form states
    const [checkOutItemCode, setCheckOutItemCode] = useState('');
    const [checkOutQty, setCheckOutQty] = useState<number>(1);
    const [checkOutUnitMode, setCheckOutUnitMode] = useState<'L' | 'ML'>('L');
    const [checkOutStaffName, setCheckOutStaffName] = useState('');
    const [checkOutProjectName, setCheckOutProjectName] = useState('');
    const [checkOutIssuedBy, setCheckOutIssuedBy] = useState('');
    const [checkOutRemarks, setCheckOutRemarks] = useState('');
    const [checkOutSuccess, setCheckOutSuccess] = useState(false);
    const [checkOutTxDetails, setCheckOutTxDetails] = useState<any>(null);
    const [checkoutPhoto, setCheckoutPhoto] = useState('');
    const [showAdvancedCheckOut, setShowAdvancedCheckOut] = useState(false);
    const [showAdvancedLiveRegister, setShowAdvancedLiveRegister] = useState(false);
    const [showAdvancedCurrentStock, setShowAdvancedCurrentStock] = useState(false);
    const [showAdvancedReports, setShowAdvancedReports] = useState(false);
    const [checkInSearch, setCheckInSearch] = useState('');
    const [checkInLocation, setCheckInLocation] = useState('MAIN STORE');
    const [checkOutLocation, setCheckOutLocation] = useState('MAIN STORE');
    const [showCheckInDropdown, setShowCheckInDropdown] = useState(false);
    const [checkOutSearch, setCheckOutSearch] = useState('');
    const [showCheckOutDropdown, setShowCheckOutDropdown] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

    // Requirements states
    const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
    const [reqMaterialCode, setReqMaterialCode] = useState('');
    const [reqSearch, setReqSearch] = useState('');
    const [showReqDropdown, setShowReqDropdown] = useState(false);
    const [reqQty, setReqQty] = useState<number>(1);
    const [reqUnit, setReqUnit] = useState('Nos');
    const [reqProject, setReqProject] = useState('');
    const [reqRequestedBy, setReqRequestedBy] = useState('');
    const [reqRemarks, setReqRemarks] = useState('');
    const [reqSuccess, setReqSuccess] = useState(false);
    const [lastSubmittedReq, setLastSubmittedReq] = useState<any>(null);
    const [editingRequirement, setEditingRequirement] = useState<MaterialRequirement | null>(null);
    const [reqFilterStatus, setReqFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'REJECTED'>('ALL');
    const [reqSearchCode, setReqSearchCode] = useState('');
    const [reqSearchName, setReqSearchName] = useState('');
    const [reqSearchProject, setReqSearchProject] = useState('');
    const [reqSearchStaff, setReqSearchStaff] = useState('');
    const [rackSearchQuery, setRackSearchQuery] = useState('');
    const [rackFilterType, setRackFilterType] = useState<'ALL' | 'LOW_STOCK' | 'EMPTY'>('ALL');
    const [modalConfig, setModalConfig] = useState<{ type: 'ITEM' | 'DELETE' | 'EDIT_TX' | 'DELETE_TX', data: any } | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        message: string;
        confirmText?: string;
        theme?: 'indigo' | 'rose' | 'emerald';
        onConfirm: () => void;
    } | null>(null);


    // Webcam / Camera Capture states (Optional Feature inside Checkout & Settings)
    const [webcamTarget, setWebcamTarget] = useState<'CHECKOUT' | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const webcamStreamRef = useRef<MediaStream | null>(null);

    // Project List from props
    const DEFAULT_PROJECT_IDS = ['C2718', 'C2737', 'C2931', 'C3020', 'C4867', 'C5178', 'C5191', 'C5192', 'C5193', 'C5195', 'C5197', 'C5198', 'C5207', 'C5209', 'C5210', 'C5212', 'C5213', 'C5216', 'C5223', 'C5224', 'C5227', 'C5228', 'C5229'];
    const rawProjectList = (projects && projects.length > 0)
        ? projects.map((p: any) => p.projectId)
        : DEFAULT_PROJECT_IDS;
    const projectList = ['GENERAL', ...rawProjectList.filter((p: string) => p !== 'GENERAL')];

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
                if (!hasMigratedRef.current) {
                    await migrateJune11Transactions();
                    hasMigratedRef.current = true;
                }
                const stockData = await fetchCurrentStock();
                setCurrentStock(stockData);
                
                const masterData = await fetchMasterRegister();
                setMasterTransactions(masterData);

                const monthlyData = await fetchMonthlyRegister(monthlyViewMonth);
                setMonthlyTransactions(monthlyData);

                const reqData = await fetchMaterialRequirements();
                setRequirements(reqData);
            } catch (err) {
                console.error("Error loading registry data:", err);
                storeGuardian.logError('DATA_FETCH', 'Registry load failed', 'StoreStockReport Init', String(userRole));
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

    const uniqueVendors = Array.from(new Set(
        masterTransactions
            .filter(tx => tx.type === 'INWARD' && tx.staffName && tx.staffName.trim() !== '' && tx.staffName.trim().toUpperCase() !== 'LOCAL PURCHASE' && tx.staffName.trim() !== 'Store Operator' && tx.staffName.trim() !== 'Admin')
            .map(tx => tx.staffName.trim())
    )).sort((a, b) => a.localeCompare(b));

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
            const filtered = currentStock.filter(item => {
                const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
                if (!matchesSearch) return false;

                if (selectedStockCategory !== 'ALL' && item.category !== selectedStockCategory) return false;

                if (selectedStockRack !== 'ALL') {
                    const itemRack = normalizeRackLocation(item.location || 'MAIN STORE');
                    if (itemRack !== selectedStockRack) return false;
                }

                if (selectedStockStatus !== 'ALL') {
                    const isLow = item.availableStock <= (item.minThreshold || 5);
                    const isOut = item.availableStock === 0;
                    if (selectedStockStatus === 'OUT' && !isOut) return false;
                    if (selectedStockStatus === 'LOW' && (!isLow || isOut)) return false;
                    if (selectedStockStatus === 'SECURE' && isLow) return false;
                }

                return true;
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
                return (tx.materialName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (tx.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (tx.staffName || '').toLowerCase().includes(searchQuery.toLowerCase());
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
        } else if (view === 'REQUIREMENTS') {
            sheetName = "Material Requirements";
            const filtered = requirements.filter(req => {
                return (req.materialName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (req.materialCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (req.projectId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (req.requestedBy || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (req.remarks || '').toLowerCase().includes(searchQuery.toLowerCase());
            });
            dataList = filtered.map((req, idx) => ({
                'Sr No.': idx + 1,
                'Request Date': new Date(req.timestamp).toLocaleString(),
                'Project ID': req.projectId,
                'Material Code': req.materialCode,
                'Material Name': req.materialName,
                'Quantity': req.quantity,
                'Unit': req.unit,
                'Requested By': req.requestedBy,
                'Status': req.status,
                'Remarks': req.remarks
            }));
        } else {
            alert("Please select a Register, Stock, or Requirements tab to export.");
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

    // Shared WhatsApp trigger for transaction slips
    const handleShareWhatsApp = (tx: any) => {
        const dateStr = new Date(tx.timestamp || Date.now()).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        }).replace(/ /g, '-');
        
        let text = "";
        if (tx.status) {
            // It's a Material Requirement Request!
            text = `STORE REQUIREMENT REQUEST\n\nDate: ${dateStr}\nMaterial: ${tx.materialName}\nCode: ${tx.materialCode}\nQuantity: ${tx.quantity} ${tx.unit || 'Nos'}\nRequested By: ${tx.requestedBy}\nProject: ${tx.projectId}\nStatus: ${tx.status}\nRemarks: ${tx.remarks || 'None'}\n\nENGLABS STORE`;
        } else {
            const stockItem = currentStock.find(i => i.name === tx.materialName || i.itemCode === tx.materialName);
            const itemRack = tx.location || (stockItem ? stockItem.location : '');
            const rackInfo = itemRack ? ` [Rack: ${itemRack}]` : "";

            if (tx.type === 'INWARD' || tx.type === 'IN') {
                text = `STORE RECEIPT SLIP\n\nDate: ${dateStr}\nMaterial: ${tx.materialName}${rackInfo}\nQuantity: ${tx.quantity} ${tx.unit || 'Nos'}\nReceived From: ${tx.staffName}\nProject: ${tx.projectId || 'N/A'}\nReceived By: ${tx.issuedBy || 'Arjun Tiwari'}\n\nCurrent Balance: ${tx.balanceStockAfterIssue} ${tx.unit || 'Nos'}\n\nENGLABS STORE`;
            } else {
                text = `STORE ISSUE SLIP\n\nDate: ${dateStr}\nMaterial: ${tx.materialName}${rackInfo}\nQuantity: ${tx.quantity} ${tx.unit || 'Nos'}\nIssued To: ${tx.staffName}\nProject: ${tx.projectId}\nIssued By: ${tx.issuedBy || 'Gate Operator'}\n\nCurrent Balance: ${tx.balanceStockAfterIssue} ${tx.unit || 'Nos'}\n\nENGLABS STORE`;
            }
        }

        const shareTitle = tx.status ? 'STORE REQUIREMENT REQUEST' : (tx.type === 'INWARD' || tx.type === 'IN' ? 'STORE RECEIPT SLIP' : 'STORE ISSUE SLIP');

        if (navigator.share) {
            navigator.share({
                title: shareTitle,
                text: text
            }).catch(err => {
                console.error("Web share failed", err);
                const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
            });
        } else {
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    };

    const handleShareAllWhatsApp = () => {
        const pending = requirements.filter(r => r.status === 'PENDING');
        if (pending.length === 0) {
            alert("No pending requirements to share.");
            return;
        }

        let text = "*PENDING MATERIAL REQUIREMENTS*\n----------------------------------\n";
        pending.forEach((req, idx) => {
            text += `${idx + 1}. *${req.materialName}*\n`;
            text += `   Code: ${req.materialCode}\n`;
            text += `   Qty: ${req.quantity} ${req.unit || 'Nos'}\n`;
            text += `   Project: ${req.projectId}\n`;
            text += `   Requested By: ${req.requestedBy}\n`;
            if (req.remarks) {
                text += `   Remarks: ${req.remarks}\n`;
            }
            text += `----------------------------------\n`;
        });
        text += "\nENGLABS STORE";

        if (navigator.share) {
            navigator.share({
                title: 'PENDING MATERIAL REQUIREMENTS',
                text: text
            }).catch(err => {
                console.error("Web share failed", err);
                const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
            });
        } else {
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    };

    const handleShareStockWhatsApp = () => {
        const filtered = currentStock.filter(item => {
            const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            if (selectedStockCategory !== 'ALL' && item.category !== selectedStockCategory) return false;

            if (selectedStockRack !== 'ALL') {
                const itemRack = normalizeRackLocation(item.location || 'MAIN STORE');
                if (itemRack !== selectedStockRack) return false;
            }

            if (selectedStockStatus !== 'ALL') {
                const isLow = item.availableStock <= (item.minThreshold || 5);
                const isOut = item.availableStock === 0;
                if (selectedStockStatus === 'OUT' && !isOut) return false;
                if (selectedStockStatus === 'LOW' && (!isLow || isOut)) return false;
                if (selectedStockStatus === 'SECURE' && isLow) return false;
            }

            return true;
        });

        const dateStr = new Date().toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        }).replace(/ /g, '-');

        let text = `ENGLABS CURRENT STOCK REPORT\n`;
        text += `Date: ${dateStr}\n`;
        text += `Total Items: ${filtered.length}\n`;
        if (searchQuery) {
            text += `Filter Query: "${searchQuery}"\n`;
        }
        text += `\n`;

        filtered.forEach((item, idx) => {
            const isLowStock = item.availableStock <= (item.minThreshold || 5);
            const status = isLowStock ? (item.availableStock === 0 ? '🔴 OUT' : '🟡 LOW') : '🟢 OK';
            const rackLoc = item.location ? normalizeRackLocation(item.location) : 'N/A';
            const idxStr = String(idx + 1).padStart(3, '0');
            text += `${idxStr}. ${item.name} (${item.itemCode}): ${item.availableStock} ${item.unit || 'Nos'} [Rack: ${rackLoc}] [${status}]\n`;
        });

        text += `\nENGLABS STORE`;

        // Check if Web Share API is available (optimal for Capacitor mobile)
        if (navigator.share) {
            navigator.share({
                title: 'ENGLABS CURRENT STOCK REPORT',
                text: text
            }).catch(err => {
                console.error("Web share failed, trying fallback to WhatsApp URL", err);
                copyToClipboard(text).then(() => {
                    alert("Stock report copied to clipboard! Opening WhatsApp...");
                }).catch(cErr => console.error("Clipboard copy failed:", cErr));
                
                const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
            });
        } else {
            copyToClipboard(text).then(() => {
                alert("Stock report copied to clipboard! Opening WhatsApp...");
            }).catch(cErr => console.error("Clipboard copy failed:", cErr));
            
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    };

    const handleShareMonthlyRegisterWhatsApp = () => {
        const filtered = monthlyTransactions.filter(tx => {
            const matchesSearch = (tx.materialName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tx.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tx.staffName || '').toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            if (monthlyTypeFilter !== 'ALL' && tx.type !== monthlyTypeFilter) return false;

            if (monthlyCategoryFilter !== 'ALL' && tx.category !== monthlyCategoryFilter) return false;

            if (monthlyRackFilter !== 'ALL') {
                const stockItem = currentStock.find(i => i.itemCode === tx.itemCode);
                const itemRack = normalizeRackLocation(tx.location || (stockItem && stockItem.location) || 'MAIN STORE');
                if (itemRack !== monthlyRackFilter) return false;
            }

            return true;
        });

        if (filtered.length === 0) {
            alert(`No entries found for ${monthlyViewMonth} to share.`);
            return;
        }

        let text = `*ENGLABS STORE REGISTER - ${monthlyViewMonth.toUpperCase()}*\n`;
        text += `Total Logged Entries: ${filtered.length}\n`;
        
        const checkIns = filtered.filter(tx => tx.type === 'INWARD');
        const checkOuts = filtered.filter(tx => tx.type === 'OUTWARD');
        
        text += `Check-Ins: ${checkIns.length}\n`;
        text += `Check-Outs: ${checkOuts.length}\n\n`;

        text += `*LOGGED OPERATIONS:*\n`;
        filtered.forEach((tx, idx) => {
            const dateStr = new Date(tx.timestamp).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short'
            });
            const flowChar = tx.type === 'INWARD' ? '🟢 IN' : '🟡 OUT';
            const personLabel = tx.type === 'INWARD' ? `[Received by: ${tx.issuedBy || 'Arjun Tiwari'}]` : `[Issued by: ${tx.issuedBy || 'Gate Operator'}]`;
            text += `${idx + 1}. [${dateStr}] [${flowChar}] *${tx.materialName}* (${tx.itemCode}): ${tx.quantity} ${tx.unit || 'Nos'} - ${tx.staffName} (${tx.projectId || 'N/A'}) ${personLabel}\n`;
        });

        text += `\nENGLABS STORE`;

        if (navigator.share) {
            navigator.share({
                title: `${monthlyViewMonth.toUpperCase()} Monthly Register Summary`,
                text: text
            }).catch(err => {
                console.error("Web share failed, trying fallback to WhatsApp URL", err);
                copyToClipboard(text).then(() => {
                    alert("Monthly register summary copied to clipboard! Opening WhatsApp...");
                }).catch(cErr => console.error("Clipboard copy failed:", cErr));
                
                const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
            });
        } else {
            copyToClipboard(text).then(() => {
                alert("Monthly register summary copied to clipboard! Opening WhatsApp...");
            }).catch(cErr => console.error("Clipboard copy failed:", cErr));
            
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    };

    const handleShareLiveRegisterWhatsApp = () => {
        const filtered = getFilteredTransactions(masterTransactions);

        if (filtered.length === 0) {
            alert("No live transactions found to share with the current filters.");
            return;
        }

        let filterTitle = 'LIVE REGISTER';
        if (liveFilter === 'TODAY') filterTitle = 'TODAY\'S REGISTER';
        else if (liveFilter === 'WEEK') filterTitle = 'WEEKLY REGISTER';
        else if (liveFilter === 'MONTH') filterTitle = 'MONTHLY REGISTER';
        else if (liveFilter === 'CUSTOM') filterTitle = 'CUSTOM RANGE REGISTER';

        let text = `*ENGLABS STORE ${filterTitle}*\n`;
        text += `Total Transactions: ${filtered.length}\n`;
        
        const checkIns = filtered.filter(tx => tx.type === 'INWARD');
        const checkOuts = filtered.filter(tx => tx.type === 'OUTWARD');
        
        text += `Check-Ins: ${checkIns.length}\n`;
        text += `Check-Outs: ${checkOuts.length}\n\n`;

        text += `*LOGGED OPERATIONS:*\n`;
        filtered.forEach((tx, idx) => {
            const dateStr = new Date(tx.timestamp).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            const flowChar = tx.type === 'INWARD' ? '🟢 IN' : '🟡 OUT';
            const personLabel = tx.type === 'INWARD' ? `[Received by: ${tx.issuedBy || 'Arjun Tiwari'}]` : `[Issued by: ${tx.issuedBy || 'Gate Operator'}]`;
            text += `${idx + 1}. [${dateStr}] [${flowChar}] *${tx.materialName}* (${tx.itemCode}): ${tx.quantity} ${tx.unit || 'Nos'} - ${tx.staffName} (${tx.projectId || 'N/A'}) ${personLabel}\n`;
        });

        text += `\nENGLABS STORE`;

        if (navigator.share) {
            navigator.share({
                title: `ENGLABS Store ${filterTitle}`,
                text: text
            }).catch(err => {
                console.error("Web share failed, trying fallback to WhatsApp URL", err);
                copyToClipboard(text).then(() => {
                    alert("Live register summary copied to clipboard! Opening WhatsApp...");
                }).catch(cErr => console.error("Clipboard copy failed:", cErr));
                
                const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
            });
        } else {
            copyToClipboard(text).then(() => {
                alert("Live register summary copied to clipboard! Opening WhatsApp...");
            }).catch(cErr => console.error("Clipboard copy failed:", cErr));
            
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    };

    // Helper to compute rack mapping
    const computeRackInventory = () => {
        const rackMap: Record<string, CurrentStockItem[]> = {};
        
        // Seed standard racks
        const STANDARD_RACKS = ['Rack No. 1', 'Rack No. 2', 'Rack No. 3', 'Rack No. 4', 'Rack No. 5', 'Rack No. 6', 'Rack B-01'];
        STANDARD_RACKS.forEach(r => {
            rackMap[r] = [];
        });

        currentStock.forEach(item => {
            const loc = item.location ? normalizeRackLocation(item.location) : 'Unassigned';
            if (!rackMap[loc]) {
                rackMap[loc] = [];
            }
            rackMap[loc].push(item);
        });

        // Convert to array
        let racksList = Object.keys(rackMap).map(name => ({
            name,
            items: rackMap[name]
        }));

        // Apply filters
        if (rackSearchQuery) {
            const query = rackSearchQuery.toLowerCase();
            racksList = racksList.filter(rack => {
                const matchesRackName = rack.name.toLowerCase().includes(query);
                const matchesMaterial = rack.items.some(item => 
                    item.name.toLowerCase().includes(query) || 
                    item.itemCode.toLowerCase().includes(query)
                );
                return matchesRackName || matchesMaterial;
            });
        }

        if (rackFilterType === 'EMPTY') {
            racksList = racksList.filter(rack => rack.items.length === 0);
        } else if (rackFilterType === 'LOW_STOCK') {
            racksList = racksList.filter(rack => 
                rack.items.some(item => item.availableStock <= (item.minThreshold || 5))
            );
        }

        // Sort by rack name
        racksList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        return racksList;
    };

    const racksToDisplay = computeRackInventory();



    // Live Register Filter Query helper
    const getFilteredTransactions = (txs: MasterRegisterEntry[]) => {
        return txs.filter(tx => {
            const matchesSearch = (tx.materialName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tx.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tx.staffName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tx.projectId && tx.projectId.toLowerCase().includes(searchQuery.toLowerCase()));
                
            if (!matchesSearch) return false;

            if (liveTypeFilter !== 'ALL' && tx.type !== liveTypeFilter) return false;

            if (liveCategoryFilter !== 'ALL' && tx.category !== liveCategoryFilter) return false;

            if (liveRackFilter !== 'ALL') {
                const stockItem = currentStock.find(i => i.itemCode === tx.itemCode);
                const itemRack = normalizeRackLocation(tx.location || (stockItem && stockItem.location) || 'MAIN STORE');
                if (itemRack !== liveRackFilter) return false;
            }

            const txDate = new Date(tx.timestamp);
            const now = new Date();

            if (liveFilter === 'TODAY') {
                return txDate.toDateString() === now.toDateString();
            } else if (liveFilter === 'WEEK') {
                return (now.getTime() - txDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
            } else if (liveFilter === 'MONTH') {
                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            } else if (liveFilter === 'CUSTOM') {
                if (!customStartDate && !customEndDate) return true;
                const start = customStartDate ? new Date(customStartDate) : null;
                const end = customEndDate ? new Date(customEndDate) : null;
                if (start) {
                    start.setHours(0, 0, 0, 0);
                }
                if (end) {
                    end.setHours(23, 59, 59, 999);
                }
                if (start && txDate < start) return false;
                if (end && txDate > end) return false;
                return true;
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
            storeGuardian.logError('CAMERA_ERROR', 'Access failed', 'StoreStockReport Webcam', String(userRole));
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
                    { id: 'REQUIREMENTS', label: 'Requirements', icon: <ClipboardList className="w-4 h-4" /> },
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
        <div className="flex-1 flex flex-col xl:flex-row min-w-0 min-h-0 bg-[#F8FAFC] print:bg-white print:block relative">
            
            {/* MOBILE SIDEBAR DRAWER OVERLAY */}
            {isMobileSidebarOpen && (
                <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm xl:hidden animate-in fade-in duration-200" onClick={() => setIsMobileSidebarOpen(false)} />
            )}

            {/* MOBILE SIDEBAR DRAWER PANEL */}
            <aside className={`fixed inset-y-0 left-0 z-[120] w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-300 transform xl:hidden pt-safe ${
                isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="absolute top-4 right-4 xl:hidden">
                    <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {renderSidebarContent()}
            </aside>

            {/* STATIC SUB-SIDEBAR (Desktop) */}
            <aside className="hidden xl:flex w-64 bg-slate-900 text-slate-100 flex-col shrink-0 border-r border-slate-800 print:hidden pt-safe">
                {renderSidebarContent()}
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* TOP BAR / HEADER */}
                <header className="h-auto xl:h-20 bg-white border-b border-slate-100 flex flex-col xl:flex-row items-start xl:items-center justify-between px-4 xl:px-8 py-4 xl:py-0 shrink-0 gap-4 xl:gap-0 print:hidden pt-safe">
                    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 xl:gap-6 w-full xl:w-auto">
                        <div className="flex items-center gap-3">
                            {/* Mobile Hamburger toggle button */}
                            <button 
                                type="button"
                                onClick={() => setIsMobileSidebarOpen(true)}
                                className="p-2 hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-600 xl:hidden transition-all shadow-sm shrink-0 mr-2"
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
                                    {view === 'REQUIREMENTS' && 'Material Requirements Tracking'}
                                    {view === 'REPORTS' && 'Monthly Audit Reports'}
                                    {view === 'SETTINGS' && 'System Settings'}
                                </h1>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Store Stock Registry</span>
                            </div>
                        </div>
                        
                        <div className="hidden xl:block h-6 w-px bg-slate-100"></div>
                        
                        {/* Mobile Header Sub-Navigation (Horizontal Scroll) */}
                        <nav className="flex gap-1 bg-slate-50 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar shrink-0 xl:hidden border border-slate-150 relative z-20 pointer-events-auto">
                            {[
                                { id: 'DASHBOARD', label: 'Dashboard' },
                                { id: 'CHECK_IN', label: 'Check In' },
                                { id: 'CHECK_OUT', label: 'Check Out' },
                                { id: 'LIVE_REGISTER', label: 'Live Register' },
                                { id: 'CURRENT_STOCK', label: 'Stock' },
                                { id: 'REQUIREMENTS', label: 'Requirements' },
                                { id: 'REPORTS', label: 'Reports' },
                                { id: 'SETTINGS', label: 'Settings' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => { setView(item.id as any); setCheckInSuccess(false); setCheckOutSuccess(false); }}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all relative z-10 cursor-pointer ${
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
                    <div className="flex items-center gap-2 w-full xl:w-auto justify-between xl:justify-end">
                        {/* Search Bar for Table Views */}
                        {(view === 'LIVE_REGISTER' || view === 'CURRENT_STOCK' || view === 'REPORTS' || view === 'REQUIREMENTS') && (
                            <div className="relative w-full xl:w-44 flex-1 xl:flex-none">
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
                            {(view === 'LIVE_REGISTER' || view === 'CURRENT_STOCK' || view === 'REPORTS' || view === 'REQUIREMENTS') && (
                                <>
                                    <button onClick={handleExportExcel} className="p-2.5 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm" title="Export Excel">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleExportPDF} className="p-2.5 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm" title="Export PDF">
                                        <Printer className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            {view === 'CURRENT_STOCK' && (
                                <button onClick={handleShareStockWhatsApp} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-150 shadow-sm" title="Share Stock on WhatsApp">
                                    <Share2 className="w-4 h-4" />
                                </button>
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
                                <div 
                                    onClick={() => { setView('CURRENT_STOCK'); setSelectedStockStatus('ALL'); }}
                                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                                >
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Items</span>
                                        <h3 className="text-xl font-black text-slate-900">{currentStock.length} Items</h3>
                                    </div>
                                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Package className="w-5 h-5" /></div>
                                </div>
                                
                                <div 
                                    onClick={() => { setView('CURRENT_STOCK'); setSelectedStockStatus('ALL'); }}
                                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                                >
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Stock Value</span>
                                        <h3 className="text-xl font-black text-slate-900">₹{statsTotalStockValue.toLocaleString('en-IN')}</h3>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
                                </div>

                                <div 
                                    onClick={() => { setView('LIVE_REGISTER'); setLiveFilter('TODAY'); }}
                                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                                >
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Today Check-In</span>
                                        <h3 className="text-xl font-black text-slate-900">{todayCheckInCount} Entries</h3>
                                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{todayCheckInQty} units added</span>
                                    </div>
                                    <div className="p-3 bg-teal-50 rounded-2xl text-teal-600"><ArrowDownCircle className="w-5 h-5" /></div>
                                </div>

                                <div 
                                    onClick={() => { setView('LIVE_REGISTER'); setLiveFilter('TODAY'); }}
                                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                                >
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
                                                    <div 
                                                        onClick={() => { setView('LIVE_REGISTER'); setLiveFilter('TODAY'); }}
                                                        className="bg-slate-50 rounded-xl p-3 border border-slate-100 cursor-pointer hover:bg-slate-100 hover:border-slate-200 transition-all"
                                                    >
                                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">Check-In</span>
                                                        <span className="text-base font-black text-slate-800 block mt-0.5">{todayCheckInCount} Entries</span>
                                                    </div>
                                                    <div 
                                                        onClick={() => { setView('LIVE_REGISTER'); setLiveFilter('TODAY'); }}
                                                        className="bg-slate-50 rounded-xl p-3 border border-slate-100 cursor-pointer hover:bg-slate-100 hover:border-slate-200 transition-all"
                                                    >
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
                                                <div 
                                                    onClick={() => { setView('CURRENT_STOCK'); setSelectedStockStatus('ALL'); }}
                                                    className="cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-all"
                                                >
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Total Store Items</span>
                                                    <span className="text-sm font-black text-slate-700">{currentStock.length} Items</span>
                                                </div>
                                                <div 
                                                    onClick={() => { setView('CURRENT_STOCK'); setSelectedStockStatus('LOW'); }}
                                                    className="cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-all"
                                                >
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
                                                        <span className="text-[9px] font-black text-slate-400 tracking-widest">{item.itemCode} • {item.category}</span>
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

                            {/* RACK-WISE INVENTORY VIEW */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 mb-4 gap-3 sm:gap-0">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <Folder className="w-4 h-4 text-indigo-600" /> Rack-Wise Inventory Map
                                        </h3>
                                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Physical warehouse layout and item location map</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Search Rack/Item..." 
                                                className="bg-slate-50 border border-slate-200 rounded-lg py-1 pl-7 pr-3 text-[10px] font-bold focus:border-indigo-500 outline-none w-36"
                                                value={rackSearchQuery}
                                                onChange={(e) => setRackSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10px] font-black uppercase text-slate-600 focus:border-indigo-500 outline-none"
                                            value={rackFilterType}
                                            onChange={(e) => setRackFilterType(e.target.value as any)}
                                        >
                                            <option value="ALL">All Racks</option>
                                            <option value="LOW_STOCK">Low/Out Stock</option>
                                            <option value="EMPTY">Empty Racks</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                                    {racksToDisplay.length === 0 ? (
                                        <p className="text-slate-400 text-xs py-8 text-center font-bold col-span-full">No racks found matching criteria.</p>
                                    ) : (
                                        racksToDisplay.map(rack => {
                                            const totalItems = rack.items.length;
                                            const hasLowStock = rack.items.some(item => item.availableStock <= (item.minThreshold || 5));
                                            const hasOutOfStock = rack.items.some(item => item.availableStock === 0);
                                            
                                            return (
                                                <div key={rack.name} className={`border rounded-2xl p-4 transition-all hover:shadow-md flex flex-col justify-between ${
                                                    hasOutOfStock 
                                                        ? 'bg-rose-50/10 border-rose-100/60 hover:border-rose-200' 
                                                        : hasLowStock 
                                                            ? 'bg-amber-50/10 border-amber-100/60 hover:border-amber-200' 
                                                            : 'bg-slate-50/30 border-slate-100 hover:border-slate-200'
                                                }`}>
                                                    <div>
                                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                                hasOutOfStock 
                                                                    ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                                                    : hasLowStock 
                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                                                        : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                                📍 {rack.name}
                                                            </span>
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                                {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                                                            </span>
                                                        </div>

                                                        {totalItems === 0 ? (
                                                            <span className="text-[10px] italic text-slate-400 font-bold block py-4 text-center bg-slate-50 rounded-xl border border-slate-100">⚠️ EMPTY RACK</span>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {rack.items.map(item => {
                                                                    const isLow = item.availableStock <= (item.minThreshold || 5);
                                                                    const isOut = item.availableStock === 0;
                                                                    return (
                                                                        <div key={item.itemCode} className="flex justify-between items-center text-[10px] font-bold">
                                                                            <span className="text-slate-700 truncate pr-2" title={item.name}>{item.name}</span>
                                                                            <span className={`shrink-0 font-black px-1.5 py-0.5 rounded ${
                                                                                isOut 
                                                                                    ? 'text-rose-600 bg-rose-50' 
                                                                                    : isLow 
                                                                                        ? 'text-amber-600 bg-amber-50' 
                                                                                        : 'text-slate-600 bg-slate-100'
                                                                            }`}>
                                                                                {item.availableStock} {item.unit}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
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
                                <div className="space-y-6 text-center py-4 animate-in fade-in duration-300">
                                    <img src={logo} alt="ENGLABS" className="h-10 object-contain mx-auto mb-4" />
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Check-In Successful!</h3>
                                        {checkInTxDetails?.offline ? (
                                            <p className="text-xs text-amber-600 font-bold mt-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 inline-block">
                                                ⚠️ Saved offline. Syncs automatically when online.
                                            </p>
                                        ) : (
                                            <p className="text-xs text-slate-400 font-bold mt-1">The store inventory has been updated.</p>
                                        )}
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
                                    if (isLoading || isSubmittingRef.current) return;
                                    isSubmittingRef.current = true;
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
                                            // Generate next ENG-XXXX code
                                            const engItems = currentStock.filter(i => i.itemCode && (i.itemCode.toUpperCase().startsWith('ENG')));
                                            let maxEng = 0;
                                            engItems.forEach(i => {
                                                const match = i.itemCode.match(/ENG-?(\d+)/i);
                                                if (match) {
                                                    const num = parseInt(match[1], 10);
                                                    if (num > maxEng) maxEng = num;
                                                }
                                            });
                                            finalItemCode = `ENG-${String(maxEng + 1).padStart(4, '0')}`;
                                            finalItemName = checkInItemName;
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
                                            checkInProject || 'GENERAL',
                                            checkInLocation || 'MAIN STORE',
                                            checkInReceivedBy || 'Arjun Tiwari',
                                            finalItemCode
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
                                                balanceStockAfterIssue: currentBalance,
                                                offline: res.offline || false
                                            });
                                            setCheckInSuccess(true);
                                            // Reset
                                            setCheckInItemCode('');
                                            setCheckInItemName('');
                                            setCheckInSearch('');
                                            setCheckInQty(1);
                                            setCheckInUnitMode('L');
                                            setCheckInSupplier('');
                                            setCheckInProject('');
                                            setCheckInRemarks('');
                                            setIsNewItemMode(false);
                                        } else {
                                            alert("Failed to save transaction: " + (res.error || 'Unknown error'));
                                        }
                                    } catch (err: any) {
                                        console.error(err);
                                        storeGuardian.logError('CHECK_IN', err.message || 'Check-in failed', 'StoreStockReport CheckIn', String(userRole));
                                        alert("Error checking in material: " + err.message);
                                    } finally {
                                        setIsLoading(false);
                                        isSubmittingRef.current = false;
                                    }
                                }} className="space-y-4">
                                    
                                    {/* Material Name Selector */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Material Name</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsNewItemMode(!isNewItemMode);
                                                    setCheckInUnitMode('L');
                                                    setCheckInQty(1);
                                                }}
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
                                                            onChange={(e) => {
                                                                setCheckInUnit(e.target.value);
                                                                setCheckInUnitMode('L');
                                                                setCheckInQty(1);
                                                            }}
                                                        >
                                                            {STANDARD_UNITS.map(u => (
                                                                <option key={u} value={u}>{u}</option>
                                                            ))}
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
                                            <div className="relative">
                                                 <input
                                                     type="text"
                                                     placeholder="Type to search material..."
                                                     className="w-full relative z-20 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                     value={checkInSearch}
                                                     onChange={(e) => {
                                                         setCheckInSearch(e.target.value);
                                                         if (!e.target.value) {
                                                             setCheckInItemCode('');
                                                         }
                                                         setShowCheckInDropdown(true);
                                                     }}
                                                     onFocus={() => setShowCheckInDropdown(true)}
                                                 />
                                                 <input 
                                                     type="hidden" 
                                                     value={checkInItemCode} 
                                                 />
                                                 {showCheckInDropdown && (
                                                     <>
                                                         <div className="fixed inset-0 z-10" onClick={() => setShowCheckInDropdown(false)} />
                                                         <div className="absolute z-20 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl mt-1 shadow-lg custom-scrollbar">
                                                             {currentStock
                                                                 .filter(item => (item.name || '').toLowerCase().includes(checkInSearch.toLowerCase()) || (item.itemCode || '').toLowerCase().includes(checkInSearch.toLowerCase()))
                                                                 .map(item => (
                                                                     <button
                                                                         type="button"
                                                                         key={item.itemCode}
                                                                         onClick={() => {
                                                                             setCheckInItemCode(item.itemCode);
                                                                             setCheckInSearch(item.name);
                                                                             setShowCheckInDropdown(false);
                                                                             setCheckInUnitMode('L');
                                                                             setCheckInQty(1);
                                                                         }}
                                                                         className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-colors border-b border-slate-50 last:border-0"
                                                                     >
                                                                         <span className="block text-slate-900">{item.name}</span>
                                                                         <span className="block text-[8px] text-slate-400 font-bold tracking-wider">{item.itemCode} • {item.unit}</span>
                                                                     </button>
                                                                 ))
                                                             }
                                                             {currentStock.filter(item => (item.name || '').toLowerCase().includes(checkInSearch.toLowerCase()) || (item.itemCode || '').toLowerCase().includes(checkInSearch.toLowerCase())).length === 0 && (
                                                                 <div className="p-4 text-center text-slate-400 text-xs font-bold">No matching materials found</div>
                                                             )}
                                                         </div>
                                                     </>
                                                 )}
                                             </div>
                                        )}
                                    </div>

                                    {/* Quantity */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                                                Quantity {!isNewItemMode && !checkInItemCode && <span className="text-[8px] font-normal text-slate-400 normal-case"> (select liquid material for ml/Ltr toggle)</span>}
                                                {!isNewItemMode && checkInItemCode && `(in ${checkInUnitMode === 'ML' ? 'ml' : (currentStock.find(i => i.itemCode === checkInItemCode)?.unit || '')})`}
                                                {isNewItemMode && `(in ${checkInUnitMode === 'ML' ? 'ml' : checkInUnit})`}
                                            </label>
                                            {(() => {
                                                const selectedItem = checkInItemCode ? currentStock.find(i => i.itemCode === checkInItemCode) : null;
                                                const isCheckInLtr = (isNewItemMode && checkInUnit.toLowerCase() === 'ltr') || (!isNewItemMode && selectedItem && selectedItem.unit && selectedItem.unit.toLowerCase() === 'ltr');
                                                if (!isCheckInLtr) return null;
                                                return (
                                                    <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (checkInUnitMode === 'ML') {
                                                                    setCheckInUnitMode('L');
                                                                    setCheckInQty(Math.round(checkInQty * 1000) / 1000 || 1);
                                                                }
                                                            }}
                                                            className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all ${
                                                                checkInUnitMode === 'L'
                                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                                    : 'text-slate-500 hover:text-slate-800'
                                                            }`}
                                                        >
                                                            Ltr
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (checkInUnitMode === 'L') {
                                                                    setCheckInUnitMode('ML');
                                                                    setCheckInQty(Math.round(checkInQty * 1000) / 1000 || 1);
                                                                }
                                                            }}
                                                            className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all ${
                                                                checkInUnitMode === 'ML'
                                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                                    : 'text-slate-500 hover:text-slate-800'
                                                            }`}
                                                        >
                                                            ml
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="relative flex items-center">
                                            <input
                                                type="number"
                                                min={checkInUnitMode === 'ML' ? 1 : 0.001}
                                                step={checkInUnitMode === 'ML' ? 1 : 'any'}
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-12 text-xs font-bold focus:border-indigo-500 outline-none"
                                                value={checkInUnitMode === 'ML' ? (checkInQty ? Math.round(checkInQty * 1000) : '') : (checkInQty || '')}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setCheckInQty(checkInUnitMode === 'ML' ? val / 1000 : val);
                                                }}
                                            />
                                            {!isNewItemMode && checkInItemCode && (
                                                <span className="absolute right-3 text-slate-400 text-[10px] font-black uppercase pointer-events-none">
                                                    {checkInUnitMode === 'ML' ? 'ml' : (currentStock.find(i => i.itemCode === checkInItemCode)?.unit || '')}
                                                </span>
                                            )}
                                            {isNewItemMode && (
                                                <span className="absolute right-3 text-slate-400 text-[10px] font-black uppercase pointer-events-none">
                                                    {checkInUnitMode === 'ML' ? 'ml' : checkInUnit}
                                                </span>
                                            )}
                                        </div>
                                        {(() => {
                                            const selectedItem = checkInItemCode ? currentStock.find(i => i.itemCode === checkInItemCode) : null;
                                            const isCheckInLtr = (isNewItemMode && checkInUnit.toLowerCase() === 'ltr') || (!isNewItemMode && selectedItem && selectedItem.unit && selectedItem.unit.toLowerCase() === 'ltr');
                                            if (isCheckInLtr && checkInQty > 0) {
                                                return (
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1">
                                                        {checkInUnitMode === 'ML' ? (
                                                            <span>Equivalent to <strong className="text-emerald-600">{checkInQty} Ltr</strong></span>
                                                        ) : (
                                                            <span>Equivalent to <strong className="text-emerald-600">{Math.round(checkInQty * 1000)} ml</strong></span>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                     {/* Advanced Options Toggle */}
                                     <div className="pt-2 border-t border-slate-100">
                                         <button
                                             type="button"
                                             onClick={() => setShowAdvancedCheckIn(!showAdvancedCheckIn)}
                                             className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                         >
                                             {showAdvancedCheckIn ? '- Hide Advanced Options' : '+ Show Advanced Options (Supplier, Project, Location, Remarks)'}
                                         </button>
                                     </div>

                                     {showAdvancedCheckIn && (
                                         <div className="space-y-4 pt-2">
                                             {/* Supplier */}
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Supplier / Vendor</label>
                                                 <input
                                                     type="text"
                                                     list="supplier-list"
                                                     placeholder="Enter or select Supplier Name"
                                                     required={showAdvancedCheckIn}
                                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                     value={checkInSupplier}
                                                     onChange={(e) => setCheckInSupplier(e.target.value)}
                                                 />
                                                 <datalist id="supplier-list">
                                                     {uniqueVendors.map(vendor => (
                                                         <option key={vendor} value={vendor} />
                                                     ))}
                                                 </datalist>
                                             </div>

                                             {/* Project ID (Optional) */}
                                             <div className="space-y-1.5">
                                                 <div className="flex justify-between items-center">
                                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Project ID (Optional)</label>
                                                     <button
                                                         type="button"
                                                         onClick={() => setIsAddProjectModalOpen(true)}
                                                         className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"
                                                     >
                                                         <Plus className="w-2.5 h-2.5" /> Create Project ID
                                                     </button>
                                                 </div>
                                                 <select
                                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                     value={checkInProject}
                                                     onChange={(e) => setCheckInProject(e.target.value)}
                                                 >
                                                     <option value="">General Store / None</option>
                                                     {projectList.map(p => {
                                                         const proj = projects.find(proj => proj.projectId === p);
                                                         const displayLabel = proj && proj.client ? `${p} - ${proj.client}` : p;
                                                         return (
                                                             <option key={p} value={p}>{displayLabel}</option>
                                                         );
                                                     })}
                                                 </select>
                                                 {/* Project PO Validation Block */}
                                                 {checkInProject && (
                                                     (() => {
                                                         const proj = projects.find(p => p.projectId === checkInProject);
                                                         if (proj) {
                                                             const isConfirmed = !!proj.planning?.poConfirmed;
                                                             return (
                                                                 <div className={`mt-2 p-3.5 rounded-2xl border text-xs ${
                                                                     isConfirmed 
                                                                         ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                                                                         : 'bg-amber-50/50 border-amber-100 text-amber-850'
                                                                 }`}>
                                                                     <div className="flex justify-between items-center mb-1">
                                                                         <span className="font-black uppercase tracking-wider text-[9px] text-slate-400">PO Number Validation</span>
                                                                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                                             isConfirmed 
                                                                                 ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                                                                                 : 'bg-amber-100 text-amber-800 border border-amber-250'
                                                                         }`}>
                                                                             {isConfirmed ? 'PO Confirmed' : 'PO Pending'}
                                                                         </span>
                                                                     </div>
                                                                     <div className="font-bold flex items-center justify-between">
                                                                         <span>PO Ref: <span className="font-black text-slate-800">{proj.planning?.poNumber || 'N/A (No PO entered)'}</span></span>
                                                                         <span>Client: <span className="font-black text-slate-800">{proj.client}</span></span>
                                                                     </div>
                                                                 </div>
                                                             );
                                                         }
                                                         return null;
                                                     })()
                                                 )}
                                             </div>

                                             {/* Store Location Selection */}
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Store Number / Location</label>
                                                 <select
                                                     required
                                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                     value={checkInLocation}
                                                     onChange={(e) => setCheckInLocation(e.target.value)}
                                                 >
                                                     <option value="MAIN STORE">MAIN STORE</option>
                                                     <option value="Store No. 1">Store No. 1</option>
                                                     <option value="Store No. 2">Store No. 2</option>
                                                     <option value="MDC PANCHKULA">MDC PANCHKULA</option>
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
                                         </div>
                                     )}

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
                                <div className="space-y-6 text-center py-4 animate-in fade-in duration-300">
                                    <img src={logo} alt="ENGLABS" className="h-10 object-contain mx-auto mb-4" />
                                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Material Issued!</h3>
                                        {checkOutTxDetails?.offline ? (
                                            <p className="text-xs text-amber-600 font-bold mt-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 inline-block">
                                                ⚠️ Saved offline. Syncs automatically when online.
                                            </p>
                                        ) : (
                                            <p className="text-xs text-slate-400 font-bold mt-1">Transaction logged and stock deducted.</p>
                                        )}
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
                                    if (isLoading) return;
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
                                            checkOutProjectName,
                                            checkOutLocation || 'MAIN STORE',
                                            checkOutIssuedBy || 'Gate Operator',
                                            checkOutItemCode
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
                                                photoUrl: checkoutPhoto || undefined,
                                                offline: res.offline || false
                                            });
                                            setCheckOutSuccess(true);
                                            // Reset
                                            setCheckOutItemCode('');
                                            setCheckOutSearch('');
                                            setCheckOutQty(1);
                                            setCheckOutUnitMode('L');
                                            setCheckOutStaffName('');
                                            setCheckOutProjectName('');
                                            setCheckOutRemarks('');
                                            setCheckoutPhoto('');
                                            setCheckOutLocation('MAIN STORE');
                                        } else {
                                            alert("Failed to issue material: " + (res.error || 'Unknown error'));
                                        }
                                    } catch (err: any) {
                                        console.error(err);
                                        storeGuardian.logError('CHECK_OUT', err.message || 'Check-out failed', 'StoreStockReport Checkout', String(userRole));
                                        alert("Error issuing material: " + err.message);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }} className="space-y-4">
                                    
                                    {/* Material Selector */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Material</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Type to search material..."
                                                className="w-full relative z-20 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                value={checkOutSearch}
                                                onChange={(e) => {
                                                    setCheckOutSearch(e.target.value);
                                                    if (!e.target.value) {
                                                        setCheckOutItemCode('');
                                                    }
                                                    setShowCheckOutDropdown(true);
                                                }}
                                                onFocus={() => setShowCheckOutDropdown(true)}
                                            />
                                            <input 
                                                type="hidden" 
                                                value={checkOutItemCode} 
                                            />
                                            {showCheckOutDropdown && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setShowCheckOutDropdown(false)} />
                                                    <div className="absolute z-20 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl mt-1 shadow-lg custom-scrollbar">
                                                        {currentStock
                                                            .filter(item => item.availableStock > 0)
                                                            .filter(item => (item.name || '').toLowerCase().includes(checkOutSearch.toLowerCase()) || (item.itemCode || '').toLowerCase().includes(checkOutSearch.toLowerCase()))
                                                            .map(item => (
                                                                <button
                                                                    type="button"
                                                                    key={item.itemCode}
                                                                    onClick={() => {
                                                                        setCheckOutItemCode(item.itemCode);
                                                                        setCheckOutSearch(item.name);
                                                                        setShowCheckOutDropdown(false);
                                                                        setCheckOutUnitMode('L');
                                                                        setCheckOutQty(1);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-colors border-b border-slate-50 last:border-0"
                                                                >
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-slate-900 block">{item.name}</span>
                                                                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                                            {item.availableStock} {item.unit}
                                                                        </span>
                                                                    </div>
                                                                    <span className="block text-[8px] text-slate-400 font-bold tracking-wider mt-0.5">{item.itemCode}</span>
                                                                </button>
                                                            ))
                                                        }
                                                        {currentStock.filter(item => item.availableStock > 0).filter(item => (item.name || '').toLowerCase().includes(checkOutSearch.toLowerCase()) || (item.itemCode || '').toLowerCase().includes(checkOutSearch.toLowerCase())).length === 0 && (
                                                            <div className="p-4 text-center text-slate-400 text-xs font-bold">No available matching materials</div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quantity */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                Quantity {!checkOutItemCode && <span className="text-[8px] font-normal text-slate-400 normal-case"> (select liquid material for ml/Ltr toggle)</span>}
                                                {checkOutItemCode && `(in ${checkOutUnitMode === 'ML' ? 'ml' : (currentStock.find(i => i.itemCode === checkOutItemCode)?.unit || '')})`}
                                            </label>
                                            <div className="flex items-center gap-3">
                                                {(() => {
                                                    const selectedItem = checkOutItemCode ? currentStock.find(i => i.itemCode === checkOutItemCode) : null;
                                                    const isCheckOutLtr = selectedItem && selectedItem.unit && selectedItem.unit.toLowerCase() === 'ltr';
                                                    if (!isCheckOutLtr) return null;
                                                    return (
                                                        <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (checkOutUnitMode === 'ML') {
                                                                        setCheckOutUnitMode('L');
                                                                        setCheckOutQty(Math.round(checkOutQty * 1000) / 1000 || 1);
                                                                    }
                                                                }}
                                                                className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all ${
                                                                    checkOutUnitMode === 'L'
                                                                        ? 'bg-amber-600 text-white shadow-sm'
                                                                        : 'text-slate-500 hover:text-slate-800'
                                                                }`}
                                                            >
                                                                Ltr
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (checkOutUnitMode === 'L') {
                                                                        setCheckOutUnitMode('ML')
                                                                        setCheckOutQty(Math.round(checkOutQty * 1000) / 1000 || 1);
                                                                    }
                                                                }}
                                                                className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all ${
                                                                    checkOutUnitMode === 'ML'
                                                                        ? 'bg-amber-600 text-white shadow-sm'
                                                                        : 'text-slate-500 hover:text-slate-800'
                                                                }`}
                                                            >
                                                                ml
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                                {checkOutItemCode && (
                                                    <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
                                                        Max: {(() => {
                                                            const item = currentStock.find(i => i.itemCode === checkOutItemCode);
                                                            if (!item) return 0;
                                                            return checkOutUnitMode === 'ML' ? Math.round(item.availableStock * 1000) : item.availableStock;
                                                        })()} {checkOutUnitMode === 'ML' ? 'ml' : (currentStock.find(i => i.itemCode === checkOutItemCode)?.unit || '')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative flex items-center">
                                            <input
                                                type="number"
                                                min={checkOutUnitMode === 'ML' ? 1 : 0.001}
                                                max={checkOutItemCode ? (checkOutUnitMode === 'ML' ? (currentStock.find(i => i.itemCode === checkOutItemCode)?.availableStock || 0) * 1000 : currentStock.find(i => i.itemCode === checkOutItemCode)?.availableStock) : undefined}
                                                step={checkOutUnitMode === 'ML' ? 1 : 'any'}
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-12 text-xs font-bold focus:border-indigo-500 outline-none"
                                                value={checkOutUnitMode === 'ML' ? (checkOutQty ? Math.round(checkOutQty * 1000) : '') : (checkOutQty || '')}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setCheckOutQty(checkOutUnitMode === 'ML' ? val / 1000 : val);
                                                }}
                                            />
                                            {checkOutItemCode && (
                                                <span className="absolute right-3 text-slate-400 text-[10px] font-black uppercase pointer-events-none">
                                                    {checkOutUnitMode === 'ML' ? 'ml' : (currentStock.find(i => i.itemCode === checkOutItemCode)?.unit || '')}
                                                </span>
                                            )}
                                        </div>
                                        {(() => {
                                            const selectedItem = checkOutItemCode ? currentStock.find(i => i.itemCode === checkOutItemCode) : null;
                                            const isCheckOutLtr = selectedItem && selectedItem.unit && selectedItem.unit.toLowerCase() === 'ltr';
                                            if (isCheckOutLtr && checkOutQty > 0) {
                                                return (
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1">
                                                        {checkOutUnitMode === 'ML' ? (
                                                            <span>Equivalent to <strong className="text-amber-600">{checkOutQty} Ltr</strong></span>
                                                        ) : (
                                                            <span>Equivalent to <strong className="text-amber-600">{Math.round(checkOutQty * 1000)} ml</strong></span>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {/* Issued To Staff */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issued To (Staff Name)</label>
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

                                     {/* Advanced Options Toggle */}
                                     <div className="pt-2 border-t border-slate-100">
                                         <button
                                             type="button"
                                             onClick={() => setShowAdvancedCheckOut(!showAdvancedCheckOut)}
                                             className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                         >
                                             {showAdvancedCheckOut ? '- Hide Advanced Options' : '+ Show Advanced Options (Project, Location, Camera)'}
                                         </button>
                                     </div>

                                     {showAdvancedCheckOut && (
                                         <div className="space-y-4 pt-2">
                                             {/* Project ID */}
                                             <div className="space-y-1.5">
                                                 <div className="flex justify-between items-center">
                                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Project ID</label>
                                                     <button
                                                         type="button"
                                                         onClick={() => setIsAddProjectModalOpen(true)}
                                                         className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"
                                                     >
                                                         <Plus className="w-2.5 h-2.5" /> Create Project ID
                                                     </button>
                                                 </div>
                                                 <select
                                                     required={showAdvancedCheckOut}
                                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                     value={checkOutProjectName}
                                                     onChange={(e) => setCheckOutProjectName(e.target.value)}
                                                 >
                                                     <option value="">Select Project...</option>
                                                     {projectList.map(p => {
                                                         const proj = projects.find(proj => proj.projectId === p);
                                                         const displayLabel = proj && proj.client ? `${p} - ${proj.client}` : p;
                                                         return (
                                                             <option key={p} value={p}>{displayLabel}</option>
                                                         );
                                                     })}
                                                 </select>
                                                 {/* Project PO Validation Block */}
                                                 {checkOutProjectName && (
                                                     (() => {
                                                         const proj = projects.find(p => p.projectId === checkOutProjectName);
                                                         if (proj) {
                                                             const isConfirmed = !!proj.planning?.poConfirmed;
                                                             return (
                                                                 <div className={`mt-2 p-3.5 rounded-2xl border text-xs ${
                                                                     isConfirmed 
                                                                         ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                                                                         : 'bg-amber-50/50 border-amber-100 text-amber-850'
                                                                 }`}>
                                                                     <div className="flex justify-between items-center mb-1">
                                                                         <span className="font-black uppercase tracking-wider text-[9px] text-slate-400">PO Number Validation</span>
                                                                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                                             isConfirmed 
                                                                                 ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                                                                                 : 'bg-amber-100 text-amber-800 border border-amber-250'
                                                                         }`}>
                                                                             {isConfirmed ? 'PO Confirmed' : 'PO Pending'}
                                                                         </span>
                                                                     </div>
                                                                     <div className="font-bold flex items-center justify-between">
                                                                         <span>PO Ref: <span className="font-black text-slate-800">{proj.planning?.poNumber || 'N/A (No PO entered)'}</span></span>
                                                                         <span>Client: <span className="font-black text-slate-800">{proj.client}</span></span>
                                                                     </div>
                                                                 </div>
                                                             );
                                                         }
                                                         return null;
                                                     })()
                                                 )}
                                             </div>

                                             {/* Store Location Selection */}
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Store Number / Location</label>
                                                 <select
                                                     required={showAdvancedCheckOut}
                                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                     value={checkOutLocation}
                                                     onChange={(e) => setCheckOutLocation(e.target.value)}
                                                 >
                                                     <option value="MAIN STORE">MAIN STORE</option>
                                                     <option value="Store No. 1">Store No. 1</option>
                                                     <option value="Store No. 2">Store No. 2</option>
                                                     <option value="MDC PANCHKULA">MDC PANCHKULA</option>
                                                 </select>
                                             </div>

                                            {/* Issued By */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issued By (Store Keeper)</label>
                                                <select
                                                    required={showAdvancedCheckOut}
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
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Remarks</label>
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
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Evidence (Optional)</label>
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
                                                        <div className="flex flex-wrap gap-2">
                                                            <button type="button" onClick={capturePhoto} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Take Snapshot</button>
                                                            <button type="button" onClick={stopWebcam} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">Cancel</button>
                                                            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold cursor-pointer transition-colors ml-auto">
                                                                <Upload className="w-3.5 h-3.5" /> Upload File
                                                                <input 
                                                                    type="file" 
                                                                    accept="image/*" 
                                                                    className="hidden" 
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            stopWebcam();
                                                                            const reader = new FileReader();
                                                                            reader.onloadend = () => setCheckoutPhoto(reader.result as string);
                                                                            reader.readAsDataURL(file);
                                                                        }
                                                                    }} 
                                                                />
                                                            </label>
                                                        </div>
                                                        <canvas ref={canvasRef} className="hidden" />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => startWebcam('CHECKOUT')}
                                                            className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 rounded-xl text-xs font-bold transition-colors"
                                                        >
                                                            <Camera className="w-4 h-4" /> Capture Photo
                                                        </button>
                                                        <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                                                            <Upload className="w-4 h-4" /> Upload Photo
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                className="hidden" 
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onloadend = () => setCheckoutPhoto(reader.result as string);
                                                                        reader.readAsDataURL(file);
                                                                    }
                                                                }} 
                                                            />
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                         </div>
                                     )}

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
                                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                    <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl overflow-x-auto">
                                        {[
                                            { id: 'TODAY', label: 'Today' },
                                            { id: 'WEEK', label: 'This Week' },
                                            { id: 'MONTH', label: 'This Month' },
                                            { id: 'CUSTOM', label: 'Custom' }
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
                                    
                                    {liveFilter === 'CUSTOM' && (
                                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 animate-in slide-in-from-left duration-300">
                                            <span className="text-[9px] font-black uppercase text-slate-400 pl-2">From:</span>
                                            <input 
                                                type="date" 
                                                value={customStartDate} 
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 outline-none focus:border-[#0e4368]"
                                            />
                                            <span className="text-[9px] font-black uppercase text-slate-400">To:</span>
                                            <input 
                                                type="date" 
                                                value={customEndDate} 
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 outline-none focus:border-[#0e4368]"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setView('CHECK_IN');
                                                setCheckInSuccess(false);
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-[9px] uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                                        >
                                            <ArrowDownCircle className="w-3.5 h-3.5" /> Check In
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setView('CHECK_OUT');
                                                setCheckOutSuccess(false);
                                            }}
                                            className="bg-amber-600 hover:bg-amber-700 text-white font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-[9px] uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                                        >
                                            <ArrowUpCircle className="w-3.5 h-3.5" /> Check Out
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleShareLiveRegisterWhatsApp}
                                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-[9px] uppercase tracking-widest transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                                            title="Share Live Register on WhatsApp"
                                        >
                                            <Share2 className="w-3.5 h-3.5" /> Share
                                        </button>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Showing {getFilteredTransactions(masterTransactions).length} transactions
                                    </span>
                                </div>
                            </div>

                            {/* Live Register Filters Bar */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex flex-wrap items-center gap-4 print:hidden">
                                {/* Flow Type Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Flow Type</label>
                                    <select
                                        value={liveTypeFilter}
                                        onChange={(e) => setLiveTypeFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-[#0e4368] transition-all min-w-[130px]"
                                    >
                                        <option value="ALL">All Flow Types</option>
                                        <option value="INWARD">Check-In</option>
                                        <option value="OUTWARD">Check-Out</option>
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Category</label>
                                    <select
                                        value={liveCategoryFilter}
                                        onChange={(e) => setLiveCategoryFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-[#0e4368] transition-all min-w-[140px]"
                                    >
                                        <option value="ALL">All Categories</option>
                                        {Array.from(new Set(currentStock.map(i => i.category).filter(Boolean))).sort().map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Rack Location Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Rack Location</label>
                                    <select
                                        value={liveRackFilter}
                                        onChange={(e) => setLiveRackFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-[#0e4368] transition-all min-w-[140px]"
                                    >
                                        <option value="ALL">All Racks</option>
                                        {Array.from(new Set(currentStock.map(i => normalizeRackLocation(i.location || 'MAIN STORE')).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Advanced Options Toggle */}
                            <div className="flex justify-end mb-4 pr-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedLiveRegister(!showAdvancedLiveRegister)}
                                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                >
                                    {showAdvancedLiveRegister ? '- Hide Advanced Options' : '+ Show Advanced Options (Project, Remarks)'}
                                </button>
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
                                                {showAdvancedLiveRegister && <th className="py-4 px-4">Project</th>}
                                                {showAdvancedLiveRegister && <th className="py-4 px-4">Remarks</th>}
                                                <th className="py-4 px-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {getFilteredTransactions(masterTransactions).map(tx => (
                                                <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                                    {/* 1. Date */}
                                                    <td className="py-4 px-4 text-slate-500 font-medium">
                                                        {new Date(tx.timestamp).toLocaleString('en-IN', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    {/* 2. Material */}
                                                    <td className="py-4 px-4">
                                                        <span className="font-bold text-slate-900 block">{tx.materialName}</span>
                                                        <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase block">{tx.itemCode}</span>
                                                    </td>
                                                    {/* 3. In */}
                                                    <td className="py-4 px-4 text-center whitespace-nowrap">
                                                        {tx.type === 'INWARD' ? (
                                                            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">+{tx.quantity} {tx.unit}</span>
                                                        ) : (
                                                            <span className="text-slate-300 font-black">-</span>
                                                        )}
                                                    </td>
                                                    {/* 4. Out */}
                                                    <td className="py-4 px-4 text-center whitespace-nowrap">
                                                        {tx.type === 'OUTWARD' ? (
                                                            <span className="font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">-{tx.quantity} {tx.unit}</span>
                                                        ) : (
                                                            <span className="text-slate-300 font-black">-</span>
                                                        )}
                                                    </td>
                                                    {/* 5. Balance */}
                                                    <td className="py-4 px-4 text-center font-black text-slate-800 bg-slate-50/30 whitespace-nowrap">{tx.balanceStockAfterIssue} {tx.unit}</td>
                                                    {/* 6. Staff / Supplier */}
                                                    <td className="py-4 px-4">
                                                        <span className="font-bold text-slate-700 block">{tx.staffName}</span>
                                                        {showAdvancedLiveRegister && <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Issued by: {tx.issuedBy}</span>}
                                                    </td>
                                                    {/* 7. Project (Advanced) */}
                                                    {showAdvancedLiveRegister && (
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <span className="font-bold text-[10px] text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">
                                                                {tx.projectId || 'GENERAL'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {/* 8. Remarks (Advanced) */}
                                                    {showAdvancedLiveRegister && (
                                                        <td className="py-4 px-4 text-slate-400 italic max-w-xs truncate">{tx.remarks}</td>
                                                    )}
                                                    {/* 9. Actions */}
                                                    <td className="py-4 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                onClick={() => handleShareWhatsApp(tx)}
                                                                className="inline-flex items-center justify-center p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all border border-emerald-100"
                                                                title="Share slip on WhatsApp"
                                                            >
                                                                <Share2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setModalConfig({ type: 'EDIT_TX', data: tx })}
                                                                className="inline-flex items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all border border-blue-100"
                                                                title="Edit Transaction"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setModalConfig({ type: 'DELETE_TX', data: tx })}
                                                                className="inline-flex items-center justify-center p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-100"
                                                                title="Delete Transaction"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {getFilteredTransactions(masterTransactions).length === 0 && (
                                                <tr>
                                                    <td colSpan={showAdvancedLiveRegister ? 9 : 7} className="py-12 text-center text-slate-400 font-bold">No register entries found.</td>
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
                            {/* Actions and Filters Bar */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm print:hidden">
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    {/* Category Filter */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Category</label>
                                        <select
                                            value={selectedStockCategory}
                                            onChange={(e) => setSelectedStockCategory(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all min-w-[140px]"
                                        >
                                            <option value="ALL">All Categories</option>
                                            {Array.from(new Set(currentStock.map(i => i.category).filter(Boolean))).sort().map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Rack Filter */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Rack Location</label>
                                        <select
                                            value={selectedStockRack}
                                            onChange={(e) => setSelectedStockRack(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all min-w-[140px]"
                                        >
                                            <option value="ALL">All Racks</option>
                                            {Array.from(new Set(currentStock.map(i => normalizeRackLocation(i.location || 'MAIN STORE')).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Stock Status</label>
                                        <select
                                            value={selectedStockStatus}
                                            onChange={(e) => setSelectedStockStatus(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all min-w-[140px]"
                                        >
                                            <option value="ALL">All Statuses</option>
                                            <option value="SECURE">Secure Stock</option>
                                            <option value="LOW">Low Stock</option>
                                            <option value="OUT">Out of Stock</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setView('CHECK_IN');
                                            setCheckInSuccess(false);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3.5 rounded-xl flex items-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer justify-center"
                                    >
                                        <ArrowDownCircle className="w-4 h-4" /> Check In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const runMigration = async () => {
                                                const badItems = currentStock.filter(i => i.itemCode && !i.itemCode.toUpperCase().startsWith('ENG'));
                                                if (badItems.length === 0) {
                                                    alert("All material codes are already in ENG format!");
                                                    return;
                                                }
                                                
                                                if (!window.confirm(`Found ${badItems.length} items with invalid codes. Migrate them to ENG-XXXX format now?`)) return;

                                                let maxEng = 0;
                                                currentStock.forEach(i => {
                                                    const match = i.itemCode?.match(/ENG-?(\d+)/i);
                                                    if (match) {
                                                        const num = parseInt(match[1], 10);
                                                        if (num > maxEng) maxEng = num;
                                                    }
                                                });

                                                let count = 0;
                                                for (const oldItem of badItems) {
                                                    maxEng++;
                                                    const newCode = `ENG-${String(maxEng).padStart(4, '0')}`;
                                                    const newItem = { ...oldItem, itemCode: newCode, currentStock: oldItem.availableStock || 0 } as any;
                                                    if (newItem.id) delete newItem.id;
                                                    
                                                    try {
                                                        await addInventoryItem(newItem);
                                                        await deleteInventoryItem(oldItem.itemCode);
                                                        count++;
                                                    } catch (e: any) {
                                                        console.error(e);
                                                        alert(`Error migrating ${oldItem.itemCode}: ${e.message}`);
                                                    }
                                                }
                                                alert(`Successfully migrated ${count} items to ENG-XXXX format!`);
                                                window.location.reload();
                                            };
                                            runMigration();
                                        }}
                                        className="bg-red-600/10 hover:bg-red-600/20 text-red-500 font-black px-6 py-3.5 rounded-xl flex items-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer justify-center"
                                    >
                                        <AlertTriangle className="w-4 h-4" /> Fix Material Codes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setView('CHECK_OUT');
                                            setCheckOutSuccess(false);
                                        }}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-3.5 rounded-xl flex items-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer justify-center"
                                    >
                                        <ArrowUpCircle className="w-4 h-4" /> Check Out
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCreateCategory('');
                                            setCustomCategory('');
                                            setCreateUnit('');
                                            setCustomUnit('');
                                            setCreateLocation('');
                                            setCustomLocation('');
                                            setIsCreateMaterialModalOpen(true);
                                        }}
                                        className="bg-[#0e4368] hover:bg-[#0b3350] text-emerald-400 font-black px-6 py-3.5 rounded-xl flex items-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer justify-center border border-slate-750"
                                    >
                                        <Plus className="w-4 h-4 text-emerald-400" /> Add Material
                                    </button>
                                </div>
                            </div>

                            {/* Advanced Options Toggle */}
                            <div className="flex justify-end mb-4 pr-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedCurrentStock(!showAdvancedCurrentStock)}
                                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                >
                                    {showAdvancedCurrentStock ? '- Hide Advanced Options' : '+ Show Advanced Options (Category, Rack)'}
                                </button>
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                                        <thead>
                                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                                <th className="py-4 px-4">Sr No.</th>
                                                <th className="py-4 px-4">Material Code</th>
                                                <th className="py-4 px-4">Material Name</th>
                                                {showAdvancedCurrentStock && (
                                                    <>
                                                        <th className="py-4 px-4">Category</th>
                                                        <th className="py-4 px-4">Rack</th>
                                                    </>
                                                )}
                                                <th className="py-4 px-4 text-center">Available Qty</th>
                                                <th className="py-4 px-4">Unit</th>
                                                <th className="py-4 px-4 text-center">Status</th>
                                                <th className="py-4 px-4 text-center print:hidden">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {currentStock
                                                .filter(item => {
                                                    // Search query filter
                                                    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        (item.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
                                                    if (!matchesSearch) return false;

                                                    // Category filter
                                                    if (selectedStockCategory !== 'ALL') {
                                                        if (item.category !== selectedStockCategory) return false;
                                                    }

                                                    // Rack filter
                                                    if (selectedStockRack !== 'ALL') {
                                                        const itemRack = normalizeRackLocation(item.location || 'MAIN STORE');
                                                        if (itemRack !== selectedStockRack) return false;
                                                    }

                                                    // Status filter
                                                    if (selectedStockStatus !== 'ALL') {
                                                        const isLow = item.availableStock <= (item.minThreshold || 5);
                                                        const isOut = item.availableStock === 0;
                                                        if (selectedStockStatus === 'OUT' && !isOut) return false;
                                                        if (selectedStockStatus === 'LOW' && (!isLow || isOut)) return false;
                                                        if (selectedStockStatus === 'SECURE' && isLow) return false;
                                                    }

                                                    return true;
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
                                                            {showAdvancedCurrentStock && (
                                                                <>
                                                                    <td className="py-4 px-4 font-bold text-slate-500 uppercase">{item.category}</td>
                                                                    <td className="py-4 px-4 font-bold text-slate-700">{normalizeRackLocation(item.location || 'N/A')}</td>
                                                                </>
                                                            )}
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
                                                                        onClick={() => {
                                                                            setView('CHECK_IN');
                                                                            setIsNewItemMode(false);
                                                                            setCheckInItemCode(item.itemCode);
                                                                            setCheckInSearch(item.name);
                                                                            setShowCheckInDropdown(false);
                                                                            setCheckInUnitMode('L');
                                                                            setCheckInQty(1);
                                                                        }}
                                                                        className="p-1.5 hover:bg-emerald-50 rounded-xl text-emerald-600 hover:text-emerald-800 transition-all border border-transparent hover:border-emerald-100"
                                                                        title="Check In this item"
                                                                    >
                                                                        <ArrowDownCircle className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        disabled={item.availableStock === 0}
                                                                        onClick={() => {
                                                                            if (item.availableStock === 0) return;
                                                                            setView('CHECK_OUT');
                                                                            setCheckOutItemCode(item.itemCode);
                                                                            setCheckOutSearch(item.name);
                                                                            setShowCheckOutDropdown(false);
                                                                            setCheckOutUnitMode('L');
                                                                            setCheckOutQty(1);
                                                                        }}
                                                                        className={`p-1.5 rounded-xl transition-all border border-transparent ${
                                                                            item.availableStock === 0
                                                                                ? 'opacity-45 cursor-not-allowed text-slate-300'
                                                                                : 'hover:bg-amber-50 text-amber-600 hover:text-amber-800 hover:border-amber-100'
                                                                        }`}
                                                                        title={item.availableStock === 0 ? "Cannot Check Out (Out of Stock)" : "Check Out this item"}
                                                                    >
                                                                        <ArrowUpCircle className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setModalConfig({ type: 'ITEM', data: item })}
                                                                        className="p-1.5 hover:bg-slate-100 rounded-xl text-indigo-600 hover:text-indigo-800 transition-all border border-transparent hover:border-slate-150"
                                                                        title="Adjust stock level"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (userRole !== 'ADMIN') {
                                                                                const pass = prompt("ADMIN AUTHORIZATION REQUIRED\nEnter Passcode to Delete Material:");
                                                                                if (pass !== '9999' && pass !== '0001') {
                                                                                    alert("Incorrect PIN. Access Denied.");
                                                                                    return;
                                                                                }
                                                                            }
                                                                            setModalConfig({ type: 'DELETE', data: item });
                                                                        }}
                                                                        className="p-1.5 hover:bg-slate-100 rounded-xl text-rose-600 hover:text-rose-800 transition-all border border-transparent hover:border-slate-150"
                                                                        title="Delete material"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
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
                                <button 
                                    onClick={handleShareMonthlyRegisterWhatsApp} 
                                    className="flex items-center gap-2 px-5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-emerald-100 shadow-sm whitespace-nowrap self-stretch md:self-auto"
                                    title={`Share ${monthlyViewMonth} Register on WhatsApp`}
                                >
                                    <Share2 className="w-4 h-4" /> Share on WhatsApp
                                </button>
                            </div>

                            {/* Monthly Filters Bar */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex flex-wrap items-center gap-4 print:hidden">
                                {/* Flow Type Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Flow Type</label>
                                    <select
                                        value={monthlyTypeFilter}
                                        onChange={(e) => setMonthlyTypeFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-[#0e4368] transition-all min-w-[130px]"
                                    >
                                        <option value="ALL">All Flow Types</option>
                                        <option value="INWARD">Check-In</option>
                                        <option value="OUTWARD">Check-Out</option>
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Category</label>
                                    <select
                                        value={monthlyCategoryFilter}
                                        onChange={(e) => setMonthlyCategoryFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-[#0e4368] transition-all min-w-[140px]"
                                    >
                                        <option value="ALL">All Categories</option>
                                        {Array.from(new Set(currentStock.map(i => i.category).filter(Boolean))).sort().map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Rack Location Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Rack Location</label>
                                    <select
                                        value={monthlyRackFilter}
                                        onChange={(e) => setMonthlyRackFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-[#0e4368] transition-all min-w-[140px]"
                                    >
                                        <option value="ALL">All Racks</option>
                                        {Array.from(new Set(currentStock.map(i => normalizeRackLocation(i.location || 'MAIN STORE')).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Monthly Register Details */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 overflow-hidden">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                        {monthlyViewMonth} Monthly Register Entries
                                    </h3>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                        Total: {monthlyTransactions.filter(tx => {
                                            const matchesSearch = (tx.materialName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                (tx.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                (tx.staffName || '').toLowerCase().includes(searchQuery.toLowerCase());
                                            if (!matchesSearch) return false;
                                            if (monthlyTypeFilter !== 'ALL' && tx.type !== monthlyTypeFilter) return false;
                                            if (monthlyCategoryFilter !== 'ALL' && tx.category !== monthlyCategoryFilter) return false;
                                            if (monthlyRackFilter !== 'ALL') {
                                                const stockItem = currentStock.find(i => i.itemCode === tx.itemCode);
                                                const itemRack = normalizeRackLocation(tx.location || (stockItem && stockItem.location) || 'MAIN STORE');
                                                if (itemRack !== monthlyRackFilter) return false;
                                            }
                                            return true;
                                        }).length} Entries
                                    </span>
                                </div>
                                
                                {/* Advanced Options Toggle */}
                                <div className="flex justify-end mb-4 pr-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvancedReports(!showAdvancedReports)}
                                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                    >
                                        {showAdvancedReports ? '- Hide Advanced Options' : '+ Show Advanced Options (Balance Stock, Remarks)'}
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                                <th className="py-4 px-4">Date & Time</th>
                                                <th className="py-4 px-4">Material</th>
                                                <th className="py-4 px-4 text-center">Flow Type</th>
                                                <th className="py-4 px-4 text-center">Quantity</th>
                                                {showAdvancedReports && <th className="py-4 px-4 text-center">Balance Stock</th>}
                                                <th className="py-4 px-4">Staff / Operator</th>
                                                {showAdvancedReports && <th className="py-4 px-4">Remarks</th>}
                                                <th className="py-4 px-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {monthlyTransactions
                                                .filter(tx => {
                                                    const matchesSearch = (tx.materialName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        (tx.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        (tx.staffName || '').toLowerCase().includes(searchQuery.toLowerCase());
                                                    if (!matchesSearch) return false;
                                                    if (monthlyTypeFilter !== 'ALL' && tx.type !== monthlyTypeFilter) return false;
                                                    if (monthlyCategoryFilter !== 'ALL' && tx.category !== monthlyCategoryFilter) return false;
                                                    if (monthlyRackFilter !== 'ALL') {
                                                        const stockItem = currentStock.find(i => i.itemCode === tx.itemCode);
                                                        const itemRack = normalizeRackLocation(tx.location || (stockItem && stockItem.location) || 'MAIN STORE');
                                                        if (itemRack !== monthlyRackFilter) return false;
                                                    }
                                                    return true;
                                                })
                                                .map(tx => (
                                                    <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                                        <td className="py-4 px-4 text-slate-500 font-medium">{new Date(tx.timestamp).toLocaleString('en-IN')}</td>
                                                        <td className="py-4 px-4">
                                                            <span className="font-bold text-slate-900 block">{tx.materialName}</span>
                                                            <span className="text-[9px] text-slate-400 font-black tracking-wider block">{tx.itemCode}</span>
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                                                                tx.type === 'INWARD' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                            }`}>
                                                                {tx.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-center font-bold">{tx.quantity} {tx.unit}</td>
                                                        {showAdvancedReports && <td className="py-4 px-4 text-center font-black text-slate-700 bg-slate-50/30">{tx.balanceStockAfterIssue} {tx.unit}</td>}
                                                        <td className="py-4 px-4 text-slate-600 font-medium">{tx.staffName}</td>
                                                        {showAdvancedReports && <td className="py-4 px-4 text-slate-400 italic">{tx.remarks}</td>}
                                                        <td className="py-4 px-4 text-center">
                                                            <button
                                                                onClick={() => handleShareWhatsApp(tx)}
                                                                className="inline-flex items-center justify-center p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all border border-emerald-100"
                                                                title="Share slip on WhatsApp"
                                                            >
                                                                <Share2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            {monthlyTransactions.filter(tx => {
                                                const matchesSearch = (tx.materialName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    (tx.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    (tx.staffName || '').toLowerCase().includes(searchQuery.toLowerCase());
                                                if (!matchesSearch) return false;
                                                if (monthlyTypeFilter !== 'ALL' && tx.type !== monthlyTypeFilter) return false;
                                                if (monthlyCategoryFilter !== 'ALL' && tx.category !== monthlyCategoryFilter) return false;
                                                if (monthlyRackFilter !== 'ALL') {
                                                    const stockItem = currentStock.find(i => i.itemCode === tx.itemCode);
                                                    const itemRack = normalizeRackLocation(tx.location || (stockItem && stockItem.location) || 'MAIN STORE');
                                                    if (itemRack !== monthlyRackFilter) return false;
                                                }
                                                return true;
                                            }).length === 0 && (
                                                <tr>
                                                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">No entries found for {monthlyViewMonth}.</td>
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
                                <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Projects</h3>
                                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Manage active project IDs for inward/outward transactions</p>
                                    </div>
                                    <button
                                        onClick={() => setIsAddProjectModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                                    >
                                        <Plus className="w-3 h-3" /> Add Project
                                    </button>
                                </div>
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

                    {/* 8. REQUIREMENTS VIEW */}
                    {view === 'REQUIREMENTS' && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
                             {/* Top Panel: Form to Add Requirement */}
                             <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                                 <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                                     <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                         <ClipboardList className="w-6 h-6" />
                                     </div>
                                     <div>
                                         <h2 className="text-base font-black text-slate-900 leading-none">New Material Requirement Request</h2>
                                         <span className="text-[10px] font-bold text-slate-400 block mt-1">Submit request for material allocations or project allocations</span>
                                     </div>
                                 </div>

                                 {reqSuccess ? (
                                     <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
                                         <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                             <CheckCircle2 className="w-8 h-8" />
                                         </div>
                                         <div>
                                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Requirement Logged Successfully!</h3>
                                             <p className="text-xs text-slate-400 font-bold mt-1">The request has been queued and is pending store approval.</p>
                                         </div>
                                         <div className="flex flex-col sm:flex-row justify-center gap-3">
                                             <button
                                                 type="button"
                                                 onClick={() => {
                                                     if (lastSubmittedReq) {
                                                         handleShareWhatsApp(lastSubmittedReq);
                                                     }
                                                 }}
                                                 className="px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border border-emerald-100 shadow-sm"
                                             >
                                                 📱 Share on WhatsApp
                                             </button>
                                             <button
                                                 type="button"
                                                 onClick={() => setReqSuccess(false)}
                                                 className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all font-bold border border-slate-200 shadow-sm"
                                             >
                                                 Create Another Request
                                             </button>
                                         </div>
                                     </div>
                                 ) : (
                                     <form onSubmit={async (e) => {
                                         e.preventDefault();
                                         let materialName = reqSearch.trim();
                                         let materialCode = reqMaterialCode;
                                         let finalUnit = reqUnit;

                                         const selectedItem = currentStock.find(i => i.itemCode === reqMaterialCode);
                                         if (selectedItem) {
                                             materialName = selectedItem.name;
                                             materialCode = selectedItem.itemCode;
                                             finalUnit = selectedItem.unit || reqUnit;
                                         } else {
                                             if (!materialName) {
                                                 alert("Please enter a material name.");
                                                 return;
                                             }
                                             // Fallback: If they typed a name that exactly matches one of the items in currentStock, use it
                                             const exactMatch = currentStock.find(i => i.name.toLowerCase() === materialName.toLowerCase());
                                             if (exactMatch) {
                                                 materialName = exactMatch.name;
                                                 materialCode = exactMatch.itemCode;
                                                 finalUnit = exactMatch.unit || reqUnit;
                                             } else {
                                                 materialCode = 'NEW-REQ';
                                             }
                                         }

                                         if (reqQty <= 0) {
                                             alert("Please enter a valid quantity.");
                                             return;
                                         }
                                         if (!reqProject) {
                                             alert("Please select a Project ID.");
                                             return;
                                         }
                                         if (!reqRequestedBy) {
                                             alert("Please select requester name.");
                                             return;
                                         }
                                         setIsLoading(true);
                                         try {
                                             const res = await addMaterialRequirement({
                                                 projectId: reqProject,
                                                 materialCode: materialCode,
                                                 materialName: materialName,
                                                 quantity: reqQty,
                                                 unit: finalUnit,
                                                 requestedBy: reqRequestedBy,
                                                 remarks: reqRemarks
                                             });
                                             if (res.success) {
                                                 setLastSubmittedReq({
                                                     projectId: reqProject,
                                                     materialCode: materialCode,
                                                     materialName: materialName,
                                                     quantity: reqQty,
                                                     unit: finalUnit,
                                                     requestedBy: reqRequestedBy,
                                                     remarks: reqRemarks,
                                                     status: 'PENDING',
                                                     timestamp: Date.now()
                                                 });
                                                 setReqSuccess(true);
                                                 // Reset form fields
                                                 setReqMaterialCode('');
                                                 setReqSearch('');
                                                 setReqQty(1);
                                                 setReqProject('');
                                                 setReqRequestedBy('');
                                                 setReqRemarks('');
                                                 // Reload database/requirements
                                                 setRefreshTrigger(p => p + 1);
                                             } else {
                                                 alert("Failed to submit request.");
                                             }
                                         } catch (err: any) {
                                             console.error(err);
                                             storeGuardian.logError('REQUIREMENT_SUBMIT', err.message || 'Submission failed', 'StoreStockReport Requirements', String(userRole));
                                             alert("Error submitting request: " + err.message);
                                         } finally {
                                             setIsLoading(false);
                                         }
                                     }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         
                                         {/* Left Column: Selector + Qty */}
                                         <div className="space-y-4">
                                             {/* Material Search Input */}
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Material Name *</label>
                                                 <div className="relative">
                                                     <input
                                                         type="text"
                                                         placeholder="Search material in store stock..."
                                                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                         value={reqSearch}
                                                         onChange={(e) => {
                                                             setReqSearch(e.target.value);
                                                             if (!e.target.value) {
                                                                 setReqMaterialCode('');
                                                             }
                                                             setShowReqDropdown(true);
                                                         }}
                                                         onFocus={() => setShowReqDropdown(true)}
                                                         required
                                                     />
                                                     {showReqDropdown && (
                                                         <>
                                                             <div className="fixed inset-0 z-10" onClick={() => setShowReqDropdown(false)} />
                                                             <div className="absolute z-20 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl mt-1 shadow-lg custom-scrollbar">
                                                                 {currentStock
                                                                     .filter(item => item.name.toLowerCase().includes(reqSearch.toLowerCase()) || item.itemCode.toLowerCase().includes(reqSearch.toLowerCase()))
                                                                     .map(item => (
                                                                         <button
                                                                             type="button"
                                                                             key={item.itemCode}
                                                                             onClick={() => {
                                                                                 setReqMaterialCode(item.itemCode);
                                                                                 setReqSearch(item.name);
                                                                                 setReqUnit(item.unit);
                                                                                 setShowReqDropdown(false);
                                                                             }}
                                                                             className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-colors border-b border-slate-50 last:border-0"
                                                                         >
                                                                             <div className="flex justify-between items-center">
                                                                                 <span className="text-slate-900 block">{item.name}</span>
                                                                                 <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                                                                                     Stock: {item.availableStock} {item.unit}
                                                                                 </span>
                                                                             </div>
                                                                             <span className="block text-[8px] text-slate-400 font-bold tracking-wider mt-0.5">{item.itemCode}</span>
                                                                         </button>
                                                                     ))
                                                                 }
                                                                 {currentStock.filter(item => item.name.toLowerCase().includes(reqSearch.toLowerCase()) || item.itemCode.toLowerCase().includes(reqSearch.toLowerCase())).length === 0 && (
                                                                     <div className="p-4 text-center text-slate-400 text-xs font-bold">No matching materials found</div>
                                                                 )}
                                                             </div>
                                                         </>
                                                     )}
                                                 </div>
                                             </div>

                                             {/* Quantity & Unit Grid */}
                                             <div className="grid grid-cols-2 gap-4">
                                                 {/* Quantity */}
                                                 <div className="space-y-1.5">
                                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Requested Quantity *</label>
                                                     <input
                                                         type="number"
                                                         min={0.001}
                                                         step="any"
                                                         required
                                                         placeholder="1"
                                                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                         value={reqQty || ''}
                                                         onChange={(e) => setReqQty(parseFloat(e.target.value) || 0)}
                                                     />
                                                 </div>
                                                 {/* Unit */}
                                                 <div className="space-y-1.5">
                                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Unit *</label>
                                                     <select
                                                         value={STANDARD_UNITS.includes(reqUnit) ? reqUnit : "Other"}
                                                         onChange={(e) => {
                                                             const val = e.target.value;
                                                             if (val === 'Other') {
                                                                 setReqUnit('');
                                                             } else {
                                                                 setReqUnit(val);
                                                             }
                                                         }}
                                                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none text-slate-900"
                                                     >
                                                         {STANDARD_UNITS.map(u => (
                                                             <option key={u} value={u}>{u}</option>
                                                         ))}
                                                         <option value="Other">+ Add Custom Unit (Other)</option>
                                                     </select>
                                                 </div>
                                             </div>
                                             {/* Custom Unit Input */}
                                             {(!STANDARD_UNITS.includes(reqUnit) || reqUnit === '') && (
                                                 <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Custom Unit Name *</label>
                                                     <input 
                                                         type="text"
                                                         required
                                                         placeholder="e.g. Bag, Bucket, etc."
                                                         value={reqUnit}
                                                         onChange={(e) => setReqUnit(e.target.value)}
                                                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                                     />
                                                 </div>
                                             )}
                                         </div>

                                         {/* Right Column: Project, Staff, Remarks */}
                                         <div className="space-y-4">
                                             <div className="grid grid-cols-2 gap-4">
                                                 {/* Project ID */}
                                                 <div className="space-y-1.5">
                                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Project ID *</label>
                                                     <select
                                                         required
                                                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                         value={reqProject}
                                                         onChange={(e) => setReqProject(e.target.value)}
                                                     >
                                                         <option value="">Select Project...</option>
                                                         {projectList.map(p => {
                                                             const proj = projects.find(proj => proj.projectId === p);
                                                             const displayLabel = proj && proj.client ? `${p} - ${proj.client}` : p;
                                                             return (
                                                                 <option key={p} value={p}>{displayLabel}</option>
                                                             );
                                                         })}
                                                     </select>
                                                 </div>

                                                 {/* Requested By (Staff) */}
                                                 <div className="space-y-1.5">
                                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Requested By *</label>
                                                     <select
                                                         required
                                                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                         value={reqRequestedBy}
                                                         onChange={(e) => setReqRequestedBy(e.target.value)}
                                                     >
                                                         <option value="">Select Staff...</option>
                                                         {localStaffList.map(staff => (
                                                             <option key={staff} value={staff}>{staff}</option>
                                                         ))}
                                                     </select>
                                                 </div>
                                             </div>

                                             {/* Remarks */}
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Remarks</label>
                                                 <textarea
                                                     rows={2}
                                                     placeholder="Need/urgency/purpose details..."
                                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold focus:border-indigo-500 outline-none resize-none"
                                                     value={reqRemarks}
                                                     onChange={(e) => setReqRemarks(e.target.value)}
                                                 />
                                             </div>
                                         </div>

                                         <div className="md:col-span-2 flex justify-end pt-2">
                                             <button
                                                 type="submit"
                                                 disabled={isLoading}
                                                 className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2"
                                             >
                                                 {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "Submit Requirement"}
                                             </button>
                                         </div>
                                     </form>
                                 )}
                             </div>

                             {/* Bottom Panel: List/Table of Requirements */}
                             <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 overflow-hidden">
                                 <div className="flex justify-between items-center mb-4">
                                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                         <ClipboardList className="w-4 h-4 text-indigo-600" /> Pending & Historical Requirements ({requirements.length})
                                     </h3>
                                     <button
                                         type="button"
                                         onClick={handleShareAllWhatsApp}
                                         className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm border border-emerald-500/20"
                                         title="Share All Pending Requirements on WhatsApp"
                                     >
                                         <Share2 className="w-3.5 h-3.5" />
                                         Share All Pending
                                     </button>
                                 </div>

                                 {/* Search and Filters Controls */}
                                 <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-6 space-y-4">
                                     {/* Filter Buttons by Status */}
                                     <div className="flex flex-wrap gap-2 items-center">
                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Status:</span>
                                         {(['ALL', 'PENDING', 'APPROVED', 'DISPATCHED', 'REJECTED'] as const).map((status) => (
                                             <button
                                                 key={status}
                                                 type="button"
                                                 onClick={() => setReqFilterStatus(status)}
                                                 className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                                     reqFilterStatus === status
                                                     ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                     : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                 }`}
                                             >
                                                 {status}
                                             </button>
                                         ))}
                                     </div>

                                     {/* Specific Search Input Fields */}
                                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                         {/* Code Search */}
                                         <div className="space-y-1">
                                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Material Code</label>
                                             <input
                                                 type="text"
                                                 placeholder="Search Code (e.g. ENG-079)"
                                                 className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-750 outline-none focus:border-indigo-500 transition-all placeholder-slate-400"
                                                 value={reqSearchCode}
                                                 onChange={(e) => setReqSearchCode(e.target.value)}
                                             />
                                         </div>

                                         {/* Name Search */}
                                         <div className="space-y-1">
                                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Material Name</label>
                                             <input
                                                 type="text"
                                                 placeholder="Search Material Name..."
                                                 className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-750 outline-none focus:border-indigo-500 transition-all placeholder-slate-400"
                                                 value={reqSearchName}
                                                 onChange={(e) => setReqSearchName(e.target.value)}
                                             />
                                         </div>

                                         {/* Project Search */}
                                         <div className="space-y-1">
                                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Project ID</label>
                                             <input
                                                 type="text"
                                                 placeholder="Search Project (e.g. GENERAL)"
                                                 className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-750 outline-none focus:border-indigo-500 transition-all placeholder-slate-400"
                                                 value={reqSearchProject}
                                                 onChange={(e) => setReqSearchProject(e.target.value)}
                                             />
                                         </div>

                                         {/* Staff Search */}
                                         <div className="space-y-1">
                                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Requested By</label>
                                             <input
                                                 type="text"
                                                 placeholder="Search Requester Staff..."
                                                 className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-750 outline-none focus:border-indigo-500 transition-all placeholder-slate-400"
                                                 value={reqSearchStaff}
                                                 onChange={(e) => setReqSearchStaff(e.target.value)}
                                             />
                                         </div>
                                     </div>
                                 </div>
                                 
                                 <div className="overflow-x-auto">
                                     <table className="w-full text-left border-collapse text-xs">
                                         <thead>
                                             <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                                 <th className="py-4 px-4">Request Date</th>
                                                 <th className="py-4 px-4">Project</th>
                                                 <th className="py-4 px-4">Material</th>
                                                 <th className="py-4 px-4 text-center">Qty Required</th>
                                                 <th className="py-4 px-4">Requested By</th>
                                                 <th className="py-4 px-4">Remarks</th>
                                                 <th className="py-4 px-4 text-center">Status</th>
                                                 <th className="py-4 px-4 text-center">Actions</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-50">
                                             {requirements
                                                 .filter(req => {
                                                     // Status filter
                                                     if (reqFilterStatus !== 'ALL') {
                                                         if (req.status !== reqFilterStatus) return false;
                                                     }

                                                     // Code search
                                                     if (reqSearchCode.trim() !== '') {
                                                         if (!req.materialCode.toLowerCase().includes(reqSearchCode.toLowerCase())) return false;
                                                     }

                                                     // Name search
                                                     if (reqSearchName.trim() !== '') {
                                                         if (!req.materialName.toLowerCase().includes(reqSearchName.toLowerCase())) return false;
                                                     }

                                                     // Project search
                                                     if (reqSearchProject.trim() !== '') {
                                                         if (!req.projectId.toLowerCase().includes(reqSearchProject.toLowerCase())) return false;
                                                     }

                                                     // Staff search
                                                     if (reqSearchStaff.trim() !== '') {
                                                         if (!req.requestedBy.toLowerCase().includes(reqSearchStaff.toLowerCase())) return false;
                                                     }

                                                     // Global search fallback (if active)
                                                     if (searchQuery.trim() !== '') {
                                                         const q = searchQuery.toLowerCase();
                                                         const matchesGlobal = req.materialName.toLowerCase().includes(q) ||
                                                             req.materialCode.toLowerCase().includes(q) ||
                                                             req.projectId.toLowerCase().includes(q) ||
                                                             req.requestedBy.toLowerCase().includes(q) ||
                                                             req.remarks.toLowerCase().includes(q) ||
                                                             req.status.toLowerCase().includes(q);
                                                         if (!matchesGlobal) return false;
                                                     }

                                                     return true;
                                                 })
                                                 .map(req => {
                                                     const statusColors = {
                                                         PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
                                                         APPROVED: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                                                         DISPATCHED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                                         REJECTED: 'bg-rose-50 text-rose-700 border-rose-100'
                                                     };
                                                     
                                                     return (
                                                         <tr key={req.id} className="hover:bg-slate-50/30 transition-colors">
                                                             <td className="py-4 px-4 text-slate-500 font-medium">
                                                                 {new Date(req.timestamp).toLocaleString('en-IN', {
                                                                     day: '2-digit', month: '2-digit', year: 'numeric',
                                                                     hour: '2-digit', minute: '2-digit'
                                                                 })}
                                                             </td>
                                                             <td className="py-4 px-4 font-bold text-slate-700 uppercase">{req.projectId}</td>
                                                             <td className="py-4 px-4">
                                                                 <span className="font-bold text-slate-900 block">{req.materialName}</span>
                                                                 <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase block">{req.materialCode}</span>
                                                             </td>
                                                             <td className="py-4 px-4 text-center font-black text-slate-800 bg-slate-50/30">{req.quantity} {req.unit}</td>
                                                             <td className="py-4 px-4 font-bold text-slate-700">{req.requestedBy}</td>
                                                             <td className="py-4 px-4 text-slate-400 italic max-w-[200px] truncate" title={req.remarks}>{req.remarks || '-'}</td>
                                                 <td className="py-4 px-4 text-center">
                                                                 <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${statusColors[req.status]}`}>
                                                                     {req.status}
                                                                 </span>
                                                             </td>
                                                             <td className="py-4 px-4 text-center">
                                                                 <div className="flex items-center justify-center gap-1.5">
                                                                     <button
                                                                         onClick={() => handleShareWhatsApp(req)}
                                                                         className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border border-emerald-100"
                                                                         title="Share on WhatsApp"
                                                                     >
                                                                         <Share2 className="w-3.5 h-3.5" />
                                                                     </button>
                                                                     <button
                                                                         onClick={() => setEditingRequirement(req)}
                                                                         className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-100"
                                                                         title="Edit Requirement"
                                                                     >
                                                                         <Edit3 className="w-3.5 h-3.5" />
                                                                     </button>
                                                                     {userRole === 'ADMIN' && req.status === 'PENDING' && (
                                                                         <>
                                                                             <button
                                                                                 onClick={() => {
                                                                                     setConfirmConfig({
                                                                                         title: 'Approve Request?',
                                                                                         message: `Approve allocation of ${req.quantity} ${req.unit} for ${req.projectId}?`,
                                                                                         confirmText: 'Approve',
                                                                                         theme: 'indigo',
                                                                                         onConfirm: async () => {
                                                                                             setIsLoading(true);
                                                                                             const res = await updateMaterialRequirementStatus(req.id, 'APPROVED');
                                                                                             if (res && !res.success) {
                                                                                                 alert("Error: " + (res.error || "Failed to update status."));
                                                                                             }
                                                                                             setRefreshTrigger(p => p + 1);
                                                                                             setIsLoading(false);
                                                                                         }
                                                                                     });
                                                                                 }}
                                                                                 className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-100 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                                                             >
                                                                                 Approve
                                                                             </button>
                                                                             <button
                                                                                 onClick={() => {
                                                                                     setConfirmConfig({
                                                                                         title: 'Reject Request?',
                                                                                         message: `Reject request for ${req.projectId}?`,
                                                                                         confirmText: 'Reject',
                                                                                         theme: 'rose',
                                                                                         onConfirm: async () => {
                                                                                             setIsLoading(true);
                                                                                             const res = await updateMaterialRequirementStatus(req.id, 'REJECTED');
                                                                                             if (res && !res.success) {
                                                                                                 alert("Error: " + (res.error || "Failed to update status."));
                                                                                             }
                                                                                             setRefreshTrigger(p => p + 1);
                                                                                             setIsLoading(false);
                                                                                         }
                                                                                     });
                                                                                 }}
                                                                                 className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-100 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                                                             >
                                                                                 Reject
                                                                             </button>
                                                                         </>
                                                                     )}
                                                                     {userRole === 'ADMIN' && req.status === 'APPROVED' && (
                                                                         <button
                                                                             onClick={() => {
                                                                                 setConfirmConfig({
                                                                                     title: 'Dispatch Material?',
                                                                                     message: `Mark as dispatched (material issued) for project ${req.projectId}?`,
                                                                                     confirmText: 'Dispatch',
                                                                                     theme: 'emerald',
                                                                                     onConfirm: async () => {
                                                                                         setIsLoading(true);
                                                                                         const res = await updateMaterialRequirementStatus(req.id, 'DISPATCHED');
                                                                                         if (res && !res.success) {
                                                                                             alert("Error: " + (res.error || "Failed to update status."));
                                                                                         }
                                                                                         setRefreshTrigger(p => p + 1);
                                                                                         setIsLoading(false);
                                                                                     }
                                                                                 });
                                                                             }}
                                                                             className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-100 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                                                         >
                                                                             Dispatch
                                                                         </button>
                                                                     )}
                                                                     {/* Only Admin can delete requirement logs */}
                                                                     {userRole === 'ADMIN' && (
                                                                         <button
                                                                             onClick={() => {
                                                                                 setConfirmConfig({
                                                                                     title: 'Delete Requirement Record?',
                                                                                     message: `Permanently delete this requirement record for ${req.projectId}?`,
                                                                                     confirmText: 'Delete',
                                                                                     theme: 'rose',
                                                                                     onConfirm: async () => {
                                                                                         setIsLoading(true);
                                                                                         await deleteMaterialRequirement(req.id);
                                                                                         setRefreshTrigger(p => p + 1);
                                                                                         setIsLoading(false);
                                                                                     }
                                                                                 });
                                                                             }}
                                                                             className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 cursor-pointer"
                                                                             title="Delete Request"
                                                                         >
                                                                             <Trash2 className="w-3.5 h-3.5" />
                                                                         </button>
                                                                     )}
                                                                 </div>
                                                             </td>
                                                         </tr>
                                                     );
                                                 })}
                                             {requirements.length === 0 && (
                                                 <tr>
                                                     <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">No material requirements recorded.</td>
                                                 </tr>
                                             )}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>
                        </div>
                    )}

                </main>
            </div>

            {/* Modals */}
            {confirmConfig && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 p-8 text-center space-y-6">
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center border ${
                            confirmConfig.theme === 'rose' 
                                ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                : confirmConfig.theme === 'emerald'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                            {confirmConfig.theme === 'rose' ? (
                                <AlertTriangle className="w-6 h-6" />
                            ) : confirmConfig.theme === 'emerald' ? (
                                <CheckCircle2 className="w-6 h-6" />
                            ) : (
                                <ClipboardList className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{confirmConfig.title}</h3>
                            <p className="text-xs text-slate-400 mt-2 font-bold leading-normal">{confirmConfig.message}</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setConfirmConfig(null)} 
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    confirmConfig.onConfirm();
                                    setConfirmConfig(null);
                                }} 
                                className={`flex-1 py-3 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                    confirmConfig.theme === 'rose' 
                                        ? 'bg-rose-600 hover:bg-rose-700' 
                                        : confirmConfig.theme === 'emerald'
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {confirmConfig.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddStaffModalOpen && (
                <AddStaffModal 
                    isOpen={isAddStaffModalOpen}
                    onClose={() => setIsAddStaffModalOpen(false)}
                    onAdd={handleAddStaffSuccess}
                    existingStaff={localStaffList}
                />
            )}

            {isAddProjectModalOpen && (
                <NewProjectModal 
                    isOpen={isAddProjectModalOpen}
                    onClose={() => setIsAddProjectModalOpen(false)}
                    onAdd={(newProj) => {
                        if (onAddProject) {
                            onAddProject(newProj);
                        }
                    }}
                    existingProjects={projectList}
                />
            )}

            {/* EDIT STOCK LEVEL MODAL */}
            {modalConfig && modalConfig.type === 'ITEM' && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 sm:p-6 print:hidden animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Edit Material: {modalConfig.data.name}</h3>
                                <button 
                                    id="fix-fev-btn"
                                    onClick={async () => {
                                        try {
                                            const { updateDoc, doc } = await import('firebase/firestore');
                                            await updateDoc(doc((window as any).db, "current_stock", "Eng-079"), {
                                                availableStock: 4,
                                                totalInward: 0
                                            });
                                            console.log("FIXED_FEVIKWIK_STOCK");
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }}
                                    style={{ display: 'none' }}
                                >
                                    Fix Fev
                                </button>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Catalog Code ({modalConfig.data.itemCode})</p>
                            </div>
                            <button onClick={() => setModalConfig(null)} className="p-1.5 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            {/* Material Name */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Material Name</label>
                                <input 
                                    type="text" 
                                    defaultValue={modalConfig.data.name}
                                    id="stock-name-input"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                />
                            </div>

                            {/* Category & Unit in one row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                                    <input 
                                        type="text" 
                                        defaultValue={modalConfig.data.category}
                                        id="stock-category-input"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit</label>
                                    <input 
                                        type="text" 
                                        defaultValue={modalConfig.data.unit}
                                        id="stock-unit-input"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Unit Price & Min Threshold in one row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit Price (₹)</label>
                                    <input 
                                        type="number" 
                                        defaultValue={modalConfig.data.unitPrice || 0}
                                        id="stock-price-input"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Min Threshold</label>
                                    <input 
                                        type="number" 
                                        defaultValue={modalConfig.data.minThreshold || 5}
                                        id="stock-threshold-input"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Available Stock Level */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    Available Stock Level
                                </label>
                                <div className="relative flex items-center">
                                    <input 
                                        type="number" 
                                        defaultValue={modalConfig.data.availableStock || modalConfig.data.currentStock}
                                        id="stock-adjust-input"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-16 text-xl font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-850"
                                    />
                                    {modalConfig.data.unit && (
                                        <span className="absolute right-4 text-slate-400 text-sm font-black uppercase pointer-events-none">
                                            {modalConfig.data.unit}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Rack Location */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    Rack Location
                                </label>
                                <input 
                                    type="text" 
                                    defaultValue={modalConfig.data.location || ''}
                                    placeholder="e.g. Rack No. 4"
                                    id="stock-location-input"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
                            <button 
                                type="button"
                                onClick={() => {
                                    if (userRole !== 'ADMIN') {
                                        const pass = prompt("ADMIN AUTHORIZATION REQUIRED\nEnter Passcode to Delete Material:");
                                        if (pass !== '9999' && pass !== '0001') {
                                            alert("Incorrect PIN. Access Denied.");
                                            return;
                                        }
                                    }
                                    setConfirmConfig({
                                        title: 'Delete Material?',
                                        message: `Are you sure you want to permanently delete ${modalConfig.data.name}? This will remove it from the catalog.`,
                                        confirmText: 'Delete',
                                        theme: 'rose',
                                        onConfirm: async () => {
                                            try {
                                                setIsLoading(true);
                                                await deleteInventoryItem(modalConfig.data.itemCode);
                                                setRefreshTrigger(prev => prev + 1);
                                                setModalConfig(null);
                                            } catch (err: any) {
                                                console.error(err);
                                                storeGuardian.logError('DELETE_ITEM', err.message || 'Delete failed', 'StoreStockReport DeleteItem', String(userRole));
                                                alert(`Failed to delete: ${err.message || err}`);
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }
                                    });
                                }}
                                disabled={isLoading}
                                className="px-4 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black rounded-xl transition-all uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                                title="Delete Material Record"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>

                            <button 
                                onClick={async () => {
                                    const nameVal = (document.getElementById('stock-name-input') as HTMLInputElement).value.trim();
                                    const catVal = (document.getElementById('stock-category-input') as HTMLInputElement).value.trim();
                                    const unitVal = (document.getElementById('stock-unit-input') as HTMLInputElement).value.trim();
                                    const priceVal = parseFloat((document.getElementById('stock-price-input') as HTMLInputElement).value);
                                    const threshVal = parseInt((document.getElementById('stock-threshold-input') as HTMLInputElement).value);
                                    const qtyVal = parseInt((document.getElementById('stock-adjust-input') as HTMLInputElement).value);
                                    const locVal = normalizeRackLocation((document.getElementById('stock-location-input') as HTMLInputElement).value.trim());
                                    
                                    if (!nameVal) {
                                        alert("Please enter a valid material name.");
                                        return;
                                    }
                                    if (isNaN(qtyVal) || qtyVal < 0) {
                                        alert("Please enter a valid stock level.");
                                        return;
                                    }
                                    try {
                                        setIsLoading(true);
                                        await updateInventoryItemDetails(
                                            modalConfig.data.itemCode, 
                                            qtyVal, 
                                            locVal, 
                                            nameVal, 
                                            catVal, 
                                            unitVal, 
                                            isNaN(threshVal) ? undefined : threshVal,
                                            isNaN(priceVal) ? undefined : priceVal
                                        );
                                        setRefreshTrigger(prev => prev + 1);
                                        setModalConfig(null);
                                    } catch (err: any) {
                                        console.error(err);
                                        storeGuardian.logError('UPDATE_ITEM', err.message || 'Update failed', 'StoreStockReport UpdateItem', String(userRole));
                                        alert(`Failed to update details: ${err.message || err}`);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }} 
                                disabled={isLoading} 
                                className="flex-1 py-3.5 bg-[#0e4368] hover:bg-[#0b3350] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-[9px] uppercase tracking-widest disabled:opacity-50"
                            >
                                {isLoading ? 'Updating Details...' : 'Apply Correction'}
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

            {/* DELETE TRANSACTION MODAL */}
            {modalConfig && modalConfig.type === 'DELETE_TX' && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 p-8 text-center space-y-6">
                        <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Delete Transaction?</h3>
                            <p className="text-xs text-slate-400 mt-2 font-bold leading-normal">
                                Are you sure you want to delete this transaction for <strong className="text-slate-700">{modalConfig.data.materialName}</strong> ({modalConfig.data.quantity} {modalConfig.data.unit})? 
                                This will automatically revert the stock level.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setModalConfig(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                            <button 
                                onClick={async () => {
                                    try {
                                        setIsLoading(true);
                                        const res = await deleteTransaction(modalConfig.data);
                                        if (res.success) {
                                            setRefreshTrigger(prev => prev + 1);
                                            setModalConfig(null);
                                        } else {
                                            alert(`Failed to delete transaction: ${res.error}`);
                                        }
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

            {/* EDIT TRANSACTION MODAL */}
            {modalConfig && modalConfig.type === 'EDIT_TX' && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Edit Transaction: {modalConfig.data.materialName}</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{modalConfig.data.type} Log ({modalConfig.data.itemCode})</p>
                            </div>
                            <button onClick={() => setModalConfig(null)} className="p-1.5 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Quantity */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Quantity (in {modalConfig.data.unit})</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    defaultValue={modalConfig.data.quantity}
                                    id="edit-tx-qty"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                />
                            </div>

                            {/* Staff / Supplier */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Staff / Supplier</label>
                                <select 
                                    defaultValue={modalConfig.data.staffName}
                                    id="edit-tx-staff"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                >
                                    {localStaffList.map(staff => (
                                        <option key={staff} value={staff}>{staff}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Project ID */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Project ID</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddProjectModalOpen(true)}
                                        className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        <Plus className="w-2.5 h-2.5" /> Create Project ID
                                    </button>
                                </div>
                                <select 
                                    defaultValue={modalConfig.data.projectId}
                                    id="edit-tx-project"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                >
                                    {projectList.map(p => {
                                        const proj = projects.find(proj => proj.projectId === p);
                                        const displayLabel = proj && proj.client ? `${p} - ${proj.client}` : p;
                                        return (
                                            <option key={p} value={p}>{displayLabel}</option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Remarks */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Remarks</label>
                                <input 
                                    type="text" 
                                    defaultValue={modalConfig.data.remarks}
                                    id="edit-tx-remarks"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <button 
                                onClick={async () => {
                                    try {
                                        const qtyInput = document.getElementById('edit-tx-qty') as HTMLInputElement;
                                        const staffSelect = document.getElementById('edit-tx-staff') as HTMLSelectElement;
                                        const projectSelect = document.getElementById('edit-tx-project') as HTMLSelectElement;
                                        const remarksInput = document.getElementById('edit-tx-remarks') as HTMLInputElement;

                                        if (!qtyInput || !staffSelect || !projectSelect || !remarksInput) {
                                            throw new Error(`Missing elements: qty=${!!qtyInput}, staff=${!!staffSelect}, proj=${!!projectSelect}, rem=${!!remarksInput}`);
                                        }

                                        const newQty = parseInt(qtyInput.value);
                                        if (isNaN(newQty) || newQty < 1) {
                                            alert("Please enter a valid quantity.");
                                            return;
                                        }

                                        setIsLoading(true);
                                        const res = await editTransaction(
                                            modalConfig.data,
                                            newQty,
                                            staffSelect.value,
                                            remarksInput.value,
                                            projectSelect.value
                                        );
                                        if (res.success) {
                                            setRefreshTrigger(prev => prev + 1);
                                            setModalConfig(null);
                                        } else {
                                            alert(`Failed to update transaction: ${res.error}`);
                                        }
                                    } catch (err: any) {
                                        alert(`Failed to edit: ${err.message || err}`);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }} 
                                disabled={isLoading} 
                                className="w-full py-3 bg-[#0e4368] hover:bg-[#0b3350] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-[10px] uppercase tracking-widest disabled:opacity-50"
                            >
                                {isLoading ? 'Updating Log...' : 'SAVE CHANGES'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* CREATE MATERIAL MODAL */}
            {isCreateMaterialModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 sm:p-6 print:hidden animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Create New Material</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Register Material to Catalog</p>
                            </div>
                            <button onClick={() => setIsCreateMaterialModalOpen(false)} className="p-1.5 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const codeVal = (document.getElementById('create-material-code') as HTMLInputElement).value.trim().toUpperCase().replace(/\s+/g, '_');
                            const nameVal = (document.getElementById('create-material-name') as HTMLInputElement).value.trim();
                            const catVal = createCategory === 'NEW' ? customCategory.trim() : createCategory;
                            const unitVal = createUnit === 'NEW' ? customUnit.trim() : createUnit;
                            const priceVal = parseFloat((document.getElementById('create-material-price') as HTMLInputElement).value) || 0;
                            const threshVal = parseInt((document.getElementById('create-material-threshold') as HTMLInputElement).value) || 5;
                            const qtyVal = parseInt((document.getElementById('create-material-qty') as HTMLInputElement).value) || 0;
                            const locVal = normalizeRackLocation(createLocation === 'NEW' ? customLocation.trim() : (createLocation || 'MAIN STORE'));

                            if (!codeVal || !nameVal || !catVal || !unitVal) {
                                alert("Please fill in all required fields (Code, Name, Category, Unit).");
                                return;
                            }

                            // Check if itemCode already exists in currentStock
                            if (currentStock.some(i => i.itemCode === codeVal)) {
                                alert(`Material Code "${codeVal}" already exists in the catalog.`);
                                return;
                            }

                            try {
                                setIsLoading(true);
                                await addInventoryItem({
                                    itemCode: codeVal,
                                    name: nameVal,
                                    category: catVal,
                                    unit: unitVal,
                                    currentStock: qtyVal,
                                    totalInward: 0,
                                    totalOutward: 0,
                                    minThreshold: threshVal,
                                    unitPrice: priceVal,
                                    location: locVal,
                                    lastUpdated: new Date().toISOString()
                                });
                                setRefreshTrigger(prev => prev + 1);
                                setIsCreateMaterialModalOpen(false);
                            } catch (err: any) {
                                alert(`Failed to create material: ${err.message || err}`);
                            } finally {
                                setIsLoading(false);
                            }
                        }} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                            <div className="p-6 space-y-4">
                                {/* Material Code & Name */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Material Code *</label>
                                        <input 
                                            type="text" 
                                            required
                                            id="create-material-code"
                                            list="existing-material-codes"
                                            placeholder="e.g. ADH-015"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        />
                                        <datalist id="existing-material-codes">
                                            {currentStock.map(item => (
                                                <option key={item.itemCode} value={item.itemCode}>{item.name}</option>
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Material Name *</label>
                                        <input 
                                            type="text" 
                                            required
                                            id="create-material-name"
                                            placeholder="e.g. Araldite"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Category & Unit */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Category *</label>
                                        <select 
                                            required
                                            id="create-material-category-select"
                                            value={createCategory}
                                            onChange={(e) => setCreateCategory(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        >
                                            <option value="">Choose Category</option>
                                            {Array.from(new Set(currentStock.map(i => i.category).filter(Boolean))).sort().map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            <option value="NEW">+ Add New Category</option>
                                        </select>
                                        {createCategory === 'NEW' && (
                                            <input 
                                                type="text" 
                                                required
                                                id="create-material-category-custom"
                                                placeholder="Enter new category name"
                                                value={customCategory}
                                                onChange={(e) => setCustomCategory(e.target.value)}
                                                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all animate-in slide-in-from-top-1 duration-200"
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit *</label>
                                        <select 
                                            required
                                            id="create-material-unit-select"
                                            value={createUnit}
                                            onChange={(e) => setCreateUnit(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        >
                                            <option value="">Choose Unit</option>
                                            {STANDARD_UNITS.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                            <option value="NEW">+ Add New Unit</option>
                                        </select>
                                        {createUnit === 'NEW' && (
                                            <input 
                                                type="text" 
                                                required
                                                id="create-material-unit-custom"
                                                placeholder="Enter custom unit"
                                                value={customUnit}
                                                onChange={(e) => setCustomUnit(e.target.value)}
                                                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all animate-in slide-in-from-top-1 duration-200"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Unit Price & Min Threshold */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit Price (₹)</label>
                                        <input 
                                            type="number" 
                                            id="create-material-price"
                                            placeholder="0"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Min Threshold</label>
                                        <input 
                                            type="number" 
                                            id="create-material-threshold"
                                            defaultValue={5}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Available Initial Qty & Location */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Initial Available Qty</label>
                                        <input 
                                            type="number" 
                                            id="create-material-qty"
                                            defaultValue={0}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rack Location</label>
                                        <select 
                                            id="create-material-location-select"
                                            value={createLocation}
                                            onChange={(e) => setCreateLocation(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        >
                                            <option value="MAIN STORE">MAIN STORE</option>
                                            {Array.from(new Set(currentStock.map(i => normalizeRackLocation(i.location || 'MAIN STORE')).filter(loc => loc && loc !== 'MAIN STORE'))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                            <option value="NEW">+ Add New Location</option>
                                        </select>
                                        {createLocation === 'NEW' && (
                                            <input 
                                                type="text" 
                                                required
                                                id="create-material-location-custom"
                                                placeholder="Enter rack location name"
                                                value={customLocation}
                                                onChange={(e) => setCustomLocation(e.target.value)}
                                                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all animate-in slide-in-from-top-1 duration-200"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
                                {/* STOCK TABS */}
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => {
                                            const runMigration = async () => {
                                                const badItems = currentStock.filter(i => i.itemCode && !i.itemCode.toUpperCase().startsWith('ENG'));
                                                if (badItems.length === 0) {
                                                    alert("All material codes are already in ENG format!");
                                                    return;
                                                }
                                                
                                                if (!window.confirm(`Found ${badItems.length} items with invalid codes. Migrate them to ENG-XXXX format now?`)) return;

                                                let maxEng = 0;
                                                currentStock.forEach(i => {
                                                    const match = i.itemCode?.match(/ENG-?(\d+)/i);
                                                    if (match) {
                                                        const num = parseInt(match[1], 10);
                                                        if (num > maxEng) maxEng = num;
                                                    }
                                                });

                                                let count = 0;
                                                for (const oldItem of badItems) {
                                                    maxEng++;
                                                    const newCode = `ENG-${String(maxEng).padStart(4, '0')}`;
                                                    const newItem = { ...oldItem, itemCode: newCode, currentStock: oldItem.availableStock || 0 } as any;
                                                    if (newItem.id) delete newItem.id;
                                                    
                                                    try {
                                                        await addInventoryItem(newItem);
                                                        await deleteInventoryItem(oldItem.itemCode);
                                                        count++;
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }
                                                alert(`Successfully migrated ${count} items to ENG-XXXX format!`);
                                                window.location.reload();
                                            };
                                            runMigration();
                                        }}
                                        className="px-6 py-2 rounded-xl bg-red-600/10 text-red-500 font-semibold text-sm tracking-widest hover:bg-red-600/20 transition-all flex items-center gap-2"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        FIX MATERIAL CODES
                                    </button>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateMaterialModalOpen(false)}
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-all text-[9px] uppercase tracking-widest text-center"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3.5 bg-[#0e4368] hover:bg-[#0b3350] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-[9px] uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating...' : 'Create Material'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* EDIT REQUIREMENT MODAL */}
            {editingRequirement && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 sm:p-6 print:hidden animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Edit Requirement</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {editingRequirement.id}</p>
                            </div>
                            <button onClick={() => setEditingRequirement(null)} className="p-1.5 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setIsLoading(true);
                            try {
                                const res = await updateMaterialRequirement(editingRequirement);
                                if (res.success) {
                                    setEditingRequirement(null);
                                    setRefreshTrigger(p => p + 1);
                                } else {
                                    alert("Failed to update requirement.");
                                }
                            } catch (err: any) {
                                alert("Error updating requirement: " + err.message);
                            } finally {
                                setIsLoading(false);
                            }
                        }} className="overflow-y-auto custom-scrollbar flex-1 flex flex-col">
                            <div className="p-6 space-y-4 flex-1">
                                {/* Material Name */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Material Name *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={editingRequirement.materialName}
                                        onChange={(e) => setEditingRequirement({ ...editingRequirement, materialName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>

                                {/* Project ID & Requested By */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Project ID *</label>
                                        <select 
                                            required
                                            value={editingRequirement.projectId}
                                            onChange={(e) => setEditingRequirement({ ...editingRequirement, projectId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        >
                                            {projectList.map(p => {
                                                const proj = projects.find(proj => proj.projectId === p);
                                                const displayLabel = proj && proj.client ? `${p} - ${proj.client}` : p;
                                                return (
                                                    <option key={p} value={p}>{displayLabel}</option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Requested By *</label>
                                        <select 
                                            required
                                            value={editingRequirement.requestedBy}
                                            onChange={(e) => setEditingRequirement({ ...editingRequirement, requestedBy: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        >
                                            {localStaffList.map(staff => (
                                                <option key={staff} value={staff}>{staff}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Quantity & Unit */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Quantity *</label>
                                        <input 
                                            type="number" 
                                            required
                                            min={0.001}
                                            step="any"
                                            value={editingRequirement.quantity}
                                            onChange={(e) => setEditingRequirement({ ...editingRequirement, quantity: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit *</label>
                                        <select 
                                            value={STANDARD_UNITS.includes(editingRequirement.unit) ? editingRequirement.unit : "Other"}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === 'Other') {
                                                    setEditingRequirement({ ...editingRequirement, unit: '' });
                                                } else {
                                                    setEditingRequirement({ ...editingRequirement, unit: val });
                                                }
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        >
                                            {STANDARD_UNITS.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                            <option value="Other">+ Add Custom Unit (Other)</option>
                                        </select>
                                        {(!STANDARD_UNITS.includes(editingRequirement.unit) || editingRequirement.unit === '') && (
                                            <input 
                                                type="text"
                                                required
                                                placeholder="Enter custom unit name..."
                                                value={editingRequirement.unit}
                                                onChange={(e) => setEditingRequirement({ ...editingRequirement, unit: e.target.value })}
                                                className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Remarks */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Remarks</label>
                                    <textarea 
                                        rows={2}
                                        value={editingRequirement.remarks || ''}
                                        onChange={(e) => setEditingRequirement({ ...editingRequirement, remarks: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none"
                                        placeholder="Add context..."
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingRequirement(null)}
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-all text-[9px] uppercase tracking-widest text-center"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-[9px] uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StoreStockReport;


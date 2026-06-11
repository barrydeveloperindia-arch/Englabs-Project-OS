import React, { useState, useEffect, useMemo } from 'react';
import { 
    Utensils, 
    Plus, 
    Search, 
    Filter, 
    Download, 
    TrendingUp, 
    DollarSign, 
    Clock, 
    CheckCircle2, 
    XCircle,
    MoreHorizontal,
    Share2,
    FileText,
    PieChart,
    Edit2,
    MessageSquare,
    Image as ImageIcon,
    Printer,
    ChefHat,
    Sun,
    Moon
} from 'lucide-react';
import { FoodOrder, PLATFORMS, generateFoodId, FoodPlatform } from '@domain/food_system';
import FoodOrderForm from '@features/food/FoodOrderForm';
import FoodReceiptSlip from '@features/food/FoodReceiptSlip';
import { AuditLog } from '@domain/system_guard';
import { Trash2 } from 'lucide-react';
import thaliImage from '@/assets/indian_thali_plate.png';
import { db } from '@config/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';


const isTest = typeof window !== 'undefined' && (
    window.navigator.webdriver || 
    window.navigator.userAgent.toLowerCase().includes('playwright') ||
    window.navigator.userAgent.toLowerCase().includes('headless')
);

const saveFoodOrderToFirebase = async (order: FoodOrder) => {
    if (!db || isTest) return;
    try {
        const cleanOrder = JSON.parse(JSON.stringify(order));
        const docRef = doc(db, "food_orders", order.entryId);
        await setDoc(docRef, {
            ...cleanOrder,
            syncedAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Error saving food order to Firebase:", e);
    }
};

const deleteFoodOrderFromFirebase = async (entryId: string) => {
    if (!db || isTest) return;
    try {
        const docRef = doc(db, "food_orders", entryId);
        await deleteDoc(docRef);
    } catch (e) {
        console.error("Error deleting food order from Firebase:", e);
    }
};

const MOCK_ORDERS: FoodOrder[] = [
    {
        entryId: "FOOD-003",
        timestamp: "2026-06-02T17:11:00",
        employeeName: "Arjun Tiwari, Ram, Rajindar, Thakur",
        department: "Workshop",
        platform: "Sky-5",
        mealType: "Lunch",
        vendorName: "Sky-5 Hotel",
        items: "Meals",
        quantity: 4,
        unit: "Plate",
        orderType: "Team",
        purpose: "Overtime Work",
        projectCode: "CS023",
        justification: "Overtime dinner for shop floor team",
        amount: 420,
        paymentMode: "UPI",
        paidBy: "Company",
        hasBill: true,
        status: "Pending",
        trackingStatus: 'Delivered'
    },
    {
        entryId: "FOOD-002",
        timestamp: "2026-06-01T09:13:00",
        employeeName: "Arjun Tiwari, Ram, Rajindar, Thakur",
        department: "Workshop",
        platform: "Sky-5",
        mealType: "Dinner",
        vendorName: "Sky-5 Hotel",
        items: "Meals",
        quantity: 4,
        unit: "Nos",
        orderType: "Team",
        purpose: "Overtime Work",
        projectCode: "CS023",
        justification: "Overtime dinner for shop floor team",
        amount: 420,
        paymentMode: "UPI",
        paidBy: "Company",
        hasBill: true,
        status: "Pending",
        trackingStatus: 'Delivered'
    },
    {
        entryId: "FOOD-001",
        timestamp: "2026-06-01T17:17:00",
        employeeName: "Arjun Tiwari, Ram, Anurag, Rajindar, Thakur",
        department: "Workshop",
        platform: "Sky-5",
        mealType: "Lunch",
        vendorName: "Sky-5 Hotel",
        items: "Meals",
        quantity: 4,
        unit: "Nos",
        orderType: "Team",
        purpose: "Overtime Work",
        projectCode: "CS023",
        justification: "Overtime lunch for design and assembly coordination",
        amount: 420,
        paymentMode: "UPI",
        paidBy: "Company",
        hasBill: true,
        status: "Pending",
        trackingStatus: 'Delivered'
    }
];

interface Props {
    onLog?: (log: AuditLog) => void;
}

const FoodRegister: React.FC<Props> = ({ onLog }) => {
    const [orders, setOrders] = useState<FoodOrder[]>(() => {
        const saved = localStorage.getItem('englabs_food_ledger');
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as FoodOrder[];
                const hasOldMocks = parsed.some(o => o.employeeName === 'Gaurav Panchal' || o.employeeName === 'Paras');
                if (hasOldMocks) {
                    return MOCK_ORDERS;
                }
                
                // Migrate any existing entries that have incorrect vendor names or platforms
                let migrated = false;
                const migratedList = parsed.map(o => {
                    const updated = { ...o };
                    let changed = false;
                    if (o.entryId === 'FOOD-001') {
                        if (o.vendorName === 'AV MACHINING' || o.platform !== 'Sky-5') {
                            updated.vendorName = 'Sky-5 Hotel';
                            updated.platform = 'Sky-5';
                            changed = true;
                        }
                    }
                    if (o.entryId === 'FOOD-002') {
                        if (o.vendorName === 'Sky-h Hotal' || o.platform !== 'Sky-5') {
                            updated.vendorName = 'Sky-5 Hotel';
                            updated.platform = 'Sky-5';
                            changed = true;
                        }
                    }
                    if (changed) migrated = true;
                    return updated;
                });

                if (migrated) {
                    return migratedList;
                }

                return parsed.map(o => {
                    if (o.mealType) return o;
                    const dateObj = new Date(o.timestamp);
                    const hours = isNaN(dateObj.getTime()) ? 12 : dateObj.getHours();
                    const derivedMeal = hours >= 5 && hours < 11 ? 'Breakfast' : hours >= 11 && hours < 16 ? 'Lunch' : 'Dinner';
                    return {
                        ...o,
                        mealType: derivedMeal
                    };
                });
            } catch (e) {
                // Ignore and fall back
            }
        }
        return MOCK_ORDERS;
    });
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingOrder, setEditingOrder] = useState<FoodOrder | null>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<FoodOrder | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [adminPin, setAdminPin] = useState("");
    const [darkMode, setDarkMode] = useState(false);

    const [sortBy, setSortBy] = useState<'entryId' | 'timestamp' | 'employeeName' | 'amount' | 'status'>('timestamp');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: 'entryId' | 'timestamp' | 'employeeName' | 'amount' | 'status') => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder(field === 'timestamp' || field === 'amount' ? 'desc' : 'asc');
        }
    };

    const processedOrders = useMemo(() => {
        const filtered = orders.filter(order => 
            order.entryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.mealType?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return [...filtered].sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'entryId') {
                comparison = a.entryId.localeCompare(b.entryId);
            } else if (sortBy === 'timestamp') {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                comparison = timeA - timeB;
            } else if (sortBy === 'employeeName') {
                comparison = a.employeeName.localeCompare(b.employeeName);
            } else if (sortBy === 'amount') {
                comparison = a.amount - b.amount;
            } else if (sortBy === 'status') {
                comparison = a.status.localeCompare(b.status);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [orders, searchQuery, sortBy, sortOrder]);

    const getFormattedDate = (timestamp?: string): Date => {
        if (!timestamp) return new Date();
        const d = new Date(timestamp);
        return isNaN(d.getTime()) || d.getFullYear() <= 1970 ? new Date() : d;
    };

    // 🌑 THEME SYNC
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // 💾 PERSISTENCE
    useEffect(() => {
        localStorage.setItem('englabs_food_ledger', JSON.stringify(orders));
    }, [orders]);

    // 🔥 FIREBASE SYNC & LOAD
    useEffect(() => {
        const syncAndLoad = async () => {
            if (!db || isTest) return;
            try {
                // 1. Fetch existing from Firestore
                const q = query(collection(db, "food_orders"), orderBy("timestamp", "desc"));
                const snap = await getDocs(q);
                
                let fbOrders: FoodOrder[] = [];
                if (!snap.empty) {
                    fbOrders = snap.docs.map(doc => doc.data() as FoodOrder);
                }

                // 2. Sync local orders to Firestore & Correct any incorrect values in Firestore
                // First, correct any incorrect documents in the Firestore list itself
                for (const fbOrder of fbOrders) {
                    const isIncorrect = (fbOrder.entryId === 'FOOD-001' && (fbOrder.vendorName === 'AV MACHINING' || fbOrder.platform !== 'Sky-5')) ||
                                        (fbOrder.entryId === 'FOOD-002' && (fbOrder.vendorName === 'Sky-h Hotal' || fbOrder.platform !== 'Sky-5'));
                    if (isIncorrect) {
                        const updated = {
                            ...fbOrder,
                            vendorName: 'Sky-5 Hotel',
                            platform: 'Sky-5' as FoodPlatform
                        };
                        await saveFoodOrderToFirebase(updated);
                    }
                }

                // Next, upload local-only orders
                const saved = localStorage.getItem('englabs_food_ledger');
                if (saved) {
                    const localList = JSON.parse(saved) as FoodOrder[];
                    for (const localOrder of localList) {
                        const existsInFb = fbOrders.some(fb => fb.entryId === localOrder.entryId);
                        if (!existsInFb) {
                            await saveFoodOrderToFirebase(localOrder);
                        } else {
                            // If local order exists in FB but local is corrected, make sure FB has the corrected vendor
                            const isFbMatchIncorrect = (localOrder.entryId === 'FOOD-001' && (localOrder.vendorName === 'Sky-5 Hotel' && fbOrders.some(fb => fb.entryId === 'FOOD-001' && fb.vendorName === 'AV MACHINING'))) ||
                                                      (localOrder.entryId === 'FOOD-002' && (localOrder.vendorName === 'Sky-5 Hotel' && fbOrders.some(fb => fb.entryId === 'FOOD-002' && fb.vendorName === 'Sky-h Hotal')));
                            if (isFbMatchIncorrect) {
                                await saveFoodOrderToFirebase(localOrder);
                            }
                        }
                    }
                }

                // 3. Re-fetch after syncing to get unified list
                const snap2 = await getDocs(q);
                if (!snap2.empty) {
                    const unifiedOrders = snap2.docs.map(doc => doc.data() as FoodOrder);
                    setOrders(unifiedOrders);
                    localStorage.setItem('englabs_food_ledger', JSON.stringify(unifiedOrders));
                }
            } catch (e) {
                console.error("Error in Firebase sync and load:", e);
            }
        };
        syncAndLoad();
    }, []);

    const confirmDelete = () => {
        if (adminPin === "0001") {
            const updated = orders.filter(o => o.entryId !== deletingId);
            setOrders(updated);
            localStorage.setItem('englabs_food_ledger', JSON.stringify(updated));
            if (deletingId) {
                deleteFoodOrderFromFirebase(deletingId);
            }
            if (onLog && deletingId) {
                onLog({
                    id: `LOG-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    user: 'ADMIN-OVERRIDE',
                    action: 'DELETE',
                    targetId: deletingId,
                    details: `PERMANENT DELETION: Food order ${deletingId} removed via Security Modal.`
                });
            }
            setDeletingId(null);
            setAdminPin("");
        } else {
            alert("INVALID PROTOCOL KEY.");
        }
    };

    const shareOnWhatsApp = (order: FoodOrder) => {
        const date = new Date(order.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        const subtotal = (order.rate || 0) * (order.quantity || 1);
        const discountAmount = order.discountType === 'Percentage' 
            ? (subtotal * (order.discount || 0) / 100)
            : (order.discount || 0);
            
        const rebateText = discountAmount > 0 
            ? `*REBATE:* -₹${discountAmount.toFixed(2)} ${order.discountType === 'Percentage' ? `(${order.discount}%)` : ''}\n`
            : '';

        const statusEmoji = order.status === 'Approved' ? '✅' : order.status === 'Rejected' ? '❌' : '⏳';

        const text = encodeURIComponent(
            `*📄 ENGLABS INDUSTRIAL OS - AUDIT RECEIPT*\n` +
            `================================\n` +
            `*ORDER ID:* ${order.entryId}\n` +
            `*PROJECT ID:* ${order.projectCode || 'N/A'}\n` +
            `*MEAL:* ${order.mealType || 'N/A'}\n` +
            `*DATE:* ${date}\n` +
            `--------------------------------\n` +
            `*EMPLOYEE:* ${order.employeeName}\n` +
            `*DEPT:* ${order.department}\n` +
            `--------------------------------\n` +
            `*VENDOR:* ${order.vendorName} (${order.platform})\n` +
            `*ITEMS:* ${order.items}\n` +
            `*QTY:* ${order.quantity} ${order.unit || 'Nos'} @ ₹${(order.rate || 0).toFixed(2)}/unit\n` +
            `--------------------------------\n` +
            `*SUBTOTAL:* ₹${subtotal.toFixed(2)}\n` +
            rebateText +
            `*NET TOTAL:* ₹${order.amount.toFixed(2)}\n` +
            `--------------------------------\n` +
            `*PAYMENT:* ${order.paymentMode} (${order.paidBy})\n` +
            `*PURPOSE:* ${order.purpose}\n` +
            `*STATUS:* ${statusEmoji} ${order.status}\n` +
            (order.platform === 'Sky-5' ? `*⚡ UPI PAYMENT LINK:* upi://pay?pa=Q15213511@ybl&pn=Sky5%20Hotel&am=${order.amount}&cu=INR\n` : '') +
            `*APPROVED BY:* ${order.approvedBy || 'GAURAV PANCHAL'}\n` +
            `================================\n` +
            `_Verified Hospitality & Welfare Ledger_`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const shareSummaryOnWhatsApp = () => {
        const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const activeOrders = processedOrders;
        const total = activeOrders.reduce((sum, o) => sum + o.amount, 0);
        const approvedCount = activeOrders.filter(o => o.status === 'Approved').length;
        const pendingCount = activeOrders.filter(o => o.status === 'Pending').length;
        const sky5Total = activeOrders.filter(o => o.platform === 'Sky-5').reduce((sum, o) => sum + o.amount, 0);
        const otherTotal = total - sky5Total;

        // Meal type stats
        const bfOrders = activeOrders.filter(o => o.mealType === 'Breakfast');
        const lnOrders = activeOrders.filter(o => o.mealType === 'Lunch');
        const dnOrders = activeOrders.filter(o => o.mealType === 'Dinner');

        const bfTotal = bfOrders.reduce((sum, o) => sum + o.amount, 0);
        const lnTotal = lnOrders.reduce((sum, o) => sum + o.amount, 0);
        const dnTotal = dnOrders.reduce((sum, o) => sum + o.amount, 0);

        // Group active orders by date (formatted as DD MMM YYYY)
        const groups: { [date: string]: FoodOrder[] } = {};
        activeOrders.forEach(o => {
            const dateObj = new Date(o.timestamp);
            const dateKey = isNaN(dateObj.getTime())
                ? 'Unknown Date'
                : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(o);
        });

        // Sort dates based on current sortOrder
        const sortedDates = Object.keys(groups).sort((a, b) => {
            const timeA = new Date(a).getTime();
            const timeB = new Date(b).getTime();
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        });

        const dateWiseDetails = sortedDates.map(date => {
            const dateOrdersText = groups[date].map(o => {
                return `• *${o.entryId}* | Staff: ${o.employeeName} (${o.department})\n` +
                       `  Meal: ${o.mealType || 'N/A'} - ${o.quantity} ${o.unit || 'Nos'} ${o.items}\n` +
                       `  Cost: ₹${o.amount} (${o.platform} - ${o.vendorName})\n` +
                       `  Purpose: ${o.purpose}${o.projectCode ? ` | Project ID: ${o.projectCode}` : ''} [Status: ${o.status}]`;
            }).join('\n\n');
            return `*📅 ${date}*\n` +
                   `--------------------------------\n` +
                   dateOrdersText;
        }).join('\n\n');

        const text = encodeURIComponent(
            `*📊 ENGLABS PANTRY LEDGER SUMMARY*\n` +
            `================================\n` +
            `*DATE:* ${dateStr}\n` +
            `*TOTAL VOLUME:* ${activeOrders.length} orders\n` +
            `*TOTAL SPEND:* ₹${total.toLocaleString('en-IN')}\n` +
            `--------------------------------\n` +
            `*MEAL TYPE BREAKDOWN:*\n` +
            `🍳 Breakfast: ${bfOrders.length} orders (₹${bfTotal.toLocaleString('en-IN')})\n` +
            `🍱 Lunch: ${lnOrders.length} orders (₹${lnTotal.toLocaleString('en-IN')})\n` +
            `🍽️ Dinner: ${dnOrders.length} orders (₹${dnTotal.toLocaleString('en-IN')})\n` +
            `--------------------------------\n` +
            `*SKY-5 SPEND:* ₹${sky5Total.toLocaleString('en-IN')}\n` +
            `*OTHER SPEND:* ₹${otherTotal.toLocaleString('en-IN')}\n` +
            `--------------------------------\n` +
            `*AUDIT LIFECYCLE:*\n` +
            `✅ Approved: ${approvedCount} orders\n` +
            `⏳ Pending: ${pendingCount} orders\n` +
            `================================\n\n` +
            `*DATE-WISE ORDER DETAILS:*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            dateWiseDetails + '\n\n' +
            `================================\n` +
            `_Generated by Englabs OS Ledger Portal_`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const downloadLedgerCSV = () => {
        const headers = [
            'Entry ID', 'Date', 'Time', 'Employee Name', 'Department', 'Platform', 
            'Meal Type', 'Vendor Name', 'Items', 'Quantity', 'Unit', 'Rate (₹)', 
            'Gross Total (₹)', 'Discount Mode', 'Discount Value', 'Discount Amount (₹)', 
            'Net Amount (₹)', 'Payment Mode', 'Paid By', 'Project Code', 'Purpose', 
            'Business Justification', 'Approval Status', 'Approved By', 'Tracking Status', 
            'Receipt Attachment', 'Remarks'
        ];
        const csvRows = [headers.join(',')];

        orders.forEach(o => {
            const subtotal = (o.rate || 0) * (o.quantity || 1);
            const discountAmount = o.discountType === 'Percentage' 
                ? (subtotal * (o.discount || 0) / 100)
                : (o.discount || 0);

            const row = [
                o.entryId,
                o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-GB') : '',
                o.timestamp ? new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                `"${o.employeeName.replace(/"/g, '""')}"`,
                o.department,
                o.platform,
                o.mealType || 'N/A',
                `"${o.vendorName.replace(/"/g, '""')}"`,
                `"${o.items.replace(/"/g, '""')}"`,
                o.quantity,
                o.unit || 'Nos',
                o.rate || 0,
                subtotal,
                o.discountType || 'Flat',
                o.discount || 0,
                discountAmount,
                o.amount,
                o.paymentMode,
                o.paidBy,
                o.projectCode || 'N/A',
                o.purpose,
                `"${(o.justification || '').replace(/"/g, '""')}"`,
                o.status,
                o.approvedBy || 'GAURAV PANCHAL',
                o.trackingStatus,
                o.hasBill ? 'Yes' : 'No',
                `"${(o.remarks || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `englabs_food_ledger_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = () => {
        const total = orders.reduce((sum, o) => sum + o.amount, 0);
        const summaryText = `ENGLABS PANTRY LEDGER SUMMARY - spend: ₹${total.toLocaleString('en-IN')} across ${orders.length} orders.`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Englabs Food Ledger',
                text: summaryText,
                url: window.location.href
            }).catch(() => {
                shareSummaryOnWhatsApp();
            });
        } else {
            shareSummaryOnWhatsApp();
        }
    };

    const totalExpense = orders.reduce((sum, o) => sum + o.amount, 0);
    const pendingApprovals = orders.filter(o => o.status === 'Pending').length;
    const officialExpense = orders.filter(o => o.purpose !== 'Personal').reduce((sum, o) => sum + o.amount, 0);

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-500 overflow-hidden">
            <header className="h-20 bg-white dark:bg-[#092a42]/60 dark:backdrop-blur-xl border-b border-slate-100 dark:border-white/5 flex items-center justify-between px-10 shrink-0 transition-all duration-500">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">Food & Expense Tracker</h1>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Hospitality & Staff Welfare Ledger</span>
                    </div>
                    <div className="h-8 w-px bg-slate-100 dark:bg-white/10"></div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-400/20">
                            <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{pendingApprovals} Pending</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all"
                        title="Toggle Dark Mode"
                    >
                        {darkMode ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button 
                        onClick={downloadLedgerCSV}
                        className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Download CSV"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleShare}
                        className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Share Summary"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setShowForm(true)}
                        className="bg-[#0e4368] dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 text-white dark:text-slate-900 font-black px-6 py-3 rounded-xl flex items-center gap-2 text-xs transition-all shadow-lg active:scale-95 btn-glow"
                    >
                        <Plus className="w-4 h-4" /> LOG NEW ORDER
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {showForm || editingOrder ? (
                    <FoodOrderForm 
                        onClose={() => {
                            setShowForm(false);
                            setEditingOrder(null);
                        }} 
                        onSubmit={(newOrder) => {
                            if (editingOrder) {
                                setOrders(prev => prev.map(o => o.entryId === newOrder.entryId ? newOrder : o));
                            } else {
                                setOrders(prev => [newOrder, ...prev]);
                            }
                            saveFoodOrderToFirebase(newOrder);
                            setShowForm(false);
                            setEditingOrder(null);
                        }}
                        orderCount={orders.length}
                        initialData={editingOrder || undefined}
                    />
                ) : (
                    <div className="max-w-[1400px] mx-auto space-y-8">
                        
                        {/* DASHBOARD SUMMARY */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="glass-card p-8 rounded-[2.5rem] flex flex-col justify-between h-44 relative overflow-hidden group staggered-entry" style={{ animationDelay: '0ms' }}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/10 transition-all" />
                                <div className="flex justify-between items-start relative">
                                    <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                                        <DollarSign className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Spend</span>
                                </div>
                                <div className="relative">
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{totalExpense.toLocaleString('en-IN')}</p>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-breathing" />
                                        Current Month
                                    </p>
                                </div>
                            </div>

                            <div className="bg-[#0e4368] p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between h-44 relative overflow-hidden group industrial-glow staggered-entry" style={{ animationDelay: '100ms' }}>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent animate-pulse" />
                                <div className="flex justify-between items-start relative">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5">
                                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Official Work</span>
                                </div>
                                <div className="relative">
                                    <p className="text-3xl font-black text-white tracking-tighter">₹{officialExpense.toLocaleString('en-IN')}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Audit Ready</p>
                                </div>
                            </div>

                            <div className="glass-card p-8 rounded-[2.5rem] flex flex-col justify-between h-44 relative group staggered-entry" style={{ animationDelay: '200ms' }}>
                                <div className="flex justify-between items-start relative">
                                    <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200">
                                        <Utensils className="w-5 h-5 text-slate-900" />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Volume</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{orders.length}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Live Transactions</p>
                                </div>
                            </div>

                            <div className="glass-card p-8 rounded-[2.5rem] flex flex-col justify-between h-44 relative group staggered-entry" style={{ animationDelay: '300ms' }}>
                                <div className="flex justify-between items-start relative">
                                    <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
                                        <PieChart className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Hub</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">Sky-5</p>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase mt-1 flex items-center gap-2">
                                        <ChefHat className="w-3 h-3 status-breathing" />
                                        Certified Vendor
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* REGISTER TABLE */}
                        <div className="glass-card rounded-[3rem] overflow-hidden flex flex-col min-h-[600px] mb-10 dark:bg-[#0e4368]/40 transition-all duration-500 border-slate-100 dark:border-white/5">
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60 backdrop-blur-md">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative flex-1 max-w-md group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input 
                                            type="text" 
                                            autoComplete="off"
                                            name="food-register-search"
                                            placeholder="Search Orders by ID, Employee, Vendor or Item..."
                                            className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all dark:text-white"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:text-white transition-all">
                                        <Filter className="w-3.5 h-3.5" /> FILTERS
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Quick Reports:</span>
                                    <button 
                                        onClick={() => window.print()}
                                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-100 transition-colors"
                                        title="Print Ledger Report"
                                    >
                                        Daily PDF
                                    </button>
                                    <button 
                                        onClick={downloadLedgerCSV}
                                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-colors"
                                        title="Export Ledger to CSV"
                                    >
                                        Master Excel
                                    </button>
                                    <button 
                                        onClick={shareSummaryOnWhatsApp}
                                        className="px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-[10px] font-black uppercase hover:bg-green-100 transition-colors"
                                        title="Share Ledger Summary on WhatsApp"
                                    >
                                        WhatsApp Ledger
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50 dark:bg-slate-900/80 sticky top-0 z-10 backdrop-blur-xl">
                                        <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none" onClick={() => handleSort('entryId')}>
                                                Entry ID {sortBy === 'entryId' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none" onClick={() => handleSort('timestamp')}>
                                                Date {sortBy === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none" onClick={() => handleSort('employeeName')}>
                                                Employee {sortBy === 'employeeName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5">Platform / Vendor</th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none" onClick={() => handleSort('amount')}>
                                                Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5">Purpose</th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none" onClick={() => handleSort('status')}>
                                                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {processedOrders.map((order) => (
                                            <tr key={order.entryId} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        {order.attachmentUrl || 
                                                         order.items.toLowerCase().includes('thali') || 
                                                         order.items.toLowerCase().includes('thaali') || 
                                                         order.items.toLowerCase().includes('biryani') || 
                                                         order.items.toLowerCase().includes('makhani') ? (
                                                            <button 
                                                                onClick={() => setSelectedImage(order.attachmentUrl || thaliImage)}
                                                                className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 shrink-0 hover:ring-2 hover:ring-emerald-500 transition-all"
                                                            >
                                                                <img 
                                                                    src={order.attachmentUrl || thaliImage} 
                                                                    className="w-full h-full object-cover" 
                                                                    alt="Food" 
                                                                />
                                                            </button>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                                <ImageIcon className="w-3 h-3 text-slate-300" />
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md">{order.entryId}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {getFormattedDate(order.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                                                            {getFormattedDate(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{order.employeeName}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{order.department}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{order.vendorName}</p>
                                                        <p className="text-[10px] font-black text-emerald-500 uppercase">{order.platform}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-black text-slate-900">₹{order.amount.toLocaleString('en-IN')}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[10px] font-black text-slate-600 uppercase">{order.purpose}</span>
                                                            {order.mealType && (
                                                                <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[8px] font-black rounded border border-amber-100 dark:border-amber-900/50 uppercase">
                                                                    {order.mealType}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-emerald-600">{order.quantity} {order.unit || 'Nos'}</span>
                                                        {order.projectCode && <span className="text-[9px] font-bold text-blue-500">PROJ: {order.projectCode}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-2">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                            order.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                            order.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                                            'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                                                        }`}>
                                                            {order.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> :
                                                            order.status === 'Rejected' ? <XCircle className="w-3 h-3" /> :
                                                            <Clock className="w-3 h-3" />}
                                                            {order.status}
                                                        </div>
                                                        {order.platform === 'Sky-5' && (
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-tighter">
                                                                <ChefHat className="w-2.5 h-2.5 text-orange-400" />
                                                                <span className="text-orange-400">{order.trackingStatus}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button 
                                                            onClick={() => setSelectedReceipt(order)}
                                                            className="p-3 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-xl transition-all group"
                                                            title="Print Receipt"
                                                        >
                                                            <Printer className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                        <button 
                                                            onClick={() => shareOnWhatsApp(order)}
                                                            className="p-3 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-xl transition-all group"
                                                            title="Share Slip on WhatsApp"
                                                        >
                                                            <MessageSquare className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingOrder(order)}
                                                            className="p-3 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-xl transition-all group"
                                                            title="Edit Order"
                                                        >
                                                            <Edit2 className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                        <button 
                                                            onClick={() => setDeletingId(order.entryId)}
                                                            className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all group"
                                                            title="Admin Delete"
                                                        >
                                                            <Trash2 className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                        <button className="p-3 hover:bg-slate-100 rounded-xl transition-colors">
                                                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {selectedReceipt && (
                <FoodReceiptSlip 
                    order={selectedReceipt} 
                    onClose={() => setSelectedReceipt(null)} 
                />
            )}

            {/* DELETE AUTHORIZATION MODAL */}
            {deletingId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/30 animate-bounce">
                                <Trash2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">AUTHORIZE DELETE</h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Record ID: {deletingId}</p>
                        </div>
                        
                        <div className="space-y-4">
                            <input 
                                autoFocus
                                type="password" 
                                autoComplete="new-password"
                                placeholder="ENTER ADMIN PIN"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 text-center text-lg font-black tracking-[0.5em] focus:bg-white focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                                value={adminPin}
                                onChange={e => setAdminPin(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && confirmDelete()}
                            />
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setDeletingId(null)}
                                    className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    CANCEL
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-[2] py-4 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                                >
                                    CONFIRM DELETE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)} />
                    <div className="relative max-w-4xl max-h-full overflow-hidden rounded-[2rem] shadow-2xl animate-in zoom-in duration-300">
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                        <img src={selectedImage} className="w-full h-full object-contain" alt="Bill Preview" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoodRegister;

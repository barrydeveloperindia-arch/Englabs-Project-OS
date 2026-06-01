import React, { useState, useEffect } from 'react';
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
import { FoodOrder, PLATFORMS, generateFoodId } from '../lib/food_system';
import FoodOrderForm from './FoodOrderForm';
import FoodReceiptSlip from './FoodReceiptSlip';
import { AuditLog } from '../lib/system_guard';
import { Trash2 } from 'lucide-react';

const MOCK_ORDERS: FoodOrder[] = [
    {
        entryId: "FOOD-001",
        timestamp: "2026-05-04T12:30:00",
        employeeName: "Gaurav Panchal",
        department: "Engineering",
        platform: "Sky-5",
        vendorName: "Sky Kitchen",
        items: "Chicken Biryani, Raita",
        quantity: 2,
        orderType: "Team",
        purpose: "Overtime Work",
        projectCode: "C001",
        justification: "Extended shift for design finalization",
        amount: 850,
        paymentMode: "UPI",
        paidBy: "Employee",
        hasBill: true,
        status: "Approved",
        approvedBy: "Admin",
        trackingStatus: 'Delivered'
    },
    {
        entryId: "FOOD-002",
        timestamp: "2026-05-04T13:15:00",
        employeeName: "Paras",
        department: "Workshop",
        platform: "Zomato",
        vendorName: "Punjabi Tadka",
        items: "Dal Makhani, Butter Naan",
        quantity: 1,
        orderType: "Individual",
        purpose: "Site Work",
        justification: "Lunch during site inspection",
        amount: 320,
        paymentMode: "Cash",
        paidBy: "Company",
        hasBill: true,
        status: "Pending",
        trackingStatus: 'In Kitchen'
    }
];

interface Props {
    onLog?: (log: AuditLog) => void;
}

const FoodRegister: React.FC<Props> = ({ onLog }) => {
    const [orders, setOrders] = useState<FoodOrder[]>(() => {
        const saved = localStorage.getItem('englabs_food_ledger');
        if (saved) return JSON.parse(saved);
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

    const confirmDelete = () => {
        if (adminPin === "0001") {
            const updated = orders.filter(o => o.entryId !== deletingId);
            setOrders(updated);
            localStorage.setItem('englabs_food_ledger', JSON.stringify(updated));
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
            `*APPROVED BY:* ${order.approvedBy || 'GAURAV PANCHAL'}\n` +
            `================================\n` +
            `_Verified Hospitality & Welfare Ledger_`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
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
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <Download className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
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
                                    <button className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-100 transition-colors">Daily PDF</button>
                                    <button className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-colors">Master Excel</button>
                                </div>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50 dark:bg-slate-900/80 sticky top-0 z-10 backdrop-blur-xl">
                                        <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5">Entry ID</th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5">Employee</th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5">Platform / Vendor</th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5">Amount</th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5">Purpose</th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5">Status</th>
                                            <th className="px-8 py-5 border-b border-slate-100 dark:border-white/5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {orders.filter(order => 
                                            order.entryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            order.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            order.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            order.items.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            order.platform.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map((order) => (
                                            <tr key={order.entryId} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        {order.attachmentUrl ? (
                                                            <button 
                                                                onClick={() => setSelectedImage(order.attachmentUrl || null)}
                                                                className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 shrink-0 hover:ring-2 hover:ring-emerald-500 transition-all"
                                                            >
                                                                <img src={order.attachmentUrl} className="w-full h-full object-cover" alt="Bill" />
                                                            </button>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                                <ImageIcon className="w-3 h-3 text-slate-300" />
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{order.entryId}</span>
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
                                                        <span className="text-[10px] font-black text-slate-600 uppercase">{order.purpose}</span>
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

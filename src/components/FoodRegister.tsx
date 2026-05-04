import React, { useState } from 'react';
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
    Image as ImageIcon
} from 'lucide-react';
import { FoodOrder, PLATFORMS, generateFoodId } from '../lib/food_system';
import FoodOrderForm from './FoodOrderForm';

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
        approvedBy: "Admin"
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
        paidBy: "Reimbursement",
        hasBill: true,
        status: "Pending"
    }
];

const FoodRegister: React.FC = () => {
    const [orders, setOrders] = useState<FoodOrder[]>(MOCK_ORDERS);
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingOrder, setEditingOrder] = useState<FoodOrder | null>(null);

    const shareOnWhatsApp = (order: FoodOrder) => {
        const text = encodeURIComponent(
            `*ENGLABS FOOD ORDER - ${order.entryId}*\n` +
            `--------------------------------\n` +
            `*Emp:* ${order.employeeName}\n` +
            `*Dept:* ${order.department}\n` +
            `*Vendor:* ${order.vendorName} (${order.platform})\n` +
            `*Items:* ${order.items}\n` +
            `*Amount:* ₹${order.amount}\n` +
            `*Purpose:* ${order.purpose}\n` +
            `*Justification:* ${order.justification}\n` +
            `*Status:* ${order.status}\n` +
            `--------------------------------\n` +
            `_Food Expense Ledger_`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const totalExpense = orders.reduce((sum, o) => sum + o.amount, 0);
    const pendingApprovals = orders.filter(o => o.status === 'Pending').length;
    const officialExpense = orders.filter(o => o.purpose !== 'Personal').reduce((sum, o) => sum + o.amount, 0);

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
            <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-slate-900 leading-none">Food & Expense Tracker</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Hospitality & Staff Welfare Ledger</span>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{pendingApprovals} Pending</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                        <Download className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setShowForm(true)}
                        className="bg-[#0F172A] hover:bg-slate-800 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 text-xs transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> LOG NEW ORDER
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    
                    {/* DASHBOARD SUMMARY */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-44">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-emerald-500 rounded-2xl">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Spend</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">₹{totalExpense.toLocaleString('en-IN')}</p>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Current Month</p>
                            </div>
                        </div>

                        <div className="bg-[#0F172A] p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between h-44">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Official Work</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-white">₹{officialExpense.toLocaleString('en-IN')}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Reimbursable</p>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-44">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-slate-100 rounded-2xl">
                                    <Utensils className="w-5 h-5 text-slate-900" />
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Orders</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">{orders.length}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Transactions</p>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-44">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-orange-500 rounded-2xl">
                                    <PieChart className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Top Platform</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">Sky-5</p>
                                <p className="text-[10px] font-bold text-orange-500 uppercase mt-1">Preferred Vendor</p>
                            </div>
                        </div>
                    </div>

                    {/* REGISTER TABLE */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search Orders..."
                                        className="bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 w-64 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50">
                                    <Filter className="w-3.5 h-3.5" /> FILTERS
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Quick Reports:</span>
                                <button className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-100 transition-colors">Daily PDF</button>
                                <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-colors">Master Excel</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-5 border-b border-slate-100">Entry ID</th>
                                        <th className="px-8 py-5 border-b border-slate-100">Employee</th>
                                        <th className="px-8 py-5 border-b border-slate-100">Platform / Vendor</th>
                                        <th className="px-8 py-5 border-b border-slate-100">Amount</th>
                                        <th className="px-8 py-5 border-b border-slate-100">Purpose</th>
                                        <th className="px-8 py-5 border-b border-slate-100">Status</th>
                                        <th className="px-8 py-5 border-b border-slate-100 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {orders.map((order) => (
                                        <tr key={order.entryId} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    {order.attachmentUrl ? (
                                                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                                                            <img src={order.attachmentUrl} className="w-full h-full object-cover" alt="Bill" />
                                                        </div>
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
                                                    {order.projectCode && <span className="text-[9px] font-bold text-blue-500">PROJ: {order.projectCode}</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    order.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                                    order.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                                                    'bg-blue-50 text-blue-600 animate-pulse'
                                                }`}>
                                                    {order.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> :
                                                     order.status === 'Rejected' ? <XCircle className="w-3 h-3" /> :
                                                     <Clock className="w-3 h-3" />}
                                                    {order.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => shareOnWhatsApp(order)}
                                                        className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-lg transition-all"
                                                        title="Share Slip on WhatsApp"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingOrder(order)}
                                                        className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-lg transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
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
            </main>

            {(showForm || editingOrder) && (
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
            )}
        </div>
    );
};

export default FoodRegister;

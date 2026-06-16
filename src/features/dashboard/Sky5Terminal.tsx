import React, { useState, useEffect } from 'react';
import { 
    Utensils, 
    Clock, 
    CheckCircle2, 
    ChefHat, 
    Truck, 
    DollarSign,
    RefreshCw,
    Search,
    ChevronRight,
    Flame
} from 'lucide-react';
import { FoodOrder, TrackingStatus } from '@domain/food_system';

const Sky5Terminal: React.FC = () => {
    const [orders, setOrders] = useState<FoodOrder[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // SYNC WITH ENGLABS MASTER LEDGER
    const syncData = () => {
        try {
            const saved = localStorage.getItem('englabs_food_ledger');
            if (saved) {
                const allOrders = JSON.parse(saved) as FoodOrder[];
                // Only show Sky-5 orders for this terminal
                const filtered = allOrders.filter(o => o.platform === 'Sky-5');
                setOrders(filtered);
                console.log(`[SKY-5 SYNC] ${filtered.length} orders detected at ${new Date().toLocaleTimeString()}`);
            }
        } catch (e) {
            console.error("[SKY-5 SYNC ERROR]", e);
        }
    };

    useEffect(() => {
        syncData();
        const interval = setInterval(syncData, 3000); // Increased polling frequency
        
        // Listen for storage changes from other tabs (Pantry Control)
        window.addEventListener('storage', syncData);
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', syncData);
        };
    }, []);

    const updateStatus = (id: string, nextStatus: TrackingStatus) => {
        const saved = localStorage.getItem('englabs_food_ledger');
        if (saved) {
            const allOrders = JSON.parse(saved) as FoodOrder[];
            const updated = allOrders.map(o => {
                if (o.entryId === id) {
                    return { 
                        ...o, 
                        trackingStatus: nextStatus,
                        kitchenTimestamp: new Date().toISOString() 
                    };
                }
                return o;
            });
            localStorage.setItem('englabs_food_ledger', JSON.stringify(updated));
            setOrders(updated.filter(o => o.platform === 'Sky-5'));
        }
    };

    const activeOrders = orders.filter(o => o.trackingStatus !== 'Delivered');
    const completedToday = orders.filter(o => o.trackingStatus === 'Delivered').length;

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#0e4368] text-white">
            {/* KITCHEN HEADER */}
            <header className="h-24 bg-slate-900 border-b border-white/5 flex items-center justify-between px-10 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-orange-500 rounded-[2rem] shadow-lg shadow-orange-500/20">
                        <ChefHat className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight uppercase">Sky-5 Kitchen Terminal</h1>
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mt-1">Englabs Direct Inbound Pipeline</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kitchen Load</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-white">{activeOrders.length}</span>
                            <Flame className={`w-5 h-5 ${activeOrders.length > 3 ? 'text-orange-500' : 'text-emerald-500'}`} />
                        </div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Delivered Today</p>
                        <p className="text-2xl font-black text-emerald-500">{completedToday}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex p-10 gap-10">
                {/* ORDER BOARD */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Incoming Requirements</h2>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={syncData}
                                className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
                            >
                                <RefreshCw className="w-3 h-3" /> Force Refresh
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase">Live Sync Active</span>
                            </div>
                        </div>
                    </div>

                    {activeOrders.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic">
                            <Utensils className="w-24 h-24 mb-4" />
                            <p className="text-sm font-black uppercase tracking-widest">No Active Orders</p>
                        </div>
                    ) : (
                        activeOrders.map(order => (
                            <div key={order.entryId} className="bg-slate-900 rounded-[2.5rem] border border-white/5 p-8 hover:border-orange-500/30 transition-all group relative overflow-hidden">
                                {/* PROGRESS BAR */}
                                <div className="absolute bottom-0 left-0 h-1.5 bg-orange-500 transition-all duration-1000" 
                                     style={{ width: 
                                        order.trackingStatus === 'Order Placed' ? '20%' : 
                                        order.trackingStatus === 'In Kitchen' ? '50%' :
                                        order.trackingStatus === 'Ready for Pickup' ? '75%' : '100%' 
                                     }} 
                                />

                                <div className="flex justify-between items-start">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-black text-white">{order.entryId}</span>
                                            <span className="px-3 py-1 bg-white/5 text-[10px] font-black rounded-lg text-slate-400 uppercase">
                                                {order.employeeName}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-200">{order.items || "ITEMS NOT SPECIFIED"}</h3>
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">
                                                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl">
                                                    {order.quantity} {order.unit || 'Nos'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-4">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tracking Status</p>
                                            <p className="text-xs font-black text-emerald-400 uppercase mt-1 flex items-center gap-2">
                                                <RefreshCw className="w-3 h-3 animate-spin" /> {order.trackingStatus}
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2">
                                            {order.trackingStatus === 'Order Placed' && (
                                                <button 
                                                    onClick={() => updateStatus(order.entryId, 'In Kitchen')}
                                                    className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                                                >
                                                    <Flame className="w-4 h-4" /> START PREPARATION
                                                </button>
                                            )}
                                            {order.trackingStatus === 'In Kitchen' && (
                                                <button 
                                                    onClick={() => updateStatus(order.entryId, 'Ready for Pickup')}
                                                    className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> MARK AS READY
                                                </button>
                                            )}
                                            {order.trackingStatus === 'Ready for Pickup' && (
                                                <button 
                                                    onClick={() => updateStatus(order.entryId, 'Dispatched')}
                                                    className="px-8 py-4 bg-purple-500 hover:bg-purple-400 text-white rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                                                >
                                                    <Truck className="w-4 h-4" /> OUT FOR DELIVERY
                                                </button>
                                            )}
                                            {order.trackingStatus === 'Dispatched' && (
                                                <button 
                                                    onClick={() => updateStatus(order.entryId, 'Delivered')}
                                                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> DELIVERED & SETTLED
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* SIDEBAR: PAYMENT VERIFICATION */}
                <div className="w-[400px] bg-slate-900 rounded-[3rem] border border-white/5 p-8 flex flex-col gap-8">
                    <div>
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Payment Intelligence</h2>
                        <div className="space-y-4">
                            {orders.filter(o => o.paymentMode === 'UPI' && o.status === 'Approved').length === 0 ? (
                                <p className="text-[10px] font-black text-slate-600 uppercase italic">No direct settlements pending...</p>
                            ) : (
                                orders.filter(o => o.paymentMode === 'UPI' && o.status === 'Approved').map(order => (
                                    <div key={order.entryId} className="p-4 bg-white/5 rounded-2xl flex items-center justify-between border border-emerald-500/20">
                                        <div>
                                            <p className="text-[10px] font-black text-white">{order.entryId}</p>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">₹{order.amount} - VERIFIED</p>
                                        </div>
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <DollarSign className="w-4 h-4 text-emerald-500" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-auto p-6 bg-orange-500/10 rounded-[2rem] border border-orange-500/20">
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Technical Support</p>
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                            For technical issues with the Englabs Command Pipeline, contact Admin Dashboard immediately.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Sky5Terminal;

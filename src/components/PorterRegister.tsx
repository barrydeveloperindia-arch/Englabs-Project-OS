import React, { useState } from 'react';
import { 
    Truck, 
    Navigation, 
    IndianRupee, 
    Calendar, 
    Search, 
    Filter, 
    Download, 
    Printer, 
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    Shield,
    History,
    MessageSquare,
    Image as ImageIcon,
    Trash2,
    FileText,
    MapPin,
    Edit2,
    CheckCircle,
    Map,
    MessageCircle,
    Navigation2,
    ClipboardList,
    MoreVertical,
    Package,
    Activity,
    X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import PorterEntryForm from './PorterEntryForm';
import { PorterTrip, PorterPaymentStatus, DeliveryStatus } from '../lib/porter_system';
import { PorterProtectionAgent } from '../lib/porter_protection';
import { logAction } from '../lib/system_guard';

interface Props {
    trips: PorterTrip[];
    onNewTrip: (trip: PorterTrip) => void;
    onUpdateTrip: (trip: PorterTrip) => void;
    onDeleteTrip: (id: string) => void;
}

const PorterRegister: React.FC<Props> = ({ trips, onNewTrip, onUpdateTrip, onDeleteTrip }) => {
    const [view, setView] = useState<'DASHBOARD' | 'LOGBOOK' | 'PAYMENTS'>('DASHBOARD');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<PorterTrip | null>(null);
    const [viewingTimeline, setViewingTimeline] = useState<PorterTrip | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<PorterTrip | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProof, setSelectedProof] = useState<string | null>(null);
    const [isHealed, setIsHealed] = useState(false);

    // PROTECTION AGENT: Initial Healing & Integrity Check
    React.useEffect(() => {
        if (!isHealed) {
            const healed = PorterProtectionAgent.healRegistry(trips);
            if (healed.length !== trips.length) {
                // If records were restored, update parent state
                healed.forEach(t => {
                    if (!trips.find(orig => orig.id === t.id)) onNewTrip(t);
                });
            }
            setIsHealed(true);
        }
    }, [trips, isHealed, onNewTrip]);

    // PROTECTION AGENT: Continuous Backup
    React.useEffect(() => {
        PorterProtectionAgent.performBackup(trips);
    }, [trips]);

    const stats = {
        totalTrips: (trips || []).length,
        totalKm: (trips || []).reduce((acc, curr) => acc + (curr.distanceKm || 0), 0),
        pendingPayments: (trips || []).filter(t => t.paymentStatus !== 'COMPLETED').length,
        totalGross: (trips || []).reduce((acc, curr) => acc + (curr.grossAmount || 0), 0),
        totalRemaining: (trips || []).reduce((acc, curr) => acc + (curr.remainingBalance || 0), 0),
        totalAdvances: (trips || []).reduce((acc, curr) => acc + (curr.advanceAmount || 0), 0),
        totalBikeExpenses: (trips || []).reduce((acc, curr) => 
            acc + (curr.fuelCharge || 0) + (curr.serviceCharge || 0) + (curr.repairCharge || 0) + (curr.extraExpense || 0), 0),
        deliveredCount: (trips || []).filter(t => t.deliveryStatus === 'DELIVERED').length
    };

    const filteredTrips = trips.filter(t => 
        t.porterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.materialDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(trips.map(t => ({
            ID: t.id,
            Date: t.date,
            Time: t.time,
            Porter: t.porterName,
            Vehicle: t.vehicleNumber,
            From: t.fromLocation,
            To: t.toLocation,
            Material: t.materialDescription,
            KM: t.distanceKm,
            Rate: t.ratePerKm,
            Total: t.totalAmount,
            Payment: t.paymentStatus,
            Status: t.deliveryStatus
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Porter Trips");
        XLSX.writeFile(wb, `Porter_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const shareOnWhatsApp = (trip: PorterTrip) => {
        const bikeCharges = (trip.fuelCharge || 0) + (trip.serviceCharge || 0) + (trip.repairCharge || 0) + (trip.extraExpense || 0);
        const statusEmoji = trip.paymentStatus === 'COMPLETED' ? '✅' : '⏳';
        
        const text = encodeURIComponent(
            `📦 *ENGLABS LOGISTICS MISSION: ${trip.id}*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 *Porter:* ${trip.porterName}\n` +
            `📍 *Route:* ${trip.fromLocation} ➔ ${trip.toLocation}\n` +
            `🛤️ *Mission KM:* ${trip.distanceKm} KM\n\n` +
            `💰 *FINANCIAL BREAKDOWN*\n` +
            `• Trip Value: ₹${(trip.distanceKm * trip.ratePerKm).toLocaleString()}\n` +
            `• Bike/Exp: ₹${bikeCharges.toLocaleString()}\n` +
            `• Gross Total: ₹${trip.grossAmount.toLocaleString()}\n` +
            `• Advance: ₹${(trip.advanceAmount || 0).toLocaleString()}\n` +
            `• *Balance:* ₹${Math.max(0, trip.remainingBalance).toLocaleString()}\n\n` +
            `${statusEmoji} *Status:* ${trip.paymentStatus}\n` +
            `${trip.remainingBalance < 0 ? `⚠️ *Note:* Overpaid by ₹${Math.abs(trip.remainingBalance).toLocaleString()}\n` : ''}` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `🌐 _Command OS Forensic Dispatch_`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const shareMonthlySummary = () => {
        const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const recentMissions = trips.slice(0, 5).map(t => 
            `• ${t.id}: ${t.fromLocation}➔${t.toLocation} (${t.distanceKm}KM)`
        ).join('\n');

        const text = encodeURIComponent(
            `📊 *ENGLABS PORTER AUDIT - ${month.toUpperCase()}*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📈 *Total Missions:* ${stats.totalTrips}\n` +
            `🛣️ *Total Distance:* ${stats.totalKm} KM\n` +
            `💵 *Gross Value:* ₹${stats.totalGross.toLocaleString()}\n` +
            `💳 *Total Advances:* ₹${stats.totalAdvances.toLocaleString()}\n` +
            `🛠️ *Bike Expenses:* ₹${stats.totalBikeExpenses.toLocaleString()}\n` +
            `🧾 *Outstanding Balance:* ₹${stats.totalRemaining.toLocaleString()}\n\n` +
            `🚚 *RECENT MISSIONS:*\n${recentMissions}\n\n` +
            `🚨 *Pending Closures:* ${stats.pendingPayments}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `🛡️ _Verified by Porter Protection Agent_`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const sendCustomerUpdate = (trip: PorterTrip, status: string) => {
        let message = '';
        switch(status) {
            case 'PICKUP': message = `Hi ${trip.customerName}, our porter ${trip.porterName} has reached the pickup location for your delivery.`; break;
            case 'TRANSIT': message = `Hi ${trip.customerName}, your items are now on the way to ${trip.toLocation}.`; break;
            case 'REACHED': message = `Hi ${trip.customerName}, our porter has reached the delivery location.`; break;
            case 'DELIVERED': message = `Hi ${trip.customerName}, mission accomplished! Your delivery is complete. Final Balance: ₹${trip.remainingBalance.toLocaleString()}.`; break;
        }
        window.open(`https://wa.me/${trip.customerMobile.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
            {/* HEADER */}
            <header className="h-auto md:h-24 bg-white border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-10 py-4 md:py-0 shrink-0 sticky top-0 z-40 shadow-sm gap-4 md:gap-0">
                <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0e4368] rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 shrink-0">
                        <Truck className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                            Porter Service Management
                            <div className="flex gap-2 mt-1 md:mt-0">
                                <span className="text-[9px] md:text-[10px] font-black bg-emerald-50 text-emerald-500 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> PROTECTION ACTIVE
                                </span>
                            </div>
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">KM-Wise Logistics & Delivery Ledger</p>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-2 md:mt-0">
                    <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                        <button 
                            onClick={() => setView('DASHBOARD')}
                            className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'DASHBOARD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Dashboard
                        </button>
                        <button 
                            onClick={() => setView('LOGBOOK')}
                            className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'LOGBOOK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Logbook
                        </button>
                    </div>
                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="bg-[#0e4368] text-emerald-500 hover:bg-slate-800 font-black px-6 py-3.5 rounded-xl flex items-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10"
                    >
                        <Plus className="w-4 h-4" /> NEW TRIP
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                {view === 'DASHBOARD' ? (
                    <div className="max-w-[1400px] mx-auto space-y-10">
                        {/* MISSION STATS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <DashboardCard icon={<Truck />} label="Total Missions" value={stats.totalTrips} color="emerald" subValue={`${stats.deliveredCount} Delivered`} />
                            <DashboardCard icon={<IndianRupee />} label="Total Advances" value={`₹${stats.totalAdvances.toLocaleString()}`} color="blue" subValue="Advance Payouts" />
                            <DashboardCard icon={<Activity />} label="Bike Expenses" value={`₹${stats.totalBikeExpenses.toLocaleString()}`} color="purple" subValue="Service & Maintenance" />
                            <DashboardCard icon={<Clock />} label="Remaining Balance" value={`₹${stats.totalRemaining.toLocaleString()}`} color="amber" subValue="Unpaid Dues" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                            {/* RECENT TRIPS FEED */}
                            <div className="xl:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                        <History className="w-6 h-6 text-emerald-500" /> Active Mission Log
                                    </h3>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={shareMonthlySummary}
                                            className="px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-sm"
                                        >
                                            <MessageSquare className="w-4 h-4" /> MONTHLY SHARE
                                        </button>
                                        <button onClick={() => setView('LOGBOOK')} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">Full Logbook</button>
                                    </div>
                                </div>
                                <div className="p-10 flex-1">
                                    <div className="space-y-4">
                                        {trips.slice(0, 6).map(trip => (
                                            <div key={trip.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors shadow-sm">
                                                        <MapPin className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{trip.fromLocation} ➔ {trip.toLocation}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{trip.porterName} • {trip.id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-10">
                                                    <div className="text-right">
                                                        <p className="font-black text-slate-900 text-sm">{trip.distanceKm} KM</p>
                                                        <p className="text-[9px] font-black text-slate-300 uppercase">₹{trip.ratePerKm}/KM</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-slate-900 text-sm">₹{trip.grossAmount.toLocaleString()}</p>
                                                        <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-tighter ${trip.paymentStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                            {trip.paymentStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ANALYTICS SIDEBAR */}
                            <div className="bg-[#0e4368] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 h-full flex flex-col">
                                    <h3 className="text-xl font-black text-slate-400 mb-8 uppercase tracking-widest">Efficiency Intel</h3>
                                    <div className="space-y-10 flex-1">
                                        <div>
                                            <div className="flex justify-between items-end mb-4">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Delivery Success Rate</p>
                                                <p className="text-2xl font-black text-emerald-500">{trips.length ? Math.round((stats.deliveredCount/trips.length)*100) : 0}%</p>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${trips.length ? (stats.deliveredCount/trips.length)*100 : 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Payment Distribution</p>
                                            <div className="flex gap-2 h-3 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: '65%' }}></div>
                                                <div className="h-full bg-amber-500" style={{ width: '25%' }}></div>
                                                <div className="h-full bg-slate-700" style={{ width: '10%' }}></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Paid Trips</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Pending</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-10 pt-10 border-t border-white/5">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <span>Data Integrity</span>
                                                <span className={PorterProtectionAgent.verifyIntegrity(trips) ? 'text-emerald-500' : 'text-red-500'}>
                                                    {PorterProtectionAgent.verifyIntegrity(trips) ? 'VERIFIED' : 'FAILED'}
                                                </span>
                                            </div>
                                            <button className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/5 text-[10px] uppercase tracking-widest">
                                                <FileText className="w-4 h-4 text-emerald-500" /> Export Forensic Audit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-[1400px] mx-auto space-y-8">
                        {/* CONTROLS */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Search Porter, ID or Material..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
                                <button onClick={shareMonthlySummary} className="flex items-center gap-2 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm">
                                    <MessageSquare className="w-4 h-4" /> SHARE
                                </button>
                                <button onClick={exportToExcel} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm">
                                    <Download className="w-4 h-4" /> EXCEL
                                </button>
                                <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400">
                                    <Printer className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            <th className="py-8 px-10">Customer / Mission</th>
                                            <th className="py-8 px-6">Porter / Vehicle</th>
                                            <th className="py-8 px-6">Distance / KM</th>
                                            <th className="py-8 px-6">Valuation</th>
                                            <th className="py-8 px-6">Lifecycle</th>
                                            <th className="py-8 px-10 text-right">Dispatch Control</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredTrips.map(trip => (
                                            <tr key={trip.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0">
                                                <td className="py-8 px-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 transition-colors">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-sm tracking-tight">{trip.customerName}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase">{trip.id} • {trip.date}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-6">
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-900 text-sm">{trip.porterName}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase">{trip.vehicleNumber}</p>
                                                        <div className="flex items-center gap-1 text-slate-400">
                                                            <MapPin className="w-3 h-3" />
                                                            <p className="text-[10px] font-bold truncate max-w-[150px]">{trip.toLocation}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900">{trip.distanceKm} KM</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">Rate: ₹{trip.ratePerKm}/KM</span>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-6">
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-400 text-[10px] uppercase">Gross: ₹{trip.grossAmount.toLocaleString()}</p>
                                                        <p className={`font-black text-sm ${trip.remainingBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                            {trip.remainingBalance < 0 ? `Overpaid: ₹${Math.abs(trip.remainingBalance).toLocaleString()}` : `Bal: ₹${trip.remainingBalance.toLocaleString()}`}
                                                        </p>
                                                        <button 
                                                            onClick={() => setViewingInvoice(trip)}
                                                            className="text-[9px] font-black text-blue-500 uppercase hover:underline"
                                                        >
                                                            View Invoice
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-6">
                                                    <div className="space-y-2">
                                                        <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${trip.deliveryStatus === 'DELIVERED' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                            {trip.deliveryStatus === 'DELIVERED' ? <CheckCircle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                                            {trip.deliveryStatus.replace('_', ' ')}
                                                        </span>
                                                        <button 
                                                            onClick={() => setViewingTimeline(trip)}
                                                            className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase"
                                                        >
                                                            <ClipboardList className="w-3 h-3" /> View Timeline
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-10">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="flex items-center bg-slate-50 p-1 rounded-xl gap-1">
                                                            <button onClick={() => sendCustomerUpdate(trip, 'PICKUP')} title="Pickup Alert" className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Map className="w-4 h-4" /></button>
                                                            <button onClick={() => sendCustomerUpdate(trip, 'TRANSIT')} title="Transit Alert" className="p-2 text-slate-400 hover:text-amber-500 transition-colors"><Navigation2 className="w-4 h-4" /></button>
                                                            <button onClick={() => sendCustomerUpdate(trip, 'DELIVERED')} title="Delivery Alert" className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><CheckCircle className="w-4 h-4" /></button>
                                                        </div>
                                                        <div className="w-px h-8 bg-slate-100 mx-2" />
                                                        <button onClick={() => shareOnWhatsApp(trip)} className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-100">
                                                            <MessageSquare className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setEditingTrip(trip)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const pass = prompt("ADMIN AUTHORIZATION REQUIRED\nEnter Passcode to Delete Trip:");
                                                                if (pass === '0001') onDeleteTrip(trip.id);
                                                            }}
                                                            className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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

            {/* TIMELINE MODAL */}
            {viewingTimeline && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Mission Timeline</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{viewingTimeline.id}</p>
                            </div>
                            <button onClick={() => setViewingTimeline(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-8 space-y-8">
                            {viewingTimeline.timeline?.map((event, idx) => (
                                <div key={idx} className="flex gap-4 relative">
                                    {idx !== viewingTimeline.timeline.length - 1 && (
                                        <div className="absolute left-[11px] top-6 bottom-[-32px] w-0.5 bg-slate-100" />
                                    )}
                                    <div className={`w-6 h-6 rounded-full border-4 border-white shadow-sm flex-shrink-0 z-10 ${idx === 0 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        <p className="text-sm font-black text-slate-900 mt-1 uppercase tracking-tight">{event.status.replace('_', ' ')}</p>
                                        {event.remarks && <p className="text-xs text-slate-500 mt-1 font-medium">{event.remarks}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* INVOICE MODAL */}
            {viewingInvoice && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border-8 border-slate-50">
                        <div className="p-12">
                            <div className="flex justify-between items-start mb-16">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-[#0e4368] rounded-2xl flex items-center justify-center text-white">
                                            <Truck className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">ENGLABS LOGISTICS</h2>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Delivery Invoice</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice ID</p>
                                    <p className="text-lg font-black text-slate-900">{viewingInvoice.id}</p>
                                    <button onClick={() => setViewingInvoice(null)} className="mt-4 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X className="w-5 h-5" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 mb-16">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Customer Details</p>
                                    <p className="text-lg font-black text-slate-900 mb-1">{viewingInvoice.customerName}</p>
                                    <p className="text-sm font-bold text-slate-500">{viewingInvoice.customerMobile}</p>
                                    <p className="text-sm font-medium text-slate-400 mt-2 max-w-[200px] leading-relaxed">{viewingInvoice.deliveryAddress}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mission Parameters</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Date</span> <span className="text-slate-900">{viewingInvoice.date}</span></div>
                                        <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Distance</span> <span className="text-slate-900">{viewingInvoice.distanceKm} KM</span></div>
                                        <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Vehicle</span> <span className="text-slate-900">{viewingInvoice.vehicleNumber}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-[2rem] p-10 mb-12">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center text-sm font-black uppercase tracking-tight">
                                        <span className="text-slate-500">Trip Base Cost ({viewingInvoice.distanceKm}KM × ₹{viewingInvoice.ratePerKm})</span>
                                        <span className="text-slate-900">₹{(viewingInvoice.distanceKm * viewingInvoice.ratePerKm).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-black uppercase tracking-tight">
                                        <span className="text-slate-500">Bike & Service Expenses</span>
                                        <span className="text-slate-900">₹{((viewingInvoice.fuelCharge || 0) + (viewingInvoice.serviceCharge || 0) + (viewingInvoice.repairCharge || 0) + (viewingInvoice.extraExpense || 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gross Total Mission Value</span>
                                        <span className="text-2xl font-black text-slate-900">₹{viewingInvoice.grossAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Advance Received</span>
                                        <span className="text-lg font-black">-₹{(viewingInvoice.advanceAmount || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-[#0e4368] p-10 rounded-[2.5rem] text-white">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Final Settlement Balance</p>
                                    <p className="text-4xl font-black text-emerald-400">₹{viewingInvoice.remainingBalance.toLocaleString()}</p>
                                </div>
                                <button className="bg-white text-[#0e4368] font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-slate-100 transition-all">
                                    <FileText className="w-5 h-5" /> EXPORT PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedProof && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-10">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-lg" onClick={() => setSelectedProof(null)} />
                    <div className="relative max-w-4xl w-full aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10">
                        <img src={selectedProof} className="w-full h-full object-contain" alt="Delivery Proof" />
                        <button onClick={() => setSelectedProof(null)} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <PorterEntryForm 
                    onClose={() => setIsFormOpen(false)}
                    onSave={(trip) => {
                        onNewTrip(trip);
                        setIsFormOpen(false);
                        logAction('CREATE', trip.id, `Initialized new porter mission for ${trip.customerName}`, 'GAURAV PANCHAL');
                    }}
                    currentCount={trips.length}
                />
            )}

            {editingTrip && (
                <PorterEntryForm 
                    initialData={editingTrip}
                    onClose={() => setEditingTrip(null)}
                    onSave={(updated) => {
                        onUpdateTrip(updated);
                        setEditingTrip(null);
                        logAction('UPDATE', updated.id, `Modified mission parameters for ${updated.customerName}`, 'GAURAV PANCHAL');
                    }}
                    currentCount={trips.length}
                />
            )}
        </div>
    );
};

const DashboardCard = ({ icon, label, value, color, subValue }: any) => {
    const colors: any = {
        emerald: "text-emerald-500 bg-emerald-50 border-emerald-100 shadow-emerald-500/5",
        blue: "text-blue-500 bg-blue-50 border-blue-100 shadow-blue-500/5",
        amber: "text-amber-500 bg-amber-50 border-amber-100 shadow-amber-500/5",
        purple: "text-purple-500 bg-purple-50 border-purple-100 shadow-purple-500/5"
    };
    return (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${colors[color]} border shadow-lg`}>
                {React.cloneElement(icon, { className: "w-7 h-7" })}
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-4 flex items-center gap-2">
                <Activity className="w-3 h-3 text-emerald-500" /> {subValue}
            </p>
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                {React.cloneElement(icon, { className: "w-32 h-32" })}
            </div>
        </div>
    );
};

export default PorterRegister;

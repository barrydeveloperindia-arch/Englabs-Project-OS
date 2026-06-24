import React, { useState, useEffect } from 'react';
import { 
    Building, 
    Plus, 
    Search, 
    Filter, 
    Trash2, 
    Briefcase, 
    Calendar, 
    DollarSign, 
    Users, 
    Clock, 
    FileText, 
    ArrowUpRight, 
    ArrowDownRight,
    CheckCircle2, 
    AlertCircle,
    X,
    UserCheck,
    QrCode,
    Phone,
    MapPin,
    Paperclip
} from 'lucide-react';
import { ProjectData } from '@shared/services/project';
import NewProjectModal from '@common/NewProjectModal';

interface HotelStay {
    id: string;
    guestName: string;
    guestType: 'CLIENT' | 'STAFF' | 'VENDOR';
    associatedProjectId: string; // project ID or 'GENERAL'
    hotelName: string;
    roomNumber?: string;
    floorNumber?: string;
    hotelContact?: string;
    hotelLocation?: string;
    checkInDate: string;
    checkOutDate: string;
    purpose: string;
    cost: number;
    paymentStatus: 'PAID' | 'PENDING';
    notes?: string;
    timestamp: string;
    invoiceFile?: string;
}

interface HotelRegisterProps {
    projects: ProjectData[];
    staffList: string[];
    onAddProject?: (newProj: ProjectData) => void;
}

export const HotelRegister: React.FC<HotelRegisterProps> = ({ projects, staffList, onAddProject }) => {
    const [stays, setStays] = useState<HotelStay[]>([]);
    const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Form fields
    const [guestName, setGuestName] = useState('');
    const [guestType, setGuestType] = useState<'CLIENT' | 'STAFF' | 'VENDOR'>('CLIENT');
    const [projectId, setProjectId] = useState('GENERAL');
    const [hotelName, setHotelName] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [floorNumber, setFloorNumber] = useState('');
    const [hotelContact, setHotelContact] = useState('');
    const [hotelLocation, setHotelLocation] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [purpose, setPurpose] = useState('Client Visit');
    const [cost, setCost] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
    const [notes, setNotes] = useState('');
    const [invoiceFileName, setInvoiceFileName] = useState('');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'CLIENT' | 'STAFF' | 'VENDOR'>('ALL');
    const [projectFilter, setProjectFilter] = useState('ALL');
    const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

    // Load data
    useEffect(() => {
        const stored = localStorage.getItem('englabs_hotel_stays');
        if (stored) {
            try {
                setStays(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse hotel stays from localStorage:", e);
            }
        } else {
            // Seed sample data for high-fidelity initial display
            const samples: HotelStay[] = [
                {
                    id: 'HTL-2026-0001',
                    guestName: 'Anurag Sharma',
                    guestType: 'STAFF',
                    associatedProjectId: 'C5023',
                    hotelName: 'Hotel Sunbeam, Chandigarh',
                    roomNumber: '304',
                    floorNumber: '3rd',
                    hotelContact: '+91 98765 43210',
                    hotelLocation: 'Sector 22, Chandigarh',
                    checkInDate: '2026-06-20',
                    checkOutDate: '2026-06-22',
                    purpose: 'Staff Overtime & Night Shift',
                    cost: 4500,
                    paymentStatus: 'PAID',
                    notes: 'Overtime supervisor stay for urgent C5023 assembly dispatch.',
                    timestamp: new Date('2026-06-20T10:00:00Z').toISOString(),
                    invoiceFile: 'invoice_anurag_HTL_0001.pdf'
                },
                {
                    id: 'HTL-2026-0002',
                    guestName: 'Mr. Rajesh Mehra (Aura Tech)',
                    guestType: 'CLIENT',
                    associatedProjectId: 'C5124',
                    hotelName: 'Taj Mahal Hotel, New Delhi',
                    roomNumber: '1208',
                    floorNumber: '12th',
                    hotelContact: '+91 11 2302 3322',
                    hotelLocation: 'Mansingh Road, New Delhi',
                    checkInDate: '2026-06-22',
                    checkOutDate: '2026-06-24',
                    purpose: 'Client Inspection & Review',
                    cost: 14200,
                    paymentStatus: 'PAID',
                    notes: 'Design approval stay for high-value client delegation.',
                    timestamp: new Date('2026-06-22T09:30:00Z').toISOString(),
                    invoiceFile: 'invoice_client_HTL_0002.pdf'
                },
                {
                    id: 'HTL-2026-0003',
                    guestName: 'Jarnail Singh (Excel Steel)',
                    guestType: 'VENDOR',
                    associatedProjectId: 'C5230',
                    hotelName: 'Hotel Aroma, Chandigarh',
                    roomNumber: '102',
                    floorNumber: '1st',
                    hotelContact: '+91 172 401 0000',
                    hotelLocation: 'Sector 22-C, Chandigarh',
                    checkInDate: '2026-06-24',
                    checkOutDate: '2026-06-25',
                    purpose: 'Vendor Procurement Alignment',
                    cost: 3200,
                    paymentStatus: 'PENDING',
                    notes: 'Material dispatch discussion stay.',
                    timestamp: new Date().toISOString()
                }
            ];
            setStays(samples);
            localStorage.setItem('englabs_hotel_stays', JSON.stringify(samples));
        }
    }, []);

    // Save data
    const saveStays = (updatedStays: HotelStay[]) => {
        setStays(updatedStays);
        localStorage.setItem('englabs_hotel_stays', JSON.stringify(updatedStays));
    };

    // Auto-fill purpose based on guest type
    useEffect(() => {
        if (guestType === 'CLIENT') {
            setPurpose('Client Visit');
        } else if (guestType === 'STAFF') {
            setPurpose('Staff Overtime');
        } else {
            setPurpose('Vendor Meeting');
        }
    }, [guestType]);

    // Handle Form Submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!guestName.trim()) {
            alert('Please enter or select a guest name.');
            return;
        }
        if (!hotelName.trim()) {
            alert('Please enter a hotel name.');
            return;
        }
        if (!checkInDate || !checkOutDate) {
            alert('Please enter check-in and check-out dates.');
            return;
        }
        if (new Date(checkOutDate) < new Date(checkInDate)) {
            alert('Check-out date cannot be earlier than check-in date.');
            return;
        }
        const numericCost = parseFloat(cost);
        if (isNaN(numericCost) || numericCost <= 0) {
            alert('Please enter a valid stay cost.');
            return;
        }

        const newId = `HTL-2026-${String(stays.length + 1).padStart(4, '0')}`;
        const newStay: HotelStay = {
            id: newId,
            guestName: guestName.trim(),
            guestType,
            associatedProjectId: projectId,
            hotelName: hotelName.trim(),
            roomNumber: roomNumber.trim() || undefined,
            floorNumber: floorNumber.trim() || undefined,
            hotelContact: hotelContact.trim() || undefined,
            hotelLocation: hotelLocation.trim() || undefined,
            checkInDate,
            checkOutDate,
            purpose: purpose.trim(),
            cost: numericCost,
            paymentStatus,
            notes: notes.trim() || undefined,
            timestamp: new Date().toISOString(),
            invoiceFile: invoiceFileName.trim() || undefined
        };

        const updated = [newStay, ...stays];
        saveStays(updated);
        
        // Reset form
        setGuestName('');
        setProjectId('GENERAL');
        setHotelName('');
        setRoomNumber('');
        setFloorNumber('');
        setHotelContact('');
        setHotelLocation('');
        setCheckInDate('');
        setCheckOutDate('');
        setCost('');
        setNotes('');
        setInvoiceFileName('');
        setIsFormOpen(false);
    };

    // Delete Stay
    const handleDelete = (id: string) => {
        if (confirm(`Are you sure you want to remove the hotel stay record ${id}?`)) {
            const filtered = stays.filter(s => s.id !== id);
            saveStays(filtered);
        }
    };

    // Export to CSV
    const handleExport = () => {
        const headers = ['ID', 'Guest Name', 'Guest Type', 'Project ID', 'Hotel Name', 'Room No', 'Check-In', 'Check-Out', 'Purpose', 'Cost (INR)', 'Payment Status', 'Notes'];
        const rows = filteredStays.map(s => [
            s.id,
            s.guestName,
            s.guestType,
            s.associatedProjectId,
            s.hotelName,
            s.roomNumber || '',
            s.checkInDate,
            s.checkOutDate,
            s.purpose,
            s.cost,
            s.paymentStatus,
            s.notes || ''
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Englabs_Hotel_Stays_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Metrics calculations
    const totalStaysCount = stays.length;
    const totalExp = stays.reduce((sum, s) => sum + s.cost, 0);
    const activeStaysCount = stays.filter(s => new Date(s.checkOutDate) >= new Date()).length;
    const overtimeStaysCount = stays.filter(s => s.guestType === 'STAFF' && s.purpose.toLowerCase().includes('overtime')).length;

    // Filter stays
    const filteredStays = stays.filter(s => {
        const matchesSearch = 
            s.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.purpose.toLowerCase().includes(searchQuery.toLowerCase());
            
        const matchesType = typeFilter === 'ALL' || s.guestType === typeFilter;
        const matchesProject = projectFilter === 'ALL' || s.associatedProjectId === projectFilter;
        const matchesPayment = paymentFilter === 'ALL' || s.paymentStatus === paymentFilter;

        return matchesSearch && matchesType && matchesProject && matchesPayment;
    });

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent p-4 md:p-10 custom-scrollbar industrial-grid">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/40 dark:border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#0e4368] dark:bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[#52cca3] shadow-lg shadow-slate-900/10">
                            <Building className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Hotel Stay Register</h1>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mt-2">
                                Lodging, Travel Booking & Expense Console
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleExport}
                            className="bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4 text-slate-400" /> Export CSV
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(!isFormOpen)}
                            className="bg-[#0e4368] text-white hover:bg-[#0c3958] px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> {isFormOpen ? 'Cancel Stay Log' : 'Log New Stay'}
                        </button>
                    </div>
                </div>

                {/* Metrics Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Stat 1 */}
                    <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                <Building className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-slate-400 dark:text-slate-300 text-xs font-black uppercase tracking-wider mb-1">Total Stays</h3>
                        <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 font-outfit">
                            {totalStaysCount}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                            Accumulated stays booked
                        </div>
                    </div>

                    {/* Stat 2 */}
                    <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-slate-400 dark:text-slate-300 text-xs font-black uppercase tracking-wider mb-1">Lodging Cost</h3>
                        <div className="text-3xl font-black text-[#52cca3] tracking-tighter mb-1 font-outfit">
                            ₹{totalExp.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                            Total lodging expenditure
                        </div>
                    </div>

                    {/* Stat 3 */}
                    <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                                <Clock className="w-5 h-5" />
                            </div>
                            <span className="w-2 h-2 rounded-full bg-[#52cca3] status-breathing"></span>
                        </div>
                        <h3 className="text-slate-400 dark:text-slate-300 text-xs font-black uppercase tracking-wider mb-1">Active Stays</h3>
                        <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 font-outfit">
                            {activeStaysCount}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                            Currently checked-in
                        </div>
                    </div>

                    {/* Stat 4 */}
                    <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                                <UserCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-slate-400 dark:text-slate-300 text-xs font-black uppercase tracking-wider mb-1">Overtime Lodging</h3>
                        <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 font-outfit">
                            {overtimeStaysCount}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                            Overtime shifts booked
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                {isFormOpen && (
                    <div className="glass-card border border-slate-200/50 dark:border-white/5 rounded-3xl p-6 shadow-md animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/5 pb-4 mb-6">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                Log Guest / Staff Lodging details
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Guest Type</label>
                                <select 
                                    value={guestType}
                                    onChange={(e) => setGuestType(e.target.value as any)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#52cca3] transition-all"
                                >
                                    <option value="CLIENT">Client Stay</option>
                                    <option value="STAFF">Staff Stay (Overtime/Work)</option>
                                    <option value="VENDOR">Vendor Stay</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Guest Name</label>
                                {guestType === 'STAFF' ? (
                                    <select
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#52cca3] transition-all"
                                    >
                                        <option value="">Select Staff Member</option>
                                        {staffList.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input 
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="e.g. Mr. Sumeet (Karan Traders)"
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#52cca3] transition-all"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Associated Project</label>
                                <div className="flex gap-2">
                                    <select 
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#52cca3] transition-all"
                                    >
                                        <option value="GENERAL">General/Administrative (No Project)</option>
                                        {projects.map(p => (
                                            <option key={p.projectId} value={p.projectId}>{p.projectId} - {p.client || 'Internal'}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddProjectModalOpen(true)}
                                        className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 px-3 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm"
                                        title="Add New Project"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Hotel Name</label>
                                <input 
                                    required
                                    type="text"
                                    value={hotelName}
                                    onChange={(e) => setHotelName(e.target.value)}
                                    placeholder="e.g. Landmark Hotel"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#52cca3] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Hotel Contact Number</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={hotelContact}
                                        onChange={(e) => setHotelContact(e.target.value)}
                                        placeholder="e.g. +91 98765 43210"
                                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#52cca3] transition-all"
                                    />
                                    {hotelContact && (
                                        <a 
                                            href={`tel:${hotelContact}`}
                                            className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 px-3 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm"
                                            title="Call Hotel"
                                        >
                                            <Phone className="w-4 h-4 text-[#52cca3]" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Hotel Location / Address</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={hotelLocation}
                                        onChange={(e) => setHotelLocation(e.target.value)}
                                        placeholder="e.g. Sector 22, Chandigarh"
                                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#52cca3] transition-all"
                                    />
                                    {hotelLocation && (
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelLocation)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 px-3 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm"
                                            title="Locate Hotel"
                                        >
                                            <MapPin className="w-4 h-4 text-indigo-400" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Room Number (Optional)</label>
                                <input 
                                    type="text"
                                    value={roomNumber}
                                    onChange={(e) => setRoomNumber(e.target.value)}
                                    placeholder="e.g. 204"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#52cca3] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Floor Number (Optional)</label>
                                <input 
                                    type="text"
                                    value={floorNumber}
                                    onChange={(e) => setFloorNumber(e.target.value)}
                                    placeholder="e.g. Ground or 3rd"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#52cca3] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Stay Cost (INR)</label>
                                <div className="flex gap-2">
                                    <input 
                                        required
                                        type="number"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        placeholder="Amount in ₹"
                                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#52cca3] transition-all"
                                    />
                                    {Number(cost) > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setIsQrModalOpen(true)}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 text-[10px] uppercase tracking-wider"
                                            title="Generate Sky5 UPI QR Code"
                                        >
                                            <QrCode className="w-4 h-4" /> QR Pay
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Check-In Date</label>
                                <input 
                                    required
                                    type="date"
                                    value={checkInDate}
                                    onChange={(e) => setCheckInDate(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#52cca3] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Check-Out Date</label>
                                <input 
                                    required
                                    type="date"
                                    value={checkOutDate}
                                    onChange={(e) => setCheckOutDate(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#52cca3] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Purpose of Stay</label>
                                <input 
                                    required
                                    type="text"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="e.g. Overtime Design Phase / Client review meeting"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#52cca3] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Payment Status</label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="paymentStatus" 
                                            value="PAID"
                                            checked={paymentStatus === 'PAID'}
                                            onChange={() => setPaymentStatus('PAID')}
                                            className="text-[#52cca3] focus:ring-[#52cca3]"
                                        />
                                        Paid
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="paymentStatus" 
                                            value="PENDING"
                                            checked={paymentStatus === 'PENDING'}
                                            onChange={() => setPaymentStatus('PENDING')}
                                            className="text-rose-500 focus:ring-rose-500"
                                        />
                                        Pending / Unpaid
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Attach Invoice</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="file" 
                                        id="invoice-upload"
                                        className="hidden" 
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setInvoiceFileName(e.target.files[0].name);
                                            }
                                        }}
                                    />
                                    <input 
                                        type="text"
                                        readOnly
                                        value={invoiceFileName}
                                        placeholder="No file selected"
                                        className="flex-1 bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 cursor-not-allowed focus:outline-none"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => document.getElementById('invoice-upload')?.click()}
                                        className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        Choose
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notes & Additional details</label>
                                <input 
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Booking reference, payment source details, etc."
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#52cca3] transition-all"
                                />
                            </div>

                            <div className="md:col-span-3 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200/40 dark:border-white/5">
                                <button 
                                    type="button" 
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-[10px] font-black uppercase tracking-wider transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-6 py-3 rounded-xl bg-[#52cca3] hover:bg-[#46b891] text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                                >
                                    Save stay entry
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filter and Logs Section */}
                <div className="glass-card border border-slate-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                    
                    {/* Filters Header */}
                    <div className="p-6 border-b border-slate-200/40 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-100/30 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <Filter className="w-4 h-4 text-[#52cca3]" />
                            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Filtered Stay Records</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-4 w-full md:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search guest or hotel name..."
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#52cca3] transition-all"
                                />
                            </div>

                            {/* Guest Type Filter */}
                            <select 
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#52cca3] transition-all"
                            >
                                <option value="ALL">All Guest Types</option>
                                <option value="CLIENT">Clients</option>
                                <option value="STAFF">Staff Members</option>
                                <option value="VENDOR">Vendors</option>
                            </select>

                            {/* Project Filter */}
                            <select 
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#52cca3] transition-all"
                            >
                                <option value="ALL">All Project Codes</option>
                                <option value="GENERAL">General Admin</option>
                                {projects.map(p => (
                                    <option key={p.projectId} value={p.projectId}>{p.projectId}</option>
                                ))}
                            </select>

                            {/* Payment Filter */}
                            <select 
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value as any)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#52cca3] transition-all"
                            >
                                <option value="ALL">All Payments</option>
                                <option value="PAID">Paid</option>
                                <option value="PENDING">Pending</option>
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/40 dark:border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/10 dark:bg-white/5">
                                    <th className="py-4 px-6">ID</th>
                                    <th className="py-4 px-6">Guest Info</th>
                                    <th className="py-4 px-6">Project / Reason</th>
                                    <th className="py-4 px-6">Hotel Stay Details</th>
                                    <th className="py-4 px-6">Check-in / Out</th>
                                    <th className="py-4 px-6 text-right">Cost (INR)</th>
                                    <th className="py-4 px-6 text-center">Status</th>
                                    <th className="py-4 px-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/40 dark:divide-white/5">
                                {filteredStays.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider bg-white/50 dark:bg-transparent">
                                            No lodging stay logs match the active filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStays.map((stay) => {
                                        return (
                                            <tr key={stay.id} className="hover:bg-slate-100/40 dark:hover:bg-white/5 transition-colors duration-150">
                                                {/* ID */}
                                                <td className="py-4 px-6 text-xs font-black text-[#0e4368] dark:text-[#52cca3] whitespace-nowrap">
                                                    {stay.id}
                                                    {stay.invoiceFile && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                                                            <span className="text-[9px] font-bold text-slate-400 truncate max-w-[80px]" title={stay.invoiceFile}>
                                                                {stay.invoiceFile}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                
                                                {/* Guest Info */}
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">{stay.guestName}</span>
                                                        <span className={`inline-flex items-center w-fit text-[8px] font-black px-2 py-0.5 mt-1 rounded uppercase tracking-wider ${
                                                            stay.guestType === 'CLIENT' 
                                                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                                                                : stay.guestType === 'STAFF' 
                                                                    ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' 
                                                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                        }`}>
                                                            {stay.guestType}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Project / Reason */}
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                            {stay.associatedProjectId === 'GENERAL' ? (
                                                                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Internal Admin</span>
                                                            ) : (
                                                                <span className="font-extrabold text-indigo-400">{stay.associatedProjectId}</span>
                                                            )}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold mt-0.5">{stay.purpose}</span>
                                                    </div>
                                                </td>

                                                {/* Hotel Name */}
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            {stay.hotelName}
                                                        </span>
                                                        {(stay.roomNumber || stay.floorNumber) && (
                                                            <span className="text-[9px] font-semibold text-slate-400 pl-5 uppercase tracking-wide">
                                                                Room: {stay.roomNumber || 'N/A'} {stay.floorNumber ? `(Floor: ${stay.floorNumber})` : ''}
                                                            </span>
                                                        )}
                                                        {stay.hotelContact && (
                                                            <a href={`tel:${stay.hotelContact}`} className="text-[9px] font-bold text-slate-400 pl-5 hover:text-[#52cca3] transition-colors flex items-center gap-1 mt-0.5">
                                                                <Phone className="w-2.5 h-2.5" /> {stay.hotelContact}
                                                            </a>
                                                        )}
                                                        {stay.hotelLocation && (
                                                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.hotelLocation)}`} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-slate-400 pl-5 hover:text-indigo-400 transition-colors flex items-center gap-1 mt-0.5">
                                                                <MapPin className="w-2.5 h-2.5" /> {stay.hotelLocation}
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Check in / Out */}
                                                <td className="py-4 px-6 whitespace-nowrap text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    <div className="flex flex-col">
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {stay.checkInDate}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold mt-0.5">to {stay.checkOutDate}</span>
                                                    </div>
                                                </td>

                                                {/* Cost */}
                                                <td className="py-4 px-6 text-right text-xs font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                                                    ₹{stay.cost.toLocaleString('en-IN')}
                                                </td>

                                                {/* Payment Status */}
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                                                        stay.paymentStatus === 'PAID' 
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                    }`}>
                                                        {stay.paymentStatus === 'PAID' ? (
                                                            <>
                                                                <CheckCircle2 className="w-3 h-3" /> Paid
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertCircle className="w-3 h-3" /> Pending
                                                            </>
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-6 text-center">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleDelete(stay.id)}
                                                        className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
                                                        title="Delete Stay record"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {isAddProjectModalOpen && (
                <NewProjectModal 
                    isOpen={isAddProjectModalOpen}
                    onClose={() => setIsAddProjectModalOpen(false)}
                    onAdd={(newProj) => {
                        if (onAddProject) {
                            onAddProject(newProj);
                        }
                        setProjectId(newProj.projectId);
                    }}
                    existingProjects={projects.map(p => p.projectId)}
                />
            )}

            {isQrModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsQrModalOpen(false)} />
                    
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase text-center">Sky5 Payment QR</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 text-center">UPI Instant Settlement</p>
                            </div>
                            <button onClick={() => setIsQrModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-center mb-6">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=Q15213511@ybl%26pn=Sky5%20Hotel%26am=${cost}%26cu=INR`} 
                                alt="Sky5 Payment QR"
                                className="w-48 h-48 rounded-2xl"
                            />
                        </div>

                        <div className="w-full space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 col-span-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Payee Name</span>
                                <span className="text-slate-800 font-black">Sky5 Hotel</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">UPI Address</span>
                                <span className="text-slate-800 font-bold font-mono">Q15213511@ybl</span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-3">
                                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Payable Amount</span>
                                <span className="text-[#52cca3] font-black text-lg">₹{Number(cost || 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsQrModalOpen(false)}
                            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Done / Confirmed
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default HotelRegister;

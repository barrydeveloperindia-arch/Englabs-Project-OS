import React, { useState } from 'react';
import { 
    X, 
    Truck, 
    MapPin, 
    Package, 
    Calendar, 
    Clock, 
    Navigation, 
    IndianRupee, 
    FileText, 
    Camera,
    CheckCircle2,
    Loader2,
    Activity
} from 'lucide-react';
import { PorterTrip, calculatePorterAmount, PorterPaymentStatus } from '../lib/porter_system';
import { extractPorterData } from '../lib/extraction_service';

interface Props {
    onClose: () => void;
    onSave: (trip: PorterTrip) => void;
    currentCount: number;
    initialData?: PorterTrip;
}

const PorterEntryForm: React.FC<Props> = ({ onClose, onSave, currentCount, initialData }) => {
    const [isExtracting, setIsExtracting] = useState(false);
    const [formData, setFormData] = useState<Partial<PorterTrip>>(initialData || {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        paymentStatus: 'PENDING',
        deliveryStatus: 'ACCEPTED',
        customerName: '',
        customerMobile: '',
        deliveryAddress: '',
        ratePerKm: 15,
        distanceKm: 0,
        fuelCharge: 0,
        serviceCharge: 0,
        repairCharge: 0,
        extraExpense: 0,
        advanceAmount: 0,
        grossAmount: 0,
        remainingBalance: 0,
        totalAmount: 0,
        timeline: []
    });

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            setFormData(prev => ({ ...prev, proofUrl: dataUrl }));
            
            try {
                const extracted = await extractPorterData(dataUrl);
                setFormData(prev => {
                    const distanceKm = extracted.distanceKm || prev.distanceKm || 0;
                    const ratePerKm = extracted.ratePerKm || prev.ratePerKm || 15;
                    const calc = calculatePorterAmount(
                        distanceKm, ratePerKm,
                        prev.fuelCharge || 0, prev.serviceCharge || 0, prev.repairCharge || 0, prev.extraExpense || 0,
                        prev.advanceAmount || 0
                    );
                    return {
                        ...prev,
                        date: extracted.date || prev.date,
                        porterName: extracted.porterName || prev.porterName,
                        vehicleNumber: extracted.vehicleNumber || prev.vehicleNumber,
                        fromLocation: extracted.fromLocation || prev.fromLocation,
                        toLocation: extracted.toLocation || prev.toLocation,
                        materialDescription: extracted.materialDescription || prev.materialDescription,
                        distanceKm,
                        ratePerKm,
                        remarks: extracted.remarks || prev.remarks,
                        grossAmount: calc.gross,
                        totalAmount: calc.gross,
                        remainingBalance: calc.balance
                    };
                });
            } catch (error) {
                console.error("AI Extraction failed:", error);
            } finally {
                setIsExtracting(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const updateFinance = (updates: any) => {
        const newData = { ...formData, ...updates };
        const calc = calculatePorterAmount(
            newData.distanceKm || 0,
            newData.ratePerKm || 0,
            newData.fuelCharge || 0,
            newData.serviceCharge || 0,
            newData.repairCharge || 0,
            newData.extraExpense || 0,
            newData.advanceAmount || 0
        );
        
        let status: PorterPaymentStatus = 'PENDING';
        if (calc.balance <= 0 && calc.gross > 0) status = 'COMPLETED';
        else if ((newData.advanceAmount || 0) > 0) status = 'PARTIAL';

        setFormData({ 
            ...newData, 
            grossAmount: calc.gross, 
            totalAmount: calc.gross, 
            remainingBalance: calc.balance,
            paymentStatus: status
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trip: PorterTrip = {
            ...formData,
            id: initialData?.id || `PTR-2026-${(currentCount + 1).toString().padStart(4, '0')}`,
            timestamp: initialData?.timestamp || new Date().toISOString(),
            timeline: initialData?.timeline || [{
                status: (formData.deliveryStatus as any) || 'ACCEPTED',
                timestamp: new Date().toISOString(),
                remarks: 'Mission Initialized'
            }]
        } as PorterTrip;
        onSave(trip);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* PREVIEW SIDEBAR */}
                <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-8 flex flex-col">
                    <div className="flex-1">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{initialData ? 'Edit Mission' : 'Porter Intake'}</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{initialData ? 'Manual Record Modification' : 'Automatic Trip Ingestion'}</p>
                        
                        <div className="aspect-[3/4] bg-slate-200 rounded-3xl overflow-hidden relative border-4 border-white shadow-xl">
                            {formData.proofUrl ? (
                                <img src={formData.proofUrl} className="w-full h-full object-cover" alt="Proof" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                    <Camera className="w-10 h-10 mb-4 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                        Upload Screenshot, Slip or WhatsApp Image for AI Extraction
                                    </p>
                                </div>
                            )}
                            {isExtracting && (
                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                </div>
                            )}
                        </div>
                        
                        <label className="mt-8 block cursor-pointer">
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            <div className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                                <Camera className="w-4 h-4" /> UPLOAD PROOF
                            </div>
                        </label>
                    </div>
                </div>

                {/* FORM AREA */}
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar max-h-[90vh]">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <span className="text-[10px] font-black bg-emerald-500 text-slate-900 px-3 py-1.5 rounded-lg tracking-widest uppercase">{initialData ? 'Update Sequence' : 'Mission Ready'}</span>
                            <h3 className="text-3xl font-black text-slate-900 mt-4 tracking-tight">{initialData ? 'Modify Details' : 'Trip Configuration'}</h3>
                        </div>
                        <button onClick={onClose} data-testid="btn-close-porter" className="p-3 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Trip Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="date"
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Departure Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="time"
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                        value={formData.time}
                                        onChange={e => setFormData({...formData, time: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Porter Name</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Enter Porter Name"
                                    value={formData.porterName || ''}
                                    onChange={e => setFormData({ ...formData, porterName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vehicle Number</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Ex: CH-01-XXXX"
                                    value={formData.vehicleNumber || ''}
                                    onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 mb-8">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Package className="w-4 h-4 text-emerald-500" /> Customer Information
                            </h4>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer Name</label>
                                    <input type="text" required className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" placeholder="Full Name" value={formData.customerName || ''} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                                    <input type="tel" required className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" placeholder="Contact No." value={formData.customerMobile || ''} onChange={e => setFormData({ ...formData, customerMobile: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Delivery Address</label>
                                <textarea required rows={2} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold resize-none" placeholder="Detailed Address" value={formData.deliveryAddress || ''} onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">From Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    <input 
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                        placeholder="Origin"
                                        value={formData.fromLocation || ''}
                                        onChange={e => setFormData({...formData, fromLocation: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">To Location</label>
                                <div className="relative">
                                    <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                    <input 
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                        placeholder="Destination"
                                        value={formData.toLocation || ''}
                                        onChange={e => setFormData({...formData, toLocation: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Material Description</label>
                            <div className="relative">
                                <Package className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                                <textarea 
                                    required
                                    rows={2}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all resize-none"
                                    placeholder="Payload details..."
                                    value={formData.materialDescription || ''}
                                    onChange={e => setFormData({...formData, materialDescription: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Distance (KM)</label>
                                <input 
                                    type="number"
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                    placeholder="KM"
                                    value={formData.distanceKm || ''}
                                    onChange={e => updateFinance({ distanceKm: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rate (₹/KM)</label>
                                <input 
                                    type="number"
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Rate"
                                    value={formData.ratePerKm || ''}
                                    onChange={e => updateFinance({ ratePerKm: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Gross</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    <input 
                                        readOnly
                                        className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-emerald-700"
                                        value={formData.grossAmount || 0}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BIKE CHARGES SECTION */}
                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" /> Bike Service Charges
                            </h4>
                            <div className="grid grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Fuel</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" value={formData.fuelCharge || ''} onChange={e => updateFinance({ fuelCharge: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Service</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" value={formData.serviceCharge || ''} onChange={e => updateFinance({ serviceCharge: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Repair</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" value={formData.repairCharge || ''} onChange={e => updateFinance({ repairCharge: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Extra</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" value={formData.extraExpense || ''} onChange={e => updateFinance({ extraExpense: Number(e.target.value) })} />
                                </div>
                            </div>
                        </div>

                        {/* ADVANCE PAYMENT SECTION */}
                        <div className="bg-amber-50/50 p-8 rounded-[2rem] border border-amber-100">
                            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <IndianRupee className="w-4 h-4" /> Advance Settlement
                            </h4>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Advance Amount</label>
                                    <input type="number" className="w-full bg-white border border-amber-200 rounded-xl py-3 px-4 text-xs font-bold" value={formData.advanceAmount || ''} onChange={e => updateFinance({ advanceAmount: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Date Given</label>
                                    <input type="date" className="w-full bg-white border border-amber-200 rounded-xl py-3 px-4 text-xs font-bold" value={formData.advanceDate || ''} onChange={e => setFormData({ ...formData, advanceDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Given By</label>
                                    <input type="text" className="w-full bg-white border border-amber-200 rounded-xl py-3 px-4 text-xs font-bold" placeholder="Payer Name" value={formData.advanceGivenBy || ''} onChange={e => setFormData({ ...formData, advanceGivenBy: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className={`p-8 rounded-[2rem] text-white flex justify-between items-center transition-all ${formData.remainingBalance && formData.remainingBalance < 0 ? 'bg-rose-500' : 'bg-[#0e4368]'}`}>
                            <div>
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">
                                    {formData.remainingBalance && formData.remainingBalance < 0 ? 'Overpayment detected' : 'Final Settlement Balance'}
                                </p>
                                <p className="text-3xl font-black text-white">
                                    ₹{Math.abs(formData.remainingBalance || 0).toLocaleString()}
                                    {formData.remainingBalance && formData.remainingBalance < 0 && <span className="ml-2 text-sm opacity-60">(CREDIT)</span>}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Mission Status</p>
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${formData.paymentStatus === 'COMPLETED' ? 'bg-emerald-400 text-slate-900' : 'bg-amber-400 text-slate-900'}`}>
                                    {formData.paymentStatus}
                                </span>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-[#0e4368] text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20"
                        >
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {initialData ? 'UPDATE MISSION RECORD' : 'FINALIZE MISSION RECORD'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PorterEntryForm;

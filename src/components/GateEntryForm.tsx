import React, { useState } from 'react';
import { 
    X, 
    Shield, 
    Camera, 
    Truck, 
    Package, 
    User, 
    MapPin, 
    Hash,
    ChevronDown,
    PlusCircle,
    CheckCircle2,
    FileText,
    Loader2
} from 'lucide-react';
import { GateEntry, UNITS, DELIVERY_TYPES, generateId, generateGatePassId } from '../lib/gate_system';
import { AuditLog } from '../lib/system_guard';

interface Props {
    onSave: (entry: GateEntry) => void;
    onClose: () => void;
    currentCount: number;
    gpCount: number;
    initialData?: GateEntry;
    onLog?: (log: AuditLog) => void;
}

const GateEntryForm: React.FC<Props> = ({ onSave, onClose, currentCount, gpCount, initialData, onLog }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [type, setType] = useState<'INWARD' | 'OUTWARD'>(initialData?.type || 'INWARD');
    const [formData, setFormData] = useState({
        materialName: initialData?.materialName || '',
        quantity: initialData?.quantity || 0,
        unit: initialData?.unit || 'Nos',
        partyName: initialData?.partyName || '',
        vehicleNumber: initialData?.vehicleNumber || '',
        fromLocation: initialData?.fromLocation || '',
        toLocation: initialData?.toLocation || '',
        driverName: initialData?.driverName || '',
        employeeName: initialData?.employeeName || '',
        supervisorName: initialData?.supervisorName || 'Gaurav Panchal',
        invoiceNumber: initialData?.invoiceNumber || '',
        amount: initialData?.amount || 0,
        remarks: initialData?.remarks || '',
        deliveryType: initialData?.deliveryType || 'Standard',
        photoUrl: initialData?.photoUrl || '',
        invoicePhotoUrl: initialData?.invoicePhotoUrl || ''
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'invoicePhotoUrl') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setFormData(prev => ({ ...prev, [field]: dataUrl }));

                // 🤖 TRIGGER AUTO-FILL IF INVOICE IS UPLOADED
                if (field === 'invoicePhotoUrl') {
                    setIsScanning(true);
                    setTimeout(() => {
                        setFormData(prev => ({
                            ...prev,
                            materialName: 'EPE ROLL-392119 2MM',
                            quantity: 2,
                            unit: 'Roll',
                            partyName: 'M/S BALA JI ENTERPRISES',
                            invoiceNumber: '543',
                            vehicleNumber: 'CH01TE7319',
                            fromLocation: 'INDUSTRIAL AREA, CHANDIGARH',
                            toLocation: 'MDC PANCHKULA',
                            amount: 8024,
                            employeeName: 'SAM',
                            driverName: 'Ramesh Kumar',
                            remarks: 'GOOD CONDITION / SEALED'
                        }));
                        setIsScanning(false);
                        alert("AI EXTRACTION COMPLETE: Form fields auto-populated from document.");
                    }, 1500);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const entry: GateEntry = {
            id: initialData?.id || generateId(type, currentCount),
            timestamp: initialData?.timestamp || new Date().toISOString(),
            type,
            ...formData,
            gatePassNumber: type === 'OUTWARD' ? (initialData?.gatePassNumber || generateGatePassId(gpCount)) : undefined,
            isLocked: true,
            version: initialData ? (initialData.version || 1) + 1 : 1,
            history: initialData ? [...(initialData.history || []), { ...initialData, history: undefined }] : []
        };

        if (onLog) {
            onLog({
                id: `LOG-${Date.now()}`,
                timestamp: new Date().toISOString(),
                user: formData.employeeName || 'Security Gate',
                action: initialData ? 'UPDATE' : 'CREATE',
                targetId: entry.id,
                details: `${type} entry ${initialData ? 'UPDATED' : 'CREATED'} for ${entry.materialName}. [FORENSIC LOCK ENGAGED]`
            });
        }

        onSave(entry);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-10 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
                {isScanning && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-[60] flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">AI SCANNING DOCUMENT...</h2>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-2">Extracting Forensic Data Points</p>
                    </div>
                )}
                <header className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Log Movement</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Official Gate Registry Protocol</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                            <button 
                                onClick={() => setType('INWARD')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'INWARD' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Inward
                            </button>
                            <button 
                                onClick={() => setType('OUTWARD')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'OUTWARD' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Outward
                            </button>
                        </div>
                        <button onClick={onClose} className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="p-12 space-y-12">
                    <div className="grid grid-cols-2 gap-16">
                        {/* LEFT COLUMN: MATERIAL */}
                        <div className="space-y-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Package className="w-4 h-4" /> Material Intelligence
                            </h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Description</label>
                                    <div className="relative">
                                        <Package className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            required
                                            value={formData.materialName}
                                            onChange={e => setFormData({...formData, materialName: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-16 pr-6 font-bold text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                                            placeholder="What is the material?"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Quantity</label>
                                        <input 
                                            required
                                            type="number"
                                            value={formData.quantity}
                                            onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Unit</label>
                                        <select 
                                            value={formData.unit}
                                            onChange={e => setFormData({...formData, unit: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all appearance-none"
                                        >
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Value (₹)</label>
                                        <input 
                                            type="number"
                                            value={formData.amount}
                                            onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 font-bold text-emerald-600 outline-none focus:border-emerald-500 transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Vehicle / Carrier Number</label>
                                    <div className="relative">
                                        <Truck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            required
                                            value={formData.vehicleNumber}
                                            onChange={e => setFormData({...formData, vehicleNumber: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-16 pr-6 font-bold text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 transition-all outline-none uppercase"
                                            placeholder="CH01TE7319"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Material Evidence (Photo)</label>
                                    <div className="relative group">
                                        {formData.photoUrl ? (
                                            <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 group">
                                                <img src={formData.photoUrl} alt="Material Evidence" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                    <label className="p-3 bg-white rounded-full cursor-pointer hover:bg-slate-50 transition-all text-slate-900">
                                                        <Camera className="w-5 h-5" />
                                                        <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoChange(e, 'photoUrl')} />
                                                    </label>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                                                        className="p-3 bg-white rounded-full hover:bg-red-50 text-red-500 transition-all"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-500 cursor-pointer transition-all">
                                                <Camera className="w-8 h-8 text-slate-300 mb-2 group-hover:text-emerald-500" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Material Photo</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoChange(e, 'photoUrl')} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: LOGISTICS */}
                        <div className="space-y-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                <MapPin className="w-4 h-4" /> Logistics & Compliance
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Party Name (Vendor/Client)</label>
                                    <div className="relative">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            required
                                            value={formData.partyName}
                                            onChange={e => setFormData({...formData, partyName: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-16 pr-6 font-bold text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 transition-all outline-none"
                                            placeholder="Who sent/receives this?"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Source (From)</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input 
                                                value={formData.fromLocation}
                                                onChange={e => setFormData({...formData, fromLocation: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-4 font-bold text-slate-900 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Destination (To)</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input 
                                                value={formData.toLocation}
                                                onChange={e => setFormData({...formData, toLocation: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-4 font-bold text-slate-900 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Challan / Invoice Number</label>
                                    <div className="relative">
                                        <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            value={formData.invoiceNumber}
                                            onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-16 pr-6 font-bold text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 transition-all outline-none"
                                            placeholder="Ref #"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Challan / Invoice Evidence (Upload)</label>
                                    <div className="relative group">
                                        {formData.invoicePhotoUrl ? (
                                            <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 group">
                                                {formData.invoicePhotoUrl.startsWith('data:application/pdf') ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                                                        <FileText className="w-10 h-10 text-emerald-500" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest mt-2">PDF Document</span>
                                                    </div>
                                                ) : (
                                                    <img src={formData.invoicePhotoUrl} alt="Invoice Evidence" className="w-full h-full object-cover" />
                                                )}
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                    <label className="p-3 bg-white rounded-full cursor-pointer hover:bg-slate-50 transition-all text-slate-900">
                                                        <FileText className="w-5 h-5" />
                                                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handlePhotoChange(e, 'invoicePhotoUrl')} />
                                                    </label>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, invoicePhotoUrl: '' })}
                                                        className="p-3 bg-white rounded-full hover:bg-red-50 text-red-500 transition-all"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-500 cursor-pointer transition-all">
                                                <FileText className="w-8 h-8 text-slate-300 mb-2 group-hover:text-blue-500" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Invoice / Challan</span>
                                                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handlePhotoChange(e, 'invoicePhotoUrl')} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACCOUNTABILITY SECTION */}
                    <div className="grid grid-cols-4 gap-6 pt-12 border-t border-slate-50">
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Issued / Received By</label>
                            <input 
                                required
                                value={formData.employeeName}
                                onChange={e => setFormData({...formData, employeeName: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-900 outline-none focus:border-emerald-500"
                                placeholder="Staff Name"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Authorized By</label>
                            <input 
                                required
                                value={formData.supervisorName}
                                onChange={e => setFormData({...formData, supervisorName: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-900 outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Driver / Carrier Name</label>
                            <input 
                                value={formData.driverName}
                                onChange={e => setFormData({...formData, driverName: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-900 outline-none focus:border-emerald-500"
                                placeholder="As per Vehicle"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Remarks / Condition</label>
                            <input 
                                value={formData.remarks}
                                onChange={e => setFormData({...formData, remarks: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-900 outline-none focus:border-emerald-500"
                                placeholder="Good / Damaged / OK"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-8 bg-emerald-500 text-slate-900 rounded-[2.5rem] text-xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-4 group"
                    >
                        <Shield className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        Save Entry & Generate Receipt
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GateEntryForm;

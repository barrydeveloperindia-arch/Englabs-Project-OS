import React, { useState, useEffect } from 'react';
import { 
    X, 
    Save, 
    Utensils, 
    CreditCard, 
    FileText, 
    User, 
    Briefcase,
    AlertCircle,
    Camera
} from 'lucide-react';
import { 
    FoodOrder, 
    FoodPlatform, 
    OrderType, 
    Purpose, 
    PaymentMode, 
    PaidBy,
    PLATFORMS,
    ORDER_TYPES,
    PURPOSES,
    PAYMENT_MODES,
    PAID_BY_OPTIONS,
    DEPARTMENTS,
    STAFF_LIST,
    generateFoodId
} from '../lib/food_system';

interface Props {
    onClose: () => void;
    onSubmit: (order: FoodOrder) => void;
    orderCount: number;
    initialData?: FoodOrder;
}

const FoodOrderForm: React.FC<Props> = ({ onClose, onSubmit, orderCount, initialData }) => {
    const [formData, setFormData] = useState<Partial<FoodOrder>>(() => {
        if (initialData) return initialData;
        return {
            entryId: generateFoodId(orderCount),
            timestamp: new Date().toISOString(),
            platform: 'Sky-5',
            orderType: 'Individual',
            purpose: 'Official Work',
            paymentMode: 'UPI',
            paidBy: 'Employee',
            hasBill: true,
            status: 'Pending',
            attachmentUrl: '',
            rate: 0,
            discount: 0,
            discountType: 'Flat',
            quantity: 1,
            unit: 'Nos',
            trackingStatus: 'Order Placed'
        };
    });

    useEffect(() => {
        const rate = formData.rate || 0;
        const quantity = formData.quantity || 1;
        const discount = formData.discount || 0;
        const subtotal = rate * quantity;
        
        let calculatedAmount = 0;
        if (formData.discountType === 'Percentage') {
            calculatedAmount = Math.max(0, subtotal * (1 - discount / 100));
        } else {
            calculatedAmount = Math.max(0, subtotal - discount);
        }
        
        setFormData(prev => ({ ...prev, amount: Math.round(calculatedAmount) }));
    }, [formData.rate, formData.quantity, formData.discount, formData.discountType]);

    const [previewUrl, setPreviewUrl] = useState<string>(initialData?.attachmentUrl || '');

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setFormData({...formData, attachmentUrl: url});
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) onSubmit(formData as FoodOrder);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-12">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-spring-zoom">
                {/* HEADER */}
                <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <Utensils className="w-6 h-6 text-slate-900" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">{initialData ? 'EDIT FOOD ORDER' : 'LOG FOOD ORDER'}</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{initialData ? `Adjusting ${initialData.entryId}` : 'Expediting Official Sustenance'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        
                        {/* SECTION 1: BASIC & ORDER */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <User className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Requester Details</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee Name</label>
                                    <select 
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                        value={formData.employeeName || ''}
                                        onChange={e => setFormData({...formData, employeeName: e.target.value})}
                                    >
                                        <option value="">Select Employee...</option>
                                        {STAFF_LIST.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                        value={formData.department}
                                        onChange={e => setFormData({...formData, department: e.target.value as any})}
                                    >
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-8 pt-4">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <Briefcase className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Order Specification</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                            value={formData.platform}
                                            onChange={e => setFormData({...formData, platform: e.target.value as FoodPlatform})}
                                        >
                                            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                            placeholder="e.g. Sky Kitchen"
                                            value={formData.vendorName || ''}
                                            onChange={e => setFormData({...formData, vendorName: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity (Nos)</label>
                                        <input 
                                            required
                                            type="number" 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                            placeholder="e.g. 2"
                                            value={formData.quantity || ''}
                                            onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                            value={formData.unit || 'Nos'}
                                            onChange={e => setFormData({...formData, unit: e.target.value})}
                                        >
                                            <option value="Nos">Nos</option>
                                            <option value="Plate">Plate</option>
                                            <option value="Portion">Portion</option>
                                            <option value="Packet">Packet</option>
                                            <option value="Kg">Kg</option>
                                            <option value="Ltr">Ltr</option>
                                            <option value="Box">Box</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Food Items (Brief)</label>
                                    <textarea 
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all h-24 resize-none"
                                        placeholder="e.g. 2x Thali, 4x Samosas"
                                        value={formData.items || ''}
                                        onChange={e => setFormData({...formData, items: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: PURPOSE & FINANCE */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <AlertCircle className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Purpose & Justification</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purpose</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                        value={formData.purpose}
                                        onChange={e => setFormData({...formData, purpose: e.target.value as Purpose})}
                                    >
                                        {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Code (Optional)</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                        placeholder="e.g. C2931"
                                        value={formData.projectCode || ''}
                                        onChange={e => setFormData({...formData, projectCode: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Justification</label>
                                <textarea 
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all h-24 resize-none"
                                    placeholder="Why is this order being placed?"
                                    value={formData.justification || ''}
                                    onChange={e => setFormData({...formData, justification: e.target.value})}
                                />
                            </div>

                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <CreditCard className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Financial Settlement</h3>
                                </div>

                                    {/* TRANSPARENT BILLING INTELLIGENCE */}
                                    <div className="bg-[#0F172A] rounded-[2rem] p-6 flex justify-between items-center border-b-4 border-emerald-500/30 shadow-xl">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Gross Total</span>
                                            <span className="text-sm font-black text-white/40 line-through tracking-widest">₹{((formData.rate || 0) * (formData.quantity || 1)).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex flex-col text-center">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                                {formData.discountType === 'Percentage' ? 'Off (%)' : 'Discount'}
                                            </span>
                                            <span className="text-sm font-black text-rose-500 tracking-widest">
                                                {formData.discountType === 'Percentage' ? `-${formData.discount}%` : `-₹${(formData.discount || 0).toLocaleString('en-IN')}`}
                                            </span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Net Payable</span>
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-2xl font-black text-emerald-500 tracking-tighter">₹{(formData.amount || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Rate (₹)</label>
                                            <input 
                                                type="number" 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                                placeholder="0.00"
                                                value={formData.rate || ''}
                                                onChange={e => setFormData({...formData, rate: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount Mode</label>
                                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 h-[46px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({...formData, discountType: 'Flat'})}
                                                    className={`flex-1 rounded-lg text-[9px] font-black transition-all ${
                                                        formData.discountType === 'Flat' 
                                                        ? 'bg-white text-slate-900 shadow-sm' 
                                                        : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                >
                                                    ₹ CASH
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({...formData, discountType: 'Percentage'})}
                                                    className={`flex-1 rounded-lg text-[9px] font-black transition-all ${
                                                        formData.discountType === 'Percentage' 
                                                        ? 'bg-white text-slate-900 shadow-sm' 
                                                        : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                >
                                                    % PERCENT
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                {formData.discountType === 'Percentage' ? 'Quick Off (%)' : 'Discount (₹)'}
                                            </label>
                                            {formData.discountType === 'Percentage' ? (
                                                <select 
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-rose-500"
                                                    value={formData.discount || 0}
                                                    onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                                                >
                                                    {[0, 10, 20, 30, 50].map(val => (
                                                        <option key={val} value={val}>{val}% Discount</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-rose-500"
                                                    placeholder="0"
                                                    value={formData.discount || ''}
                                                    onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                                                />
                                            )}
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-emerald-500">Final Payable (₹)</label>
                                            <div className="w-full h-[46px] bg-emerald-50 border border-emerald-100 rounded-xl px-2 flex items-center justify-center text-sm font-black text-emerald-600">
                                                ₹{(formData.amount || 0).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 pt-2">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rapid Payment Matrix</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {PAYMENT_MODES.map(mode => (
                                                    <button
                                                        key={mode}
                                                        type="button"
                                                        onClick={() => setFormData({...formData, paymentMode: mode})}
                                                        className={`py-3 rounded-xl text-[9px] font-black transition-all border flex items-center justify-center gap-2 ${
                                                            formData.paymentMode === mode 
                                                            ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/10' 
                                                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {mode === 'UPI' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Settlement Responsibility</label>
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                                value={formData.paidBy}
                                                onChange={e => setFormData({...formData, paidBy: e.target.value as PaidBy})}
                                            >
                                                {PAID_BY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* SKY-5 DIRECT SCANNER */}
                                    {formData.platform === 'Sky-5' && formData.paymentMode === 'UPI' && (
                                        <div className="mt-4 p-6 bg-slate-900 rounded-[2rem] border-2 border-emerald-500/30 flex flex-col items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sky-5 Direct Payment Active</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-3xl shadow-2xl">
                                                <img 
                                                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=Q15213511@ybl&pn=Sky5%20Hotel&am=0" 
                                                    alt="Sky-5 QR" 
                                                    className="w-32 h-32"
                                                />
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase text-center leading-relaxed">
                                                Scan to Pay Directly to Sky-5 Hotel<br/>
                                                <span className="text-emerald-400">Merchant ID: Q15213511@ybl</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Bill Verification</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Physical or digital receipt available</p>
                                    </div>
                                    
                                    <div className="relative group shrink-0">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                            onChange={handlePhotoChange}
                                        />
                                        {previewUrl ? (
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md relative">
                                                <img src={previewUrl} className="w-full h-full object-cover" alt="Bill" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-emerald-500 transition-all">
                                                <Camera className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                                            </div>
                                        )}
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={formData.hasBill} onChange={e => setFormData({...formData, hasBill: e.target.checked})} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                    {/* ACTIONS */}
                    <div className="mt-12 flex gap-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            CANCEL LOG
                        </button>
                        <button 
                            type="submit"
                            className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                            <Save className="w-4 h-4" /> {initialData ? 'UPDATE LEDGER' : 'COMMIT TO LEDGER'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FoodOrderForm;

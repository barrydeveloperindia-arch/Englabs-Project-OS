import React, { useState, useEffect } from 'react';
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
    Loader2,
    Save,
    Trash2,
    MessageSquare,
    CreditCard,
    AlertCircle
} from 'lucide-react';
import { GateEntry, UNITS, DELIVERY_TYPES, generateId, generateGatePassId } from '@shared/services/gate_system';
import { AuditLog } from '@shared/services/system_guard';
import { extractInvoiceData } from '@services/extraction_service';
import { isInterState } from '@shared/services/billing_system';
import masterInventory from '@data/master_inventory_may_2026.json';

const nameToCodeMap = new Map<string, string>();
if (Array.isArray(masterInventory)) {
    masterInventory.forEach((report: any) => {
        if (report && Array.isArray(report.items)) {
            report.items.forEach((item: any) => {
                if (item && item.name && item.itemCode) {
                    nameToCodeMap.set(item.name.trim().toLowerCase(), item.itemCode.trim());
                }
            });
        }
    });
}
nameToCodeMap.set("hand gloves", "Eng-136");
nameToCodeMap.set("gloves (industrial)", "Eng-136");
nameToCodeMap.set("surgical blade", "Eng-055");
nameToCodeMap.set("seven black gloss paint", "Eng-005");
nameToCodeMap.set("h.c. robotic aircraft gray paint", "Eng-012");

interface Props {
    onSave: (entry: GateEntry) => void;
    onClose: () => void;
    currentCount: number;
    gpCount: number;
    initialData?: GateEntry;
    onLog?: (log: AuditLog) => void;
    entries?: GateEntry[];
}

const DRAFT_KEY = 'englabs_gate_entry_draft';

// 🏢 CORPORATE VENDOR INTELLIGENCE DATABASE
const VENDOR_PROFILES: Record<string, any> = {
    'Mr. Parmod Behl': {
        vehicleNumber: 'LOCAL',
        fromLocation: 'CHANDIGARH',
        toLocation: 'ENGLABS FACILITY',
        driverName: 'Mr. Parmod Behl',
        remarks: 'INWARD MATERIAL RECEIVED IN GOOD CONDITION',
        items: [
            { id: 1, name: '25mm CPVC Pipe (FlowGuard)', hsnCode: '3917', quantity: 10, unit: 'Nos', rate: 180, amount: 1800 },
            { id: 2, name: '25mm CPVC Elbow', hsnCode: '3917', quantity: 20, unit: 'Nos', rate: 45, amount: 900 }
        ]
    },
    'Ridhan': {
        vehicleNumber: 'PB-65-AX-9921',
        fromLocation: 'ZIRAKPUR',
        toLocation: 'ENGLABS FACILITY',
        driverName: 'Satish Kumar',
        remarks: 'PURCHASE INVOICE ATTACHED / RIDHAN LOGISTICS',
        items: [
            { id: 1, name: 'Industrial Hardware Kit', hsnCode: '7318', quantity: 5, unit: 'Nos', rate: 450, amount: 2250 }
        ]
    },
    'SKY-5 Hotel': {
        vehicleNumber: 'HAND-CARRY',
        fromLocation: 'ENGLABS OFFICE',
        toLocation: 'SKY-5 KITCHEN',
        driverName: 'VARUN',
        remarks: 'DELIVERY TO SKY-5 KITCHEN',
        items: [
            { id: 1, name: 'Catering / Food Supply', hsnCode: '9963', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }
        ]
    }
};

const GateEntryForm: React.FC<Props> = ({ onSave, onClose, currentCount, gpCount, initialData, onLog, entries = [] }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [type, setType] = useState<'INWARD' | 'OUTWARD'>(initialData?.type || 'INWARD');
    const [showVendorDropdown, setShowVendorDropdown] = useState(false);
    const [formData, setFormData] = useState(() => {
        const defaults = {
            items: [{ id: 1, name: '', hsnCode: '', quantity: 0, unit: 'Nos', rate: 0, amount: 0 }],
            partyName: '',
            vehicleNumber: '',
            fromLocation: '',
            toLocation: '',
            driverName: '',
            employeeName: '',
            supervisorName: 'Gaurav Panchal',
            invoiceNumber: '',
            amount: 0,
            remarks: '',
            deliveryType: 'Standard',
            photoUrl: '',
            invoicePhotoUrl: '',
            paymentStatus: 'UNPAID',
            paymentMode: 'UPI',
            transactionId: '',
            billType: 'GST'
        };

        if (initialData) {
            return {
                ...defaults,
                ...initialData,
                items: (initialData as any).items?.map((item: any) => ({
                    ...item,
                    hsnCode: item.hsnCode || ''
                })) || defaults.items
            };
        }

        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    return {
                        ...defaults,
                        ...parsed,
                        items: (parsed.items || []).map((item: any) => ({
                            id: item.id || Math.random(),
                            name: item.name || '',
                            hsnCode: item.hsnCode || '',
                            quantity: item.quantity || 0,
                            unit: item.unit || 'Nos',
                            rate: item.rate || 0,
                            amount: item.amount || 0
                        }))
                    };
                }
            } catch (e) {
                console.error("Failed to parse gate entry draft", e);
            }
        }
        return defaults;
    });

    // Helper to normalize names for mapping (bahl/behl, ridhan/ridhaan, and sky-5 spelling variation reconciliation)
    const getNormalizedVendorKey = (name: string) => {
        let key = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (key.includes('parmodbahl') || key.includes('parmodbehl')) {
            return 'parmodbehl';
        }
        if (key.includes('ridhan') || key.includes('ridhaan')) {
            return 'ridhan';
        }
        if (key.includes('sky5') || key.includes('sky-5')) {
            return 'sky5';
        }
        return key;
    };

    const hasProfile = (vendorName: string) => {
        const normalized = getNormalizedVendorKey(vendorName);
        return Object.keys(VENDOR_PROFILES).some(profileName => getNormalizedVendorKey(profileName) === normalized);
    };

    // Extract unique vendor list from entries and static Profiles
    const allVendors = React.useMemo(() => {
        const historicalVendors = entries.map(e => e.partyName).filter(Boolean);
        const staticVendors = Object.keys(VENDOR_PROFILES);
        return Array.from(new Set([...staticVendors, ...historicalVendors])).sort();
    }, [entries]);

    const filteredVendors = React.useMemo(() => {
        const search = (formData.partyName || '').trim().toLowerCase();
        if (!search) return allVendors;
        return allVendors.filter(v => v.toLowerCase().includes(search));
    }, [allVendors, formData.partyName]);


    const duplicateInvoiceEntry = React.useMemo(() => {
        const invNum = (formData.invoiceNumber || '').trim().toLowerCase();
        const vendor = (formData.partyName || '').trim().toLowerCase();
        if (!invNum || !vendor) return null;
        const normalizedInputVendor = getNormalizedVendorKey(vendor);
        return entries.find(e => 
            e.id !== initialData?.id &&
            getNormalizedVendorKey(e.partyName) === normalizedInputVendor &&
            e.invoiceNumber && e.invoiceNumber.trim().toLowerCase() === invNum
        );
    }, [entries, formData.invoiceNumber, formData.partyName, initialData]);

    // 💾 SAVE DRAFT ON EVERY CHANGE
    useEffect(() => {
        if (!initialData) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        }
    }, [formData, initialData]);

    const addItem = () => {
        setFormData((prev: any) => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), name: '', hsnCode: '', quantity: 0, unit: 'Nos', rate: 0, amount: 0 }]
        }));
    };

    const removeItem = (id: number) => {
        if (formData.items.length === 1) return;
        setFormData((prev: any) => ({
            ...prev,
            items: prev.items.filter((item: any) => item.id !== id)
        }));
    };

    const clearDraft = () => {
        if (window.confirm("FORENSIC WIPE INITIATED: Are you sure you want to clear this entire entry? This cannot be undone.")) {
            localStorage.removeItem(DRAFT_KEY);
            const resetState = {
                items: [{ id: 1, name: '', hsnCode: '', quantity: 0, unit: 'Nos', rate: 0, amount: 0 }],
                partyName: '',
                vehicleNumber: '',
                fromLocation: '',
                toLocation: '',
                driverName: '',
                employeeName: '',
                supervisorName: '',
                invoiceNumber: '',
                amount: 0,
                remarks: '',
                deliveryType: 'Standard',
                photoUrl: '',
                invoicePhotoUrl: '',
                paymentStatus: 'UNPAID',
                paymentMode: 'UPI',
                transactionId: '',
                billType: 'GST'
            };
            setFormData(resetState);
            
            if (onLog) {
                onLog({
                    id: `LOG-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    user: formData.employeeName || 'System',
                    action: 'DELETE',
                    targetId: 'DRAFT',
                    details: 'Manual draft purge executed via Forensic Trash protocol.'
                });
            }
        }
    };

    const updateItem = (id: number, field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            items: prev.items.map((item: any) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    // 🔄 BIDIRECTIONAL CALCULATION ENGINE
                    if (field === 'quantity' || field === 'rate') {
                        updated.amount = (updated.quantity || 0) * (updated.rate || 0);
                    } else if (field === 'amount') {
                        // Back-calculate rate if amount is entered manually
                        if (updated.quantity > 0) {
                            updated.rate = parseFloat((updated.amount / updated.quantity).toFixed(2));
                        }
                    }
                    return updated;
                }
                return item;
            })
        }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'invoicePhotoUrl') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const dataUrl = reader.result as string;
                setFormData((prev: any) => ({ ...prev, [field]: dataUrl }));

                // 🤖 TRIGGER AUTO-FILL IF INVOICE IS UPLOADED
                if (field === 'invoicePhotoUrl') {
                    setIsScanning(true);
                    try {
                        const extracted = await extractInvoiceData(dataUrl);
                        setFormData((prev: any) => ({
                            ...prev,
                            ...extracted,
                            // Ensure items have internal IDs for React keys
                            items: extracted.items.map((item, idx) => ({ ...item, id: Date.now() + idx }))
                        }));
                        alert(`INTEL ATTACHED: Forensic details for ${extracted.partyName} extracted and verified.`);
                    } catch (err) {
                        console.error("AI Extraction Error:", err);
                        alert("AI CORE ERROR: Failed to extract forensic data. Falling back to manual verification.");
                    } finally {
                        setIsScanning(false);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const shareDraftOnWhatsApp = () => {
        let itemsDetail = '';
        if (formData.items && formData.items.length > 0) {
            itemsDetail = '\n*ITEMIZED BREAKDOWN:*\n';
            formData.items.forEach((item: any, idx: number) => {
                const hsn = item.hsnCode ? ` [HSN: ${item.hsnCode}]` : '';
                const codeVal = item.itemCode || nameToCodeMap.get((item.name || '').trim().toLowerCase()) || (item.name || '').toUpperCase().replace(/\s+/g, '_');
                const code = codeVal ? ` [${codeVal}]` : '';
                itemsDetail += `${idx + 1}. ${item.name || 'Unknown'}${code}${hsn} | ${item.quantity} ${item.unit} @ ₹${item.rate || 0} = ₹${(item.amount || 0).toLocaleString()}\n`;
            });
            itemsDetail += `--------------------------------\n`;
        }

        const totalTaxable = formData.items.reduce((sum: number, item: any) => sum + item.amount, 0);
        const hasGST = formData.billType === 'GST';
        const isInter = isInterState(formData.fromLocation, formData.toLocation);
        const igst = hasGST && isInter ? totalTaxable * 0.18 : 0;
        const cgst = hasGST && !isInter ? totalTaxable * 0.09 : 0;
        const sgst = hasGST && !isInter ? totalTaxable * 0.09 : 0;
        const exactTotal = totalTaxable + igst + cgst + sgst;
        const grandTotal = Math.round(exactTotal);

        const text = encodeURIComponent(
            `*ENGLABS GATE ENTRY DRAFT*\n` +
            `--------------------------------\n` +
            `*Type:* ${type}\n` +
            `*Invoice Type:* ${hasGST ? 'GST Bill' : 'Without GST'}\n` +
            `*Date & Time:* ${new Date().toLocaleString()}\n` +
            `*Vendor:* ${formData.partyName || 'Not Specified'}\n` +
            `*Vehicle:* ${formData.vehicleNumber || 'Not Specified'}\n` +
            `*Invoice:* ${formData.invoiceNumber || 'Not Specified'}\n` +
            itemsDetail +
            `*TAXABLE TOTAL: ₹${totalTaxable.toLocaleString()}*\n` +
            (hasGST ? (isInter 
                ? `*IGST (18%): ₹${igst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}*\n`
                : `*CGST (9%): ₹${cgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}*\n` +
                  `*SGST (9%): ₹${sgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}*\n`) : '') +
            `*GRAND TOTAL: ₹${grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}*\n` +
            `*PAYMENT STATUS:* ${formData.paymentStatus}\n` +
            `*DELIVERY STATUS:* ${type === 'INWARD' ? 'Received' : 'Dispatched'}\n` +
            `--------------------------------\n` +
            `*TRANSIT & PERSONNEL AUTHENTICATION*\n` +
            `Route: ${formData.fromLocation || 'N/A'} -> ${formData.toLocation || 'N/A'}\n` +
            `Received By: ${formData.employeeName || 'N/A'}\n` +
            `Carrier/Driver: ${formData.driverName || 'N/A'}\n` +
            `Checked By: ${formData.supervisorName || 'N/A'}\n` +
            `Prepared By: Gate Registry System\n` +
            `--------------------------------\n` +
            `_Verified by Gate Registry System_`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // 📊 GENERATE SUMMARY FOR BULK ENTRIES
        const activeItems = formData.items.filter((i: any) => i.name.trim() !== '');
        const totalQty = formData.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
        const totalAmount = formData.items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
        
        let summaryName = 'Unknown Material';
        if (activeItems.length > 1) {
            summaryName = `Bulk: ${activeItems.map((i: any) => i.name).join(', ').substring(0, 60)}...`;
        } else if (activeItems.length === 1) {
            summaryName = activeItems[0].name;
        } else if (formData.items[0]?.name) {
            summaryName = formData.items[0].name;
        }

        const isInter = isInterState(formData.fromLocation, formData.toLocation);
        const igst = formData.billType === 'GST' && isInter ? totalAmount * 0.18 : 0;
        const cgst = formData.billType === 'GST' && !isInter ? totalAmount * 0.09 : 0;
        const sgst = formData.billType === 'GST' && !isInter ? totalAmount * 0.09 : 0;
        const totalGross = Math.round(totalAmount + igst + cgst + sgst);
        const paid = formData.paidAmount || 0;
        const remaining = totalGross - paid;
        const status = paid >= totalGross ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');

        const entry: GateEntry = {
            id: initialData?.id || generateId(type, currentCount),
            timestamp: initialData?.timestamp || new Date().toISOString(),
            type,
            ...formData,
            remainingAmount: remaining,
            paymentStatus: status,
            materialName: summaryName,
            quantity: totalQty,
            amount: totalAmount,
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

        // ✅ CLEAR DRAFT ON SUCCESSFUL SUBMISSION
        localStorage.removeItem(DRAFT_KEY);
        onSave(entry);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-50 flex justify-center items-start overflow-y-auto p-4 md:p-10">
            <div className="bg-white w-full max-w-5xl rounded-[3rem] md:rounded-[4rem] shadow-2xl relative my-auto animate-in zoom-in duration-300">
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
                        <button 
                            type="button"
                            onClick={shareDraftOnWhatsApp}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                        >
                            <MessageSquare className="w-4 h-4" /> Share Detailed List
                        </button>
                        <button 
                            type="button"
                            onClick={clearDraft}
                            className="p-4 bg-white border border-slate-200 text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 rounded-full transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-rose-500/20 hover:scale-110 group"
                            title="FORENSIC WIPE: Clear All Entries"
                        >
                            <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        </button>
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

                <form onSubmit={handleSubmit} className="p-12 space-y-10">
                    {/* VENDOR & LOGISTICS CONTEXT (SINGLE VENDOR FOCUS) */}
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-visible">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Truck className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 grid grid-cols-3 gap-8">
                            <div className="col-span-1 space-y-4 relative">
                                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] block">Principal Vendor</label>
                                <div className="relative">
                                    <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                                    <input 
                                        required
                                        value={formData.partyName}
                                        onFocus={() => setShowVendorDropdown(true)}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData({...formData, partyName: val});
                                            setShowVendorDropdown(true);
                                        }}
                                        className="w-full bg-transparent border-b-2 border-slate-700 py-3 pl-8 pr-8 font-black text-2xl text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="Vendor Name"
                                        autoComplete="off"
                                    />
                                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 cursor-pointer" onClick={() => setShowVendorDropdown(prev => !prev)} />
                                </div>
                                {showVendorDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowVendorDropdown(false)} />
                                        <div className="absolute left-0 right-0 top-[calc(100%-8px)] mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                                            {filteredVendors.length > 0 ? (
                                                filteredVendors.map(vendor => (
                                                    <button
                                                        type="button"
                                                        key={vendor}
                                                        onClick={() => {
                                                            setFormData((prev: any) => ({
                                                                ...prev,
                                                                partyName: vendor
                                                            }));
                                                            setShowVendorDropdown(false);
                                                        }}
                                                        className="w-full text-left px-6 py-4 hover:bg-slate-700 hover:text-emerald-400 font-bold text-sm border-b border-slate-750/50 last:border-b-0 transition-colors flex items-center justify-between text-white"
                                                    >
                                                        <span>{vendor}</span>
                                                        {hasProfile(vendor) ? (
                                                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Profile</span>
                                                        ) : (
                                                            <span className="text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">History</span>
                                                        )}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-6 py-4 text-xs font-bold text-slate-500 italic">No vendors found. Keep typing to add.</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="space-y-4 relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">Invoice / Slip #</label>
                                <div className="relative">
                                    <Hash className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                    <input 
                                        value={formData.invoiceNumber}
                                        onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
                                        className={`w-full bg-transparent border-b-2 py-3 pl-8 font-black text-2xl text-white placeholder:text-slate-600 outline-none transition-all ${duplicateInvoiceEntry ? 'border-amber-500 focus:border-amber-500' : 'border-slate-700 focus:border-emerald-500'}`}
                                        placeholder="REF-0000"
                                        autoComplete="off"
                                    />
                                </div>
                                {duplicateInvoiceEntry && (
                                    <div className="absolute left-0 right-0 top-[calc(100%-8px)] mt-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2 text-amber-400 animate-in fade-in slide-in-from-top-1 duration-200 z-50">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Duplicate Entry Detected</span>
                                            <span className="text-[9px] font-medium leading-normal text-slate-300">
                                                Invoice {formData.invoiceNumber} was already registered for this vendor in entry <span className="font-bold text-white">{duplicateInvoiceEntry.id}</span> ({new Date(duplicateInvoiceEntry.timestamp).toLocaleDateString()}).
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">Bill Type</label>
                                <div className="flex bg-slate-800 p-1 rounded-xl">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, billType: 'GST'})}
                                        className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.billType === 'GST' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        GST Bill
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, billType: 'WITHOUT_GST'})}
                                        className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.billType === 'WITHOUT_GST' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Without GST
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">Vehicle Detail</label>
                                <div className="relative">
                                    <Truck className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                    <input 
                                        required
                                        value={formData.vehicleNumber}
                                        onChange={e => setFormData({...formData, vehicleNumber: e.target.value})}
                                        className="w-full bg-transparent border-b-2 border-slate-700 py-3 pl-8 font-black text-2xl text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none transition-all uppercase"
                                        placeholder="MH-01-..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-12">
                        {/* BULK PURCHASE ITEMS LIST */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Package className="w-4 h-4" /> Bulk Purchase Item List (Serial Entry)
                                </h3>
                                <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-4 py-2 rounded-full uppercase tracking-widest">
                                    Total Items: {formData.items.length}
                                </div>
                            </div>
                                                   <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead className="bg-slate-50/50">
                                            <tr className="border-b border-slate-100">
                                                <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">Sr. No.</th>
                                                <th className="py-6 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Items / Particulars</th>
                                                <th className="py-6 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-28">HSN Code</th>
                                                <th className="py-6 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-28 text-center">Qty.</th>
                                                <th className="py-6 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-32">Unit</th>
                                                <th className="py-6 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-32">Rate (₹)</th>
                                                <th className="py-6 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-40">Amount (₹)</th>
                                                <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-widest w-20 text-center">Delete</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.items.map((item: any, index: number) => (
                                                <tr key={item.id} className="border-b border-slate-50 group hover:bg-slate-50/30 transition-all">
                                                    <td className="py-6 px-8">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-sm mx-auto">
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <input 
                                                            required
                                                            value={item.name}
                                                            onChange={e => updateItem(item.id, 'name', e.target.value)}
                                                            className="w-full bg-transparent font-black text-slate-900 text-lg outline-none placeholder:text-slate-200"
                                                            placeholder="Enter Item Description..."
                                                        />
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <input 
                                                            value={item.hsnCode}
                                                            onChange={e => updateItem(item.id, 'hsnCode', e.target.value)}
                                                            className="w-full bg-transparent font-bold text-slate-400 text-sm outline-none placeholder:text-slate-200"
                                                            placeholder="HSN"
                                                        />
                                                    </td>
                                                    <td className="py-6 px-4 text-center">
                                                        <input 
                                                            required
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                                            className="w-20 bg-slate-50 border border-slate-100 rounded-xl py-3 px-3 font-black text-slate-900 outline-none focus:border-emerald-500 text-center"
                                                        />
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <div className="relative">
                                                            <select 
                                                                value={item.unit}
                                                                onChange={e => updateItem(item.id, 'unit', e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-2 font-black text-slate-900 outline-none appearance-none cursor-pointer pr-6 text-[11px]"
                                                            >
                                                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                            </select>
                                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">₹</span>
                                                            <input 
                                                                type="number"
                                                                value={item.rate}
                                                                onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-6 pr-3 font-black text-slate-900 outline-none focus:border-emerald-500 text-sm"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-500 text-sm">₹</span>
                                                            <input 
                                                                type="number"
                                                                value={item.amount}
                                                                onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                                                className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl py-3 pl-8 pr-4 font-black text-emerald-600 outline-none focus:border-emerald-500 text-lg"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-8 text-center">
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeItem(item.id)}
                                                            className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-8 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <button 
                                        type="button"
                                        onClick={addItem}
                                        className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:border-emerald-500 hover:shadow-lg transition-all"
                                    >
                                        <PlusCircle className="w-5 h-5" /> Add Next Bulk Item
                                    </button>
                                    <div className="flex gap-8">
                                        {(() => {
                                            const totalTaxable = formData.items.reduce((sum: number, item: any) => sum + item.amount, 0);
                                            const isInter = isInterState(formData.fromLocation, formData.toLocation);
                                            const igst = formData.billType === 'GST' && isInter ? totalTaxable * 0.18 : 0;
                                            const cgst = formData.billType === 'GST' && !isInter ? totalTaxable * 0.09 : 0;
                                            const sgst = formData.billType === 'GST' && !isInter ? totalTaxable * 0.09 : 0;
                                            const grandTotal = Math.round(totalTaxable + igst + cgst + sgst);
                                            return (
                                                <>
                                                    <div className="flex flex-col items-end gap-1 border-r border-slate-200 pr-8">
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                                            Taxable Subtotal
                                                        </div>
                                                        <div className="text-2xl font-black text-slate-400 tracking-tighter flex items-center gap-2">
                                                            <span className="text-sm">₹</span>
                                                            {totalTaxable.toLocaleString('en-IN')}
                                                        </div>
                                                        {formData.billType === 'GST' ? (
                                                            isInter ? (
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                                    + IGST @18%: ₹{igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                                        + CGST @9%: ₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                    </div>
                                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                                        + SGST @9%: ₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                    </div>
                                                                </>
                                                            )
                                                        ) : (
                                                            <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1">
                                                                (WITHOUT GST)
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
                                                            {type === 'INWARD' ? 'Grand Invoice Total' : 'Grand Delivery Total'}
                                                        </div>
                                                        <div className="text-4xl font-black text-emerald-600 tracking-tighter flex items-center gap-2">
                                                            <span className="text-xl text-emerald-400">₹</span>
                                                            {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECONDARY DETAILS: LOGISTICS & EVIDENCE */}
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <MapPin className="w-4 h-4" /> Transit Intelligence
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Source (From)</label>
                                        <input 
                                            value={formData.fromLocation}
                                            onChange={e => setFormData({...formData, fromLocation: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 font-bold text-slate-900 outline-none focus:border-emerald-500"
                                            placeholder="Origin"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Destination (To)</label>
                                        <input 
                                            value={formData.toLocation}
                                            onChange={e => setFormData({...formData, toLocation: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 font-bold text-slate-900 outline-none focus:border-emerald-500"
                                            placeholder="Destination"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Camera className="w-4 h-4" /> Forensic Evidence
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="relative group">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block text-center">Slip / Invoice</label>
                                        <div className="flex flex-col gap-4">
                                            {formData.invoicePhotoUrl ? (
                                                <div className="relative w-full h-32 rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50">
                                                    <img src={formData.invoicePhotoUrl} className="w-full h-full object-contain" />
                                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all duration-300 backdrop-blur-sm">
                                                        <label className="p-3 bg-white text-slate-900 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-xl">
                                                            <Camera className="w-5 h-5"/>
                                                            <input type="file" className="hidden" onChange={e => handlePhotoChange(e, 'invoicePhotoUrl')}/>
                                                        </label>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setFormData({...formData, invoicePhotoUrl: ''})} 
                                                            className="p-3 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                                                        >
                                                            <Trash2 className="w-5 h-5"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative w-full h-32 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-500 transition-all duration-300 flex flex-col items-center justify-center group/box">
                                                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-2 group-hover/box:scale-110 transition-transform duration-500">
                                                        <FileText className="w-8 h-8 text-slate-300 group-hover/box:text-emerald-500" />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attach Invoice</span>
                                                    <input 
                                                        type="file" 
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                                                        onChange={e => handlePhotoChange(e, 'invoicePhotoUrl')}
                                                    />
                                                </div>
                                            )}
                                            <div className="relative">
                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                <input 
                                                    required
                                                    value={formData.invoiceNumber}
                                                    onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
                                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl py-5 pl-12 pr-6 font-black text-slate-900 text-lg outline-none focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/10 shadow-xl transition-all placeholder:text-slate-200"
                                                    placeholder="INV-000000"
                                                />
                                            </div>
                                            <p className="text-[8px] text-slate-400 text-center font-black uppercase tracking-[0.2em] leading-tight px-4">
                                                Verification Path: G:\\Englabs Inventory 2026-27\\MAY-2026
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block text-center">Material Photo</label>
                                        {formData.photoUrl ? (
                                            <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-slate-100">
                                                <img src={formData.photoUrl} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                                    <label className="p-2 bg-white rounded-full cursor-pointer"><Camera className="w-4 h-4"/><input type="file" className="hidden" onChange={e => handlePhotoChange(e, 'photoUrl')}/></label>
                                                    <button onClick={() => setFormData({...formData, photoUrl: ''})} className="p-2 bg-white rounded-full text-red-500"><X className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-emerald-500 cursor-pointer transition-all">
                                                <Camera className="w-6 h-6 text-slate-300" />
                                                <input type="file" className="hidden" onChange={e => handlePhotoChange(e, 'photoUrl')}/>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* FORENSIC PAYMENT SECTION */}
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-10 mt-12">
                            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-3 mb-8">
                                <CreditCard className="w-4 h-4" /> Forensic Financial Verification
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Payment Status</label>
                                    <div className="flex gap-2">
                                        {['PAID', 'UNPAID', 'PARTIAL'].map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setFormData({...formData, paymentStatus: status})}
                                                className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black transition-all ${
                                                    formData.paymentStatus === status 
                                                    ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' 
                                                    : 'bg-white border border-slate-200 text-slate-400 hover:border-emerald-500'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
                                        {type === 'INWARD' ? 'Paid Amount (₹)' : 'Received Amount (₹)'}
                                    </label>
                                    <input 
                                        type="number"
                                        value={formData.paidAmount || 0}
                                        onChange={e => {
                                            const paid = parseFloat(e.target.value) || 0;
                                            const totalTaxable = formData.items.reduce((sum: number, item: any) => sum + item.amount, 0);
                                            const isInter = isInterState(formData.fromLocation, formData.toLocation);
                                            const igst = formData.billType === 'GST' && isInter ? totalTaxable * 0.18 : 0;
                                            const cgst = formData.billType === 'GST' && !isInter ? totalTaxable * 0.09 : 0;
                                            const sgst = formData.billType === 'GST' && !isInter ? totalTaxable * 0.09 : 0;
                                            const totalGross = Math.round(totalTaxable + igst + cgst + sgst);
                                            setFormData({
                                                ...formData, 
                                                paidAmount: paid,
                                                remainingAmount: totalGross - paid,
                                                paymentStatus: paid >= totalGross ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID')
                                            });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-6 font-black text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Payment Date</label>
                                    <input 
                                        type="date"
                                        value={formData.paymentDate || new Date().toISOString().split('T')[0]}
                                        onChange={e => setFormData({...formData, paymentDate: e.target.value})}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-6 font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Payment Channel</label>
                                    <select 
                                        value={formData.paymentMode}
                                        onChange={e => setFormData({...formData, paymentMode: e.target.value})}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 font-black text-slate-900 outline-none focus:border-emerald-500 shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="UPI">UPI (GPay/PhonePe)</option>
                                        <option value="CASH">CASH</option>
                                        <option value="NEFT">NEFT / BANK TRANSFER</option>
                                        <option value="CHEQUE">CHEQUE</option>
                                        <option value="OTHER">OTHER</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 mt-6">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Transaction ID / Ref</label>
                                    <input 
                                        value={formData.transactionId}
                                        onChange={e => setFormData({...formData, transactionId: e.target.value})}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-6 font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                                        placeholder="UTR Number / Receipt ID"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Payment Remarks</label>
                                    <input 
                                        value={formData.paymentRemarks}
                                        onChange={e => setFormData({...formData, paymentRemarks: e.target.value})}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-6 font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                                        placeholder="Note regarding this transaction"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACCOUNTABILITY SECTION */}
                    <div className="bg-slate-50 rounded-[2.5rem] p-10 grid grid-cols-4 gap-8">
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Received By (Staff)</label>
                            <input 
                                required
                                value={formData.employeeName}
                                onChange={e => setFormData({...formData, employeeName: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 font-black text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                                placeholder="Name"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Gate Supervisor</label>
                            <input 
                                required
                                value={formData.supervisorName}
                                onChange={e => setFormData({...formData, supervisorName: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 font-black text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Carrier Person</label>
                            <input 
                                value={formData.driverName}
                                onChange={e => setFormData({...formData, driverName: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 font-black text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                                placeholder="Driver Name"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Final Remarks</label>
                            <input 
                                value={formData.remarks}
                                onChange={e => setFormData({...formData, remarks: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 font-black text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                                placeholder="Condition OK"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-10 bg-slate-900 text-white rounded-[3rem] text-2xl font-black uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-slate-900 transition-all shadow-2xl flex items-center justify-center gap-6 group"
                    >
                        <Shield className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        Execute Inward Registry
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GateEntryForm;

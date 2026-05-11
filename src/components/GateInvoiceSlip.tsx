import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    ShieldCheck, 
    Printer, 
    X, 
    QrCode,
    FileText,
    TrendingUp,
    MapPin
} from 'lucide-react';
import { GateEntry } from '../lib/gate_system';
import { COMPANY_DETAILS } from '../lib/billing_system';
import signature from '../assets/englabs_signature.png';
import logo from '../assets/englabs_logo.png';

interface Props {
    entry: GateEntry;
    onClose: () => void;
}

const GateInvoiceSlip: React.FC<Props> = ({ entry, onClose }) => {
    
    // URGENT: Fix for PDF Generation Shifting & Leakage
    // We use a Portal to move the invoice outside the Dashboard DOM tree
    // This allows absolute isolation during printing.
    
    useEffect(() => {
        document.body.classList.add('invoice-view-active');
        return () => {
            document.body.classList.remove('invoice-view-active');
        };
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const invoiceContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 print:bg-white print:p-0 print:block print:static">
            <div className="bg-white w-full max-w-[900px] h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 print:h-auto print:w-full print:max-w-none print:shadow-none print:rounded-none print:block print:static">
                
                {/* ACTIONS HEADER (HIDDEN ON PRINT) */}
                <div className="bg-[#0F172A] p-6 text-white flex justify-between items-center print:hidden shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Official Billing Portal v5.0</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="p-3 bg-emerald-500 text-slate-900 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400">
                            <Printer className="w-4 h-4" /> GENERATE & PRINT OFFICIAL PDF
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* THE DOCUMENT CONTENT */}
                <div id="official-invoice-document" className="flex-1 overflow-y-auto p-12 md:p-20 custom-scrollbar bg-white relative print:overflow-visible print:p-[15mm]">
                    
                    {/* EXECUTIVE HEADER */}
                    <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-12">
                        <div className="flex flex-col gap-6">
                            <img src={logo} alt="Englabs" className="h-16 object-contain self-start" />
                            <div>
                                <h1 className="text-3xl font-black tracking-tighter text-slate-900">{COMPANY_DETAILS.name}</h1>
                                <p className="text-[10px] font-bold text-slate-500 mt-2 max-w-sm leading-relaxed uppercase tracking-wider">
                                    {COMPANY_DETAILS.address}
                                </p>
                                <div className="flex gap-6 mt-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact</span>
                                        <span className="text-[11px] font-black text-slate-900">{COMPANY_DETAILS.mobile}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">GSTIN</span>
                                        <span className="text-[11px] font-black text-slate-900">{COMPANY_DETAILS.gstin}</span>
                                    </div>
                                    <a href={COMPANY_DETAILS.mapLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline print:hidden">
                                        <MapPin className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Map Location</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="text-right flex flex-col justify-between h-full">
                            <h2 className="text-7xl font-black text-slate-100 uppercase tracking-tighter leading-none select-none mb-6">INVOICE</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Invoice ID</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">INV-{entry.id.split('-').pop()}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</p>
                                        <p className="text-[11px] font-black text-slate-900">{new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Movement</p>
                                        <p className="text-[11px] font-black text-slate-900">{entry.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CLIENT & TOTAL SUMMARY */}
                    <div className="grid grid-cols-12 gap-8 mb-12">
                        <div className="col-span-7 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Recipient Details</h3>
                            <p className="text-2xl font-black text-slate-900 mb-2">{entry.partyName}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed mb-6">{entry.fromLocation}</p>
                            <div className="flex gap-8 border-t border-slate-200 pt-6">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle</p>
                                    <p className="text-xs font-black text-slate-900">{entry.vehicleNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-xs font-black text-emerald-600 uppercase flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-5 bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden shadow-2xl">
                            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Grand Total Amount</p>
                            <p className="text-5xl font-black tracking-tighter">₹{(entry.amount || 0).toLocaleString('en-IN')}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">Inclusive of all logistics taxes</p>
                        </div>
                    </div>

                    {/* ITEMIZATION TABLE */}
                    <div className="mb-12">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">Sr.</th>
                                    <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</th>
                                    <th className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">HSN</th>
                                    <th className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                    <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate</th>
                                    <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {entry.items && entry.items.length > 0 ? (
                                    entry.items.map((item, idx) => (
                                        <tr key={idx} className="print:break-inside-avoid">
                                            <td className="py-5 text-sm font-bold text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
                                            <td className="py-5 text-sm font-black text-slate-900">{item.name}</td>
                                            <td className="py-5 text-center text-xs font-bold text-slate-400">{(item as any).hsnCode || '—'}</td>
                                            <td className="py-5 text-center text-sm font-bold text-slate-700">{item.quantity} {item.unit}</td>
                                            <td className="py-5 text-right text-sm font-bold text-slate-700">₹{(item as any).rate?.toLocaleString('en-IN') || '0'}</td>
                                            <td className="py-5 text-right text-sm font-black text-slate-900">₹{item.amount.toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="py-6 text-sm font-bold text-slate-400">01</td>
                                        <td className="py-6 text-sm font-black text-slate-900">{entry.materialName}</td>
                                        <td className="py-6 text-center text-xs font-bold text-slate-400">—</td>
                                        <td className="py-6 text-center text-sm font-bold text-slate-700">{entry.quantity} {entry.unit}</td>
                                        <td className="py-6 text-right text-sm font-bold text-slate-700">₹{entry.amount > 0 ? (entry.amount / entry.quantity).toLocaleString('en-IN') : '0'}</td>
                                        <td className="py-6 text-right text-sm font-black text-slate-900">₹{entry.amount.toLocaleString('en-IN')}</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-900 bg-slate-50 font-black">
                                    <td colSpan={5} className="py-4 text-right text-[10px] uppercase tracking-widest">Total Valuation</td>
                                    <td className="py-4 text-right text-sm text-slate-900">₹{(entry.amount || 0).toLocaleString('en-IN')}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* FOOTER & AUTHENTICATION */}
                    <div className="grid grid-cols-2 gap-12 mt-16 print:break-inside-avoid">
                        <div>
                            <div className="flex items-center gap-6 mb-8">
                                <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <QrCode className="w-20 h-20 text-slate-900" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Authenticity Guard</p>
                                    <p className="text-[8px] font-bold text-slate-400 leading-relaxed max-w-[150px]">
                                        Scan to verify this invoice on the Englabs Forensic Registry.
                                    </p>
                                </div>
                            </div>
                            <div className="text-[8px] font-bold text-slate-400 space-y-1 uppercase tracking-widest">
                                <p>• Computer generated document, no signature required.</p>
                                <p>• Goods received in good condition.</p>
                                <p>• Subject to Panchkula Jurisdiction.</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-end text-center">
                            <div className="relative mb-4">
                                <img src={signature} alt="Sign" className="h-24 object-contain opacity-90 mix-blend-multiply" />
                                <div className="absolute inset-0 border-b-2 border-slate-900 translate-y-4"></div>
                            </div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Authorized Signatory</p>
                            <p className="text-xs font-black text-slate-900 mt-1 uppercase">Gaurav Panchal</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Englabs India Private Limited</p>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        @page {
                            size: A4;
                            margin: 10mm;
                        }
                        
                        /* CRITICAL: Total Isolation Strategy */
                        /* Hide the entire React root */
                        #root {
                            display: none !important;
                        }
                        
                        /* Only show the Portal where the invoice lives */
                        body {
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 210mm !important;
                        }

                        #official-invoice-document {
                            display: block !important;
                            width: 190mm !important;
                            margin: 0 auto !important;
                            padding: 5mm 0 !important; /* Reduced top/bottom padding */
                            position: static !important;
                            overflow: visible !important;
                            height: auto !important;
                            min-height: 0 !important; /* Remove min-height to prevent gap */
                        }

                        .custom-scrollbar {
                            overflow: visible !important;
                            height: auto !important;
                        }

                        /* Tighten spacing for print */
                        .mb-12 { margin-bottom: 3mm !important; }
                        .mb-8 { margin-bottom: 2mm !important; }
                        .p-10, .p-12, .p-20 { padding: 5mm !important; }

                        /* Fix Grid and Flex height issues */
                        .grid-cols-12 { 
                            display: flex !important; 
                            gap: 5mm !important;
                            height: auto !important;
                            align-items: flex-start !important;
                        }
                        .col-span-7 { width: 60% !important; }
                        .col-span-5 { width: 40% !important; }
                        
                        .h-full, .h-[90vh] { height: auto !important; }
                        .justify-center, .justify-between { justify-content: flex-start !important; }

                        /* Maintain color and contrast */
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        /* Structure preservation */
                        .grid, tr, table {
                            break-inside: avoid !important;
                        }
                        
                        /* Allow table to follow summary without forced break */
                        table {
                            break-before: auto !important;
                            margin-top: 0 !important;
                        }
                        
                        h1, h2, h3 { margin-top: 0 !important; margin-bottom: 2mm !important; }
                        
                        /* Fix for the Total card which must remain dark */
                        .bg-slate-900 {
                            background-color: #0f172a !important;
                            color: white !important;
                        }
                        .bg-slate-50 {
                            background-color: #f8fafc !important;
                        }
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: #f1f1f1;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 10px;
                    }
                `}} />
            </div>
        </div>
    );

    return createPortal(invoiceContent, document.body);
};

export default GateInvoiceSlip;

import React from 'react';
import { 
    ShieldCheck, 
    Printer, 
    X, 
    Download,
    Share2,
    MapPin,
    Phone,
    Globe
} from 'lucide-react';
import { BillingDocument, COMPANY_DETAILS } from '@domain/billing_system';
import signature from '@/assets/englabs_signature.png';
import logo from '@/assets/englabs_logo.png';

interface Props {
    doc: BillingDocument;
    onClose: () => void;
}

const DocumentPreview: React.FC<Props> = ({ doc, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[800px] h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 print:h-auto print:w-full print:max-w-none print:shadow-none print:rounded-none">
                
                {/* ACTIONS HEADER */}
                <div className="bg-[#0e4368] p-6 text-white flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Englabs" className="h-8 brightness-0 invert" />
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Document Intelligence Preview</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="p-3 hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Printer className="w-4 h-4" /> PRINT
                        </button>
                        <button className="p-3 hover:bg-white/10 rounded-xl transition-all">
                            <Download className="w-4 h-4" />
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* THE DOCUMENT CONTENT */}
                <div id="printable-document" className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white relative print:overflow-visible">
                    
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-35deg] select-none">
                        <h1 className="text-[180px] font-black">ENGLABS</h1>
                    </div>

                    <div className="relative z-10">
                        {/* CORPORATE HEADER */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10">
                            <div className="max-w-[60%]">
                                <img src={logo} alt="Englabs" className="h-20 mb-8 object-contain" />
                                <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">{COMPANY_DETAILS.name}</h1>
                                <p className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase tracking-wide">
                                    {COMPANY_DETAILS.address}
                                </p>
                                <div className="flex gap-6 mt-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-900">
                                        <Phone className="w-3 h-3 text-emerald-500" /> {COMPANY_DETAILS.mobile}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-900">
                                        <Globe className="w-3 h-3 text-emerald-500" /> GSTIN: {COMPANY_DETAILS.gstin}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-6xl font-black text-slate-100 uppercase tracking-tighter leading-none mb-4">{doc.type}</h2>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document No.</p>
                                    <p className="text-xl font-black text-slate-900">{doc.id}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Date</p>
                                    <p className="text-sm font-black text-slate-900">{new Date(doc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* CLIENT DETAILS */}
                        <div className="grid grid-cols-2 gap-20 mb-12">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Bill To:</h3>
                                <p className="text-lg font-black text-slate-900 mb-2">{doc.clientName}</p>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase">
                                    {doc.clientAddress}
                                </p>
                                <p className="text-xs font-black text-slate-900 mt-2">{doc.clientContact}</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Due</span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${doc.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {doc.status}
                                    </span>
                                </div>
                                <p className="text-4xl font-black text-slate-900">₹{doc.totalAmount.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* LINE ITEMS TABLE */}
                        <table className="w-full mb-12">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                    <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate</th>
                                    <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {doc.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-6 text-sm font-black text-slate-900">{item.description}</td>
                                        <td className="py-6 text-center text-sm font-bold text-slate-600">{item.quantity}</td>
                                        <td className="py-6 text-right text-sm font-bold text-slate-600">₹{item.rate.toLocaleString('en-IN')}</td>
                                        <td className="py-6 text-right text-sm font-black text-slate-900">₹{item.amount.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* FINANCIAL SUMMARY */}
                        <div className="flex justify-end mb-12">
                            <div className="w-full max-w-[300px] space-y-4">
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>Subtotal</span>
                                    <span>₹{doc.subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>Tax ({doc.taxRate}%)</span>
                                    <span>₹{doc.taxAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between pt-4 border-t border-slate-100">
                                    <span className="text-sm font-black text-slate-900 uppercase">Grand Total</span>
                                    <span className="text-xl font-black text-emerald-600">₹{doc.totalAmount.toLocaleString('en-IN')}</span>
                                </div>
                                {doc.paidAmount > 0 && (
                                    <>
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>Paid Amount</span>
                                            <span className="text-slate-900">- ₹{doc.paidAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t-2 border-slate-900">
                                            <span className="text-xs font-black text-slate-900 uppercase">Balance Due</span>
                                            <span className="text-sm font-black text-orange-600">₹{doc.balance.toLocaleString('en-IN')}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="mt-20 grid grid-cols-2 gap-20">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Terms & Conditions</h4>
                                <ul className="text-[9px] font-bold text-slate-500 space-y-1 list-disc pl-4">
                                    <li>Payment should be made in favor of {COMPANY_DETAILS.name}.</li>
                                    <li>Goods once sold will not be taken back.</li>
                                    <li>Subject to Panchkula jurisdiction only.</li>
                                </ul>
                            </div>
                            <div className="text-center relative">
                                <div className="absolute left-1/2 -top-16 -translate-x-1/2 w-48 h-24 opacity-80 mix-blend-multiply pointer-events-none">
                                    <img src={signature} alt="Signature" className="w-full h-full object-contain" />
                                </div>
                                <div className="border-t-2 border-slate-900 pt-4 relative z-10">
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Authorized Signatory</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Verified via Englabs System Guard</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="bg-slate-50 p-8 border-t border-slate-100 flex gap-4 print:hidden">
                    <button 
                        onClick={handlePrint}
                        className="flex-1 bg-emerald-500 text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10"
                    >
                        <Printer className="w-4 h-4" /> PRINT OFFICIAL DOCUMENT
                    </button>
                    <button className="px-10 bg-[#0e4368] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all">
                        <Share2 className="w-4 h-4 text-emerald-400" /> SHARE
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-document, #printable-document * {
                        visibility: visible;
                    }
                    #printable-document {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .custom-scrollbar {
                        overflow: visible !important;
                    }
                }
            `}} />
        </div>
    );
};

export default DocumentPreview;

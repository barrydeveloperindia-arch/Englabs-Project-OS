import React from 'react';
import { 
    X, 
    Printer, 
    Download,
    CheckCircle2,
    MessageSquare,
    Share2
} from 'lucide-react';
import { FoodOrder } from '../lib/food_system';
import logo from '../assets/englabs_logo.png';

interface Props {
    order: FoodOrder;
    onClose: () => void;
}

const FoodReceiptSlip: React.FC<Props> = ({ order, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const handleWhatsAppShare = () => {
        const subtotal = (order?.rate || 0) * (order?.quantity || 1);
        const discountAmount = order?.discountType === 'Percentage' 
            ? (subtotal * (order?.discount || 0) / 100)
            : (order?.discount || 0);
            
        const rebateText = discountAmount > 0 
            ? `*REBATE:* -₹${discountAmount.toFixed(2)} ${order?.discountType === 'Percentage' ? `(${order?.discount}%)` : ''}\n`
            : '';

        const statusEmoji = order?.status === 'Approved' ? '✅' : order?.status === 'Rejected' ? '❌' : '⏳';

        const text = `*📄 ENGLABS SETTLEMENT SLIP*
=================================
*ID:* ${order?.entryId || 'N/A'}
*PROJECT ID:* ${order?.projectCode?.toUpperCase() || 'N/A'}
*MEAL:* ${order?.mealType?.toUpperCase() || 'N/A'}
*STAFF:* ${order?.employeeName?.toUpperCase() || 'N/A'}
*DEPT:* ${order?.department?.toUpperCase() || 'N/A'}
---------------------------------
*ITEMS:* ${order?.items?.toUpperCase() || 'N/A'}
*QTY:* ${order?.quantity || 1} ${order?.unit || 'Nos'} @ ₹${(order?.rate || 0).toFixed(2)}/unit
---------------------------------
*SUBTOTAL:* ₹${subtotal.toFixed(2)}
${rebateText}*NET TOTAL:* ₹${(order?.amount || 0).toFixed(2)}
---------------------------------
*PAYMENT:* ${order?.paymentMode?.toUpperCase() || 'N/A'} (${order?.paidBy?.toUpperCase() || 'N/A'})
*PURPOSE:* ${order?.purpose?.toUpperCase() || 'N/A'}
*STATUS:* ${statusEmoji} ${order?.status?.toUpperCase() || 'PENDING'}
${order?.platform === 'Sky-5' ? `*⚡ UPI PAYMENT LINK:* upi://pay?pa=Q15213511@ybl&pn=Sky5 Hotel&am=${order?.amount || 0}&cu=INR\n` : ''}*APPROVED BY:* GAURAV PANCHAL
=================================
_Verified by Englabs OS_`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const subtotal = (order?.rate || 0) * (order?.quantity || 1);
    const discountAmount = order?.discountType === 'Percentage' 
        ? (subtotal * (order?.discount || 0) / 100)
        : (order?.discount || 0);

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 custom-scrollbar thermal-slip-overlay">
            <div className="relative bg-[#F8F9FA] w-full max-w-[400px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 thermal-slip my-auto">
                
                {/* JAGGED TOP EDGE */}
                <div className="thermal-edge-top"></div>

                <button 
                    onClick={onClose} 
                    className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all z-20 print:hidden shadow-sm"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* THE THERMAL CONTENT */}
                <div id="food-receipt-print-area" className="p-10 flex-1 font-mono text-slate-900 bg-white">
                    
                    <div className="text-center mb-8">
                        <img 
                            src={logo} 
                            className="h-12 mx-auto mb-4 object-contain" 
                            alt="Englabs" 
                        />
                        <h2 className="text-2xl font-black tracking-tight mb-1">ENGLABS INDIA</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Official Pantry Ledger</p>
                        <p className="text-[9px] mt-2">1021-1022, Disha Arcade, MDC Sector 4, Panchkula</p>
                        <div className="my-4 border-b border-dashed border-slate-300"></div>
                    </div>

                    <div className="flex justify-between text-[11px] mb-6">
                        <span>DATE: {new Date(order?.timestamp).toLocaleDateString()}</span>
                        <span>TIME: {new Date(order?.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="text-[11px] space-y-1 mb-6">
                        <p className="font-black">RECEIPT #: {order?.entryId || 'N/A'}</p>
                        <p>STAFF: {order?.employeeName?.toUpperCase() || 'N/A'}</p>
                        <p>DEPT: {order?.department?.toUpperCase() || 'GENERAL'}</p>
                        {order?.mealType && <p>MEAL TYPE: {order.mealType.toUpperCase()}</p>}
                        <p className="border-t border-dotted border-slate-300 pt-1 mt-1">PURPOSE: {order?.purpose?.toUpperCase() || 'N/A'}</p>
                        <p className="text-[10px] text-slate-500 leading-tight">JUSTIFICATION: {order?.justification || 'No justification provided.'}</p>
                    </div>

                    <div className="border-b-2 border-dashed border-slate-900 my-4"></div>

                    <div className="space-y-4 text-[12px]">
                        <div className="flex justify-between font-black border-b border-slate-100 pb-2">
                            <span className="w-12 text-[10px]">QTY</span>
                            <span className="flex-1 text-[10px]">DESCRIPTION</span>
                            <span className="w-20 text-right text-[10px]">TOTAL</span>
                        </div>
                        
                        <div className="flex justify-between items-start">
                            <span className="w-12 pt-0.5">{order?.quantity || 1}</span>
                            <span className="flex-1 text-[11px] leading-tight pr-4">
                                <span className="font-black">{order?.items?.toUpperCase() || 'ITEMS SUMMARY'}</span><br/>
                                <span className="text-[9px] text-slate-500 uppercase">Rate: ₹{(order?.rate || order?.amount).toFixed(2)} | Unit: {order?.unit || 'Nos'}</span>
                            </span>
                            <span className="w-20 text-right font-bold">₹{subtotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="border-b-2 border-dashed border-slate-900 my-6"></div>

                    <div className="space-y-2 text-[12px]">
                        <div className="flex justify-between">
                            <span className="text-slate-500">SUBTOTAL:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-rose-600 font-bold">
                                <span>
                                    REBATE {order?.discountType === 'Percentage' ? `(${order?.discount}%)` : ''}:
                                </span>
                                <span>-₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="border-b border-slate-200 my-2"></div>
                        <div className="flex justify-between text-xl font-black pt-2">
                            <span>TOTAL:</span>
                            <span>₹{(order?.amount || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-dashed border-slate-300 text-[10px] space-y-1">
                        <div className="flex justify-between">
                            <span className="text-slate-500 uppercase">Payment Mode:</span>
                            <span className="font-black">{order?.paymentMode?.toUpperCase() || 'CASH'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 uppercase">Settled By:</span>
                            <span className="font-black">{order?.paidBy?.toUpperCase() || 'EMPLOYEE'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                            <span className="text-slate-500 uppercase">Audit Status:</span>
                            <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase ${
                                order?.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {order?.status?.toUpperCase() || 'PENDING'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <div className="flex justify-center mb-4">
                            {order?.platform === 'Sky-5' ? (
                                <div className="p-3 bg-white border-2 border-slate-900 rounded-3xl shadow-sm relative">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=Q15213511@ybl&pn=Sky5%20Hotel&am=${order?.amount || 0}&cu=INR`} 
                                        alt="Sky-5 Payment QR" 
                                        className="w-32 h-32"
                                    />
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-full">
                                        PAYMENT SCAN
                                    </div>
                                </div>
                            ) : (
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${order?.entryId || 'N/A'}`} 
                                    alt="Entry Barcode" 
                                    className="w-24 h-24 opacity-80"
                                />
                            )}
                        </div>
                        <p className="text-[8px] font-black tracking-[0.5em] opacity-30 mb-8">****************************</p>
                        
                        {order?.platform === 'Sky-5' && (
                            <p className="text-[9px] font-black mb-6 text-emerald-600">
                                MERCHANT: SKY5 HOTEL<br/>
                                <span className="text-[7px] text-slate-400">ID: Q15213511@ybl</span>
                            </p>
                        )}
                        
                        <div className="mt-12 w-48 mx-auto">
                            <p className="text-[10px] font-black uppercase tracking-wider mb-1">GAURAV PANCHAL</p>
                            <div className="border-t border-slate-400 pt-1">
                                <p className="text-[8px] font-bold uppercase text-slate-500 tracking-widest">Authorized Signature</p>
                            </div>
                        </div>
                        
                        <p className="mt-12 text-[10px] font-bold">THANK YOU FOR YOUR WORK!</p>
                        <p className="text-[8px] text-slate-400 mt-1">Englabs India Pvt Ltd - 2026</p>
                    </div>

                    {/* JAGGED BOTTOM EDGE */}
                    <div className="thermal-edge-bottom"></div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="bg-slate-900 p-6 flex flex-col gap-3 print:hidden">
                    <div className="flex gap-3">
                        <button 
                            onClick={handlePrint}
                            className="flex-1 bg-white text-slate-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                        >
                            <Printer className="w-4 h-4" /> PRINT SLIP
                        </button>
                        <button 
                            onClick={handleWhatsAppShare}
                            className="flex-1 bg-[#25D366] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <MessageSquare className="w-4 h-4" /> SHARE WHATSAPP
                        </button>
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="w-full py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10"
                    >
                        <Download className="w-4 h-4" /> SAVE PDF / JPG
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .thermal-slip {
                    position: relative;
                    filter: drop-shadow(0 10px 30px rgba(0,0,0,0.2));
                }
                .thermal-edge-top {
                    position: absolute;
                    top: -10px;
                    left: 0;
                    right: 0;
                    height: 10px;
                    background: white;
                    clip-path: polygon(0 100%, 5% 0, 10% 100%, 15% 0, 20% 100%, 25% 0, 30% 100%, 35% 0, 40% 100%, 45% 0, 50% 100%, 55% 0, 60% 100%, 65% 0, 70% 100%, 75% 0, 80% 100%, 85% 0, 90% 100%, 95% 0, 100% 100%);
                }
                .thermal-edge-bottom {
                    position: absolute;
                    bottom: -10px;
                    left: 0;
                    right: 0;
                    height: 10px;
                    background: white;
                    clip-path: polygon(0 0, 5% 100%, 10% 0, 15% 100%, 20% 0, 25% 100%, 30% 0, 35% 100%, 40% 0, 45% 100%, 50% 0, 55% 100%, 60% 0, 65% 100%, 70% 0, 75% 100%, 80% 0, 85% 100%, 90% 0, 95% 100%, 100% 0);
                }
                @media print {
                    @page { 
                        size: portrait; 
                        margin: 0; 
                    }
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    .thermal-slip-overlay, .thermal-slip-overlay * {
                        visibility: visible !important;
                    }
                    .thermal-slip-overlay {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        min-height: 100% !important;
                        background: white !important;
                        display: flex !important;
                        justify-content: center !important;
                        align-items: flex-start !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                    }
                    .thermal-slip {
                        filter: none !important;
                        width: 380px !important;
                        max-width: 380px !important;
                        margin: 0 auto !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                        page-break-inside: avoid !important;
                    }
                    .thermal-edge-top, .thermal-edge-bottom { 
                        display: none !important; 
                    }
                    .print\:hidden {
                        display: none !important;
                    }
                }
            `}} />
        </div>
    );
};

export default FoodReceiptSlip;

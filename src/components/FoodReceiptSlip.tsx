import React from 'react';
import { 
    Utensils, 
    Printer, 
    X, 
    Download,
    QrCode,
    Receipt,
    CheckCircle2
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[450px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 print:shadow-none print:w-full print:max-w-none">
                
                {/* SLIP HEADER */}
                <div className="bg-emerald-600 p-8 text-white flex justify-between items-center print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md print:bg-slate-100">
                            <Utensils className="w-6 h-6 text-white print:text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tighter">ENGLABS PANTRY</h2>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Food Expense & Welfare Receipt</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors print:hidden">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* THE SLIP CONTENT */}
                <div id="food-receipt-print-area" className="p-10 flex-1 relative overflow-hidden bg-white">
                    {/* Background Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-30deg]">
                        <h1 className="text-[100px] font-black">RECEIPT</h1>
                    </div>

                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                OFFICIAL RECEIPT
                            </span>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mt-4">{order.entryId}</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Date: {new Date(order.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl mb-2 inline-block">
                                <QrCode className="w-12 h-12 text-slate-900" />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Verification QR</p>
                        </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                        {/* EMPLOYEE SECTION */}
                        <div className="border-t-2 border-dashed border-slate-100 pt-8">
                            <div className="grid grid-cols-2 gap-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee Name</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{order.employeeName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{order.department}</p>
                                </div>
                            </div>
                        </div>

                        {/* ORDER SECTION */}
                        <div className="border-t-2 border-dashed border-slate-100 pt-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Order Specifications</h3>
                            <div className="grid grid-cols-2 gap-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Platform / Vendor</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{order.vendorName} ({order.platform})</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Type</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{order.orderType}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Items Ordered</p>
                                    <p className="text-sm font-bold text-slate-700 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        {order.items}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FINANCIAL SECTION */}
                        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
                                <Receipt className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Amount Paid</span>
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                        {order.paymentMode}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black text-emerald-400">₹</span>
                                    <span className="text-5xl font-black tracking-tighter">{order.amount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="mt-6 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Payment {order.status}</p>
                                </div>
                            </div>
                        </div>

                        {/* PURPOSE SECTION */}
                        <div className="border-t-2 border-dashed border-slate-100 pt-8">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Justification</p>
                            <p className="text-xs font-bold text-slate-600 italic">"{order.justification || 'Official welfare sustenance'}"</p>
                            {order.projectCode && (
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-3">Charge to Project: {order.projectCode}</p>
                            )}
                        </div>
                    </div>

                    {/* Footer Verification */}
                    <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="Englabs" className="h-10 object-contain" />
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Englabs India Private Limited</p>
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-widest tracking-[0.3em] text-slate-300">Verified Document</p>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="bg-slate-50 p-8 border-t border-slate-100 flex gap-4 print:hidden">
                    <button 
                        onClick={handlePrint}
                        className="flex-1 bg-[#0F172A] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                    >
                        <Printer className="w-4 h-4 text-emerald-500" /> PRINT RECEIPT / PDF
                    </button>
                    <button className="px-6 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Custom print styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #food-receipt-print-area, #food-receipt-print-area * {
                        visibility: visible;
                    }
                    #food-receipt-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        min-height: 297mm;
                        padding: 20mm !important;
                        margin: 0;
                    }
                }
            `}} />
        </div>
    );
};

export default FoodReceiptSlip;

import React from 'react';
import { 
    ShieldCheck, 
    Printer, 
    X, 
    Download,
    QrCode,
    Barcode
} from 'lucide-react';
import { GateEntry } from '@shared/services/gate_system';
import signature from '@/assets/englabs_signature.png';
import logo from '@/assets/englabs_logo.png';

interface Props {
    entry: GateEntry;
    onClose: () => void;
}

const GatePassSlip: React.FC<Props> = ({ entry, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[450px] max-h-[95vh] sm:max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 print:shadow-none print:w-full print:max-w-none print:h-auto print:max-h-none print:overflow-visible">
                
                {/* SLIP HEADER */}
                <div className="bg-[#0e4368] p-8 text-white flex justify-between items-center print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900">
                    <div className="flex items-center gap-4">
                        <img src={logo} alt="Englabs" className="h-16 print:h-20 object-contain" />
                        <div>
                            <h2 className="text-xl font-black tracking-tighter">ENGLABS</h2>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">India Private Limited • Logistics Command</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors print:hidden">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* THE SLIP CONTENT */}
                <div id="gate-pass-print-area" className="p-8 sm:p-10 flex-1 relative overflow-y-auto overflow-x-hidden print:overflow-visible print:p-0">
                    {/* Background Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-30deg]">
                        <h1 className="text-[120px] font-black">ENGLABS</h1>
                    </div>

                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${entry.type === 'INWARD' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {entry.type} MOVEMENT
                            </span>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mt-4">{entry.id}</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Generated: {entry.timestamp}</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl mb-2">
                                <QrCode className="w-12 h-12 text-slate-900" />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Scan to Verify</p>
                        </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                        {/* MATERIAL SECTION */}
                        <div className="border-t-2 border-dashed border-slate-100 pt-8">
                            <div className="flex justify-between items-start">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Material Intelligence</h3>
                                {entry.photoUrl && (
                                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-100 rotate-3 shadow-lg -mt-4 mb-2">
                                        <img src={entry.photoUrl} alt="Evidence" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{entry.materialName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{entry.quantity} {entry.unit}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Party Name</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{entry.partyName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference (Invoice)</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">#{entry.invoiceNumber}</p>
                                </div>
                            </div>
                        </div>

                        {/* LOGISTICS SECTION */}
                        <div className="border-t-2 border-dashed border-slate-100 pt-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Logistics Details</h3>
                            <div className="grid grid-cols-2 gap-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Source (From)</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{entry.fromLocation}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destination (To)</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{entry.toLocation}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Carrier / Driver</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{entry.driverName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vehicle Number</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">{entry.vehicleNumber}</p>
                                </div>
                            </div>
                        </div>

                        {/* REMARKS SECTION */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarks / Condition</p>
                            <p className="text-xs font-bold text-slate-600 italic">"{entry.remarks || 'No remarks provided'}"</p>
                        </div>

                        {/* SIGNATURE SECTION */}
                        <div className="grid grid-cols-3 gap-8 pt-12 pb-4">
                            <div className="text-center relative">
                                <div className="absolute left-1/2 -top-12 -translate-x-1/2 w-32 h-16 opacity-80 mix-blend-multiply pointer-events-none">
                                    <img src={signature} alt="Signature" className="w-full h-full object-contain" />
                                </div>
                                <div className="border-t-2 border-slate-100 pt-4 relative z-10">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorized By</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">Gaurav Panchal</p>
                                </div>
                            </div>
                            <div className="text-center border-t-2 border-slate-100 pt-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Issued / Received By</p>
                                <p className="text-xs font-black text-slate-900 uppercase">{entry.employeeName}</p>
                            </div>
                            <div className="text-center border-t-2 border-slate-100 pt-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Driver Sign</p>
                                <div className="h-4"></div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">(Sign Below)</p>
                            </div>
                        </div>
                    </div>

                    {/* Barcode simulation */}
                    <div className="mt-8 flex flex-col items-center">
                        <Barcode className="w-full h-12 text-slate-300" />
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] mt-2">ENGLABS-OFFICIAL-DOC</p>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="bg-slate-50 p-8 border-t border-slate-100 flex gap-4 print:hidden">
                    <button 
                        onClick={handlePrint}
                        className="flex-1 bg-[#0e4368] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                    >
                        <Printer className="w-4 h-4 text-emerald-500" /> PRINT GATE PASS
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
                    #gate-pass-print-area, #gate-pass-print-area * {
                        visibility: visible;
                    }
                    #gate-pass-print-area {
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

export default GatePassSlip;

import React from 'react';
import { GateEntry } from '../lib/gate_system';

interface GatePassProps {
    entry: GateEntry;
}

const GatePass: React.FC<GatePassProps> = ({ entry }) => {
    return (
        <div className="bg-white w-[800px] p-10 border-2 border-slate-900 mx-auto my-10 font-sans text-slate-900 relative">
            {/* WATERMARK */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <span className="text-8xl font-black rotate-[-45deg]">ENGLABS</span>
            </div>

            {/* HEADER */}
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter">ENGLABS INDIA PVT LTD</h1>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-1">Industrial Fabrication & Engineering Excellence</p>
                </div>
                <div className="text-right">
                    <div className="bg-slate-900 text-white px-6 py-2 rounded-lg font-black text-xl">GATE PASS</div>
                    <p className="text-xs font-black mt-2">NO: <span className="text-red-600">{entry.gatePassNumber}</span></p>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Date & Time</label>
                        <p className="font-bold border-b border-slate-200 pb-1">{entry.timestamp}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Receiver / Party</label>
                        <p className="font-black text-xl border-b border-slate-200 pb-1">{entry.partyName}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Destination</label>
                        <p className="font-bold border-b border-slate-200 pb-1">{entry.location}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Vehicle Number</label>
                        <p className="font-black text-xl border-b border-slate-200 pb-1 uppercase">{entry.vehicleNumber}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Delivery Type</label>
                        <p className="font-bold border-b border-slate-200 pb-1">{entry.deliveryType}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Invoice / DC No.</label>
                        <p className="font-bold border-b border-slate-200 pb-1">{entry.invoiceNumber}</p>
                    </div>
                </div>
            </div>

            {/* MATERIAL TABLE */}
            <div className="mt-12 border-2 border-slate-900">
                <table className="w-full">
                    <thead className="bg-slate-900 text-white">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs uppercase font-black">Material Description</th>
                            <th className="py-3 px-4 text-center text-xs uppercase font-black">Quantity</th>
                            <th className="py-3 px-4 text-right text-xs uppercase font-black">Value (Approx)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-900">
                            <td className="py-10 px-4 font-bold text-lg">{entry.materialName}</td>
                            <td className="py-10 px-4 text-center font-black text-2xl">{entry.quantity} <span className="text-sm">{entry.unit}</span></td>
                            <td className="py-10 px-4 text-right font-black text-xl">₹{entry.amount.toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* SIGNATURE SECTION */}
            <div className="mt-20 grid grid-cols-3 gap-10 text-center">
                <div className="space-y-4">
                    <div className="h-px bg-slate-900 w-full mb-2"></div>
                    <p className="text-[10px] font-black uppercase">Prepared By (Gate)</p>
                    <p className="font-bold text-sm italic opacity-50">{entry.employeeName}</p>
                </div>
                <div className="space-y-4">
                    <div className="h-px bg-slate-900 w-full mb-2"></div>
                    <p className="text-[10px] font-black uppercase">Approved By (Manager)</p>
                    <p className="font-bold text-sm italic opacity-50">{entry.supervisorName}</p>
                </div>
                <div className="space-y-4">
                    <div className="h-px bg-slate-900 w-full mb-2"></div>
                    <p className="text-[10px] font-black uppercase">Receiver's Signature</p>
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] flex justify-between">
                <span>© Englabs India Pvt Ltd • Industrial Integrity</span>
                <span>System Generated Document • No Signature Required</span>
            </div>
        </div>
    );
};

export default GatePass;

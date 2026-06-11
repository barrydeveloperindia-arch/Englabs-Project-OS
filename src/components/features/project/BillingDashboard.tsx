import React, { useState } from 'react';
import { 
    FilePlus, 
    Search, 
    Filter, 
    Download, 
    FileText,
    Receipt,
    CreditCard,
    TrendingUp,
    MoreHorizontal,
    Printer,
    ExternalLink,
    Shield
} from 'lucide-react';
import { BillingDocument, generateDocId } from '@domain/billing_system';
import DocumentPreview from '@common/DocumentPreview';

const BillingDashboard: React.FC = () => {
    const [docs, setDocs] = useState<BillingDocument[]>([
        {
            id: 'INV-2026-001',
            type: 'INVOICE',
            date: '2026-05-01',
            clientName: 'Tata Projects Ltd',
            clientAddress: 'Plot No. 1, Sector 24, Gurugram, Haryana',
            clientContact: '+91 9999999999',
            items: [
                { description: 'Structural Steel Fabrication (Site A)', quantity: 1, rate: 450000, amount: 450000 },
                { description: 'Installation & Erection Charges', quantity: 1, rate: 120000, amount: 120000 }
            ],
            subtotal: 570000,
            taxRate: 18,
            taxAmount: 102600,
            totalAmount: 672600,
            paidAmount: 672600,
            balance: 0,
            status: 'PAID',
            creator: 'Admin',
            createdAt: '2026-05-01T10:00:00Z',
            updatedAt: '2026-05-01T10:00:00Z',
            isLocked: true,
            version: 1
        }
    ]);

    const [selectedDoc, setSelectedDoc] = useState<BillingDocument | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const stats = {
        totalBilled: docs.reduce((sum, d) => sum + d.totalAmount, 0),
        totalReceived: docs.reduce((sum, d) => sum + d.paidAmount, 0),
        pendingBalance: docs.reduce((sum, d) => sum + d.balance, 0),
        invoiceCount: docs.filter(d => d.type === 'INVOICE').length
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
            {/* HEADER */}
            <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">FINANCE COMMAND</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing & Invoicing Suite</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search Clients / Invoices..." 
                            className="bg-slate-50 border border-slate-100 pl-12 pr-6 py-3 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all w-[300px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-3 bg-[#0e4368] text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                        <FilePlus className="w-4 h-4 text-emerald-400" /> NEW DOCUMENT
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto space-y-10">
                    
                    {/* STATS STRIP */}
                    <div className="grid grid-cols-4 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-500">+12%</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                            <p className="text-2xl font-black text-slate-900">₹{stats.totalBilled.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <Receipt className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Invoices</p>
                            <p className="text-2xl font-black text-slate-900">{stats.invoiceCount}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
                            <p className="text-2xl font-black text-slate-900 text-orange-600">₹{stats.pendingBalance.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
                                    <Filter className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Status</p>
                            <p className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-500" /> SECURE
                            </p>
                        </div>
                    </div>

                    {/* DOCUMENT REGISTER */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900">Recent Documents</h2>
                            <div className="flex gap-4">
                                <button className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-10 py-6 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {docs.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${doc.type === 'INVOICE' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{doc.id}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{doc.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <p className="text-sm font-black text-slate-900">{doc.clientName}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5 tracking-tighter truncate max-w-[200px]">{doc.clientAddress}</p>
                                            </td>
                                            <td className="px-10 py-8">
                                                <p className="text-sm font-bold text-slate-600">{doc.date}</p>
                                            </td>
                                            <td className="px-10 py-8">
                                                <p className="text-sm font-black text-slate-900">₹{doc.totalAmount.toLocaleString('en-IN')}</p>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${doc.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => setSelectedDoc(doc)}
                                                        className="p-3 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-xl transition-all"
                                                        title="Print Document"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-3 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-xl transition-all">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-3 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-xl transition-all">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {selectedDoc && (
                    <DocumentPreview doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
                )}
            </main>
        </div>
    );
};

export default BillingDashboard;

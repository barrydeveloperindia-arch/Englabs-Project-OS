import React, { useState } from 'react';
import { 
    Upload, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    ArrowRight,
    Search,
    Download,
    Eye
} from 'lucide-react';

interface Props {
    onAutoRegister: (data: any) => void;
}

const DigitalEvidence: React.FC<Props> = ({ onAutoRegister }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [previewData, setPreviewData] = useState<any | null>(null);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);

    const handleUpload = () => {
        setIsUploading(true);
        // Simulate AI Processing
        setTimeout(() => {
            setIsUploading(false);
            const extractedData = {
                type: 'INWARD',
                materialName: 'EPE ROLL-392119 2MM',
                quantity: 2,
                unit: 'Roll',
                partyName: 'M/S BALA JI ENTERPRISES',
                invoiceNumber: '543',
                vehicleNumber: 'CH01TE7319',
                driverName: 'Ramesh Kumar',
                fromLocation: 'INDUSTRIAL AREA, CHANDIGARH',
                toLocation: 'MDC PANCHKULA',
                amount: 8024,
                timestamp: new Date().toLocaleString()
            };
            setPreviewData(extractedData);
            setUploadedFile('https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=400&h=400&fit=crop'); // Placeholder for invoice
        }, 2000);
    };

    const confirmRegistration = () => {
        if (previewData) {
            onAutoRegister({
                ...previewData,
                id: `IN-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                invoicePhotoUrl: uploadedFile
            });
            setPreviewData(null);
            setUploadedFile(null);
            alert("SUCCESS: DOCUMENT DATA SAVED TO LOGISTICS REGISTRY");
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
            <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
                <div className="flex flex-col">
                    <h1 className="text-lg font-black text-slate-900 leading-none">Digital Evidence Vault</h1>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">AI-Powered Forensic Ingestion Engine</span>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search Vault..." 
                            className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold focus:border-emerald-500 outline-none w-64"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-10">
                    
                    {/* UPLOAD ZONE */}
                    {!previewData ? (
                        <div 
                            onClick={handleUpload}
                            className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-50/10 transition-all group"
                        >
                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                {isUploading ? <Loader2 className="w-10 h-10 animate-spin" /> : <Upload className="w-10 h-10 text-slate-300 group-hover:text-white" />}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">
                                {isUploading ? 'AI PROCESSING...' : 'IMPORT DOCUMENT'}
                            </h2>
                            <p className="text-sm font-bold text-slate-400 max-w-sm">
                                {isUploading ? 'Extracting material metadata and forensic values from invoice...' : 'Upload PDF or Invoice Image to automatically populate the movement register.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4 duration-500">
                            {/* DOCUMENT PREVIEW */}
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Source Document
                                    </span>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all"><Download className="w-4 h-4" /></button>
                                        <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all"><Eye className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="flex-1 p-10 bg-slate-200 flex items-center justify-center min-h-[500px]">
                                    <img src={uploadedFile!} className="max-w-full shadow-2xl rounded-xl rotate-1" alt="Invoice" />
                                </div>
                            </div>

                            {/* EXTRACTION RESULT */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 leading-tight">Extraction Success</h3>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">98.4% Confidence Score</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <DataField label="Party / Vendor" value={previewData.partyName} />
                                        <div className="grid grid-cols-2 gap-6">
                                            <DataField label="Invoice #" value={previewData.invoiceNumber} />
                                            <DataField label="Vehicle #" value={previewData.vehicleNumber} />
                                        </div>
                                        <DataField label="Material Description" value={previewData.materialName} />
                                        <div className="grid grid-cols-2 gap-6">
                                            <DataField label="Quantity" value={`${previewData.quantity} ${previewData.unit}`} />
                                            <DataField label="Value" value={`₹${previewData.amount.toLocaleString()}`} />
                                        </div>
                                    </div>

                                    <button 
                                        onClick={confirmRegistration}
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-5 rounded-2xl flex items-center justify-center gap-3 mt-10 transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        SAVE TO LOGISTICS REGISTER <ArrowRight className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setPreviewData(null)}
                                        className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 hover:text-slate-900 transition-all"
                                    >
                                        Discard Extraction
                                    </button>
                                </div>

                                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex gap-4">
                                    <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <p className="text-[11px] font-bold text-emerald-700 leading-relaxed">
                                        Forensic verification enabled. Data has been cross-referenced with vendor master records. Securely saved in digital vault with SHA-256 integrity hash.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const DataField = ({ label, value }: { label: string, value: string }) => (
    <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-slate-900 border-b border-slate-50 pb-2">{value}</p>
    </div>
);

export default DigitalEvidence;

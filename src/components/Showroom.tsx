import React from 'react';
import { 
    Box, 
    Zap, 
    Shield, 
    Target, 
    Cpu, 
    ChevronRight,
    ExternalLink,
    Maximize2
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    category: string;
    description: string;
    imageUrl: string;
    specs: string[];
}

const PRODUCTS: Product[] = [
    {
        id: "EP-001",
        name: "Aero-Housing Component",
        category: "Precision Molding",
        description: "High-grade ABS housing for aerospace applications, featuring complex internal ribbing for structural integrity.",
        imageUrl: "file:///C:/Users/SAM/.gemini/antigravity/brain/9663bc96-47f2-47f3-aae4-4d903f123dba/aero_housing_sample_1777876977451.png",
        specs: ["Material: ABS-V0", "Tolerance: ±0.05mm", "Finish: Clinical White"]
    },
    {
        id: "EP-002",
        name: "Tactical Drone Chassis",
        category: "Military Grade",
        description: "Lightweight, high-impact chassis with integrated camouflage finish for tactical field operations.",
        imageUrl: "file:///C:/Users/SAM/.gemini/antigravity/brain/9663bc96-47f2-47f3-aae4-4d903f123dba/tactical_drone_sample_1777877003977.png",
        specs: ["Pattern: Woodland Camo", "Weight: 450g", "Material: Reinforced Polymer"]
    },
    {
        id: "EP-003",
        name: "Industrial Display Module",
        category: "Electronics Integration",
        description: "Ruggedized display housing with integrated cooling vents, designed for factory floor monitoring systems.",
        imageUrl: "file:///C:/Users/SAM/.gemini/antigravity/brain/9663bc96-47f2-47f3-aae4-4d903f123dba/industrial_display_sample_1777877024074.png",
        specs: ["Screen: 10.1\" IPS", "IP Rating: IP54", "Interface: HDMI/USB"]
    },
    {
        id: "EP-004",
        name: "Advanced Safety System",
        category: "Industrial Safety",
        description: "Smart safety gear integration featuring high-visibility polymers and ergonomic grip attachments.",
        imageUrl: "file:///C:/Users/SAM/.gemini/antigravity/brain/9663bc96-47f2-47f3-aae4-4d903f123dba/safety_system_sample_1777877046812.png",
        specs: ["ANSI Certified", "Impact Resistant", "Heat Resistant: 120°C"]
    }
];

const Showroom: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
            <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-slate-900 leading-none">Product Showroom</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Capabilities & Engineering Samples • Englabs India</span>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Client-Ready View</span>
                    </div>
                </div>
                
                <button className="bg-[#0F172A] text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 text-xs transition-all shadow-lg hover:bg-slate-800">
                    <ExternalLink className="w-4 h-4" /> SHARE PORTFOLIO
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {PRODUCTS.map((product) => (
                            <div key={product.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-xl transition-all duration-500">
                                <div className="flex flex-col md:flex-row h-full">
                                    {/* IMAGE AREA */}
                                    <div className="w-full md:w-[280px] bg-slate-50 relative overflow-hidden flex items-center justify-center p-8 border-r border-slate-50">
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-transparent opacity-50" />
                                        <img 
                                            src={product.imageUrl} 
                                            alt={product.name}
                                            className="relative z-10 w-full h-auto object-contain transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute top-6 left-6 z-20">
                                            <span className="bg-[#0F172A] text-white text-[9px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase">{product.id}</span>
                                        </div>
                                    </div>

                                    {/* INFO AREA */}
                                    <div className="flex-1 p-10 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.category}</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">{product.name}</h3>
                                            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                                {product.description}
                                            </p>
                                            
                                            <div className="flex flex-wrap gap-2 mb-8">
                                                {product.specs.map(spec => (
                                                    <span key={spec} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600">
                                                        {spec}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <button className="w-full py-4 border-2 border-slate-900 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                                            VIEW DESIGN DOCS <Maximize2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Showroom;

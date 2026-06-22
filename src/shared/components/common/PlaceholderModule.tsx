import React from 'react';
import { Construction } from 'lucide-react';

export const PlaceholderModule: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] min-h-full p-10 text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border-8 border-amber-500/20 shadow-2xl">
                <Construction className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 uppercase">
                {title.replace(/_/g, ' ')}
            </h1>
            <p className="text-slate-500 font-bold max-w-lg mx-auto mb-8 uppercase tracking-widest text-[10px] md:text-xs">
                This enterprise module is currently being provisioned. Engineering teams are configuring the underlying data structures.
            </p>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl max-w-sm w-full">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment Status</span>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2 py-1 bg-amber-50 rounded-lg">Pending</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-1/3 animate-pulse rounded-full" />
                </div>
            </div>
        </div>
    );
};

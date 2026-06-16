const fs = require('fs');
const path = require('path');

const targetPath = path.join('src', 'features', 'reports', 'StoreStockReport.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add Check In Toggle State
content = content.replace(
    `const [isNewItemMode, setIsNewItemMode] = useState(false);`,
    `const [isNewItemMode, setIsNewItemMode] = useState(false);\n    const [showAdvancedCheckIn, setShowAdvancedCheckIn] = useState(false);`
);

// 2. Add Check Out Toggle State
content = content.replace(
    `const [checkoutPhoto, setCheckoutPhoto] = useState('');`,
    `const [checkoutPhoto, setCheckoutPhoto] = useState('');\n    const [showAdvancedCheckOut, setShowAdvancedCheckOut] = useState(false);`
);

// 3. Wrap Check In Advanced Fields (Start)
content = content.replace(
    `                                    {/* Project ID (Optional) */}`,
    `                                    {/* Advanced Options Toggle */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowAdvancedCheckIn(!showAdvancedCheckIn)}
                                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                        >
                                            {showAdvancedCheckIn ? '- Hide Advanced Options' : '+ Show Advanced Options (Project, Location, Remarks)'}
                                        </button>
                                    </div>

                                    {showAdvancedCheckIn && (
                                        <div className="space-y-4 pt-2">
                                            {/* Project ID (Optional) */}`
);

// 4. Wrap Check In Advanced Fields (End)
content = content.replace(
    `                                    {/* Remarks */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Remarks</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Audit details or invoice notes..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none resize-none"
                                            value={checkInRemarks}
                                            onChange={(e) => setCheckInRemarks(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/15 mt-6 flex items-center justify-center gap-2"
                                    >`,
    `                                    {/* Remarks */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Remarks</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Audit details or invoice notes..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:border-indigo-500 outline-none resize-none"
                                            value={checkInRemarks}
                                            onChange={(e) => setCheckInRemarks(e.target.value)}
                                        />
                                    </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/15 mt-6 flex items-center justify-center gap-2"
                                    >`
);

// 5. Wrap Check Out Advanced Fields (Start)
content = content.replace(
    `                                     {/* Project ID */}
                                     <div className="space-y-1.5">
                                         <div className="flex justify-between items-center">
                                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Project ID</label>`,
    `                                     {/* Advanced Options Toggle */}
                                     <div className="pt-2 border-t border-slate-100">
                                         <button
                                             type="button"
                                             onClick={() => setShowAdvancedCheckOut(!showAdvancedCheckOut)}
                                             className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                         >
                                             {showAdvancedCheckOut ? '- Hide Advanced Options' : '+ Show Advanced Options (Project, Location, Camera)'}
                                         </button>
                                     </div>

                                     {showAdvancedCheckOut && (
                                         <div className="space-y-4 pt-2">
                                             {/* Project ID */}
                                             <div className="space-y-1.5">
                                                 <div className="flex justify-between items-center">
                                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Project ID</label>`
);

// 6. Wrap Check Out Advanced Fields (End)
content = content.replace(
    `                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3.5 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md shadow-amber-600/15 mt-6 flex items-center justify-center gap-2"
                                    >`,
    `                                            </div>
                                        )}
                                    </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3.5 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md shadow-amber-600/15 mt-6 flex items-center justify-center gap-2"
                                    >`
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log("Successfully simplified StoreStockReport.tsx");

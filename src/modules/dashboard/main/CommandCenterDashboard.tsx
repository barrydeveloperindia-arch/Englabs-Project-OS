import React, { useEffect, useState } from 'react';
import { 
    Activity, 
    Briefcase, 
    Users, 
    Truck, 
    AlertTriangle, 
    FileText, 
    Shield,
    ChevronDown,
    ChevronUp,
    Settings
} from 'lucide-react';
import { ProjectData } from '@shared/services/project';
import { AuthService } from '@shared/services/auth_service';
import { ActivityLogger } from '@shared/services/activity_logger';
import { ActivityLog } from '@shared/types/database.types';

interface DashboardProps {
    projects: ProjectData[];
    gateEntries: any[];
    porterTrips: any[];
    inventoryItems: any[];
}

const Widget = ({ title, value, subtitle, icon: Icon, colorClass, status = 'active' }: any) => {
    return (
        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon className="w-5 h-5" />
                </div>
                {status === 'active' && (
                    <span className="w-2 h-2 rounded-full bg-[#52cca3] status-breathing"></span>
                )}
            </div>
            <h3 className="text-slate-400 dark:text-slate-300 text-xs font-black uppercase tracking-wider mb-1">{title}</h3>
            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 font-outfit">
                {value}
            </div>
            {subtitle && (
                <div className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                    {subtitle}
                </div>
            )}
        </div>
    );
};

const CommandCenterDashboard: React.FC<DashboardProps> = ({ projects, gateEntries, porterTrips, inventoryItems }) => {
    const userRole = AuthService.getCurrentUser()?.role || 'Viewer';
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [showInactiveModules, setShowInactiveModules] = useState(false);

    useEffect(() => {
        const fetchLogs = () => {
            setLogs(ActivityLogger.getLogs().slice(0, 5));
        };
        fetchLogs();
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, []);

    const activeProjects = projects.filter(p => p.production.stages.some(s => s.status !== 'Completed') && p.planning.poConfirmed).length;
    const completedProjects = projects.filter(p => p.production.stages.every(s => s.status === 'Completed')).length;
    
    // Derived real-time metrics
    const today = new Date().toDateString();
    const todaysGateEntries = gateEntries.filter(e => new Date(e.timestamp).toDateString() === today).length;
    const todaysPorterTrips = porterTrips.filter(t => new Date(t.timestamp).toDateString() === today).length;
    const lowStockItems = inventoryItems.filter(i => i.currentStock <= i.reorderLevel).length;

    // Check which widgets to show based on roles
    const showAttendance = AuthService.hasRole(['Super Admin', 'HR']);
    const showStock = AuthService.hasRole(['Super Admin', 'Admin', 'Store Manager']);
    const showLogistics = AuthService.hasRole(['Super Admin', 'Admin', 'Store Manager']);

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent p-4 md:p-10 custom-scrollbar industrial-grid">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
                
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-slate-200/40 dark:border-white/5 pb-6">
                    <div className="w-12 h-12 bg-[#0e4368] dark:bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[#52cca3] shadow-lg shadow-slate-900/10">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Enterprise Command Center</h1>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mt-2">
                            Live operational overview — {userRole} mode
                        </span>
                    </div>
                </div>

                {/* Primary Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Widget 
                        title="Active Projects" 
                        value={projects.length} 
                        subtitle={`${activeProjects} In Progress / ${completedProjects} Done`}
                        icon={Briefcase} 
                        colorClass="bg-blue-500/10 text-blue-500" 
                    />
                    
                    {showAttendance ? (
                        <Widget 
                            title="Daily Attendance" 
                            value="84%" 
                            subtitle="16 Present / 3 Absent"
                            icon={Users} 
                            colorClass="bg-emerald-500/10 text-emerald-500" 
                        />
                    ) : (
                        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 flex flex-col justify-center items-center text-center bg-slate-100/50 dark:bg-white/5 opacity-55">
                            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attendance Shielded</span>
                        </div>
                    )}

                    {showStock ? (
                        <Widget 
                            title="Low Stock Alerts" 
                            value={lowStockItems} 
                            subtitle={lowStockItems > 0 ? "Replenish required" : "All levels healthy"}
                            icon={AlertTriangle} 
                            colorClass={lowStockItems > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"} 
                        />
                    ) : (
                        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 flex flex-col justify-center items-center text-center bg-slate-100/50 dark:bg-white/5 opacity-55">
                            <AlertTriangle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inventory Shielded</span>
                        </div>
                    )}

                    {showLogistics ? (
                        <Widget 
                            title="Today's Logistics" 
                            value={todaysGateEntries + todaysPorterTrips} 
                            subtitle={`${todaysGateEntries} Gate Pass / ${todaysPorterTrips} Porter`}
                            icon={Truck} 
                            colorClass="bg-amber-500/10 text-amber-500" 
                        />
                    ) : (
                        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 flex flex-col justify-center items-center text-center bg-slate-100/50 dark:bg-white/5 opacity-55">
                            <Truck className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logistics Shielded</span>
                        </div>
                    )}
                </div>

                {/* Live Activity Stream */}
                <div className="glass-card border border-slate-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200/40 dark:border-white/5 flex items-center justify-between bg-slate-100/30 dark:bg-white/5">
                        <div className="flex items-center gap-2.5">
                            <Activity className="w-4 h-4 text-[#52cca3] shrink-0" />
                            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Live Activity Stream</h2>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black text-[#52cca3] uppercase tracking-widest bg-[#52cca3]/10 px-3 py-1.5 rounded-xl">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#52cca3] status-breathing"></span>
                            System Live
                        </div>
                    </div>
                    <div className="divide-y divide-slate-200/40 dark:divide-white/5">
                        {logs.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                                No recent activity logged in this session.
                            </div>
                        ) : (
                            logs.map((log, index) => (
                                <div 
                                    key={log.id} 
                                    className="p-4 flex items-start gap-4 hover:bg-slate-100/40 dark:hover:bg-white/5 transition-colors duration-200 staggered-entry"
                                    style={{ animationDelay: `${index * 80}ms` }}
                                >
                                    <div className="w-8 h-8 rounded-xl bg-[#0e4368]/10 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[10px] font-black text-[#0e4368] dark:text-[#52cca3]">{log.userName.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                            <span className="font-extrabold text-slate-950 dark:text-white uppercase tracking-wider mr-1">{log.userName}</span> 
                                            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mr-1">{log.actionType.toLowerCase()} in</span> 
                                            <span className="font-extrabold text-[#0e4368] dark:text-[#52cca3] uppercase tracking-wider">{log.module}</span>
                                        </p>
                                        {log.details && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium bg-slate-100/50 dark:bg-white/5 p-2 rounded-xl border border-slate-200/30 dark:border-transparent truncate">
                                                {log.details}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 whitespace-nowrap uppercase">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Collapsible Pending Modules Footer Tray */}
                <div className="glass-card border border-slate-200/40 dark:border-white/5 rounded-3xl overflow-hidden mt-2">
                    <button 
                        onClick={() => setShowInactiveModules(prev => !prev)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100/30 dark:hover:bg-white/5 transition-all"
                    >
                        <div className="flex items-center gap-2.5">
                            <Settings className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">System Services & Gateways</span>
                        </div>
                        {showInactiveModules ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                    </button>
                    
                    {showInactiveModules && (
                        <div className="p-6 border-t border-slate-200/40 dark:border-white/5 bg-slate-100/10 dark:bg-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/5 flex items-center gap-3 opacity-60">
                                <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pending Invoices</h4>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Integration Awaiting Activation</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/5 flex items-center gap-3 opacity-60">
                                <Truck className="w-5 h-5 text-slate-400 shrink-0" />
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fleet Status Map</h4>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GPS Tracking Integration Pending</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CommandCenterDashboard;

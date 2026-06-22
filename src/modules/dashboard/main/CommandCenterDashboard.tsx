import React, { useEffect, useState } from 'react';
import { 
    Activity, 
    Briefcase, 
    Users, 
    Truck, 
    AlertTriangle, 
    FileText, 
    CheckCircle, 
    Clock, 
    Package,
    Shield
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
        <div className={`p-6 rounded-2xl border ${status === 'disabled' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'} shadow-sm flex flex-col relative overflow-hidden transition-all hover:shadow-md`}>
            {status === 'disabled' && (
                <div className="absolute top-2 right-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">PENDING MODULE</div>
            )}
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${status === 'disabled' ? 'bg-slate-200 text-slate-400' : colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold mb-1">{title}</h3>
            <div className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                {status === 'disabled' ? '0' : value}
            </div>
            {subtitle && (
                <div className="text-xs text-slate-400 font-medium">
                    {status === 'disabled' ? 'Module ready for activation' : subtitle}
                </div>
            )}
        </div>
    );
};

const CommandCenterDashboard: React.FC<DashboardProps> = ({ projects, gateEntries, porterTrips, inventoryItems }) => {
    const userRole = AuthService.getCurrentUser()?.role || 'Viewer';
    const [logs, setLogs] = useState<ActivityLog[]>([]);

    useEffect(() => {
        // Mock a 30 second auto-refresh for logs
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

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Command Center</h1>
                        <p className="text-sm font-medium text-slate-500">Live operational overview for {userRole}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Widget 
                        title="Total Projects" 
                        value={projects.length} 
                        subtitle={`${activeProjects} Active / ${completedProjects} Completed`}
                        icon={Briefcase} 
                        colorClass="bg-blue-100 text-blue-600" 
                    />
                    
                    {AuthService.hasRole(['Super Admin', 'HR']) && (
                        <Widget 
                            title="Daily Attendance" 
                            value="84%" 
                            subtitle="16 Present / 3 Absent"
                            icon={Users} 
                            colorClass="bg-emerald-100 text-emerald-600" 
                        />
                    )}

                    {AuthService.hasRole(['Super Admin', 'Admin', 'Store Manager']) && (
                        <Widget 
                            title="Low Stock Alerts" 
                            value={lowStockItems} 
                            subtitle="Items below reorder level"
                            icon={AlertTriangle} 
                            colorClass={lowStockItems > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"} 
                        />
                    )}

                    {AuthService.hasRole(['Super Admin', 'Admin', 'Store Manager']) && (
                        <Widget 
                            title="Today's Logistics" 
                            value={todaysGateEntries + todaysPorterTrips} 
                            subtitle={`${todaysGateEntries} Gate / ${todaysPorterTrips} Porter`}
                            icon={Truck} 
                            colorClass="bg-amber-100 text-amber-600" 
                        />
                    )}

                    {AuthService.hasRole(['Super Admin', 'Accountant']) && (
                        <Widget 
                            title="Pending Invoices" 
                            value="0" 
                            icon={FileText} 
                            colorClass="bg-indigo-100 text-indigo-600" 
                            status="disabled"
                        />
                    )}

                    <Widget 
                        title="Fleet Status" 
                        value="0" 
                        icon={Truck} 
                        colorClass="bg-slate-100 text-slate-600" 
                        status="disabled"
                    />
                </div>

                {/* Activity Log Stream */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-slate-400" />
                            <h2 className="text-sm font-bold text-slate-800">Live Activity Stream</h2>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Updates
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {logs.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm font-medium">
                                No recent activity logged in this session.
                            </div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[10px] font-black text-slate-600">{log.userName.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900">
                                            {log.userName} <span className="text-slate-500 font-normal">{log.actionType.toLowerCase()} in</span> {log.module}
                                        </p>
                                        {log.details && <p className="text-xs text-slate-500 mt-0.5 truncate">{log.details}</p>}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CommandCenterDashboard;

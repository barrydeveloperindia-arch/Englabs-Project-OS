import React, { useState, useEffect } from 'react';
import { db, auth } from '@services/firebase';
import { collection, query, onSnapshot, orderBy, limit, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Settings, ShieldAlert, FileText, Users, Calculator, Bell, Package, FolderTree, Building2, Save } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const SettingsAdminModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Audit Logs');
    const [isAdmin, setIsAdmin] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyProfile, setCompanyProfile] = useState({
        companyName: 'Englabs Construction',
        supportEmail: 'admin@englabs.com',
        currency: 'INR',
        gstRate: 18,
        version: 1
    });
    const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        // Simple admin check based on email for the prototype
        const userEmail = auth.currentUser?.email || '';
        if (userEmail.includes('admin')) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
            setLoading(false);
            AuditLogger.log('PERMISSION_VIOLATION_ATTEMPT', 'SETTINGS', { target: 'SettingsAdminModule' });
        }
    }, []);

    useEffect(() => {
        if (!isAdmin) return;

        const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAuditLogs(logs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAdmin]);

    useEffect(() => {
        if (!isAdmin) return;

        const configRef = doc(db, 'system_settings', 'GLOBAL_CONFIG');
        const unsubscribeConfig = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setCompanyProfile(docSnap.data() as any);
            } else {
                // Initialize default config if not exists
                setDoc(configRef, companyProfile);
            }
        });

        return () => unsubscribeConfig();
    }, [isAdmin]);

    const handleSaveCompanyProfile = async () => {
        setSaving(true);
        setSaveMessage({ text: '', type: '' });
        try {
            const configRef = doc(db, 'system_settings', 'GLOBAL_CONFIG');
            const newVersion = (companyProfile.version || 1) + 1;
            
            await updateDoc(configRef, {
                ...companyProfile,
                version: newVersion,
                lastUpdatedBy: auth.currentUser?.email,
                lastUpdatedAt: new Date().toISOString()
            });

            await AuditLogger.log('SETTINGS_UPDATED', 'SETTINGS', { 
                tab: 'Company Profile', 
                newVersion 
            }, 'GLOBAL_CONFIG');

            setSaveMessage({ text: 'Settings saved successfully!', type: 'success' });
            setTimeout(() => setSaveMessage({ text: '', type: '' }), 3000);
        } catch (error: any) {
            console.error('Failed to save settings:', error);
            setSaveMessage({ text: error.message || 'Failed to save settings', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (!loading && !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
                <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
                <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
                <p className="text-sm font-semibold text-slate-500 mt-2">You do not have Administrative privileges.</p>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-4">This violation has been logged.</p>
            </div>
        );
    }

    const TABS = [
        { id: 'Audit Logs', icon: <FileText className="w-4 h-4" /> },
        { id: 'Company Profile', icon: <Building2 className="w-4 h-4" /> },
        { id: 'User Management', icon: <Users className="w-4 h-4" /> },
        { id: 'Permissions Matrix', icon: <ShieldAlert className="w-4 h-4" /> },
        { id: 'Number Series', icon: <Calculator className="w-4 h-4" /> },
        { id: 'Project Defaults', icon: <FolderTree className="w-4 h-4" /> },
        { id: 'Inventory Defaults', icon: <Package className="w-4 h-4" /> },
        { id: 'Financial Defaults', icon: <Calculator className="w-4 h-4" /> },
        { id: 'Notification Settings', icon: <Bell className="w-4 h-4" /> }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Settings & Administration</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">System Configuration</p>
                </div>
            </div>

            <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto dark-scrollbar">
                {TABS.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                    >
                        {tab.icon} {tab.id}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {activeTab === 'Audit Logs' ? (
                    <div>
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-emerald-600" /> System Audit Trail
                            </h3>
                            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                                Displaying last 100 events
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-white">
                                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module</th>
                                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="p-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                <p className="text-xs font-bold text-slate-800">{log.userEmail}</p>
                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{log.role}</p>
                                            </td>
                                            <td className="p-3 text-xs font-black text-slate-600 uppercase tracking-wider">
                                                {log.module}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                                                    log.action.includes('FAILED') || log.action.includes('VIOLATION') 
                                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-3 text-xs font-mono text-slate-500">
                                                {log.entityId !== 'N/A' ? log.entityId : (log.projectId !== 'GLOBAL' ? log.projectId : '-')}
                                            </td>
                                        </tr>
                                    ))}
                                    {auditLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-sm font-bold text-slate-400">
                                                No audit logs available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'Company Profile' ? (
                    <div className="p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-emerald-600" /> Company Profile Settings
                                </h3>
                                <p className="text-sm font-medium text-slate-500 mt-1">Configure global company details. Changes here reflect across all reports and modules.</p>
                            </div>
                            <button
                                onClick={handleSaveCompanyProfile}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                            >
                                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        {saveMessage.text && (
                            <div className={`p-3 rounded-lg text-xs font-bold mb-6 ${saveMessage.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                                {saveMessage.text}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6 max-w-3xl">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Company Name</label>
                                <input 
                                    type="text" 
                                    value={companyProfile.companyName || ''}
                                    onChange={e => setCompanyProfile({...companyProfile, companyName: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Support Email</label>
                                <input 
                                    type="email" 
                                    value={companyProfile.supportEmail || ''}
                                    onChange={e => setCompanyProfile({...companyProfile, supportEmail: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Base Currency</label>
                                <select 
                                    value={companyProfile.currency || 'INR'}
                                    onChange={e => setCompanyProfile({...companyProfile, currency: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="AED">AED (د.إ)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Default GST Rate (%)</label>
                                <input 
                                    type="number" 
                                    value={companyProfile.gstRate || 0}
                                    onChange={e => setCompanyProfile({...companyProfile, gstRate: Number(e.target.value)})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 flex justify-between">
                                <span>Config Version: <span className="font-mono text-slate-800">{companyProfile.version || 1}</span></span>
                                <span>Real-time sync enabled</span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-slate-700 mb-2">{activeTab} Configuration</h3>
                        <p className="text-sm font-medium text-slate-500">
                            The schema for {activeTab.toLowerCase()} has been deployed to the `system_settings` collection. 
                            UI binding is scheduled.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

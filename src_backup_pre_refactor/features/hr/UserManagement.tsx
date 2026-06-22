import React, { useState } from 'react';
import { 
    Users, 
    Plus, 
    Trash2, 
    CheckCircle, 
    XCircle, 
    RotateCcw, 
    Shield, 
    Lock, 
    History, 
    FileText, 
    AlertCircle, 
    Layers, 
    Box, 
    Truck,
    Clock,
    UserCheck,
    ToggleLeft,
    ToggleRight,
    Edit2
} from 'lucide-react';

export interface UserRecord {
    id: string;
    name: string;
    role: 'ADMIN' | 'STAFF';
    assignedApp: 'PROJECTS' | 'STORE' | 'PORTER_SERVICE' | 'ALL';
    pin: string;
    enabled: boolean;
}

export interface LoginHistoryRecord {
    id: string;
    timestamp: string;
    userName: string;
    role: string;
    application: string;
    status: 'SUCCESS' | 'FAILED';
}

interface Props {
    users: UserRecord[];
    history: LoginHistoryRecord[];
    onUpdateUsers: (updatedUsers: UserRecord[]) => void;
    onClearHistory: () => void;
}

const UserManagement: React.FC<Props> = ({ users, history, onUpdateUsers, onClearHistory }) => {
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
    const [newAssignedApp, setNewAssignedApp] = useState<'PROJECTS' | 'STORE' | 'PORTER_SERVICE' | 'ALL'>('PROJECTS');
    const [newUserPin, setNewUserPin] = useState('');
    const [pinResetTarget, setPinResetTarget] = useState<string | null>(null);
    const [newPinValue, setNewPinValue] = useState('');
    const [formError, setFormError] = useState('');

    // Editing states
    const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
    const [editUserName, setEditUserName] = useState('');
    const [editUserRole, setEditUserRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
    const [editAssignedApp, setEditAssignedApp] = useState<'PROJECTS' | 'STORE' | 'PORTER_SERVICE' | 'ALL'>('PROJECTS');
    const [editUserPin, setEditUserPin] = useState('');

    const handleStartEditUser = (user: UserRecord) => {
        setEditingUser(user);
        setEditUserName(user.name);
        setEditUserRole(user.role);
        setEditAssignedApp(user.assignedApp);
        setEditUserPin(user.pin);
        setFormError('');
    };

    const handleSaveEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setFormError('');

        if (!editUserName.trim()) {
            setFormError('User name is required.');
            return;
        }
        if (!editUserPin || editUserPin.length !== 4 || isNaN(Number(editUserPin))) {
            setFormError('PIN must be exactly 4 digits.');
            return;
        }

        // Check PIN uniqueness
        const pinExists = users.some(u => u.pin === editUserPin && u.id !== editingUser.id);
        if (pinExists) {
            setFormError('This PIN is already assigned to another user.');
            return;
        }

        const updatedUsers = users.map(u => {
            if (u.id === editingUser.id) {
                return {
                    ...u,
                    name: editUserName.trim(),
                    role: editUserRole,
                    assignedApp: editUserRole === 'ADMIN' ? 'ALL' : editAssignedApp,
                    pin: editUserPin
                };
            }
            return u;
        });

        onUpdateUsers(updatedUsers);
        setEditingUser(null);
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!newUserName.trim()) {
            setFormError('User name is required.');
            return;
        }
        if (!newUserPin || newUserPin.length !== 4 || isNaN(Number(newUserPin))) {
            setFormError('PIN must be exactly 4 digits.');
            return;
        }

        // Check PIN uniqueness
        const pinExists = users.some(u => u.pin === newUserPin);
        if (pinExists) {
            setFormError('This PIN is already assigned to another user.');
            return;
        }

        const newUser: UserRecord = {
            id: Date.now().toString(),
            name: newUserName.trim(),
            role: newUserRole,
            assignedApp: newUserRole === 'ADMIN' ? 'ALL' : newAssignedApp,
            pin: newUserPin,
            enabled: true
        };

        onUpdateUsers([...users, newUser]);
        setNewUserName('');
        setNewUserPin('');
        setFormError('');
    };

    const handleToggleEnabled = (userId: string) => {
        // Prevent disabling the master admin
        const target = users.find(u => u.id === userId);
        if (target && target.role === 'ADMIN' && target.pin === '9999') {
            alert('Cannot disable the master Admin account.');
            return;
        }

        const updated = users.map(u => {
            if (u.id === userId) {
                return { ...u, enabled: !u.enabled };
            }
            return u;
        });
        onUpdateUsers(updated);
    };

    const handleDeleteUser = (userId: string) => {
        const target = users.find(u => u.id === userId);
        if (target && target.role === 'ADMIN' && target.pin === '9999') {
            alert('Cannot delete the master Admin account.');
            return;
        }

        if (confirm(`Are you sure you want to delete user "${target?.name}"?`)) {
            const updated = users.filter(u => u.id !== userId);
            onUpdateUsers(updated);
        }
    };

    const handleStartResetPin = (userId: string) => {
        setPinResetTarget(userId);
        setNewPinValue('');
    };

    const handleSaveNewPin = (userId: string) => {
        if (!newPinValue || newPinValue.length !== 4 || isNaN(Number(newPinValue))) {
            alert('PIN must be exactly 4 digits.');
            return;
        }

        const pinExists = users.some(u => u.pin === newPinValue && u.id !== userId);
        if (pinExists) {
            alert('This PIN is already assigned to another user.');
            return;
        }

        const updated = users.map(u => {
            if (u.id === userId) {
                return { ...u, pin: newPinValue };
            }
            return u;
        });
        onUpdateUsers(updated);
        setPinResetTarget(null);
    };

    const getAppIcon = (app: string) => {
        switch (app) {
            case 'PROJECTS': return <Layers className="w-3.5 h-3.5 text-emerald-500" />;
            case 'STORE': return <Box className="w-3.5 h-3.5 text-blue-500" />;
            case 'PORTER_SERVICE': return <Truck className="w-3.5 h-3.5 text-purple-500" />;
            default: return <Shield className="w-3.5 h-3.5 text-amber-500" />;
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC]">
            {/* HEADER */}
            <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 sticky top-0 z-40 shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#0e4368] rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10">
                        <Users className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">User Management Dashboard</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Role-Based Access Control & Security Ledger</p>
                    </div>
                </div>
            </header>

            {/* MAIN MAIN */}
            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: User Directory (span 2) */}
                    <div className="xl:col-span-2 flex flex-col gap-8">
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                                <Users className="w-5.5 h-5.5 text-emerald-500" /> Authorized Accounts
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-4">
                                            <th className="pb-4">Name</th>
                                            <th className="pb-4">Role</th>
                                            <th className="pb-4">App Scope</th>
                                            <th className="pb-4">PIN Code</th>
                                            <th className="pb-4">Status</th>
                                            <th className="pb-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4">
                                                    <span className="font-black text-slate-900">{user.name}</span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                        user.role === 'ADMIN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    }`}>
                                                        {user.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                                                        {getAppIcon(user.assignedApp)}
                                                        {user.assignedApp.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    {pinResetTarget === user.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="text" 
                                                                maxLength={4}
                                                                className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-center" 
                                                                placeholder="PIN"
                                                                value={newPinValue}
                                                                onChange={e => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                                                            />
                                                            <button 
                                                                onClick={() => handleSaveNewPin(user.id)}
                                                                className="text-xs bg-emerald-500 text-white font-black px-2 py-1 rounded-lg hover:bg-emerald-600 transition-colors"
                                                            >
                                                                Save
                                                            </button>
                                                            <button 
                                                                onClick={() => setPinResetTarget(null)}
                                                                className="text-xs bg-slate-100 text-slate-400 font-black px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 group">
                                                            <span className="font-mono font-black tracking-widest text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{user.pin}</span>
                                                            <button 
                                                                onClick={() => handleStartResetPin(user.id)}
                                                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 p-1 transition-all"
                                                                title="Reset PIN"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4">
                                                    <button 
                                                        onClick={() => handleToggleEnabled(user.id)}
                                                        className="focus:outline-none"
                                                        title={user.enabled ? 'Click to Disable' : 'Click to Enable'}
                                                    >
                                                        {user.enabled ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                                                <ToggleRight className="w-6 h-6" /> Enabled
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                                                <ToggleLeft className="w-6 h-6" /> Disabled
                                                            </span>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleStartEditUser(user)}
                                                            className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                                                            title="Edit User"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* CREATE USER CARD */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                                <Plus className="w-5.5 h-5.5 text-emerald-500" /> Create Authorized Personnel
                            </h3>
                            
                            <form onSubmit={handleCreateUser} className="space-y-6">
                                {formError && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> {formError}
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all" 
                                            placeholder="Enter full name"
                                            value={newUserName}
                                            onChange={e => setNewUserName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access PIN (4 Digits)</label>
                                        <input 
                                            type="text" 
                                            required 
                                            maxLength={4}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold tracking-widest focus:border-emerald-500 outline-none transition-all" 
                                            placeholder="XXXX"
                                            value={newUserPin}
                                            onChange={e => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Role</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                                            value={newUserRole}
                                            onChange={e => {
                                                const role = e.target.value as 'ADMIN' | 'STAFF';
                                                setNewUserRole(role);
                                                if (role === 'ADMIN') setNewAssignedApp('ALL');
                                            }}
                                        >
                                            <option value="STAFF">STAFF (Restricted Application)</option>
                                            <option value="ADMIN">ADMIN (Full Oversight)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Application Scope</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                                            value={newAssignedApp}
                                            onChange={e => setNewAssignedApp(e.target.value as any)}
                                            disabled={newUserRole === 'ADMIN'}
                                        >
                                            <option value="PROJECTS">ENGLABS PROJECTS</option>
                                            <option value="STORE">ENGLABS STORE</option>
                                            <option value="PORTER_SERVICE">ENGLABS PORTER SERVICE</option>
                                            {newUserRole === 'ADMIN' && <option value="ALL">ALL APPLICATIONS</option>}
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-[#0e4368] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10 text-xs uppercase tracking-widest"
                                >
                                    <Plus className="w-4 h-4 text-emerald-500" /> REGISTER ACCESS KEY
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Audit Logs */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col h-full max-h-[80vh]">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                <History className="w-5.5 h-5.5 text-blue-500" /> Access Audit Log
                            </h3>
                            <button 
                                onClick={onClearHistory}
                                className="text-[9px] font-black bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-slate-100 transition-all uppercase tracking-widest"
                            >
                                Clear Logs
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <Clock className="w-10 h-10 mx-auto mb-4 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-wider">No authentication attempts recorded today.</p>
                                </div>
                            ) : (
                                history.map(log => (
                                    <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                                        {log.status === 'SUCCESS' ? (
                                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-xs font-black text-slate-900 truncate">{log.userName}</p>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase mt-1">
                                                {log.role} • Scope: {log.application.replace('_', ' ')}
                                            </p>
                                            <div className="mt-2">
                                                <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                                    log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {log.status === 'SUCCESS' ? 'AUTHORIZED' : 'DENIED'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingUser(null)} />
                    
                    <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit Authorized User</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Personnel Authorization Key</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEditUser} className="p-8 space-y-6">
                            {formError && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {formError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all" 
                                        placeholder="Enter full name"
                                        value={editUserName}
                                        onChange={e => setEditUserName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access PIN (4 Digits)</label>
                                    <input 
                                        type="text" 
                                        required 
                                        maxLength={4}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold tracking-widest focus:border-emerald-500 outline-none transition-all" 
                                        placeholder="XXXX"
                                        value={editUserPin}
                                        onChange={e => setEditUserPin(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Role</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                                        value={editUserRole}
                                        onChange={e => {
                                            const role = e.target.value as 'ADMIN' | 'STAFF';
                                            setEditUserRole(role);
                                            if (role === 'ADMIN') setEditAssignedApp('ALL');
                                        }}
                                    >
                                        <option value="STAFF">STAFF (Restricted Application)</option>
                                        <option value="ADMIN">ADMIN (Full Oversight)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Application Scope</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                                        value={editAssignedApp}
                                        onChange={e => setEditAssignedApp(e.target.value as any)}
                                        disabled={editUserRole === 'ADMIN'}
                                    >
                                        <option value="PROJECTS">ENGLABS PROJECTS</option>
                                        <option value="STORE">ENGLABS STORE</option>
                                        <option value="PORTER_SERVICE">ENGLABS PORTER SERVICE</option>
                                        {editUserRole === 'ADMIN' && <option value="ALL">ALL APPLICATIONS</option>}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-[#0e4368] text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;

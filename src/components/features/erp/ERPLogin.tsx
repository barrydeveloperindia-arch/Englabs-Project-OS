import React, { useState } from 'react';
import { auth } from '@services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Building2, Lock, Mail, ArrowRight } from 'lucide-react';
import { AuditLogger } from '@services/audit/AuditLogger';

export const ERPLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
                await AuditLogger.logAuthEvent('USER_CREATION', { email });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                await AuditLogger.logAuthEvent('LOGIN', { email });
            }
        } catch (err: any) {
            setError(err.message);
            // Non-blocking log of failure (will show as SYSTEM if not authed, but metadata carries email)
            await AuditLogger.logAuthEvent('FAILED_LOGIN', { attemptedEmail: email, reason: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] font-sans">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">ENGLABS ERP</h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Staging Environment</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold text-center">
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="email" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                placeholder="admin@englabs.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-[#0b1b29] hover:bg-[#132a40] text-white py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 mt-6"
                    >
                        {loading ? 'Authenticating...' : (isRegistering ? 'Create Account' : 'Secure Login')}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        type="button"
                        onClick={() => { console.log('Attempting login for:', email, 'API KEY:', import.meta.env.VITE_FIREBASE_API_KEY); setIsRegistering(!isRegistering); }}
                        className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
                    >
                        {isRegistering ? 'Already have an account? Login' : 'Need a staging account? Register'}
                    </button>
                </div>
            </div>
        </div>
    );
};

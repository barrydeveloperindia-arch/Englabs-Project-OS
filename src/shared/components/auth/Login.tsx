import React, { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { AuthService } from '@shared/services/auth_service';
import logo from '@/assets/englabs_logo.png';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await AuthService.login(email, password);
            // After successful login, AuthService's observer will trigger a re-render in App.tsx
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen bg-[#092a42] flex items-center justify-center text-white font-sans p-6 overflow-hidden relative">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 industrial-grid opacity-20" />
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />

            <div className="w-full max-w-md bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl relative z-10 animate-spring-zoom">
                {/* Brand Header */}
                <div className="flex items-center gap-4 mb-8 justify-center">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <img src={logo} alt="EngLabs Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter text-white">ENGLABS OS</span>
                        <span className="text-[9px] font-black text-emerald-400 tracking-[0.3em] uppercase">Enterprise Authentication</span>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="w-5 h-5 text-slate-500" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                placeholder="Enter your corporate email"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="w-5 h-5 text-slate-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3 mt-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-rose-200">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3.5 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5" />
                                Secure Login
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Authorized Personnel Only
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface RequireRoleProps {
    role: 'ADMIN' | 'STAFF';
    children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ role, children }) => {
    const userRole = localStorage.getItem('englabs_user_role') as 'ADMIN' | 'STAFF' | null;

    if (userRole !== role && userRole !== 'ADMIN') { // ADMIN can access anything
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>
                <p className="text-slate-500 text-center max-w-sm mb-8">
                    Your current role ({userRole || 'NONE'}) does not have permission to view this module. Requires {role}.
                </p>
                <div className="bg-slate-100 px-4 py-2 rounded-lg text-xs font-mono text-slate-500">
                    ERR_AUTH_INSUFFICIENT_CLEARANCE
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { UserRole } from '@shared/types/database.types';

interface RequireRoleProps {
    allowedRoles: UserRole[];
    children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
    const userRole = localStorage.getItem('englabs_user_role') as UserRole | null;

    // Super Admin is the superuser who can access anything, otherwise check if userRole is in allowedRoles
    const hasAccess = userRole === 'Super Admin' || (userRole && allowedRoles.includes(userRole));

    if (!hasAccess) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>
                <p className="text-slate-500 text-center max-w-sm mb-8">
                    Your current role ({userRole || 'NONE'}) does not have permission to view this module. Requires one of: {allowedRoles.join(', ')}.
                </p>
                <div className="bg-slate-100 px-4 py-2 rounded-lg text-xs font-mono text-slate-500">
                    ERR_AUTH_INSUFFICIENT_CLEARANCE
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

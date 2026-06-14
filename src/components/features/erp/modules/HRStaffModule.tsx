import React, { useState } from 'react';
import { EmployeeMasterForm } from '@features/erp/modules/hr/EmployeeMasterForm';
import { AttendanceRegisterForm } from '@features/erp/modules/hr/AttendanceRegisterForm';
import { PayrollTerminal } from '@features/erp/modules/hr/PayrollTerminal';
import { LeaveRegisterForm } from '@features/erp/modules/hr/LeaveRegisterForm';
import { EmployeeDocumentsForm } from '@features/erp/modules/hr/EmployeeDocumentsForm';

export const HRStaffModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Payroll');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">HR & Staff Management</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Workforce & Labour Costs</p>
                </div>
            </div>

            <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto dark-scrollbar">
                {['Payroll', 'Attendance', 'Employee Master', 'Leave Register', 'Employee Documents'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab 
                            ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {activeTab === 'Payroll' && <PayrollTerminal />}
                {activeTab === 'Attendance' && <AttendanceRegisterForm />}
                {activeTab === 'Employee Master' && <EmployeeMasterForm />}
                {activeTab === 'Leave Register' && <LeaveRegisterForm />}
                {activeTab === 'Employee Documents' && <EmployeeDocumentsForm />}
            </div>
        </div>
    );
};

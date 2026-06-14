import React from 'react';
import { ReportingEngine } from '@features/erp/modules/reports/ReportingEngine';

export const ReportsAnalyticsModule: React.FC = () => {
    return (
        <div className="w-full h-full">
            <ReportingEngine />
        </div>
    );
};

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ERPProject } from '@domain/erp_beta_types';

interface ERPContextProps {
    selectedProjectId: string | null;
    setSelectedProjectId: (id: string | null) => void;
    isGlobalView: boolean;
    setIsGlobalView: (val: boolean) => void;
    selectedProjectData: ERPProject | null;
    setSelectedProjectData: (project: ERPProject | null) => void;
}

const ERPContext = createContext<ERPContextProps | undefined>(undefined);

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedProjectData, setSelectedProjectData] = useState<ERPProject | null>(null);
    const [isGlobalView, setIsGlobalView] = useState<boolean>(true);

    return (
        <ERPContext.Provider value={{
            selectedProjectId,
            setSelectedProjectId,
            isGlobalView,
            setIsGlobalView,
            selectedProjectData,
            setSelectedProjectData
        }}>
            {children}
        </ERPContext.Provider>
    );
};

export const useERPContext = () => {
    const context = useContext(ERPContext);
    if (!context) {
        throw new Error('useERPContext must be used within an ERPProvider');
    }
    return context;
};

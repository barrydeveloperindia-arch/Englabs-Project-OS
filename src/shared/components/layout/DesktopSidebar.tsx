import React, { useState, useEffect } from 'react';
import logo from '@/assets/englabs_logo.png';
import { Shield, Lock, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import * as Icons from 'lucide-react';
import { sidebarConfig, MenuGroup, MainMenuItem } from './sidebarConfig';

interface SidebarButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    color?: 'emerald' | 'amber';
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ active, onClick, icon, label, color = 'emerald' }) => {
    const activeClass = color === 'emerald' 
        ? 'bg-white/10 text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.25)] scale-[1.01] relative before:content-[""] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:bg-emerald-400 before:rounded-r-full' 
        : 'bg-white/10 text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.25)] scale-[1.01] relative before:content-[""] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:bg-amber-400 before:rounded-r-full';
        
    return (
        <button 
            type="button"
            onClick={onClick}
            data-testid={`sidebar-btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] transition-all duration-300 w-full text-left ${active ? activeClass : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
            {React.cloneElement(icon as React.ReactElement, { className: 'w-4.5 h-4.5' })}
            {label}
        </button>
    );
};

export interface DesktopSidebarProps {
    currentView: string;
    setCurrentView: (view: any) => void;
    userRole: string | null;
    handleLogout: () => void;
    setIsModalOpen: (isOpen: boolean) => void;
    appMode: string;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
    currentView,
    setCurrentView,
    userRole,
    handleLogout,
    setIsModalOpen,
    appMode
}) => {
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

    const isAdmin = ['ADMIN', 'Super Admin', 'Admin'].includes(userRole || '');

    // Auto-expand menu that contains the active view
    useEffect(() => {
        for (const group of sidebarConfig) {
            for (const menu of group.menus) {
                if (menu.subItems.some(sub => sub.id === currentView)) {
                    setExpandedMenus(prev => ({ ...prev, [menu.id]: true }));
                    break;
                }
            }
        }
    }, [currentView]);

    const renderIcon = (name: string) => {
        const IconComponent = (Icons as any)[name];
        if (IconComponent) {
            return <IconComponent className="w-4 h-4" />;
        }
        return <Icons.Layers className="w-4 h-4" />;
    };

    const getFilteredConfig = () => {
        return sidebarConfig.map(group => {
            if (group.roles && !group.roles.includes(userRole || '')) {
                return null;
            }
            const filteredMenus = group.menus.map(menu => {
                if (menu.roles && !menu.roles.includes(userRole || '')) {
                    return null;
                }
                const filteredSub = menu.subItems.filter(sub => {
                    return !sub.roles || sub.roles.includes(userRole || '');
                });
                if (filteredSub.length > 0) {
                    return { ...menu, subItems: filteredSub };
                }
                return null;
            }).filter(Boolean) as MainMenuItem[];
            
            if (filteredMenus.length > 0) {
                return { ...group, menus: filteredMenus };
            }
            return null;
        }).filter(Boolean) as MenuGroup[];
    };

    const filteredConfig = getFilteredConfig();

    return (
        <aside 
            className="bg-[#0e4368] hidden md:flex flex-col shadow-2xl shrink-0 border-r border-slate-800 print:hidden pt-safe"
            style={{ width: '320px', minWidth: '320px', maxWidth: '320px', zIndex: 50 }}
        >
            <div className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-3">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl group-hover:bg-emerald-500/40 transition-all rounded-xl" />
                        <div className="relative p-1 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center w-12 h-12">
                            <img src={logo} alt="ENGLABS" className="w-10 h-10 object-contain" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-white tracking-tighter leading-none">
                            {appMode === 'STORE' ? 'ENGLABS STORE' : appMode === 'PORTER_SERVICE' ? 'PORTER SERVICE' : 'ENGLABS PROJECTS'}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">PVT LTD</span>
                    </div>
                </div>
                <p className="text-[9px] font-black text-emerald-500/80 tracking-[0.25em] uppercase pl-1">
                    {appMode === 'STORE' ? 'Enterprise Store OS' : appMode === 'PORTER_SERVICE' ? 'Porter Logistics OS' : 'Enterprise Projects OS'}
                </p>
                <div className="mt-4 pl-1">
                    {isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Admin Mode
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black text-amber-400 uppercase tracking-widest">
                            <Lock className="w-3.5 h-3.5 text-amber-400" /> Staff Mode
                        </span>
                    )}
                </div>
            </div>

            {/* In the Master-Detail pattern, the sidebar ALWAYS shows the global navigation and never the project list */}
            <div className="px-6 flex flex-col gap-4 overflow-y-auto dark-scrollbar flex-1 mb-6 mt-4">
                {filteredConfig.map((group) => (
                    <div key={group.groupName} className="space-y-2">
                        <h4 className="px-3 text-[9px] font-black text-slate-400 tracking-[0.25em] uppercase opacity-75">
                            {group.groupName}
                        </h4>
                        <div className="space-y-1">
                            {group.menus.map((menu) => {
                                const isExpanded = !!expandedMenus[menu.id];
                                const hasActiveSub = menu.subItems.some(sub => sub.id === currentView);
                                
                                return (
                                    <div key={menu.id} className="space-y-1">
                                        <button
                                            type="button"
                                            data-testid={`sidebar-btn-${menu.label.toLowerCase().replace(/\s+/g, '-')}`}
                                            onClick={() => {
                                                setExpandedMenus(prev => ({
                                                    ...prev,
                                                    [menu.id]: !prev[menu.id]
                                                }));
                                                if (menu.subItems && menu.subItems.length > 0) {
                                                    setCurrentView(menu.subItems[0].id);
                                                }
                                            }}
                                            className={`flex items-center justify-between px-4 py-3 rounded-2xl font-black text-[11px] transition-all duration-300 w-full text-left cursor-pointer border border-transparent ${
                                                hasActiveSub 
                                                    ? 'bg-white/10 text-white border-white/10 shadow-md' 
                                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {renderIcon(menu.iconName)}
                                                <span>{menu.label}</span>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 opacity-60" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 opacity-60" />
                                            )}
                                        </button>
                                        
                                        {isExpanded && (
                                            <div className="pl-8 pr-2 py-1 space-y-1 flex flex-col border-l border-slate-700/55 ml-6">
                                                {menu.subItems.map((sub) => {
                                                    const isSubActive = currentView === sub.id;
                                                    return (
                                                        <button
                                                            key={sub.id}
                                                            type="button"
                                                            onClick={() => setCurrentView(sub.id)}
                                                            className={`text-[10px] font-bold py-2 transition-all text-left cursor-pointer ${
                                                                isSubActive 
                                                                    ? 'text-emerald-400 font-extrabold shadow-sm' 
                                                                    : 'text-slate-400 hover:text-slate-200'
                                                            }`}
                                                        >
                                                            {sub.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 border-t border-slate-800 shrink-0 space-y-3 mt-auto">
                {isAdmin && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        data-testid="btn-new-mission"
                        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-950/20 cursor-pointer"
                    >
                        <Plus className="w-5 h-5" /> NEW MISSION
                    </button>
                )}
                <button 
                    onClick={handleLogout}
                    className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer text-xs"
                >
                    <Lock className="w-4 h-4" /> LOCK SYSTEM
                </button>
            </div>
        </aside>
    );
};


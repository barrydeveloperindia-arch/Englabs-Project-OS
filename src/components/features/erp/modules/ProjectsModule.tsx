import React, { useState, useEffect } from 'react';
import { useERPContext } from '@features/erp/context/ERPContext';
import { ERPProject, ERPProjectStatus } from '@domain/erp_beta_types';
import { ProjectMasterTable } from '@features/erp/modules/projects/ProjectMasterTable';
import { ProjectDetailView } from '@features/erp/modules/projects/ProjectDetailView';
import { ProjectForm } from '@features/erp/modules/projects/ProjectForm';
import { db, auth } from '@services/firebase';
import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';

export interface ProjectsModuleProps {
    initialView?: string;
}

export const ProjectsModule: React.FC<ProjectsModuleProps> = ({ initialView }) => {
    const { isGlobalView, selectedProjectId, setSelectedProjectData } = useERPContext();
    const [activeTab, setActiveTab] = useState('Active Projects');
    const [selectedProject, setSelectedProject] = useState<ERPProject | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Live data state
    const [projects, setProjects] = useState<ERPProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);

    // Sync from sidebar navigation
    useEffect(() => {
        if (initialView === 'create') {
            setSelectedProject(null);
            setIsFormOpen(true);
        } else if (initialView === 'list') {
            setIsFormOpen(false);
            setActiveTab('Active Projects');
        } else if (initialView === 'dashboard') {
            setIsFormOpen(false);
            setActiveTab('Project Dashboard');
        }
    }, [initialView]);

    const fetchProjects = async (isLoadMore = false) => {
        try {
            const projectsRef = collection(db, 'projects_master');
            let q = query(projectsRef, orderBy('createdAt', 'desc'), limit(20));

            if (isLoadMore && lastDoc) {
                q = query(projectsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(20));
            }

            const snapshot = await getDocs(q);
            const fetchedProjects: ERPProject[] = [];
            
            snapshot.forEach(doc => {
                fetchedProjects.push({ id: doc.id, ...doc.data() } as ERPProject);
            });

            if (isLoadMore) {
                setProjects(prev => [...prev, ...fetchedProjects]);
            } else {
                setProjects(fetchedProjects);
            }

            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === 20);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isFormOpen && activeTab !== 'Project Dashboard' && activeTab !== 'Reports') {
            fetchProjects();
        }
    }, [isFormOpen, activeTab]);

    // Sync selected project
    useEffect(() => {
        if (selectedProjectId) {
            const proj = projects.find(p => p.id === selectedProjectId);
            if (proj) setSelectedProjectData(proj);
        } else {
            setSelectedProjectData(null);
        }
    }, [selectedProjectId, projects, setSelectedProjectData]);

    const handleRowClick = (project: ERPProject) => {
        setSelectedProject(project);
    };

    const TABS = [
        'Active Projects', 
        'Running Projects', 
        'Under Progress', 
        'On Hold', 
        'Completed', 
        'Cancelled', 
        'Project Dashboard', 
        'Reports'
    ];

    if (isFormOpen) {
        return (
            <div className="space-y-6 animate-fade-in flex flex-col h-full">
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Projects Command</h1>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Project Master Database</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ProjectForm 
                        initialData={selectedProject}
                        onClose={() => setIsFormOpen(false)} 
                        onSuccess={() => {
                            setIsFormOpen(false);
                            fetchProjects();
                            if (selectedProject) setSelectedProject(null);
                        }} 
                    />
                </div>
            </div>
        );
    }

    if (selectedProject && !isGlobalView) {
        return (
            <div className="space-y-6 animate-fade-in flex flex-col h-full">
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">{selectedProject.id}: {selectedProject.projectName}</h1>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">{selectedProject.clientName}</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsFormOpen(true)}
                            className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-200 transition-colors"
                        >
                            Edit Project
                        </button>
                        <button 
                            onClick={() => setSelectedProject(null)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                        >
                            Back to Master
                        </button>
                    </div>
                </div>
                <ProjectDetailView project={selectedProject} />
            </div>
        );
    }

    let displayProjects = projects;
    if (activeTab === 'Active Projects') displayProjects = projects.filter(p => p.status !== 'Closed' && p.status !== 'Completed');
    else if (activeTab === 'Running Projects') displayProjects = projects.filter(p => p.status === 'Running' || (p.status as string) === 'EXECUTION');
    else if (activeTab === 'Under Progress') displayProjects = projects.filter(p => p.status === 'Under Progress');
    else if (activeTab === 'On Hold') displayProjects = projects.filter(p => p.status === 'On Hold' || (p.status as string) === 'ON_HOLD');
    else if (activeTab === 'Completed') displayProjects = projects.filter(p => p.status === 'Completed' || (p.status as string) === 'COMPLETED');
    else if (activeTab === 'Cancelled') displayProjects = projects.filter(p => p.status === 'Cancelled' || (p.status as string) === 'CANCELLED');

    return (
        <div className="space-y-6 animate-fade-in flex flex-col h-full">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Projects Command</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Project Master Database</p>
                </div>
                <button 
                    onClick={() => { setSelectedProject(null); setIsFormOpen(true); }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                    + New Project
                </button>
            </div>

            <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto dark-scrollbar shrink-0">
                {TABS.map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'Project Dashboard' || activeTab === 'Reports' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
                        <h3 className="text-lg font-black text-slate-700">{activeTab}</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto font-medium">This aggregate view is being built. Select Active Projects to see the master table.</p>
                    </div>
                ) : loading && projects.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-sm font-bold text-slate-500">
                        Loading Projects...
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-hidden">
                            <ProjectMasterTable 
                                projects={displayProjects} 
                                onRowClick={handleRowClick} 
                            />
                        </div>
                        {hasMore && (
                            <div className="mt-4 flex justify-center shrink-0">
                                <button 
                                    onClick={() => fetchProjects(true)}
                                    className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest rounded-full transition-colors"
                                >
                                    Load More Projects
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

import sys

file_path = 'src/App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
imports_to_add = '''
import { DesktopSidebar } from '@components/layout/DesktopSidebar';
import { MobileLayout } from '@components/layout/MobileLayout';
import { ProjectListGrid } from '@features/project/ProjectListGrid';
import { ProjectDashboard } from '@features/project/ProjectDashboard';
'''
# Find the last import
last_import_idx = content.rfind('import ')
end_of_last_import = content.find('\n', last_import_idx)
content = content[:end_of_last_import] + imports_to_add + content[end_of_last_import:]

lines = content.split('\n')
start_idx = -1
for i, line in enumerate(lines):
    if 'print:bg-white' in line:
        start_idx = i - 1
        break

if start_idx == -1:
    print('Could not find return block')
    sys.exit(1)

new_return_block = '''    return (
        <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white">
            <DesktopSidebar 
                currentView={currentView}
                setCurrentView={setCurrentView}
                userRole={userRole}
                handleLogout={handleLogout}
                setIsModalOpen={setIsModalOpen}
                appMode={import.meta.env.VITE_APP_MODE || 'PROJECTS'}
            />

            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pb-16 md:pb-0">
                {currentView === 'PROJECTS' ? (
                    !selectedProject ? (
                        <ProjectListGrid 
                            projects={projects}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            projectFilter={projectFilter}
                            setProjectFilter={setProjectFilter}
                            onSelectProject={setSelectedProject}
                        />
                    ) : (
                        <ProjectDashboard 
                            selectedProject={selectedProject}
                            onBack={() => setSelectedProject(null)}
                            userRole={userRole}
                            updateStage={(stageName, newStatus) => {
                                setProjects(prev => prev.map(p => {
                                    if (p.projectId === selectedProject.projectId) {
                                        return {
                                            ...p,
                                            production: {
                                                ...p.production,
                                                stages: p.production.stages.map(s => s.name === stageName ? { ...s, status: newStatus } : s)
                                            }
                                        };
                                    }
                                    return p;
                                }));
                                setSelectedProject(prev => prev ? {
                                    ...prev,
                                    production: {
                                        ...prev.production,
                                        stages: prev.production.stages.map(s => s.name === stageName ? { ...s, status: newStatus } : s)
                                    }
                                } : null);
                            }}
                            recentCheckouts={recentCheckouts}
                            handleCheckoutSubmit={handleCheckoutSubmit}
                            checkoutItemCode={checkoutItemCode}
                            setCheckoutItemCode={setCheckoutItemCode}
                            inventoryItems={inventoryItems}
                            checkoutQty={checkoutQty}
                            setCheckoutQty={setCheckoutQty}
                            checkoutStaffName={checkoutStaffName}
                            setCheckoutStaffName={setCheckoutStaffName}
                            staffList={staffList}
                            setIsAddStaffModalOpen={setIsAddStaffModalOpen}
                            checkoutLoading={checkoutLoading}
                        />
                    )
                ) : currentView === 'PROJECT_LOOKUP' ? (
                    <ProjectLookupDashboard />
                ) : currentView === 'PROJECT_BUDGETS' ? (
                    <ProjectBudgets projects={projects} />
                ) : currentView === 'GATE_REGISTER' ? (
                    <GateRegister 
                        entries={gateEntries} 
                        onNewEntry={handleNewGateEntry}
                        onUpdateEntry={handleUpdateGateEntry}
                        onDeleteEntry={handleDeleteGateEntry}
                        onLog={(log) => setAuditLogs(prev => [log, ...prev])} 
                        onFullSync={handleFullSync}
                    />
                ) : currentView === 'FOOD_REGISTER' ? (
                    <FoodRegister onLog={(log) => setAuditLogs(prev => [log, ...prev])} />
                ) : currentView === 'BILLING' ? (
                    <BillingDashboard />
                ) : currentView === 'MANAGEMENT_DASHBOARD' ? (
                    <ManagementDashboard />
                ) : currentView === 'SKY5_TERMINAL' ? (
                    <Sky5Terminal />
                ) : currentView === 'INVENTORY' ? (
                    <InventoryManager />
                ) : currentView === 'STOCK_REPORT' ? (
                    <StoreStockReport 
                        userRole={userRole || 'STAFF'} 
                        projects={projects} 
                        staffList={staffList}
                        onAddStaff={handleAddStaff}
                        onAddProject={(newProj) => setProjects(prev => [...prev, newProj])}
                    />
                ) : currentView === 'STORE_GUARDIAN' ? (
                    <StoreGuardianDashboard />
                ) : currentView === 'PORTER_SERVICE' ? (
                    <PorterRegister 
                        trips={porterTrips}
                        onNewTrip={(trip) => setPorterTrips(prev => [trip, ...prev])}
                        onUpdateTrip={(updated) => setPorterTrips(prev => prev.map(t => t.id === updated.id ? updated : t))}
                        onDeleteTrip={(id) => {
                            setPorterTrips(prev => prev.filter(t => t.id !== id));
                            try {
                                const deletedSaved = localStorage.getItem('englabs_porter_deleted_ids');
                                const deletedIds = deletedSaved ? JSON.parse(deletedSaved) : [];
                                if (!deletedIds.includes(id)) {
                                    deletedIds.push(id);
                                    localStorage.setItem('englabs_porter_deleted_ids', JSON.stringify(deletedIds));
                                }
                            } catch (e) {
                                console.error("Failed to save deleted ID:", e);
                            }
                        }}
                    />
                ) : currentView === 'HOME' ? (
                    <div className="md:hidden h-full">
                        <MobileDashboard 
                            projects={projects} 
                            gateEntries={gateEntries} 
                            recentCheckouts={recentCheckouts} 
                            onQuickAction={(action) => {
                                if (action === 'GATE_ENTRY') setCurrentView('GATE_REGISTER');
                                if (action === 'CHECKOUT') setCurrentView('INVENTORY');
                                if (action === 'PORTER') setCurrentView('PORTER_SERVICE');
                                if (action === 'PROJECT_UPDATE') setCurrentView('PROJECTS');
                            }} 
                        />
                    </div>
                ) : (
                    <DigitalEvidence onAutoRegister={handleNewGateEntry} />
                )}
            </div>

            <MobileLayout 
                currentView={currentView}
                setCurrentView={setCurrentView}
                userRole={userRole}
                handleLogout={handleLogout}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={(newProj) => setProjects(prev => [...prev, newProj])} />
            <AddStaffModal isOpen={isAddStaffModalOpen} onClose={() => setIsAddStaffModalOpen(false)} onAdd={handleAddStaff} existingStaff={staffList} />
        </div>
    );
};

export default App;
'''

content = '\n'.join(lines[:start_idx]) + '\n' + new_return_block

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('App.tsx successfully refactored!')

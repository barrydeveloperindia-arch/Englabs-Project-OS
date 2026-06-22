import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '@services/firebase';
import legacyData from '@data/master_projects_db.json';

/**
 * MIGRATION PROTOCOL
 * 1. Validates existing JSON records before pushing
 * 2. Preserves historical dates
 * 3. Appends mandatory global audit fields (createdBy, modifiedAt, etc.)
 */
export const migrateProjectsToFirestore = async () => {
    try {
        console.log(`Starting migration of ${legacyData.length} legacy records...`);
        const batch = writeBatch(db);
        const projectsRef = collection(db, 'projects_master');
        
        let validCount = 0;
        let errorCount = 0;

        legacyData.forEach((project: any) => {
            // Validation
            if (!project.id || !project.id.startsWith('C')) {
                console.warn(`Skipping invalid project format: ${project.id}`);
                errorCount++;
                return;
            }

            const docRef = doc(projectsRef, project.id);
            const migratedData = {
                id: project.id,
                projectId: project.id,
                projectName: project.projectName || 'Unknown',
                clientName: project.clientName || 'Unknown',
                status: project.status || 'ACTIVE',
                poAmount: project.poAmount || 0,
                budgetAmount: project.budget || 0,
                
                // Cost Totals mapped from legacy fields
                costTotals: {
                    materialCost: project.materialCost || 0,
                    vendorCost: project.vendorCost || 0,
                    labourCost: project.labourCost || 0,
                    siteCost: project.siteCost || 0,
                    miscellaneousCost: project.miscellaneousCost || 0
                },
                
                // Mandatory Audit Fields
                createdBy: 'SYSTEM_MIGRATION',
                createdAt: project.date || new Date().toISOString(), // Preserve history
                modifiedBy: 'SYSTEM_MIGRATION',
                modifiedAt: new Date().toISOString(),
                notes: 'Migrated from legacy JSON database'
            };

            batch.set(docRef, migratedData);
            validCount++;
        });

        await batch.commit();
        console.log(`Migration Complete: ${validCount} records pushed successfully. ${errorCount} records skipped.`);
        return true;
    } catch (error) {
        console.error('Migration failed:', error);
        return false;
    }
};

export type ProjectStageStatus = 'Pending' | 'In Progress' | 'Completed';

export interface ProjectStage {
    name: string;
    status: ProjectStageStatus;
    lead?: string;
    timeTaken?: string;
    completedAt?: string;
}

export interface ProjectData {
    projectId: string;
    client: string;
    planning: {
        value: number;
        budget: number;
        deliveryTerms: 'ToPay' | 'Porter';
        poConfirmed: boolean;
        startDate: string;
    };
    production: {
        currentStage: string;
        stages: ProjectStage[];
    };
    metrics: {
        totalComponents: number;
        materialConsumption: string;
        workforce: string[];
    };
}

export const STAGES = [
    'Engineering Design',
    'Machine Processing',
    'Workshop Fabrication',
    'Sanding',
    'Painting',
    'Drying',
    'Finishing',
    'Final Packaging'
];

export function calculateBudgetUtilization(project: ProjectData): number {
    if (project.planning.value === 0) return 0;
    return (project.planning.budget / project.planning.value) * 100;
}

export function getNextStage(currentStage: string): string | null {
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === STAGES.length - 1) return null;
    return STAGES[currentIndex + 1];
}

export function isCXXXFormat(id: string): boolean {
    return /^C\d{3,}$/.test(id);
}

import { describe, it, expect } from 'vitest';
import { calculateBudgetUtilization, getNextStage, isCXXXFormat, ProjectData } from '@domain/project';

describe('Antigravity Project Logic', () => {
    it('should correctly calculate budget utilization', () => {
        const mockProject = {
            planning: { value: 1000, budget: 500 }
        } as ProjectData;
        expect(calculateBudgetUtilization(mockProject)).toBe(50);
    });

    it('should return 0 utilization if value is 0', () => {
        const mockProject = {
            planning: { value: 0, budget: 500 }
        } as ProjectData;
        expect(calculateBudgetUtilization(mockProject)).toBe(0);
    });

    it('should correctly identify the next stage', () => {
        expect(getNextStage('Engineering Design')).toBe('Machine Processing');
        expect(getNextStage('Final Packaging')).toBe(null);
    });

    it('should validate CXXX format', () => {
        expect(isCXXXFormat('C001')).toBe(true);
        expect(isCXXXFormat('C1234')).toBe(true);
        expect(isCXXXFormat('A001')).toBe(false);
        expect(isCXXXFormat('C01')).toBe(false);
    });
});

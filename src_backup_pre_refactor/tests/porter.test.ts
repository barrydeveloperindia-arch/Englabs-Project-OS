import { describe, it, expect } from 'vitest';
import { calculatePorterAmount, generatePorterId } from '@domain/porter_system';

describe('Porter System Logic', () => {
    it('should correctly calculate trip amount including bike charges and advances', () => {
        const result = calculatePorterAmount(10, 15, 100, 50, 0, 0, 75);
        expect(result.gross).toBe(300); // (10*15) + 100 + 50 = 300
        expect(result.balance).toBe(225); // 300 - 75 = 225
    });

    it('should handle zero charges and advances correctly', () => {
        const result = calculatePorterAmount(10, 15, 0, 0, 0, 0, 0);
        expect(result.gross).toBe(150);
        expect(result.balance).toBe(150);
    });

    it('should handle decimal precision in advanced calculations', () => {
        const result = calculatePorterAmount(10.5, 20, 12.5, 45.25, 5, 2.75, 50);
        // (10.5 * 20) = 210
        // 210 + 12.5 + 45.25 + 5 + 2.75 = 275.5
        // Gross: 275.5
        // Balance: 275.5 - 50 = 225.5
        expect(result.gross).toBe(275.5);
        expect(result.balance).toBe(225.5);
    });

    it('should generate standardized Porter IDs', () => {
        expect(generatePorterId(0)).toBe('PTR-2026-0001');
        expect(generatePorterId(99)).toBe('PTR-2026-0100');
    });

    it('should correctly calculate the start of week for Monday-to-Sunday week grouping', () => {
        const getStartOfWeek = (dateStr: string): string => {
            const parts = dateStr.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            
            const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...
            const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const monday = new Date(date.setDate(diff));
            
            const yyyy = monday.getFullYear();
            const mm = String(monday.getMonth() + 1).padStart(2, '0');
            const dd = String(monday.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        // Thursday, 14 May 2026 -> Monday, 11 May 2026
        expect(getStartOfWeek('2026-05-14')).toBe('2026-05-11');
        // Sunday, 17 May 2026 -> Monday, 11 May 2026
        expect(getStartOfWeek('2026-05-17')).toBe('2026-05-11');
        // Monday, 1 June 2026 -> Monday, 1 June 2026
        expect(getStartOfWeek('2026-06-01')).toBe('2026-06-01');
        // Sunday, 7 June 2026 -> Monday, 1 June 2026
        expect(getStartOfWeek('2026-06-07')).toBe('2026-06-01');
    });
});

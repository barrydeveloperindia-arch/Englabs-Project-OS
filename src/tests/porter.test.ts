import { describe, it, expect } from 'vitest';
import { calculatePorterAmount, generatePorterId } from '../lib/porter_system';

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
});

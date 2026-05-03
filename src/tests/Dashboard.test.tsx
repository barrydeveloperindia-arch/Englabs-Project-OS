import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import React from 'react';

// Mock Lucide icons to avoid rendering issues in tests
vi.mock('lucide-react', () => ({
    Search: () => <div data-testid="search-icon" />,
    Plus: () => <div data-testid="plus-icon" />,
    Activity: () => <div data-testid="activity-icon" />,
    DollarSign: () => <div data-testid="dollar-icon" />,
    Users: () => <div data-testid="users-icon" />,
    Package: () => <div data-testid="package-icon" />,
    ChevronRight: () => <div data-testid="chevron-icon" />,
    CheckCircle2: () => <div data-testid="check-icon" />,
    Clock: () => <div data-testid="clock-icon" />,
    AlertCircle: () => <div data-testid="alert-icon" />,
    X: () => <div data-testid="x-icon" />,
    Save: () => <div data-testid="save-icon" />
}));

describe('Antigravity Dashboard UI', () => {
    it('renders the main dashboard title', () => {
        render(<App />);
        expect(screen.getByText('Mission Control')).toBeDefined();
    });

    it('displays the default mock project', () => {
        render(<App />);
        expect(screen.getAllByText('Standard Engineering Ltd').length).toBeGreaterThan(0);
        expect(screen.getAllByText('C001').length).toBeGreaterThan(0);
    });

    it('opens the New Project modal when clicking the button', () => {
        render(<App />);
        const newProjectBtn = screen.getByText('New Project');
        fireEvent.click(newProjectBtn);
        expect(screen.getByText('Initialize Project')).toBeDefined();
    });

    it('filters projects based on search query', () => {
        render(<App />);
        const searchInput = screen.getByPlaceholderText('Search CXXX projects...');
        
        // Search for non-existent project
        fireEvent.change(searchInput, { target: { value: 'XYZ' } });
        expect(screen.queryAllByText('Standard Engineering Ltd').length).toBe(0);
        
        // Search for existing project
        fireEvent.change(searchInput, { target: { value: 'C001' } });
        expect(screen.getAllByText('Standard Engineering Ltd').length).toBeGreaterThan(0);
    });
});

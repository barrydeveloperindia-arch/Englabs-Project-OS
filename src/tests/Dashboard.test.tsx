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
    Save: () => <div data-testid="save-icon" />,
    Layers: () => <div data-testid="layers-icon" />,
    Box: () => <div data-testid="box-icon" />,
    Layout: () => <div data-testid="layout-icon" />,
    Settings: () => <div data-testid="settings-icon" />,
    Bell: () => <div data-testid="bell-icon" />,
    ExternalLink: () => <div data-testid="link-icon" />,
    TrendingUp: () => <div data-testid="trending-icon" />,
    Target: () => <div data-testid="target-icon" />,
    Calendar: () => <div data-testid="calendar-icon" />,
    Shield: () => <div data-testid="shield-icon" />,
    Utensils: () => <div data-testid="utensils-icon" />,
    CreditCard: () => <div data-testid="credit-card-icon" />,
    FileText: () => <div data-testid="file-text-icon" />,
    Loader2: () => <div data-testid="loader-icon" />
}));

describe('Antigravity Dashboard UI', () => {
    it('renders the main dashboard title', async () => {
        render(<App />);
        expect(await screen.findByText('Mission Control')).toBeDefined();
    });

    it('displays the default mock project', async () => {
        render(<App />);
        // Wait for the project to load (appears in sidebar and hero)
        const elements = await screen.findAllByText('Standard Engineering Ltd');
        expect(elements.length).toBeGreaterThan(0);
        
        const idElements = await screen.findAllByText('C001');
        expect(idElements.length).toBeGreaterThan(0);
    });

    it('opens the New Project modal when clicking the button', async () => {
        render(<App />);
        const newProjectBtn = await screen.findByText('NEW MISSION');
        fireEvent.click(newProjectBtn);
        expect(await screen.findByText('Initialize Mission')).toBeDefined();
    });

    it('filters projects based on search query', async () => {
        render(<App />);
        const searchInput = await screen.findByPlaceholderText('Search Projects...');
        
        // Search for non-existent project
        fireEvent.change(searchInput, { target: { value: 'XYZ' } });
        
        // It should still be in the Hero Card (active project), 
        // but should NOT be in the sidebar anymore.
        // We can check if the sidebar list has only the active project or is empty if we filter hard.
        // Let's just check that only 1 remains (the Hero Card one) instead of 2.
        expect(screen.getAllByText('Standard Engineering Ltd').length).toBe(1);
        
        // Search for existing project
        fireEvent.change(searchInput, { target: { value: 'C001' } });
        const elements = await screen.findAllByText('Standard Engineering Ltd');
        expect(elements.length).toBeGreaterThan(1); // One in hero, one in sidebar
    });
});

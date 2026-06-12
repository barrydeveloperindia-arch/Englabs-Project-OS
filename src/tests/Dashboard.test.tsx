import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import React from 'react';

// 🛡️ ICON MOCKS: Common icons used in the dashboard
vi.mock('lucide-react', () => ({
    Search: () => <div data-testid="icon-search" />,
    Plus: () => <div data-testid="icon-plus" />,
    Activity: () => <div data-testid="icon-activity" />,
    Box: () => <div data-testid="icon-box" />,
    Shield: () => <div data-testid="icon-shield" />,
    Utensils: () => <div data-testid="icon-utensils" />,
    ChefHat: () => <div data-testid="icon-chef-hat" />,
    TrendingUp: () => <div data-testid="icon-trending" />,
    AlertCircle: () => <div data-testid="icon-alert" />,
    Clock: () => <div data-testid="icon-clock" />,
    Users: () => <div data-testid="icon-users" />,
    DollarSign: () => <div data-testid="icon-dollar" />,
    Package: () => <div data-testid="icon-package" />,
    ChevronRight: () => <div data-testid="icon-chevron" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
    X: () => <div data-testid="icon-x" />,
    Save: () => <div data-testid="icon-save" />,
    Layers: () => <div data-testid="icon-layers" />,
    Layout: () => <div data-testid="icon-layout" />,
    Settings: () => <div data-testid="icon-settings" />,
    Bell: () => <div data-testid="icon-bell" />,
    ExternalLink: () => <div data-testid="icon-link" />,
    Target: () => <div data-testid="icon-target" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    CreditCard: () => <div data-testid="icon-credit" />,
    FileText: () => <div data-testid="icon-file" />,
    Loader2: () => <div data-testid="icon-loader" />,
    History: () => <div data-testid="icon-history" />,
    LogIn: () => <div data-testid="icon-login" />,
    LogOut: () => <div data-testid="icon-logout" />,
    MessageSquare: () => <div data-testid="icon-message" />,
    Edit2: () => <div data-testid="icon-edit" />,
    Trash2: () => <div data-testid="icon-trash" />,
    Printer: () => <div data-testid="icon-printer" />,
    Download: () => <div data-testid="icon-download" />,
    ShieldCheck: () => <div data-testid="icon-shield-check" />,
    ArrowUpRight: () => <div data-testid="icon-arrow-up" />,
    ArrowDownRight: () => <div data-testid="icon-arrow-down" />,
    ArrowRight: () => <div data-testid="icon-arrow-right" />,
    Database: () => <div data-testid="icon-database" />,
    Truck: () => <div data-testid="icon-truck" />,
    Navigation: () => <div data-testid="icon-navigation" />,
    MapPin: () => <div data-testid="icon-map-pin" />,
    IndianRupee: () => <div data-testid="icon-rupee" />,
    MoreHorizontal: () => <div data-testid="icon-more-horizontal" />,
    ListTodo: () => <div data-testid="icon-list-todo" />,
    Zap: () => <div data-testid="icon-zap" />,
    Mail: () => <div data-testid="icon-mail" />,
    Filter: () => <div data-testid="icon-filter" />,
    Briefcase: () => <div data-testid="icon-briefcase" />,
    Paperclip: () => <div data-testid="icon-paperclip" />,
    Send: () => <div data-testid="icon-send" />,
    FolderTree: () => <div data-testid="icon-folder" />,
    PieChart: () => <div data-testid="icon-piechart" />,
    Lock: () => <div data-testid="icon-lock" />,
    MoreVertical: () => <div data-testid="icon-more-vertical" />,
    Share2: () => <div data-testid="icon-share" />,
    RefreshCcw: () => <div data-testid="icon-refresh" />,
    ChevronLeft: () => <div data-testid="icon-chevron-left" />,
    HelpCircle: () => <div data-testid="icon-help" />,
    UserCheck: () => <div data-testid="icon-user-check" />
}));

// 🛡️ SERVICE MOCKS: Decouple UI from backend logic
vi.mock('@services/database_service', () => ({
    fetchGateEntries: vi.fn(() => Promise.resolve([])),
    saveGateEntry: vi.fn(() => Promise.resolve({ success: true })),
    syncLocalToFirebase: vi.fn(() => Promise.resolve(true)),
    syncAllProjectsToFirebase: vi.fn(() => Promise.resolve(true))
}));

vi.mock('@domain/inventory_service', () => ({
    processInventoryUpdate: vi.fn(() => Promise.resolve([{ success: true }])),
    fetchInventoryMaster: vi.fn(() => Promise.resolve([])),
    fetchStockMovement: vi.fn(() => Promise.resolve([]))
}));

vi.mock('@domain/system_guard', () => ({
    logAction: vi.fn(),
    AuditLog: vi.fn()
}));

vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockImplementation(() => ({
            generateContent: vi.fn().mockResolvedValue({
                response: {
                    text: () => JSON.stringify({
                        partyName: 'MOCK VENDOR',
                        invoiceNumber: 'INV-001',
                        date: '2026-05-14',
                        items: []
                    })
                }
            })
        }))
    }))
}));

describe('Antigravity Dashboard UI', () => {
    beforeEach(() => {
        localStorage.setItem('englabs_authenticated', 'true');
        localStorage.setItem('englabs_user_role', 'ADMIN');
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('renders the main dashboard title', async () => {
        render(<App />);
        try {
            const initBtn = await screen.findByText('Initialize Workday', {}, { timeout: 1000 });
            if (initBtn) fireEvent.click(initBtn);
        } catch(e) {}
        expect(await screen.findByText('Mission Control')).toBeDefined();
    });

    it('displays the default mock project', async () => {
        render(<App />);
        try {
            const initBtn = await screen.findByText('Initialize Workday', {}, { timeout: 1000 });
            if (initBtn) fireEvent.click(initBtn);
        } catch(e) {}
        // Wait for the project to load (appears in sidebar and hero)
        const elements = await screen.findAllByText('THROTTLE AEROSPACE');
        expect(elements.length).toBeGreaterThan(0);
        
        const idElements = await screen.findAllByText('C2718');
        expect(idElements.length).toBeGreaterThan(0);
    });

    it('opens the New Project modal when clicking the button', async () => {
        render(<App />);
        try {
            const initBtn = await screen.findByText('Initialize Workday', {}, { timeout: 1000 });
            if (initBtn) fireEvent.click(initBtn);
        } catch(e) {}
        const newProjectBtn = await screen.findByText('NEW MISSION');
        fireEvent.click(newProjectBtn);
        expect(await screen.findByText('Initialize Mission')).toBeDefined();
    });

    it('filters projects based on search query', async () => {
        render(<App />);
        try {
            const initBtn = await screen.findByText('Initialize Workday', {}, { timeout: 1000 });
            if (initBtn) fireEvent.click(initBtn);
        } catch(e) {}
        const searchInput = await screen.findByPlaceholderText('Search Projects...');
        
        // Search for non-existent project
        fireEvent.change(searchInput, { target: { value: 'XYZ' } });
        
        // It should still be in the Hero Card (active project), 
        // but should NOT be in the sidebar anymore.
        // We can check if the sidebar list has only the active project or is empty if we filter hard.
        // Let's just check that only 1 remains (the Hero Card one) instead of 2.
        expect(screen.getAllByText('THROTTLE AEROSPACE').length).toBe(1);
        
        // Search for existing project
        fireEvent.change(searchInput, { target: { value: 'C2718' } });
        const elements = await screen.findAllByText('THROTTLE AEROSPACE');
        expect(elements.length).toBeGreaterThan(1); // One in hero, one in sidebar
    });
});

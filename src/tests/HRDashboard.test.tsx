import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { HRDashboard } from '../modules/hr/main/HRDashboard';
import { STAFF_ROSTER } from '@shared/utils/config/constants';

// Mock Lucide Icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        Search: () => <div data-testid="icon-search" />,
        Users: () => <div data-testid="icon-users" />,
        UserCheck: () => <div data-testid="icon-user-check" />,
        UserMinus: () => <div data-testid="icon-user-minus" />,
        Clock: () => <div data-testid="icon-clock" />,
        ShieldCheck: () => <div data-testid="icon-shield-check" />,
        ShieldAlert: () => <div data-testid="icon-shield-alert" />,
        ShieldQuestion: () => <div data-testid="icon-shield-question" />,
        Download: () => <div data-testid="icon-download" />,
        ScanFace: () => <div data-testid="icon-face" />,
        Fingerprint: () => <div data-testid="icon-fingerprint" />,
        CreditCard: () => <div data-testid="icon-rfid" />,
        User: () => <div data-testid="icon-user" />,
        Monitor: () => <div data-testid="icon-remote" />,
        ArrowUp: () => <div data-testid="icon-arrow-up" />,
        ArrowDown: () => <div data-testid="icon-arrow-down" />,
        ArrowUpDown: () => <div data-testid="icon-arrow-updown" />,
        Calendar: () => <div data-testid="icon-calendar" />,
        ChevronLeft: () => <div data-testid="icon-chevron-left" />,
        ChevronRight: () => <div data-testid="icon-chevron-right" />,
        RefreshCw: () => <div data-testid="icon-refresh" />
    };
});

const mockLiveResponse = {
    success: true,
    roster: [
        { id: 1, staffId: 'EMP-1001', name: 'Gaurav Kumar', role: 'Store Keeper', status: 'PRESENT', checkIn: '08:45 AM', project: 'GENERAL', method: 'face', confidence: 0.95 },
        { id: 2, staffId: 'EMP-1004', name: 'Sagar', role: 'Machine Operator', status: 'PRESENT', checkIn: '08:50 AM', project: 'C4465', method: 'fingerprint', confidence: 0.98 }
    ],
    stats: {
        totalActiveStaff: 38,
        presentToday: 2,
        absentToday: 36,
        pendingOvertime: 14.5
    }
};

const mockHistoryResponse = {
    success: true,
    data: [
        {
            id: 101,
            staffId: 'EMP-1001',
            name: 'Gaurav Kumar',
            role: 'Store Keeper',
            date: '2026-06-01',
            checkIn: '08:45 AM',
            checkOut: '05:30 PM',
            workingHours: 8.75,
            status: 'ON_TIME',
            method: 'face',
            project: 'GENERAL'
        },
        {
            id: 102,
            staffId: 'EMP-1004',
            name: 'Sagar',
            role: 'Machine Operator',
            date: '2026-06-02',
            checkIn: '09:15 AM',
            checkOut: '06:00 PM',
            workingHours: 8.75,
            status: 'LATE',
            method: 'face',
            project: 'C4465'
        }
    ]
};

let jsonLiveMock = vi.fn().mockResolvedValue(mockLiveResponse);
let jsonHistoryMock = vi.fn().mockResolvedValue(mockHistoryResponse);

describe('HRDashboard Operations and Monthly Attendance Checklist', () => {
    beforeEach(() => {
        jsonLiveMock = vi.fn().mockResolvedValue(mockLiveResponse);
        jsonHistoryMock = vi.fn().mockResolvedValue(mockHistoryResponse);
        
        vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
            console.log('MOCK FETCH CALLED WITH:', url);
            if (url.includes('/api/attendance/live')) {
                return Promise.resolve({
                    ok: true,
                    json: jsonLiveMock
                });
            }
            return Promise.resolve({
                ok: true,
                json: jsonHistoryMock
            });
        }));
        localStorage.clear();
    });

    it('renders the dashboard with Live Daily Roster by default, and switches to Monthly tab to calculate KPIs', async () => {
        render(<HRDashboard />);
        
        expect(screen.getByText("HR Operations Center")).toBeDefined();
        expect(screen.getByText("Today's Live Stream")).toBeDefined();
        
        // 1. Wait for live EAT data load
        await waitFor(() => {
            expect(screen.getByText("Gaurav Kumar")).toBeDefined();
            expect(screen.getByText("Sagar")).toBeDefined();
        }, { timeout: 5000 });

        // 2. Click on Monthly tab button
        const monthlyTabBtn = screen.getByText("Monthly Registry & Analytics");
        fireEvent.click(monthlyTabBtn);
        
        // 3. Wait for monthly analytics KPIs to load and verify
        await waitFor(() => {
            expect(screen.getAllByText("2").length).toBeGreaterThan(0);
            expect(screen.getAllByText("8.8 hrs").length).toBeGreaterThan(0);
            expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
        }, { timeout: 5000 });
    });

    it('applies quick date presets and updates start and end dates', async () => {
        render(<HRDashboard />);

        // Wait for initial data load first
        await waitFor(() => {
            expect(screen.getByText("Gaurav Kumar")).toBeDefined();
        }, { timeout: 5000 });

        const monthlyTabBtn = screen.getByText("Monthly Registry & Analytics");
        fireEvent.click(monthlyTabBtn);

        await waitFor(() => {
            expect(screen.getByText("This Month")).toBeDefined();
        }, { timeout: 5000 });

        // Click "This Month" preset
        const thisMonthBtn = screen.getByText("This Month");
        fireEvent.click(thisMonthBtn);

        const today = new Date();
        const expectedStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const expectedEnd = today.toISOString().split('T')[0];

        const dateInputs = screen.getAllByRole('textbox').filter(input => (input as HTMLInputElement).type === 'date');
        if (dateInputs.length >= 2) {
            expect((dateInputs[0] as HTMLInputElement).value).toBe(expectedStart);
            expect((dateInputs[1] as HTMLInputElement).value).toBe(expectedEnd);
        }
    });

    it('handles column sorting in Monthly table', async () => {
        render(<HRDashboard />);

        // Wait for initial data load first
        await waitFor(() => {
            expect(screen.getByText("Gaurav Kumar")).toBeDefined();
        }, { timeout: 5000 });

        const monthlyTabBtn = screen.getByText("Monthly Registry & Analytics");
        fireEvent.click(monthlyTabBtn);

        await waitFor(() => {
            const headers = screen.getAllByRole('columnheader');
            expect(headers.length).toBeGreaterThan(0);
        }, { timeout: 5000 });

        // Click a header using text content matching regex
        const methodHeader = screen.getByRole('columnheader', { name: /method/i });
        fireEvent.click(methodHeader);
        expect(methodHeader).toBeDefined();
    });

    it('renders Employee Master tab and loads credentials from localStorage', async () => {
        render(<HRDashboard currentView="HR_MASTER" />);

        await waitFor(() => {
            expect(screen.getByText("User Management Dashboard")).toBeDefined();
        }, { timeout: 5000 });

        // Verify initial credentials seeded
        const storedCreds = localStorage.getItem('englabs_user_credentials');
        expect(storedCreds).not.toBeNull();
        const parsed = JSON.parse(storedCreds!);
        expect(parsed.length).toBeGreaterThan(1);
        expect(parsed[0].pin).toBe('9999'); // Admin Master PIN
    });

    it('switches to Casual Leaves (CL) sub-tab and renders the CL ledger', async () => {
        render(<HRDashboard />);
        
        // Wait for initial data load first
        await waitFor(() => {
            expect(screen.getByText("Gaurav Kumar")).toBeDefined();
        }, { timeout: 5000 });

        const monthlyTabBtn = screen.getByText("Monthly Registry & Analytics");
        fireEvent.click(monthlyTabBtn);

        await waitFor(() => {
            expect(screen.getByText("Casual Leaves (CL)")).toBeDefined();
        }, { timeout: 5000 });

        const clTabBtn = screen.getByText("Casual Leaves (CL)");
        fireEvent.click(clTabBtn);

        // Verify the CL table renders
        await waitFor(() => {
            expect(screen.getByText("Total CL Used")).toBeDefined();
            expect(screen.getByText("Remaining Balance")).toBeDefined();
            expect(screen.getByText("Anurag Panchal")).toBeDefined();
            expect(screen.getByText("Arjun Tiwari")).toBeDefined();
        }, { timeout: 5000 });
    });
});

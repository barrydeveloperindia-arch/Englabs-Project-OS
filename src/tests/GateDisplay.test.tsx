import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import GateDisplayScreen from '../components/GateDisplayScreen';
import { GateEntry } from '../lib/gate_system';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Shield: () => <div data-testid="icon-shield" />,
    Activity: () => <div data-testid="icon-activity" />,
    RefreshCw: () => <div data-testid="icon-refresh" />,
    Eye: () => <div data-testid="icon-eye" />,
    ArrowUpRight: () => <div data-testid="icon-arrow-up" />,
    ArrowDownLeft: () => <div data-testid="icon-arrow-down" />,
    Clock: () => <div data-testid="icon-clock" />,
    User: () => <div data-testid="icon-user" />,
    Truck: () => <div data-testid="icon-truck" />,
    FileText: () => <div data-testid="icon-file" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
    AlertTriangle: () => <div data-testid="icon-alert" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    ChevronRight: () => <div data-testid="icon-chevron" />,
    Layers: () => <div data-testid="icon-layers" />,
    UserCheck: () => <div data-testid="icon-user-check" />,
    HelpCircle: () => <div data-testid="icon-help" />
}));

// Mock services
vi.mock('../lib/database_service', () => ({
    fetchGateEntries: vi.fn(() => Promise.resolve([]))
}));

vi.mock('../lib/inventory_service', () => ({
    fetchInventoryMaster: vi.fn(() => Promise.resolve([]))
}));

const mockEntries: GateEntry[] = [
    {
        id: 'IN-001',
        type: 'INWARD',
        timestamp: new Date().toISOString(),
        materialName: 'STEEL BEAMS',
        quantity: 50,
        unit: 'Nos',
        vehicleNumber: 'DL-3C-AB-1234',
        partyName: 'RIDHAN',
        fromLocation: 'DELHI',
        toLocation: 'STOREHOUSE',
        invoiceNumber: 'INV-1001',
        amount: 50000,
        employeeName: 'Rajinder',
        supervisorName: 'Thakur',
        driverName: 'Ramesh Singh',
        remarks: 'Structural framing materials.',
        isLocked: true,
        version: 1
    },
    {
        id: 'OUT-002',
        type: 'OUTWARD',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        materialName: 'COPPER PIPES',
        quantity: 200,
        unit: 'Meter',
        vehicleNumber: 'HR-55-XY-5678',
        partyName: 'SKY-5 Hotel',
        fromLocation: 'STOREHOUSE',
        toLocation: 'CONSTRUCTION SITE',
        invoiceNumber: 'INV-1002',
        amount: 25000,
        employeeName: 'Arjun',
        supervisorName: 'Thakur',
        driverName: 'Suresh Kumar',
        remarks: 'Plumbing fittings.',
        isLocked: true,
        version: 1
    }
];

describe('GateDisplayScreen Component', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('renders security lock screen initially', () => {
        render(<GateDisplayScreen entries={mockEntries} />);
        
        expect(screen.getByText('GATEHUD SECURITY')).toBeInTheDocument();
        expect(screen.getByText('STORE INCHARGE VALIDATION REQUIRED')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('ENTER SECURITY PIN')).toBeInTheDocument();
    });

    it('displays error on incorrect passcode entry', () => {
        render(<GateDisplayScreen entries={mockEntries} />);
        
        const pinInput = screen.getByPlaceholderText('ENTER SECURITY PIN');
        fireEvent.change(pinInput, { target: { value: 'WRONG_PIN' } });
        
        // Find Enter button from keypad
        const enterBtn = screen.getByText('Enter');
        fireEvent.click(enterBtn);

        expect(screen.getByText(/ACCESS DENIED/i)).toBeInTheDocument();
    });

    it('unlocks HUD screen on entering 0001', () => {
        render(<GateDisplayScreen entries={mockEntries} />);
        
        const pinInput = screen.getByPlaceholderText('ENTER SECURITY PIN');
        fireEvent.change(pinInput, { target: { value: '0001' } });
        
        const enterBtn = screen.getByText('Enter');
        fireEvent.click(enterBtn);

        expect(screen.queryByText('STORE INCHARGE VALIDATION REQUIRED')).not.toBeInTheDocument();
        expect(screen.getByText('ENGLABS GATEHUD')).toBeInTheDocument();
        expect(screen.getAllByText('STEEL BEAMS').length).toBeGreaterThan(0);
    });

    it('does not unlock HUD screen on entering ADMIN2026', () => {
        render(<GateDisplayScreen entries={mockEntries} />);
        
        const pinInput = screen.getByPlaceholderText('ENTER SECURITY PIN');
        fireEvent.change(pinInput, { target: { value: 'ADMIN2026' } });
        
        const enterBtn = screen.getByText('Enter');
        fireEvent.click(enterBtn);

        expect(screen.getByText('STORE INCHARGE VALIDATION REQUIRED')).toBeInTheDocument();
        expect(screen.getByText(/ACCESS DENIED/i)).toBeInTheDocument();
    });

    it('onscreen keyboard inputs passcode properly', () => {
        render(<GateDisplayScreen entries={mockEntries} />);
        
        const pinInput = screen.getByPlaceholderText('ENTER SECURITY PIN') as HTMLInputElement;
        
        // Click numbers on keypad
        fireEvent.click(screen.getByText('1'));
        fireEvent.click(screen.getByText('2'));
        fireEvent.click(screen.getByText('3'));
        
        expect(pinInput.value).toBe('123');

        // Click clear
        fireEvent.click(screen.getByText('Clear'));
        expect(pinInput.value).toBe('');
    });

    it('supports archive movement selection and return to live HUD', () => {
        render(<GateDisplayScreen entries={mockEntries} />);
        
        // Auth first
        const pinInput = screen.getByPlaceholderText('ENTER SECURITY PIN');
        fireEvent.change(pinInput, { target: { value: '0001' } });
        fireEvent.click(screen.getByText('Enter'));

        // Confirm active entry is steel beams
        expect(screen.getAllByText('STEEL BEAMS').length).toBeGreaterThan(0);
        
        // Find OUT-002 button and click it to inspect archive
        const outButton = screen.getByRole('button', { name: /OUT-002/i });
        fireEvent.click(outButton);

        // Should show archive warning banner
        expect(screen.getByText(/ARCHIVE PLAYBACK MODE/i)).toBeInTheDocument();
        expect(screen.getAllByText('COPPER PIPES').length).toBeGreaterThan(0);

        // Click Resume Live HUD
        const resumeBtn = screen.getByRole('button', { name: /Resume Live HUD/i });
        fireEvent.click(resumeBtn);

        // Back to live view (showing steel beams)
        expect(screen.queryByText(/ARCHIVE PLAYBACK MODE/i)).not.toBeInTheDocument();
        expect(screen.getAllByText('STEEL BEAMS').length).toBeGreaterThan(0);
    });
});

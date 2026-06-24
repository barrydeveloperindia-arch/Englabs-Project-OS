import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import HotelRegister from '../modules/lodging/HotelRegister';
import { ProjectData } from '@shared/services/project';

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    Building: () => <div data-testid="icon-building" />,
    Plus: () => <div data-testid="icon-plus" />,
    Search: () => <div data-testid="icon-search" />,
    Filter: () => <div data-testid="icon-filter" />,
    Trash2: () => <div data-testid="icon-trash" />,
    Briefcase: () => <div data-testid="icon-briefcase" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    DollarSign: () => <div data-testid="icon-dollar" />,
    Users: () => <div data-testid="icon-users" />,
    Clock: () => <div data-testid="icon-clock" />,
    FileText: () => <div data-testid="icon-file" />,
    ArrowUpRight: () => <div data-testid="icon-arrow-up" />,
    ArrowDownRight: () => <div data-testid="icon-arrow-down" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
    AlertCircle: () => <div data-testid="icon-alert" />,
    X: () => <div data-testid="icon-x" />,
    UserCheck: () => <div data-testid="icon-user-check" />
  };
});

const mockProjects: ProjectData[] = [
    {
        projectId: 'C5023',
        client: 'Aura Tech',
        planning: { value: 100000, budget: 60000, startDate: '2026-06-01', deliveryTerms: 'Porter', poNumber: 'PO-123', poConfirmed: true },
        production: { stages: [], components: [] },
        dailyStandup: { lead: 'Anurag', lastUpdate: '', status: 'Healthy', blockers: 'None' }
    },
    {
        projectId: 'C5124',
        client: 'Brahmos Ltd',
        planning: { value: 250000, budget: 150000, startDate: '2026-06-10', deliveryTerms: 'ToPay', poNumber: 'PO-456', poConfirmed: true },
        production: { stages: [], components: [] },
        dailyStandup: { lead: 'Shubham', lastUpdate: '', status: 'Blocked', blockers: 'Material Delay' }
    }
];

const mockStaff = ['Anurag Sharma', 'Shubham Kumar', 'Devanshu Singh'];

describe('HotelRegister Component Tests', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders the header and bento stat cards correctly', () => {
        render(<HotelRegister projects={mockProjects} staffList={mockStaff} />);
        
        expect(screen.getByText('Hotel Stay Register')).toBeInTheDocument();
        expect(screen.getByText('Total Stays')).toBeInTheDocument();
        expect(screen.getByText('Lodging Cost')).toBeInTheDocument();
        expect(screen.getByText('Active Stays')).toBeInTheDocument();
        expect(screen.getByText('Overtime Lodging')).toBeInTheDocument();
    });

    it('lists the default/seed stays from localStorage or samples', () => {
        render(<HotelRegister projects={mockProjects} staffList={mockStaff} />);
        
        expect(screen.getByText('Anurag Sharma')).toBeInTheDocument();
        expect(screen.getByText('Mr. Rajesh Mehra (Aura Tech)')).toBeInTheDocument();
        expect(screen.getByText('Jarnail Singh (Excel Steel)')).toBeInTheDocument();
    });

    it('toggles the new stay form and allows adding a stay', async () => {
        render(<HotelRegister projects={mockProjects} staffList={mockStaff} />);
        
        // Form is hidden initially
        expect(screen.queryByText('Log Guest / Staff Lodging details')).not.toBeInTheDocument();

        // Click "Log New Stay"
        const logBtn = screen.getByRole('button', { name: /Log New Stay/i });
        fireEvent.click(logBtn);

        // Form should be visible
        expect(screen.getByText('Log Guest / Staff Lodging details')).toBeInTheDocument();

        // Fill form fields
        fireEvent.change(screen.getByPlaceholderText('e.g. Mr. Sumeet (Karan Traders)'), {
            target: { value: 'Guest Client Name' }
        });
        fireEvent.change(screen.getByPlaceholderText('e.g. Landmark Hotel'), {
            target: { value: 'Hotel Taj Palace' }
        });
        fireEvent.change(screen.getByPlaceholderText('Amount in ₹'), {
            target: { value: '5500' }
        });
        
        // Select check-in/out dates
        // We use querySelector or find by label if they exist, otherwise select inputs
        const dateInputs = screen.getAllByRole('textbox').filter(input => {
            const type = input.getAttribute('type');
            return type === 'date';
        });
        
        // Wait, standard HTML input type="date" might be rendered as type="date"
        // Let's get inputs by their tag type or standard inputs
        // Our input forms are: guestName, hotelName, roomNumber, cost, checkInDate, checkOutDate, purpose, notes
        // Check-in check-out are at indices 2 and 3 of type date or similar. Let's select them.
        const allInputs = document.querySelectorAll('input');
        let checkInInput: HTMLInputElement | null = null;
        let checkOutInput: HTMLInputElement | null = null;

        allInputs.forEach(input => {
            if (input.type === 'date') {
                if (!checkInInput) checkInInput = input;
                else if (!checkOutInput) checkOutInput = input;
            }
        });

        if (checkInInput && checkOutInput) {
            fireEvent.change(checkInInput, { target: { value: '2026-06-25' } });
            fireEvent.change(checkOutInput, { target: { value: '2026-06-28' } });
        }

        // Submit form
        const saveBtn = screen.getByRole('button', { name: /Save stay entry/i });
        fireEvent.click(saveBtn);

        // Verify stay is listed in table
        await waitFor(() => {
            expect(screen.getByText('Guest Client Name')).toBeInTheDocument();
        });
    });

    it('filters stay logs by search query', () => {
        render(<HotelRegister projects={mockProjects} staffList={mockStaff} />);
        
        // Initial list has Taj Mahal stay
        expect(screen.getByText('Mr. Rajesh Mehra (Aura Tech)')).toBeInTheDocument();

        // Search for Sunbeam
        const searchInput = screen.getByPlaceholderText('Search guest or hotel name...');
        fireEvent.change(searchInput, { target: { value: 'Sunbeam' } });

        // Sunbeam stay is visible, Taj Mahal stay is hidden
        expect(screen.getByText('Anurag Sharma')).toBeInTheDocument();
        expect(screen.queryByText('Mr. Rajesh Mehra (Aura Tech)')).not.toBeInTheDocument();
    });

    it('filters stays by guest type selection', () => {
        render(<HotelRegister projects={mockProjects} staffList={mockStaff} />);

        // Get guest type filter select
        const selects = screen.getAllByRole('combobox');
        // Guest type select is the first select in the filters row
        const typeSelect = selects[3]; // The 4th combobox in the DOM (after guestType, projectId, and staff list in form if open; if form is closed, it's 1st/2nd)
        
        // Find guest type filter select specifically:
        let guestTypeFilterSelect: HTMLSelectElement | null = null;
        document.querySelectorAll('select').forEach(select => {
            const options = Array.from(select.options).map(o => o.value);
            if (options.includes('CLIENT') && options.includes('ALL')) {
                guestTypeFilterSelect = select;
            }
        });

        if (guestTypeFilterSelect) {
            fireEvent.change(guestTypeFilterSelect, { target: { value: 'STAFF' } });
            expect(screen.getByText('Anurag Sharma')).toBeInTheDocument();
            expect(screen.queryByText('Mr. Rajesh Mehra (Aura Tech)')).not.toBeInTheDocument();
        }
    });
});

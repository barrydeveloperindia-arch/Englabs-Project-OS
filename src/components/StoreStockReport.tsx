import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Download, 
    Share2, 
    Search, 
    Filter, 
    MoreVertical, 
    Trash2, 
    Edit3, 
    Plus, 
    RefreshCcw,
    Folder,
    File,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Clock,
    Printer,
    X,
    Package,
    Camera
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { InventoryItem, StockTransaction } from '../lib/gate_system';
import { fetchInventoryMaster, seedInventoryMaster, updateInventoryItemStock, deleteInventoryItem, addInventoryItem, fetchStockMovement, recordManualTransaction } from '../lib/inventory_service';
import logo from '../assets/englabs_logo.png';
import masterInventory from '../../data/master_inventory_may_2026.json';

interface StockReport {
    report_id: string;
    report_date: string;
    items: InventoryItem[];
    status: 'AUDITED' | 'PENDING' | 'SYNCED';
}

import { STAFF_ROSTER } from '../lib/constants';

interface StoreStockReportProps {
    userRole?: 'ADMIN' | 'STAFF';
    projects?: any[];
}

const StoreStockReport: React.FC<StoreStockReportProps> = ({ userRole = 'ADMIN', projects = [] }) => {
    const [view, setView] = useState<'FOLDERS' | 'REPORT_VIEW' | 'MASTER_REPORT' | 'TRANSACTIONS'>('FOLDERS');
    const [selectedReport, setSelectedReport] = useState<StockReport | null>(null);
    const [reports, setReports] = useState<StockReport[]>([]);
    const [transactions, setTransactions] = useState<StockTransaction[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ type: 'ITEM' | 'REPORT' | 'DELETE', data: any } | null>(null);
    const [passcode, setPasscode] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isCheckOutOnly, setIsCheckOutOnly] = useState(false);
    const [isCheckInOnly, setIsCheckInOnly] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [viewingSlipItem, setViewingSlipItem] = useState<InventoryItem | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<string>('Pcs');
    const [selectedItemCode, setSelectedItemCode] = useState<string>('');
    const [isOutOfStockFilter, setIsOutOfStockFilter] = useState(false);
    const [newItemPhoto, setNewItemPhoto] = useState<string>('');
    const [editItemPhoto, setEditItemPhoto] = useState<string>('');
    const [checkoutPhoto, setCheckoutPhoto] = useState<string>('');
    const [addItemCodeMode, setAddItemCodeMode] = useState<'SELECT' | 'CUSTOM'>('SELECT');
    const [addCategoryMode, setAddCategoryMode] = useState<'SELECT' | 'CUSTOM'>('SELECT');
    const [addLocationMode, setAddLocationMode] = useState<'SELECT' | 'CUSTOM'>('SELECT');
    const [addItemCode, setAddItemCode] = useState<string>('');
    const [addCategory, setAddCategory] = useState<string>('');
    const [addLocation, setAddLocation] = useState<string>('');
    const [addUnit, setAddUnit] = useState<string>('Pcs');
    const [selectedProjectTx, setSelectedProjectTx] = useState<string>('');

    const itemCatalog = selectedReport ? selectedReport.items : (reports[0] ? reports[0].items : []);
    const existingItemCodes = Array.from(new Set(itemCatalog.map(i => i.itemCode))).sort();
    const existingCategories = Array.from(new Set(itemCatalog.map(i => i.category))).sort();
    const existingLocations = Array.from(new Set(itemCatalog.map(i => i.location))).sort();

    const DEFAULT_PROJECT_IDS = ['C2718', 'C2737', 'C2931', 'C3020', 'C4867', 'C5178', 'C5191', 'C5192', 'C5193', 'C5195', 'C5197', 'C5198', 'C5207', 'C5209', 'C5210', 'C5212', 'C5213', 'C5216', 'C5223', 'C5224', 'C5227', 'C5228', 'C5229'];
    const projectList = (projects && projects.length > 0)
        ? projects.map((p: any) => p.projectId)
        : DEFAULT_PROJECT_IDS;

    const openAddModal = () => {
        setAddItemCode('');
        setAddCategory('');
        setAddLocation('');
        setAddUnit('Pcs');
        setAddItemCodeMode('SELECT');
        setAddCategoryMode('SELECT');
        setAddLocationMode('SELECT');
        setNewItemPhoto('');
        setIsAddModalOpen(true);
    };

    useEffect(() => {
        if (modalConfig && modalConfig.type === 'ITEM') {
            setEditItemPhoto(modalConfig.data.photoUrl || '');
        } else {
            setEditItemPhoto('');
        }
    }, [modalConfig]);

    const getNextInvoiceNumber = () => {
        const prefix = "ENG-01-";
        const engInvoices = transactions
            .map(tx => tx.invoiceNumber || '')
            .filter(inv => inv.toUpperCase().startsWith(prefix));
        
        if (engInvoices.length === 0) {
            return `${prefix}0001`;
        }
        
        let maxNum = 0;
        engInvoices.forEach(inv => {
            const numPart = inv.substring(prefix.length);
            const parsed = parseInt(numPart, 10);
            if (!isNaN(parsed) && parsed > maxNum) {
                maxNum = parsed;
            }
        });
        
        const nextNum = maxNum + 1;
        return `${prefix}${nextNum.toString().padStart(4, '0')}`;
    };

    const filteredReportItems = selectedReport 
        ? selectedReport.items.filter(i => {
            const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.category.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;
            if (isOutOfStockFilter) return i.currentStock <= 0;
            return true;
        })
        : [];

    useEffect(() => {
        // Initial Forensic Load - Full 112+ Items Dataset from May 2026 Reports
        const masterItems: InventoryItem[] = [
            // RACK 1: Paints & Chemicals
            { name: "Chemilac Black Paint", itemCode: "PAI-001", category: "Paints", currentStock: 20, unit: "LTR", location: "Rack No. 1", totalInward: 20, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Chemilac Thinner", itemCode: "THI-002", category: "Chemicals", currentStock: 10, unit: "LTR", location: "Rack No. 1", totalInward: 10, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Bludip Thinner", itemCode: "THI-002B", category: "Chemicals", currentStock: 10, unit: "KG", location: "Rack No. 1", totalInward: 10, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Hardener", itemCode: "HAR-002", category: "Chemicals", currentStock: 2, unit: "LTR", location: "Rack No. 1", totalInward: 2, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "SBL Grey Primer", itemCode: "PRI-003", category: "Paints", currentStock: 12, unit: "LTR", location: "Rack No. 1", totalInward: 12, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "SBL Black Gloss", itemCode: "GLO-004", category: "Paints", currentStock: 8, unit: "Pcs", location: "Rack No. 1", totalInward: 8, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "SBL Black Matt", itemCode: "MAT-005", category: "Paints", currentStock: 4, unit: "Pcs", location: "Rack No. 1", totalInward: 4, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "SBL P.P. Primer", itemCode: "PRI-006", category: "Paints", currentStock: 3, unit: "LTR", location: "Rack No. 1", totalInward: 3, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "SBL PU Primer", itemCode: "PRI-006B", category: "Paints", currentStock: 2, unit: "KG", location: "Rack No. 1", totalInward: 2, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "SBL Glass Coat Clear Matt", itemCode: "GLA-007", category: "Paints", currentStock: 1, unit: "LTR", location: "Rack No. 1", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Seves Army Green Matt", itemCode: "PAI-008", category: "Paints", currentStock: 0, unit: "Pcs", location: "Rack No. 1", totalInward: 0, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Silver Matt", itemCode: "MAT-009", category: "Paints", currentStock: 12, unit: "Pcs", location: "Rack No. 1", totalInward: 12, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Super Clear", itemCode: "CLE-010", category: "Paints", currentStock: 4, unit: "LTR", location: "Rack No. 1", totalInward: 4, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "H.C. Robotic Grey Paint", itemCode: "PAI-011", category: "Paints", currentStock: 4, unit: "LTR", location: "Rack No. 1", totalInward: 4, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Pearl White", itemCode: "PAI-012", category: "Paints", currentStock: 8, unit: "LTR", location: "Rack No. 1", totalInward: 8, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "White Gloss", itemCode: "GLO-013", category: "Paints", currentStock: 4, unit: "LTR", location: "Rack No. 1", totalInward: 4, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Hardener (Secondary)", itemCode: "HAR-014", category: "Chemicals", currentStock: 1, unit: "LTR", location: "Rack No. 1", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Fevicol Adhesive", itemCode: "ADH-015", category: "General", currentStock: 1, unit: "Kg", location: "Rack No. 1", totalInward: 1, totalOutward: 0, minThreshold: 0.5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Liquid Silicone", itemCode: "SIL-016", category: "Chemicals", currentStock: 1, unit: "Kg", location: "Rack No. 1", totalInward: 1, totalOutward: 0, minThreshold: 0.5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Duco Clear Matt", itemCode: "MAT-017", category: "Paints", currentStock: 1, unit: "LTR", location: "Rack No. 1", totalInward: 1, totalOutward: 0, minThreshold: 0.5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Spray Can Orange", itemCode: "SPR-018", category: "General", currentStock: 8, unit: "Pcs", location: "Rack No. 1", totalInward: 8, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "White (Misc)", itemCode: "MIS-019", category: "General", currentStock: 1, unit: "Pcs", location: "Rack No. 1", totalInward: 1, totalOutward: 0, minThreshold: 0, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Spray Can Lacquer", itemCode: "SPR-020", category: "General", currentStock: 2, unit: "Pcs", location: "Rack No. 1", totalInward: 2, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Hikott Chemical", itemCode: "CHE-021", category: "Chemicals", currentStock: 7, unit: "LTR", location: "Rack No. 1", totalInward: 7, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Rit Black Dye", itemCode: "DYE-022", category: "Chemicals", currentStock: 6, unit: "Kg", location: "Rack No. 1", totalInward: 6, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "NC Putty Grey", itemCode: "PUT-023", category: "Chemicals", currentStock: 10, unit: "Kg", location: "Rack No. 1", totalInward: 10, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Etch Primer", itemCode: "PRI-024", category: "Paints", currentStock: 2, unit: "KG", location: "Rack No. 1", totalInward: 2, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "NC Thinner", itemCode: "THI-025", category: "Chemicals", currentStock: 24, unit: "LTR", location: "Rack No. 1", totalInward: 24, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            
            // RACK 2: Stationery & Misc
            { name: "JK Bond Paper", itemCode: "PAP-101", category: "Stationery", currentStock: 10, unit: "Pcs", location: "Rack-2", totalInward: 10, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Cobra File", itemCode: "FIL-102", category: "Stationery", currentStock: 7, unit: "Pcs", location: "Rack-2", totalInward: 7, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Clear Bag file", itemCode: "BAG-103", category: "Stationery", currentStock: 11, unit: "Pcs", location: "Rack-2", totalInward: 11, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "A4 Envelope", itemCode: "ENV-104", category: "Stationery", currentStock: 3, unit: "Pcs", location: "Rack-2", totalInward: 3, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "A4 Paper Envelope", itemCode: "ENV-105", category: "Stationery", currentStock: 10, unit: "Pcs", location: "Rack-2", totalInward: 10, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "A4 P file Leaf", itemCode: "LEA-106", category: "Stationery", currentStock: 4, unit: "Pcs", location: "Rack-2", totalInward: 4, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Lamination Sheet", itemCode: "LAM-107", category: "Stationery", currentStock: 7, unit: "Pcs", location: "Rack-2", totalInward: 7, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "L. Clear Folder", itemCode: "FOL-108", category: "Stationery", currentStock: 12, unit: "Pcs", location: "Rack-2", totalInward: 12, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "A4 Coloured Sheet", itemCode: "COL-109", category: "Stationery", currentStock: 2, unit: "Pack", location: "Rack-2", totalInward: 2, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Clip Board", itemCode: "BOA-110", category: "Stationery", currentStock: 4, unit: "Pcs", location: "Rack-2", totalInward: 4, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Attendance Register", itemCode: "REG-111", category: "Stationery", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Half Day Book", itemCode: "REG-112", category: "Stationery", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Gift Wrapping Sheet", itemCode: "SHE-113", category: "Stationery", currentStock: 8, unit: "Pcs", location: "Rack-2", totalInward: 8, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Batter Paper", itemCode: "SHE-114", category: "Stationery", currentStock: 5, unit: "Pcs", location: "Rack-2", totalInward: 5, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Gift Bag", itemCode: "BAG-115", category: "Stationery", currentStock: 5, unit: "Pcs", location: "Rack-2", totalInward: 5, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Chitti", itemCode: "MIS-116", category: "Stationery", currentStock: 6, unit: "Pcs", location: "Rack-2", totalInward: 6, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Surgical Blade Stand", itemCode: "STA-117", category: "General", currentStock: 0, unit: "Pcs", location: "Rack-2", totalInward: 0, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "AA Cell", itemCode: "CEL-118", category: "General", currentStock: 8, unit: "Pcs", location: "Rack-2", totalInward: 8, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "AAA Cell", itemCode: "CEL-119", category: "General", currentStock: 2, unit: "Pcs", location: "Rack-2", totalInward: 2, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Big Size Battery", itemCode: "CEL-120", category: "General", currentStock: 7, unit: "Pcs", location: "Rack-2", totalInward: 7, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "CR 2032 Cell", itemCode: "CEL-121", category: "General", currentStock: 50, unit: "Pcs", location: "Rack-2", totalInward: 50, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "GP Cell-1", itemCode: "CEL-122", category: "General", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Sharpeners", itemCode: "SHA-123", category: "Stationery", currentStock: 9, unit: "Pcs", location: "Rack-2", totalInward: 9, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Eraser", itemCode: "ERA-124", category: "Stationery", currentStock: 19, unit: "Pcs", location: "Rack-2", totalInward: 19, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Pencil", itemCode: "PEN-125", category: "Stationery", currentStock: 7, unit: "Pcs", location: "Rack-2", totalInward: 7, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Sticki Notes (Flag)", itemCode: "NOT-126", category: "Stationery", currentStock: 27, unit: "Pack", location: "Rack-2", totalInward: 27, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Binder Clips", itemCode: "CLI-127", category: "Stationery", currentStock: 30, unit: "Pcs", location: "Rack-2", totalInward: 30, totalOutward: 0, minThreshold: 50, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Big Cutter Blade", itemCode: "BLA-128", category: "General", currentStock: 15, unit: "Pcs", location: "Rack-2", totalInward: 15, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Surgical Blade", itemCode: "BLA-129", category: "General", currentStock: 35, unit: "Pcs", location: "Rack-2", totalInward: 35, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "White Board Marker", itemCode: "MAR-130", category: "Stationery", currentStock: 7, unit: "Pcs", location: "Rack-2", totalInward: 7, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Permanent Marker", itemCode: "MAR-131", category: "Stationery", currentStock: 13, unit: "Pcs", location: "Rack-2", totalInward: 13, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "White Board Duster", itemCode: "DUS-132", category: "Stationery", currentStock: 4, unit: "Pcs", location: "Rack-2", totalInward: 4, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Stepdown Pin Big", itemCode: "PIN-133", category: "Stationery", currentStock: 18, unit: "Pcs", location: "Rack-2", totalInward: 18, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Small Pin", itemCode: "PIN-134", category: "Stationery", currentStock: 19, unit: "Pcs", location: "Rack-2", totalInward: 19, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Tooth Pic", itemCode: "MIS-135", category: "General", currentStock: 1, unit: "Box", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Ink Pad", itemCode: "PAD-136", category: "Stationery", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Blue Ink", itemCode: "INK-137", category: "Stationery", currentStock: 1, unit: "Box", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Inkjet Ink", itemCode: "INK-138", category: "Stationery", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Punching Machine", itemCode: "PUN-139", category: "Stationery", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Markote", "itemCode": "MIS-140", category: "General", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 0, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Clear Silicone", "itemCode": "SIL-141", category: "Chemicals", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Araldite", "itemCode": "ADH-142", category: "Chemicals", currentStock: 2, unit: "Pcs", location: "Rack-2", totalInward: 2, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Fevitite", "itemCode": "ADH-143", category: "Chemicals", currentStock: 3, unit: "Pcs", location: "Rack-2", totalInward: 3, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Plastic Reban", "itemCode": "MIS-144", category: "General", currentStock: 5, unit: "Pcs", location: "Rack-2", totalInward: 5, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Board Marker Ink", "itemCode": "INK-145", category: "Stationery", currentStock: 8, unit: "Pcs", location: "Rack-2", totalInward: 8, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Transparent Tape", "itemCode": "TAP-146", category: "Stationery", currentStock: 147, unit: "Pcs", location: "Rack-2", totalInward: 147, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-21T10:03:02Z" },
            { name: "Dubbal Tape", "itemCode": "TAP-147", category: "Stationery", currentStock: 4, unit: "Pcs", location: "Rack-2", totalInward: 4, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Masking Tape", "itemCode": "TAP-148", category: "Stationery", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Pen", "itemCode": "PEN-149", category: "Stationery", currentStock: 80, unit: "Pcs", location: "Rack-2", totalInward: 80, totalOutward: 0, minThreshold: 20, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "3m Tape", "itemCode": "TAP-150", category: "Stationery", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Label Stiker Roll", "itemCode": "ROL-151", category: "Stationery", currentStock: 19, unit: "Pcs", location: "Rack-2", totalInward: 19, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Note Pad", "itemCode": "NOT-152", category: "Stationery", currentStock: 12, unit: "Pcs", location: "Rack-2", totalInward: 12, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Fevikwik", "itemCode": "ADH-153", category: "Chemicals", currentStock: 4, unit: "Pcs", location: "Rack-2", totalInward: 4, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "White Envelopes", "itemCode": "ENV-154", category: "Stationery", currentStock: 18, unit: "Pack", location: "Rack-2", totalInward: 18, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Weigh Machine", "itemCode": "MAC-155", category: "General", currentStock: 1, unit: "Pcs", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Painting Brush", "itemCode": "BRU-156", category: "General", currentStock: 2, unit: "Pcs", location: "Rack-2", totalInward: 2, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Correction Tape", "itemCode": "TAP-157", category: "Stationery", currentStock: 3, unit: "Pcs", location: "Rack-2", totalInward: 3, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Standard Lac", "itemCode": "MIS-158", category: "General", currentStock: 1, unit: "Box", location: "Rack-2", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Black Matt Spray", "itemCode": "SPR-159", category: "General", currentStock: 8, unit: "Can", location: "Rack-2", totalInward: 8, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },

            // RACK 3: Sanding Paper & Industrial
            { name: "Sanding Paper 100", itemCode: "SAN-301", category: "General", currentStock: 100, unit: "Pcs", location: "Rack-3", totalInward: 100, totalOutward: 0, minThreshold: 50, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Sanding Paper 220", itemCode: "SAN-302", category: "General", currentStock: 195, unit: "Pcs", location: "Rack-3", totalInward: 195, totalOutward: 0, minThreshold: 50, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Sanding Paper 320", itemCode: "SAN-303", category: "General", currentStock: 150, unit: "Pcs", location: "Rack-3", totalInward: 150, totalOutward: 0, minThreshold: 50, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Sanding Paper 600", itemCode: "SAN-304", category: "General", currentStock: 200, unit: "Pcs", location: "Rack-3", totalInward: 200, totalOutward: 0, minThreshold: 50, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Sanding Paper 2000", itemCode: "SAN-305", category: "General", currentStock: 195, unit: "Pcs", location: "Rack-3", totalInward: 195, totalOutward: 0, minThreshold: 50, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Visiting Card (Bharatsir)", itemCode: "CAR-306", category: "Stationery", currentStock: 1, unit: "Box", location: "Rack-3", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Zip Lock tie", itemCode: "MIS-307", category: "General", currentStock: 1, unit: "Pack", location: "Rack-3", totalInward: 1, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Englabs Key Ring", itemCode: "KEY-308", category: "General", currentStock: 15, unit: "Pcs", location: "Rack-3", totalInward: 15, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Plastic Gloves", itemCode: "GLO-309", category: "General", currentStock: 5, unit: "Pack", location: "Rack-3", totalInward: 5, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Glue Stick", itemCode: "ADH-310", category: "Stationery", currentStock: 17, unit: "Pcs", location: "Rack-3", totalInward: 17, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Rubber Band", itemCode: "MIS-311", category: "General", currentStock: 7, unit: "Pack", location: "Rack-3", totalInward: 7, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Cable Tester", itemCode: "MAC-312", category: "General", currentStock: 1, unit: "Pcs", location: "Rack-3", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Thermometer", itemCode: "MAC-313", category: "General", currentStock: 1, unit: "Pcs", location: "Rack-3", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Dhoti", itemCode: "MIS-314", category: "General", currentStock: 5, unit: "Pcs", location: "Rack-3", totalInward: 5, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Light Adapter", itemCode: "ELE-315", category: "General", currentStock: 1, unit: "Pcs", location: "Rack-3", totalInward: 1, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Silicone Grease", itemCode: "SIL-316", category: "Chemicals", currentStock: 4, unit: "Pcs", location: "Rack-3", totalInward: 4, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Mitti Diya", itemCode: "MIS-317", category: "General", currentStock: 1, unit: "Box", location: "Rack-3", totalInward: 1, totalOutward: 0, minThreshold: 0, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "A3 Sheet", itemCode: "COL-318", category: "Stationery", currentStock: 20, unit: "Pcs", location: "Rack-3", totalInward: 20, totalOutward: 0, minThreshold: 50, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Curtain Rod", itemCode: "MIS-319", category: "General", currentStock: 1, unit: "Box", location: "Rack-3", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Paint Wall", itemCode: "PAI-320", category: "Paints", currentStock: 20, unit: "Pcs", location: "Rack-3", totalInward: 20, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "A4 Paper Rim", itemCode: "PAP-321", category: "Stationery", currentStock: 7, unit: "Pcs", location: "Rack-3", totalInward: 7, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Decoration Item", itemCode: "MIS-322", category: "General", currentStock: 1, unit: "Box", location: "Rack-3", totalInward: 1, totalOutward: 0, minThreshold: 0, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Bad Blok ID Card", itemCode: "CAR-323", category: "General", currentStock: 1, unit: "Box", location: "Rack-3", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },

            // RACK 4: IT & Tools
            { name: "Keyboard", itemCode: "IT-401", category: "General", currentStock: 2, unit: "Pcs", location: "Rack No. 4", totalInward: 2, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Camera", itemCode: "IT-402", category: "General", currentStock: 1, unit: "Pcs", location: "Rack No. 4", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Visiting Card Holder", itemCode: "STA-403", category: "Stationery", currentStock: 2, unit: "Pcs", location: "Rack No. 4", totalInward: 2, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Spray Paint Gun", itemCode: "TOO-404", category: "General", currentStock: 1, unit: "Pcs", location: "Rack No. 4", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Hanger", itemCode: "MIS-405", category: "General", currentStock: 35, unit: "Pcs", location: "Rack No. 4", totalInward: 35, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Mouse (Rack 4)", itemCode: "IT-406", category: "General", currentStock: 1, unit: "Pcs", location: "Rack No. 4", totalInward: 1, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Laptop Cooling Pad", itemCode: "IT-407", category: "General", currentStock: 1, unit: "Pcs", location: "Rack No. 4", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Visiting Card Box", itemCode: "CAR-408", category: "Stationery", currentStock: 1, unit: "Box", location: "Rack No. 4", totalInward: 1, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Flour (Industrial)", itemCode: "MIS-409", category: "General", currentStock: 50, unit: "Pcs", location: "Rack No. 4", totalInward: 50, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Flour Duster", itemCode: "MIS-409B", category: "General", currentStock: 1, unit: "NOS", location: "Rack No. 4", totalInward: 1, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Goggles for Paint", itemCode: "PPE-410", category: "General", currentStock: 3, unit: "Pcs", location: "Rack No. 4", totalInward: 3, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Air Filter machine", itemCode: "MAC-411", category: "General", currentStock: 2, unit: "Pcs", location: "Rack No. 4", totalInward: 2, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Goggles for marking", itemCode: "PPE-412", category: "General", currentStock: 4, unit: "Box", location: "Rack No. 4", totalInward: 4, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Paint Part", itemCode: "PAI-413", category: "Paints", currentStock: 5, unit: "Box", location: "Rack No. 4", totalInward: 5, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Steel Rods", itemCode: "STE-414", category: "General", currentStock: 10, unit: "Nos", location: "Rack No. 4", totalInward: 10, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Industrial Hardware Kit", itemCode: "TOO-415", category: "General", currentStock: 510, unit: "Nos", location: "Rack No. 4", totalInward: 510, totalOutward: 0, minThreshold: 100, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Bugfree Precision Valve", itemCode: "TOO-416", category: "General", currentStock: 10, unit: "NOS", location: "Rack No. 4", totalInward: 10, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },


            // RACK 5: Pantry & Cleaning
            { name: "Room Freshener", itemCode: "MIS-501", category: "General", currentStock: 13, unit: "Pcs", location: "Rack-5", totalInward: 13, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Tissu Roll", itemCode: "MIS-502", category: "General", currentStock: 1, unit: "Pcs", location: "Rack-5", totalInward: 1, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Urinal Matt", itemCode: "MIS-503", category: "General", currentStock: 10, unit: "Pcs", location: "Rack-5", totalInward: 10, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Garbage bag Small", itemCode: "MIS-504", category: "General", currentStock: 13, unit: "Pcs", location: "Rack-5", totalInward: 13, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Garbage bag Big", itemCode: "MIS-504B", category: "General", currentStock: 5, unit: "Pcs", location: "Rack-5", totalInward: 5, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Coffee Mug", itemCode: "MIS-505", category: "General", currentStock: 4, unit: "Pcs", location: "Rack-5", totalInward: 4, totalOutward: 0, minThreshold: 6, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "All Out Reffel", itemCode: "MIS-506", category: "General", currentStock: 12, unit: "Pcs", location: "Rack-5", totalInward: 12, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Duster (Rack 5)", itemCode: "MIS-507", category: "General", currentStock: 12, unit: "Pcs", location: "Rack-5", totalInward: 12, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Scotch Brite", itemCode: "MIS-508", category: "General", currentStock: 1, unit: "Pcs", location: "Rack-5", totalInward: 1, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Baking Powder", itemCode: "MIS-509", category: "General", currentStock: 3, unit: "Pcs", location: "Rack-5", totalInward: 3, totalOutward: 0, minThreshold: 1, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Naphthalene", itemCode: "MIS-510", category: "General", currentStock: 1, unit: "Pack", location: "Rack-5", totalInward: 1, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Mouse (Rack 5)", itemCode: "IT-511", category: "General", currentStock: 9, unit: "Pcs", location: "Rack-5", totalInward: 9, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Pen (Rack 5)", itemCode: "PEN-512", category: "Stationery", currentStock: 25, unit: "Pcs", location: "Rack-5", totalInward: 25, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Glue Stick (Rack 5)", itemCode: "ADH-513", category: "Stationery", currentStock: 2, unit: "Pcs", location: "Rack-5", totalInward: 2, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Vim Bar", itemCode: "CHE-514", category: "Chemicals", currentStock: 1, unit: "Pcs", location: "Rack-5", totalInward: 1, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },

            // RACK 6: PPE & Cleaning Chemicals
            { name: "Lint Free Cloth", itemCode: "PPE-601", category: "General", currentStock: 16, unit: "Pack", location: "Rack-6", totalInward: 16, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Masks", itemCode: "PPE-602", category: "General", currentStock: 8, unit: "Pack", location: "Rack-6", totalInward: 8, totalOutward: 0, minThreshold: 20, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Cap", itemCode: "PPE-603", category: "General", currentStock: 6, unit: "Pack", location: "Rack-6", totalInward: 6, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Gloves (Industrial)", itemCode: "PPE-604", category: "General", currentStock: 4, unit: "Box", location: "Rack-6", totalInward: 4, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Apron", itemCode: "PPE-605", category: "General", currentStock: 1, unit: "Pcs", location: "Rack-6", totalInward: 1, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Hand Wash", itemCode: "CHE-606", category: "Chemicals", currentStock: 6, unit: "LTR", location: "Rack-6", totalInward: 6, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Colin", itemCode: "CHE-607", category: "Chemicals", currentStock: 5, unit: "Pcs", location: "Rack-6", totalInward: 5, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Floor Cleaner", itemCode: "CHE-608", category: "Chemicals", currentStock: 5, unit: "LTR", location: "Rack-6", totalInward: 5, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Wish Wash", itemCode: "CHE-609", category: "Chemicals", currentStock: 5, unit: "LTR", location: "Rack-6", totalInward: 5, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Surf", itemCode: "CHE-610", category: "Chemicals", currentStock: 1, unit: "Kg", location: "Rack-6", totalInward: 1, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Pocha", itemCode: "MIS-611", category: "General", currentStock: 12, unit: "Pcs", location: "Rack-6", totalInward: 12, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Toilet Brush", itemCode: "MIS-612", category: "General", currentStock: 2, unit: "Pcs", location: "Rack-6", totalInward: 2, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Phenyle", itemCode: "CHE-613", category: "Chemicals", currentStock: 10, unit: "LTR", location: "Rack-6", totalInward: 10, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Acid (Cleaning)", itemCode: "CHE-614", category: "Chemicals", currentStock: 2, unit: "LTR", location: "Rack-6", totalInward: 2, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Harpic", itemCode: "CHE-615", category: "Chemicals", currentStock: 5, unit: "LITER", location: "Rack-6", totalInward: 5, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Dishwasher Liquid", itemCode: "CHE-616", category: "Chemicals", currentStock: 5, unit: "LITER", location: "Rack-6", totalInward: 5, totalOutward: 0, minThreshold: 2, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "Kitchen Duster", itemCode: "MIS-617", category: "General", currentStock: 12, unit: "Nos", location: "Rack-6", totalInward: 12, totalOutward: 0, minThreshold: 5, lastUpdated: "2026-05-14T10:00:00Z" },
            { name: "OHP Marker 969", itemCode: "STA-618", category: "Stationery", currentStock: 5, unit: "PCS", location: "Rack-6", totalInward: 5, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" }
        ];

        const mockReports: StockReport[] = masterInventory as unknown as StockReport[];

        async function syncWithFirestore() {
            try {
                const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
                let liveItems = await Promise.race([fetchInventoryMaster(), timeoutPromise]).catch(() => []);
                
                // Seed any missing items to Firestore
                const liveCodes = new Set(liveItems.map((i: any) => i.itemCode));
                const missingItems = masterItems.filter((i: any) => !liveCodes.has(i.itemCode));
                if (missingItems.length > 0) {
                    await Promise.race([seedInventoryMaster(missingItems), timeoutPromise]).catch(() => {});
                    liveItems = await Promise.race([fetchInventoryMaster(), timeoutPromise]).catch(() => []);
                }
                
                const codeToIndex = new Map(masterItems.map((item, idx) => [item.itemCode, idx]));
                const sortedItems = [...liveItems].sort((a, b) => {
                    const idxA = codeToIndex.has(a.itemCode) ? codeToIndex.get(a.itemCode)! : 9999;
                    const idxB = codeToIndex.has(b.itemCode) ? codeToIndex.get(b.itemCode)! : 9999;
                    if (idxA !== idxB) return idxA - idxB;
                    return a.itemCode.localeCompare(b.itemCode);
                });

                const juneReport: StockReport = {
                    report_id: "SR-20260604-MASTER",
                    report_date: "2026-06-04",
                    status: 'SYNCED',
                    items: sortedItems.length > 0 ? sortedItems : (masterInventory[0]?.items as unknown as InventoryItem[])
                };

                const mayReport: StockReport = {
                    report_id: "SR-20260514-MASTER",
                    report_date: "2026-05-14",
                    status: 'SYNCED',
                    items: masterItems
                };

                setReports([juneReport, mayReport]);
                setSelectedReport(juneReport);

                const logs = await fetchStockMovement();
                setTransactions(logs);
            } catch (e) {
                console.error("Firestore sync error, falling back to local dataset", e);
                setReports(mockReports);
                setSelectedReport(mockReports[0]);
                setTransactions([]);
            }
        }

        syncWithFirestore();
    }, [refreshTrigger]);

    const handleDeleteItem = async (itemCode: string) => {
        if (passcode === '0001') {
            if (selectedReport) {
                try {
                    await deleteInventoryItem(itemCode);
                } catch (e) {
                    console.error("Firestore delete failed, updating local state only", e);
                }
                const updatedItems = selectedReport.items.filter(i => i.itemCode !== itemCode);
                const updatedReport = { ...selectedReport, items: updatedItems };
                setSelectedReport(updatedReport);
                setReports(prev => prev.map(r => r.report_id === updatedReport.report_id ? updatedReport : r));
                setModalConfig(null);
                setPasscode('');
            }
        } else {
            alert("INVALID PROTOCOL KEY. ACCESS DENIED.");
        }
    };

    const handleEditItem = async (item: InventoryItem, newStock: number, newPhoto?: string) => {
        if (selectedReport) {
            const updatedPhoto = newPhoto !== undefined ? newPhoto : (item.photoUrl || '');
            try {
                const updatedItem = {
                    ...item,
                    currentStock: newStock,
                    photoUrl: updatedPhoto,
                    lastUpdated: new Date().toISOString()
                };
                await addInventoryItem(updatedItem);
            } catch (e) {
                console.error("Firestore stock update failed, updating local state only", e);
            }
            const updatedItems = selectedReport.items.map(i => 
                i.itemCode === item.itemCode ? { ...i, currentStock: newStock, photoUrl: updatedPhoto, lastUpdated: new Date().toISOString() } : i
            );
            const updatedReport = { ...selectedReport, items: updatedItems };
            setSelectedReport(updatedReport);
            setReports(prev => prev.map(r => r.report_id === updatedReport.report_id ? updatedReport : r));
        }
    };

    const handleImportPDF = () => {
        setIsLoading(true);
        setImportSuccess(false);
        setTimeout(() => {
            setIsLoading(false);
            setImportSuccess(true);
            setTimeout(() => setImportSuccess(false), 3000);
        }, 2000);
    };

    const handleShareWhatsApp = () => {
        if (!selectedReport) return;
        
        if (isOutOfStockFilter) {
            const outOfStockItems = selectedReport.items.filter(i => i.currentStock <= 0);
            let message = `*ENGLABS STORE - OUT OF STOCK REGISTER*\n`;
            message += `_Date: ${new Date().toLocaleDateString('en-GB')}_\n\n`;
            message += `*ΓÜá∩╕Å OUT OF STOCK ITEMS (${outOfStockItems.length}):*\n`;
            
            outOfStockItems.forEach((i, idx) => {
                message += `${idx + 1}. *${i.name}* [${i.itemCode}]\n`;
                message += `   ≡ƒôì Location: ${i.location || 'Rack 1'}\n`;
                message += `   ≡ƒôª Required Min: ${i.minThreshold} ${i.unit}\n\n`;
            });
            
            message += `_Please arrange immediate procurement for these items._\n`;
            message += `\n_View full professional ledger in Englabs OS._`;
            
            const encoded = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encoded}`;
            const link = document.createElement('a');
            link.href = whatsappUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        const lowStockItems = selectedReport.items.filter(i => i.currentStock < i.minThreshold);
        let message = `*ENGLABS STORE STOCK REPORT: ${selectedReport.report_id}*\n`;
        message += `_Date: ${selectedReport.report_date}_\n\n`;
        message += `*Stock Summary:*\n`;
        message += `• Total Items: ${selectedReport.items.length}\n`;
        message += `• Low Stock Alerts: ${lowStockItems.length}\n\n`;
        
        if (lowStockItems.length > 0) {
            message += `*⚠️ REPLENISHMENT REQUIRED (Sr. No. Wise):*\n`;
            lowStockItems.forEach((i, idx) => {
                message += `${idx + 1}. ${i.name}: ${i.currentStock} ${i.unit} (Min: ${i.minThreshold})\n`;
            });
            message += `\n`;
        }
        
        message += `*Full Stock Inventory Details (Sr. No. Wise):*\n`;
        selectedReport.items.slice(0, 30).forEach((i, idx) => {
            message += `${idx + 1}. ${i.name}: ${i.currentStock} ${i.unit} [${i.itemCode}]\n`;
        });
        
        if (selectedReport.items.length > 30) {
            message += `\n_...and ${selectedReport.items.length - 30} more items in full report._\n`;
        }
        
        message += `\n_View full professional forensic ledger in Englabs OS._`;
        
        const encoded = encodeURIComponent(message);
        // Using a direct link approach to minimize popup blocker interference
        const whatsappUrl = `https://wa.me/?text=${encoded}`;
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        // Trigger browser print which is styled via @media print in CSS
        window.print();
    };

    const exportToExcel = () => {
        const dataToExport = selectedReport 
            ? (isOutOfStockFilter ? selectedReport.items.filter(i => i.currentStock <= 0) : selectedReport.items) 
            : reports.flatMap(r => r.items);
        const fileName = selectedReport 
            ? (isOutOfStockFilter ? `Out_of_Stock_Report_${selectedReport.report_id}` : `Stock_Report_${selectedReport.report_id}`) 
            : `Master_Stock_Inventory_${new Date().toISOString().split('T')[0]}`;

        const flatData = dataToExport.map((item, idx) => ({
            'Sr. No.': idx + 1,
            'Item Name': item.name,
            'Item Code': item.itemCode,
            'Category': item.category,
            'Location': item.location,
            'Current Stock': item.currentStock,
            'Unit': item.unit,
            'Total Inward': item.totalInward,
            'Total Outward': item.totalOutward,
            'Min Threshold': item.minThreshold,
            'Last Updated': new Date(item.lastUpdated).toLocaleString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Inventory");
        
        // Auto-size columns
        const maxWidths = Object.keys(flatData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...flatData.map(row => String(row[key as keyof typeof row]).length)) + 2
        }));
        worksheet['!cols'] = maxWidths;

        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FAFC] print:bg-white print:block">
            {/* TOP COMMAND BAR */}
            <header className="h-auto md:h-20 bg-white border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-10 py-4 md:py-0 shrink-0 gap-4 md:gap-0 print:hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full md:w-auto">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-slate-900 leading-none">Store Stock Registry</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Forensic Inventory Management & Audit</span>
                    </div>
                    <div className="hidden md:block h-8 w-px bg-slate-100"></div>
                    <nav className="flex gap-2">
                        <button onClick={() => { setIsOutOfStockFilter(false); setView('FOLDERS'); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'FOLDERS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Archive</button>
                        <button onClick={() => setView('MASTER_REPORT')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'MASTER_REPORT' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Master Report</button>
                        <button onClick={() => setView('TRANSACTIONS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'TRANSACTIONS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Transits Ledger</button>
                    </nav>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="relative w-full md:w-auto flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            autoComplete="off"
                            name="store-stock-search"
                            placeholder="Search Reports or Items..." 
                            className="w-full md:w-64 bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold focus:border-indigo-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {userRole === 'ADMIN' && (
                            <>
                                <button 
                                    onClick={openAddModal}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                >
                                    <Plus className="w-4 h-4" /> Add Item
                                </button>
                                <button 
                                    onClick={() => {
                                        setSelectedItemCode('');
                                        setIsCheckOutOnly(false);
                                        setIsCheckInOnly(false);
                                        setIsTxModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-800/20"
                                >
                                    <Plus className="w-4 h-4" /> Record Transit
                                </button>
                            </>
                        )}
                        {userRole === 'ADMIN' && (
                            <button 
                                onClick={() => {
                                    setSelectedItemCode('');
                                    setIsCheckOutOnly(false);
                                    setIsCheckInOnly(true);
                                    setIsTxModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#0e4368] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0c3857] transition-all shadow-lg shadow-[#0e4368]/20"
                            >
                                <Plus className="w-4 h-4" /> Check In Item
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                setSelectedItemCode('');
                                setIsCheckOutOnly(true);
                                setIsCheckInOnly(false);
                                setIsTxModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
                        >
                            <Plus className="w-4 h-4" /> Check Out Item
                        </button>
                        {userRole === 'ADMIN' && (
                            importSuccess ? (
                                <span className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-in zoom-in duration-300">
                                    <CheckCircle2 className="w-4 h-4" /> Import Complete
                                </span>
                            ) : (
                                <button 
                                    onClick={handleImportPDF}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                >
                                    {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Import Stock PDF
                                </button>
                            )
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar print:overflow-visible print:p-0 print:block">
                {view === 'FOLDERS' && (
                    <div className="max-w-7xl mx-auto space-y-10">
                        {/* FOLDER SYSTEM */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            <FolderCard 
                                year="Alerts" 
                                month="Out of Stock" 
                                count={reports[0] ? reports[0].items.filter(i => i.currentStock <= 0).length : 0} 
                                isAlert
                                onClick={() => {
                                    const masterReport = reports[0] || reports.find(r => r.report_id === "SR-20260604-MASTER");
                                    if (masterReport) {
                                        setSelectedReport(masterReport);
                                        setIsOutOfStockFilter(true);
                                        setView('REPORT_VIEW');
                                    }
                                }} 
                            />
                            <FolderCard 
                                year="2026" 
                                month="June" 
                                count={reports.filter(r => r.report_id === "SR-20260604-MASTER").length} 
                                onClick={() => {
                                    const juneReport = reports.find(r => r.report_id === "SR-20260604-MASTER");
                                    if (juneReport) {
                                        setSelectedReport(juneReport);
                                        setView('REPORT_VIEW');
                                    }
                                }} 
                            />
                            <FolderCard 
                                year="2026" 
                                month="May" 
                                count={reports.filter(r => r.report_id === "SR-20260514-MASTER").length} 
                                onClick={() => {
                                    const mayReport = reports.find(r => r.report_id === "SR-20260514-MASTER");
                                    if (mayReport) {
                                        setSelectedReport(mayReport);
                                        setView('REPORT_VIEW');
                                    }
                                }} 
                            />
                            <FolderCard year="2026" month="April" count={0} locked />
                            <FolderCard year="2025" month="Archive" count={0} locked />
                        </div>

                        {/* RECENT ACTIVITY */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-indigo-500" /> Recent Digital Ingestions
                                </h3>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                            <th className="py-6 px-8">Report Identity</th>
                                            <th className="py-6 px-8">Generated</th>
                                            <th className="py-6 px-8">Item Count</th>
                                            <th className="py-6 px-8">Integrity</th>
                                            <th className="py-6 px-8 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {reports.filter(r => 
                                            r.report_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            r.report_date.includes(searchQuery)
                                        ).map(report => (
                                            <tr key={report.report_id} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => { setSelectedReport(report); setView('REPORT_VIEW'); }}>
                                                <td className="py-6 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-sm">{report.report_id}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{report.report_id === "SR-20260604-MASTER" ? "June-2026" : "May-2026"} Store Report</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-8 text-xs font-bold text-slate-600">{report.report_date}</td>
                                                <td className="py-6 px-8">
                                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-900">{report.items.length} Items</span>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                                                        <CheckCircle2 className="w-4 h-4" /> {report.status}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-8 text-right">
                                                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-all"><MoreVertical className="w-4 h-4 text-slate-400" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'REPORT_VIEW' && selectedReport && (
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* REPORT HEADER */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden print:shadow-none print:border-none print:p-0 print:rounded-none print:mb-8">
                            
                            {/* PRINT ONLY HEADER */}
                            <div className="hidden print:flex justify-between items-center mb-8 border-b-2 border-slate-900 pb-4">
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter">ENGLABS STORE PVT LTD</h1>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Enterprise Forensic Audit Report</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Printed: {new Date().toLocaleDateString('en-GB')}</p>
                                </div>
                            </div>

                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl print:hidden"></div>
                            <div className="relative flex justify-between items-start">
                                <div>
                                    <button onClick={() => { setIsOutOfStockFilter(false); setView('FOLDERS'); }} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 hover:underline flex items-center gap-2 print:hidden">
                                        ← Back to Archive
                                    </button>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                                        {isOutOfStockFilter ? "Out of Stock Items Register" : `Store Report: ${selectedReport.report_id}`}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Ingested: {selectedReport.report_date}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Folder className="w-4 h-4" /> Path: /2026/{isOutOfStockFilter ? "Out-Of-Stock" : (selectedReport.report_id === "SR-20260604-MASTER" ? "June" : "May")}
                                        </p>
                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-wider">Firestore Live Sync</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 print:hidden">
                                    <button onClick={handleExportPDF} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all border border-slate-100 shadow-sm" title="Print Forensic Report"><Printer className="w-5 h-5" /></button>
                                    <button onClick={handleShareWhatsApp} className="p-3 bg-slate-50 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all border border-slate-100 shadow-sm" title="Share via WhatsApp"><Share2 className="w-5 h-5" /></button>
                                    <button onClick={exportToExcel} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 shadow-sm" title="Download Audit Data"><Download className="w-5 h-5" /></button>
                                    {userRole === 'ADMIN' && (
                                        <button 
                                            onClick={() => setModalConfig({ type: 'REPORT', data: selectedReport })}
                                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                                        >
                                            <Edit3 className="w-4 h-4" /> Edit Audit
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* STATS STRIP */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-12 print:mt-6 print:border-b print:border-slate-200 print:pb-6 print:gap-4">
                                <ReportStat label={isOutOfStockFilter ? "Critical Alerts" : "Stock Value"} value={isOutOfStockFilter ? filteredReportItems.length.toString() : "₹2,45,000"} color={isOutOfStockFilter ? "red" : "indigo"} />
                                <ReportStat label="Items Registered" value={selectedReport.items.length.toString()} color="slate" />
                                <ReportStat label="Low Stock Alert" value={selectedReport.items.filter(i => i.currentStock < i.minThreshold).length.toString()} color="amber" />
                                <ReportStat label="Replenish Urgent" value={selectedReport.items.filter(i => i.currentStock <= 0).length.toString()} color={selectedReport.items.filter(i => i.currentStock <= 0).length > 0 ? "red" : "emerald"} />
                            </div>
                        </div>

                        {/* ITEM LISTING (RESPONSIVE TABLE / CARDS GRID) */}
                        <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">
                            <div className="p-0 overflow-x-auto print:overflow-visible">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/30">
                                            <th className="py-6 px-8 text-center w-20">Sr. No.</th>
                                            <th className="py-6 px-8">Item Identity</th>
                                            <th className="py-6 px-4">Category</th>
                                            <th className="py-6 px-4">Location</th>
                                            <th className="py-6 px-4">In / Out</th>
                                            <th className="py-6 px-4 text-center">Stock Balance</th>
                                            <th className="py-6 px-4">Status</th>
                                            <th className="py-6 px-8 text-right print:hidden">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredReportItems.map((item, index) => (
                                            <tr key={item.itemCode} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="py-6 px-8 text-center">
                                                    <span className="text-xs font-black text-slate-300 group-hover:text-indigo-500 transition-colors">{(index + 1).toString().padStart(3, '0')}</span>
                                                </td>
                                                <td className="py-6 px-8 flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200/50 shrink-0">
                                                        {item.photoUrl ? (
                                                            <img src={item.photoUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{item.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.itemCode}</p>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 font-black text-[11px] text-slate-500 uppercase tracking-widest">{item.category}</td>
                                                <td className="py-6 px-4">
                                                    <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                                        <Folder className="w-3.5 h-3.5" /> {item.location || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-emerald-500 text-[10px] font-black">+{item.totalInward}</span>
                                                        <span className="text-slate-200 text-xs">|</span>
                                                        <span className="text-amber-500 text-[10px] font-black">-{item.totalOutward}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <div className="flex flex-col items-center">
                                                        <p className="text-xl font-black text-slate-900 tracking-tighter">{item.currentStock}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">{item.unit}</p>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.currentStock >= item.minThreshold ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {item.currentStock >= item.minThreshold ? 'Secure' : 'Replenish'}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-8 text-right print:hidden">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => setViewingSlipItem(item)}
                                                            className="p-2 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-slate-200 hover:border-emerald-100 shadow-sm"
                                                            title="Print Item Slip"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        {userRole === 'ADMIN' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => setModalConfig({ type: 'ITEM', data: item })}
                                                                    className="p-2 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-slate-200 hover:border-indigo-100 shadow-sm"
                                                                    title="Edit Item Stock"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setModalConfig({ type: 'DELETE', data: item })}
                                                                    className="p-2 bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-slate-200 hover:border-red-100 shadow-sm"
                                                                    title="Delete Item Record"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ITEM CARDS (MOBILE RESIZED VIEW) */}
                        <div className="md:hidden space-y-4">
                            {filteredReportItems.map((item, index) => (
                                <div key={item.itemCode} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:border-indigo-500/20 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200/50 shrink-0">
                                                {item.photoUrl ? (
                                                    <img src={item.photoUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">#{(index + 1).toString().padStart(3, '0')}</span>
                                                <h4 className="font-black text-slate-900 text-base mt-0.5">{item.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.itemCode}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.currentStock >= item.minThreshold ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {item.currentStock >= item.minThreshold ? 'Secure' : 'Replenish'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl text-center">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Category</p>
                                            <p className="text-[10px] font-black text-slate-700 truncate">{item.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                                            <p className="text-[10px] font-black text-slate-700 truncate">{item.location || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Stock Balance</p>
                                            <p className="text-xs font-black text-slate-950">{item.currentStock} <span className="text-[9px] font-bold text-slate-400 uppercase">{item.unit}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-emerald-500 text-[10px] font-black">+{item.totalInward} In</span>
                                            <span className="text-slate-200 text-xs">|</span>
                                            <span className="text-amber-500 text-[10px] font-black">-{item.totalOutward} Out</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setViewingSlipItem(item)}
                                                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl border border-emerald-100"
                                                title="Print Item Slip"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                            </button>
                                            {userRole === 'ADMIN' && (
                                                <>
                                                    <button 
                                                        onClick={() => setModalConfig({ type: 'ITEM', data: item })}
                                                        className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5"
                                                        title="Edit Item Stock"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => setModalConfig({ type: 'DELETE', data: item })}
                                                        className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all border border-rose-100 animate-pulse"
                                                        title="Delete Item Record"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {view === 'MASTER_REPORT' && (
                    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                            <h2 className="text-2xl font-black text-slate-900 mb-6">Aggregated Master Inventory</h2>
                            <p className="text-slate-500 text-sm mb-8">Comprehensive forensic overview of all stock categories and movement trends for May-2026.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Mechanical Assets</p>
                                    <p className="text-3xl font-black text-indigo-900">112 Items</p>
                                </div>
                                <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Electrical Assets</p>
                                    <p className="text-3xl font-black text-emerald-900">45 Items</p>
                                </div>
                                <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Chemical Assets</p>
                                    <p className="text-3xl font-black text-amber-900">12 Items</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-10 text-center">
                            <div className="flex flex-col items-center gap-4 text-slate-300 py-20">
                                <RefreshCcw className="w-16 h-16 opacity-20 animate-spin-slow" />
                                <p className="font-black text-lg uppercase tracking-widest">Master Analysis in Progress</p>
                                <p className="text-sm text-slate-400 max-w-md">Forensic reconciliation engine is currently aggregating cross-departmental stock logs. Full report will be available upon completion of May-2026 audit cycle.</p>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'TRANSACTIONS' && (
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                        {/* HEADER BLOCK */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl"></div>
                            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Transits Ledger</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Check-In & Check-Out Audit Logs</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 flex flex-col items-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Check-Ins</span>
                                        <span className="text-xl font-black text-emerald-600">{transactions.filter(t => t.type === 'INWARD').length}</span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 flex flex-col items-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Check-Outs</span>
                                        <span className="text-xl font-black text-amber-600">{transactions.filter(t => t.type === 'OUTWARD').length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TRANSACTION LOGS TABLE */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            {transactions.length === 0 ? (
                                <div className="p-20 text-center flex flex-col items-center gap-4 text-slate-300">
                                    <Clock className="w-16 h-16 opacity-20" />
                                    <p className="font-black text-lg uppercase tracking-widest">No Transits Logged</p>
                                    <p className="text-sm text-slate-400 max-w-sm">No inward or outward stock transactions have been recorded in this cycle yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/30">
                                                <th className="py-6 px-8">Timestamp</th>
                                                <th className="py-6 px-4">Flow</th>
                                                <th className="py-6 px-8">Item Identity</th>
                                                <th className="py-6 px-4 text-center">Quantity</th>
                                                <th className="py-6 px-4 text-center">Stock Shift</th>
                                                <th className="py-6 px-4">Reference</th>
                                                <th className="py-6 px-4">Project ID</th>
                                                <th className="py-6 px-4">Operator</th>
                                                <th className="py-6 px-8 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-xs">
                                            {transactions.filter(tx => {
                                                const query = searchQuery.toLowerCase();
                                                return (
                                                    tx.itemId.toLowerCase().includes(query) ||
                                                    tx.referenceId.toLowerCase().includes(query) ||
                                                    tx.partyName.toLowerCase().includes(query) ||
                                                    (tx.projectId && tx.projectId.toLowerCase().includes(query))
                                                );
                                            }).map((tx) => (
                                                <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="py-5 px-8 font-medium text-slate-500">
                                                        {new Date(tx.timestamp).toLocaleString('en-GB')}
                                                    </td>
                                                    <td className="py-5 px-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                                                            tx.type === 'INWARD' 
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                        }`}>
                                                            {tx.type === 'INWARD' ? (
                                                                <>
                                                                    <ArrowUpRight className="w-3.5 h-3.5" /> Check-In
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ArrowDownRight className="w-3.5 h-3.5" /> Check-Out
                                                                </>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <p className="font-black text-slate-900">{tx.itemId.replace(/_/g, ' ')}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">{tx.itemId}</p>
                                                    </td>
                                                    <td className="py-5 px-4 text-center font-black text-slate-700">
                                                        {tx.quantity}
                                                    </td>
                                                    <td className="py-5 px-4 text-center text-slate-500 font-bold">
                                                        {tx.previousStock} → <span className="font-black text-slate-900">{tx.newStock}</span>
                                                    </td>
                                                    <td className="py-5 px-4 font-black text-indigo-600 uppercase">
                                                        <div className="flex items-center gap-2">
                                                            <span>{tx.referenceId}</span>
                                                            {tx.photoUrl && (
                                                                <div className="relative group shrink-0">
                                                                    <Camera className="w-4 h-4 text-emerald-500 cursor-pointer hover:text-emerald-600" />
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-xl bg-white hidden group-hover:block z-50">
                                                                        <img src={tx.photoUrl} className="w-full h-full object-cover" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-4 font-black text-slate-700 uppercase">
                                                        {tx.projectId || 'GENERAL'}
                                                    </td>
                                                    <td className="py-5 px-4 text-slate-600 font-medium">
                                                        {tx.partyName}
                                                    </td>
                                                    <td className="py-5 px-8 text-right">
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                            <CheckCircle2 className="w-3 h-3" /> Ledger Parity
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {modalConfig && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                    {modalConfig.type === 'ITEM' ? `Adjust Stock: ${modalConfig.data.name}` : `Edit Report Identity`}
                                </h3>
                                <button onClick={() => setModalConfig(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><RefreshCcw className="w-5 h-5 rotate-45" /></button>
                            </div>
                            <div className="p-10 space-y-6">
                                {modalConfig.type === 'ITEM' ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Available Stock Level</label>
                                            <input 
                                                type="number" 
                                                defaultValue={modalConfig.data.currentStock}
                                                id="stock-input"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-2xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Item Image / Photo</label>
                                            <div className="flex items-center gap-4">
                                                {editItemPhoto ? (
                                                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 relative">
                                                        <img src={editItemPhoto} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setEditItemPhoto('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"><X className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                ) : (
                                                    <label className="w-16 h-16 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                                                        <Camera className="w-5 h-5 text-slate-400" />
                                                        <span className="text-[7px] font-black uppercase text-slate-400 mt-1">Upload</span>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (event) => {
                                                                        setEditItemPhoto(event.target?.result as string);
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }} 
                                                            className="hidden" 
                                                        />
                                                    </label>
                                                )}
                                                <p className="text-[9px] text-slate-400 font-bold max-w-[200px]">Optional: Reference photograph for visual inventory audits.</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : modalConfig.type === 'REPORT' ? (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Report Forensic ID</label>
                                        <input 
                                            type="text" 
                                            defaultValue={modalConfig.data.report_id}
                                            id="report-id-input"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <p className="text-sm text-slate-500 text-center">Permanently remove <span className="font-black text-slate-900">{modalConfig.data.name}</span> from the audit ledger?</p>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Enter Protocol Key</label>
                                            <input 
                                                type="password" 
                                                autoComplete="new-password"
                                                value={passcode}
                                                onChange={(e) => setPasscode(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-xl font-black text-slate-900 outline-none focus:border-red-500 transition-all text-center tracking-[0.5em]"
                                                placeholder="••••"
                                            />
                                        </div>
                                    </div>
                                )}
                                <button 
                                    onClick={() => {
                                        if (modalConfig.type === 'ITEM') {
                                            const val = (document.getElementById('stock-input') as HTMLInputElement).value;
                                            handleEditItem(modalConfig.data, parseInt(val), editItemPhoto);
                                            setModalConfig(null);
                                        } else if (modalConfig.type === 'REPORT') {
                                            const val = (document.getElementById('report-id-input') as HTMLInputElement).value;
                                            const updated = { ...selectedReport!, report_id: val };
                                            setSelectedReport(updated);
                                            setReports(prev => prev.map(r => r.report_id === selectedReport!.report_id ? updated : r));
                                            setModalConfig(null);
                                        } else {
                                            handleDeleteItem(modalConfig.data.itemCode);
                                        }
                                    }}
                                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${modalConfig.type === 'DELETE' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-900 text-emerald-400 hover:bg-slate-800'}`}
                                >
                                    Confirm Audit Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ADD ITEM MODAL */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Manual Registry Intake</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Register New Stock Item / Asset</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const target = e.target as HTMLFormElement;
                                const name = target.elements.namedItem('itemName') as HTMLInputElement;
                                const code = target.elements.namedItem('itemCode') as HTMLInputElement;
                                const category = target.elements.namedItem('category') as HTMLInputElement;
                                const location = target.elements.namedItem('location') as HTMLInputElement;
                                const stock = target.elements.namedItem('stock') as HTMLInputElement;
                                const unit = target.elements.namedItem('unit') as HTMLInputElement;
                                const minThreshold = target.elements.namedItem('minThreshold') as HTMLInputElement;

                                const newItem: InventoryItem = {
                                    name: name.value,
                                    itemCode: code.value.toUpperCase().trim(),
                                    category: category.value,
                                    location: location.value,
                                    currentStock: parseInt(stock.value) || 0,
                                    unit: unit.value.toUpperCase().trim(),
                                    minThreshold: parseInt(minThreshold.value) || 10,
                                    totalInward: parseInt(stock.value) || 0,
                                    totalOutward: 0,
                                    lastUpdated: new Date().toISOString(),
                                    photoUrl: newItemPhoto
                                };
                                try {
                                    await addInventoryItem(newItem);
                                } catch (err) {
                                    console.error("Firestore save failed, adding locally:", err);
                                }

                                if (selectedReport) {
                                    const updatedItems = [...selectedReport.items, newItem];
                                    const updatedReport = { ...selectedReport, items: updatedItems };
                                    setSelectedReport(updatedReport);
                                    setReports(prev => prev.map(r => r.report_id === updatedReport.report_id ? updatedReport : r));
                                }

                                // Auto-select the newly registered item inside check-in/checkout modals
                                setSelectedItemCode(newItem.itemCode);
                                const unitStr = newItem.unit.toLowerCase();
                                if (unitStr.includes('pc')) setSelectedUnit('Pcs');
                                else if (unitStr.includes('kg')) setSelectedUnit('Kg');
                                else if (unitStr.includes('lt')) setSelectedUnit('Ltr');
                                else if (unitStr.includes('no')) setSelectedUnit('Nos');
                                else setSelectedUnit('Pcs');

                                setIsAddModalOpen(false);
                                setNewItemPhoto('');
                            }} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Item Name (Full Name)</label>
                                    <input name="itemName" required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none" placeholder="Ex: JK Bond Paper" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Item Code</label>
                                        {addItemCodeMode === 'SELECT' ? (
                                            <select 
                                                name="itemCode" 
                                                required 
                                                value={addItemCode}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'CUSTOM') {
                                                        setAddItemCodeMode('CUSTOM');
                                                        setAddItemCode('');
                                                    } else {
                                                        setAddItemCode(val);
                                                    }
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none"
                                            >
                                                <option value="">-- Choose Code --</option>
                                                {existingItemCodes.map(code => (
                                                    <option key={code} value={code}>{code}</option>
                                                ))}
                                                <option value="CUSTOM">+ Create New...</option>
                                            </select>
                                        ) : (
                                            <div className="relative">
                                                <input 
                                                    name="itemCode" 
                                                    required 
                                                    value={addItemCode}
                                                    onChange={(e) => setAddItemCode(e.target.value)}
                                                    type="text" 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none pr-12" 
                                                    placeholder="Ex: PAP-101" 
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setAddItemCodeMode('SELECT');
                                                        setAddItemCode('');
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase"
                                                >
                                                    Select
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                                        {addCategoryMode === 'SELECT' ? (
                                            <select 
                                                name="category" 
                                                required 
                                                value={addCategory}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'CUSTOM') {
                                                        setAddCategoryMode('CUSTOM');
                                                        setAddCategory('');
                                                    } else {
                                                        setAddCategory(val);
                                                    }
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none"
                                            >
                                                <option value="">-- Choose Category --</option>
                                                {existingCategories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                <option value="CUSTOM">+ Create New...</option>
                                            </select>
                                        ) : (
                                            <div className="relative">
                                                <input 
                                                    name="category" 
                                                    required 
                                                    value={addCategory}
                                                    onChange={(e) => setAddCategory(e.target.value)}
                                                    type="text" 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none pr-12" 
                                                    placeholder="Ex: Stationery" 
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setAddCategoryMode('SELECT');
                                                        setAddCategory('');
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase"
                                                >
                                                    Select
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Location (Rack)</label>
                                        {addLocationMode === 'SELECT' ? (
                                            <select 
                                                name="location" 
                                                required 
                                                value={addLocation}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'CUSTOM') {
                                                        setAddLocationMode('CUSTOM');
                                                        setAddLocation('');
                                                    } else {
                                                        setAddLocation(val);
                                                    }
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none"
                                            >
                                                <option value="">-- Choose Location --</option>
                                                {existingLocations.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                                <option value="CUSTOM">+ Create New...</option>
                                            </select>
                                        ) : (
                                            <div className="relative">
                                                <input 
                                                    name="location" 
                                                    required 
                                                    value={addLocation}
                                                    onChange={(e) => setAddLocation(e.target.value)}
                                                    type="text" 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none pr-12" 
                                                    placeholder="Ex: Rack-2" 
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setAddLocationMode('SELECT');
                                                        setAddLocation('');
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase"
                                                >
                                                    Select
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit</label>
                                        <select 
                                            name="unit" 
                                            required 
                                            value={addUnit}
                                            onChange={(e) => setAddUnit(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none"
                                        >
                                            <option value="Pcs">Pcs</option>
                                            <option value="Kg">Kg</option>
                                            <option value="Ltr">Ltr</option>
                                            <option value="Nos">Nos</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Item Image / Photo</label>
                                    <div className="flex items-center gap-4">
                                        {newItemPhoto ? (
                                            <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 relative">
                                                <img src={newItemPhoto} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setNewItemPhoto('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ) : (
                                            <label className="w-16 h-16 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                                                <Camera className="w-5 h-5 text-slate-400" />
                                                <span className="text-[7px] font-black uppercase text-slate-400 mt-1">Upload</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                setNewItemPhoto(event.target?.result as string);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} 
                                                    className="hidden" 
                                                />
                                            </label>
                                        )}
                                        <p className="text-[9px] text-slate-400 font-bold max-w-[200px]">Optional: Attach a reference photograph for visual inventory audits.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Initial Stock</label>
                                        <input name="stock" required type="number" min="0" defaultValue="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Min Threshold</label>
                                        <input name="minThreshold" required type="number" min="1" defaultValue="5" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                                    Register Item
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* RECORD TRANSIT MODAL */}
                {isTxModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 print:hidden animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                        {isCheckOutOnly ? 'Manual Material Check-Out' : isCheckInOnly ? 'Manual Material Check-In' : 'Record Stock Transit'}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        {isCheckOutOnly ? 'Immediate Store Inventory Release' : isCheckInOnly ? 'Immediate Store Inventory Addition' : 'Manual Check-In & Check-Out Entry'}
                                    </p>
                                </div>
                                <button onClick={() => { setIsTxModalOpen(false); setIsCheckOutOnly(false); setIsCheckInOnly(false); setSelectedProjectTx(''); setCheckoutPhoto(''); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const itemCodeVal = (form.elements.namedItem('itemCode') as HTMLSelectElement).value;
                                const typeVal = isCheckOutOnly ? 'OUTWARD' : isCheckInOnly ? 'INWARD' : ((form.elements.namedItem('type') as HTMLSelectElement).value as 'INWARD' | 'OUTWARD');
                                const quantityVal = parseInt((form.elements.namedItem('quantity') as HTMLInputElement).value) || 0;
                                const partyVal = (form.elements.namedItem('partyName') as HTMLSelectElement).value;
                                const invoiceVal = (form.elements.namedItem('invoiceNumber') as HTMLInputElement).value;

                                const itemCatalog = selectedReport ? selectedReport.items : (reports[0] ? reports[0].items : []);
                                const selectedItem = itemCatalog.find(i => i.itemCode === itemCodeVal);
                                if (!selectedItem) {
                                    alert("Please select a valid item.");
                                    return;
                                }

                                try {
                                    setIsLoading(true);
                                    const res: any = await recordManualTransaction(
                                        selectedItem.name,
                                        quantityVal,
                                        selectedUnit,
                                        typeVal,
                                        partyVal,
                                        invoiceVal,
                                        undefined,
                                        checkoutPhoto,
                                        selectedProjectTx
                                    );
                                    if (res.success) {
                                        setRefreshTrigger(prev => prev + 1);
                                        setIsTxModalOpen(false);
                                        setIsCheckOutOnly(false);
                                        setIsCheckInOnly(false);
                                        setSelectedProjectTx('');
                                        setCheckoutPhoto('');
                                    } else {
                                        alert(`Failed to record transaction: ${res.error || 'Unknown error'}`);
                                    }
                                } catch (err: any) {
                                    alert(`System error: ${err.message || err}`);
                                } finally {
                                    setIsLoading(false);
                                }
                            }} className="p-8 space-y-5">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Item / Asset</label>
                                        <button 
                                            type="button"
                                            onClick={openAddModal}
                                            className="text-[9px] font-black text-[#0e4368] hover:text-[#0b3350] uppercase tracking-widest flex items-center gap-1 transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> New Item
                                        </button>
                                    </div>
                                    <select 
                                        name="itemCode" 
                                        required 
                                        value={selectedItemCode}
                                        onChange={(e) => {
                                            const code = e.target.value;
                                            setSelectedItemCode(code);
                                            const items = selectedReport ? selectedReport.items : (reports[0] ? reports[0].items : []);
                                            const found = items.find(i => i.itemCode === code);
                                            if (found) {
                                                const unitStr = found.unit.toLowerCase();
                                                if (unitStr.includes('pc')) setSelectedUnit('Pcs');
                                                else if (unitStr.includes('kg')) setSelectedUnit('Kg');
                                                else if (unitStr.includes('lt')) setSelectedUnit('Ltr');
                                                else if (unitStr.includes('no')) setSelectedUnit('Nos');
                                                else setSelectedUnit('Pcs');
                                            }
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">-- Choose Stock Item --</option>
                                        {(selectedReport ? selectedReport.items : (reports[0] ? reports[0].items : [])).map((item) => (
                                            <option key={item.itemCode} value={item.itemCode}>
                                                [{item.itemCode}] {item.name} ({item.currentStock} {item.unit} available)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {(!isCheckOutOnly && !isCheckInOnly) ? (
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Flow Type</label>
                                            <select name="type" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none">
                                                <option value="INWARD">Check-In (Inward)</option>
                                                <option value="OUTWARD">Check-Out (Outward)</option>
                                            </select>
                                        </div>
                                    ) : null}
                                    <div className={`space-y-2 ${(isCheckOutOnly || isCheckInOnly) ? 'col-span-2' : ''}`}>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                                        <input name="quantity" required type="number" min="1" defaultValue="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit</label>
                                    <div className="flex gap-2 bg-slate-50 p-1.5 border border-slate-200 rounded-xl items-center">
                                        {['Pcs', 'Kg', 'Ltr', 'Nos'].map((u) => (
                                            <button
                                                key={u}
                                                type="button"
                                                onClick={() => setSelectedUnit(u)}
                                                className={`flex-1 py-3.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                    selectedUnit === u
                                                    ? 'bg-slate-900 text-white shadow-md'
                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Assigned Operator / Staff</label>
                                    <select name="partyName" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none">
                                        <option value="">-- Select Staff Member --</option>
                                        {STAFF_ROSTER.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reference / Invoice No.</label>
                                    <input name="invoiceNumber" required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none" placeholder="Ex: ENG-01-0001" defaultValue={getNextInvoiceNumber()} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Project ID / Use</label>
                                    <select 
                                        value={selectedProjectTx || 'GENERAL'}
                                        onChange={(e) => setSelectedProjectTx(e.target.value === 'GENERAL' ? '' : e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-xs font-bold focus:border-indigo-500 outline-none"
                                    >
                                        <option value="GENERAL">GENERAL</option>
                                        {projectList.filter(pid => pid !== 'GENERAL').map((pid) => (
                                            <option key={pid} value={pid}>{pid}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                         {isCheckInOnly ? 'Cargo / Inward Photo' : 'Cargo / Release Photo'}
                                     </label>
                                     <div className="flex items-center gap-4">
                                         {checkoutPhoto ? (
                                             <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 relative">
                                                 <img src={checkoutPhoto} className="w-full h-full object-cover" />
                                                 <button type="button" onClick={() => setCheckoutPhoto('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"><X className="w-3.5 h-3.5" /></button>
                                             </div>
                                         ) : (
                                             <label className="w-16 h-16 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                                                 <Camera className="w-5 h-5 text-slate-400" />
                                                 <span className="text-[7px] font-black uppercase text-slate-400 mt-1">Upload</span>
                                                 <input 
                                                     type="file" 
                                                     accept="image/*" 
                                                     onChange={async (e) => {
                                                         const file = e.target.files?.[0];
                                                         if (file) {
                                                             const reader = new FileReader();
                                                             reader.onload = (event) => {
                                                                 setCheckoutPhoto(event.target?.result as string);
                                                             };
                                                             reader.readAsDataURL(file);
                                                         }
                                                     }} 
                                                     className="hidden" 
                                                 />
                                             </label>
                                         )}
                                         <p className="text-[9px] text-slate-400 font-bold max-w-[200px]">
                                             Optional: Attach a live {isCheckInOnly ? 'check-in' : 'check-out'} photo for material security compliance.
                                         </p>
                                     </div>
                                 </div>
                                <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest shadow-lg disabled:opacity-50 mt-4">
                                    {isLoading ? 'Syncing Ledger...' : (isCheckOutOnly ? 'Confirm Check-Out' : isCheckInOnly ? 'Confirm Check-In' : 'Commit Transit Entry')}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* VIEW SLIP MODAL */}
                {viewingSlipItem && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 print:p-0 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-[450px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col print:border-0 print:shadow-none print:max-w-none print:w-full print:rounded-none">
                            {/* Header */}
                            <div className="bg-[#0e4368] p-8 text-white flex justify-between items-center print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <div className="flex items-center gap-4">
                                    <img src={logo} alt="Englabs" className="h-16 print:h-20 object-contain" />
                                    <div>
                                        <h2 className="text-xl font-black tracking-tighter">ENGLABS STORE</h2>
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">India Private Limited • Store Stock Slip</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingSlipItem(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors print:hidden">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div id="stock-slip-print-area" className="p-10 flex-1 relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-30deg]">
                                    <h1 className="text-[100px] font-black">ENGLABS STORE</h1>
                                </div>

                                <div className="space-y-8 relative z-10">
                                    <div className="border-b border-dashed border-slate-200 pb-6">
                                        <span className="px-3 py-1 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-700 uppercase tracking-widest">
                                            STOCK INVENTORY ITEM
                                        </span>
                                        <h1 className="text-2xl font-black text-slate-900 mt-4 tracking-tight leading-tight">{viewingSlipItem.name}</h1>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Item Code: {viewingSlipItem.itemCode}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-6">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                                            <p className="text-sm font-black text-slate-900 mt-1">{viewingSlipItem.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location / Rack</p>
                                            <p className="text-sm font-black text-slate-900 mt-1">{viewingSlipItem.location || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Threshold</p>
                                            <p className="text-sm font-black text-slate-900 mt-1">{viewingSlipItem.minThreshold} {viewingSlipItem.unit}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Updated</p>
                                            <p className="text-xs font-bold text-slate-500 mt-1">
                                                {new Date(viewingSlipItem.lastUpdated).toLocaleDateString('en-GB')} {new Date(viewingSlipItem.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between mt-6 print:bg-white print:border print:border-slate-200">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock Balance</p>
                                            <p className="text-3xl font-black text-slate-900 tracking-tighter">
                                                {viewingSlipItem.currentStock} <span className="text-sm font-black text-slate-400 uppercase">{viewingSlipItem.unit}</span>
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${viewingSlipItem.currentStock >= viewingSlipItem.minThreshold ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {viewingSlipItem.currentStock >= viewingSlipItem.minThreshold ? 'Secure' : 'Replenish'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-slate-50 p-8 border-t border-slate-100 flex gap-4 print:hidden">
                                <button 
                                    onClick={() => window.print()}
                                    className="flex-1 bg-[#0e4368] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                                >
                                    <Printer className="w-4 h-4 text-emerald-500" /> PRINT STOCK SLIP
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {viewingSlipItem && (
                    <style dangerouslySetInnerHTML={{ __html: `
                        @media print {
                            @page {
                                size: portrait;
                                margin: 15mm;
                            }
                            body * {
                                visibility: hidden !important;
                            }
                            #stock-slip-print-area, #stock-slip-print-area * {
                                visibility: visible !important;
                            }
                            #stock-slip-print-area {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                        }
                    `}} />
                )}
            </main>
        </div>
    );
};

const FolderCard = ({ year, month, count, locked, onClick, isAlert }: any) => (
    <div 
        onClick={!locked ? onClick : undefined}
        className={`p-8 rounded-[2rem] border transition-all group ${
            locked 
                ? 'bg-slate-50/50 grayscale border-slate-100 shadow-sm' 
                : isAlert 
                    ? 'bg-rose-50/30 border-rose-100 hover:border-rose-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer animate-pulse'
                    : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer'
        }`}
    >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
            locked 
                ? 'bg-slate-100 text-slate-400' 
                : isAlert 
                    ? 'bg-rose-100 text-rose-600' 
                    : 'bg-indigo-50 text-indigo-600'
        }`}>
            <Folder className="w-7 h-7" />
        </div>
        <div className="flex justify-between items-end">
            <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isAlert ? 'text-rose-400' : 'text-slate-400'}`}>{year}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{month}</p>
            </div>
            {locked ? (
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Locked</span>
            ) : (
                <div className="flex flex-col items-end">
                    <span className={`text-sm font-black ${isAlert ? 'text-rose-600' : 'text-indigo-600'}`}>{count}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{isAlert ? 'Items' : 'Reports'}</span>
                </div>
            )}
        </div>
    </div>
);

const ReportStat = ({ label, value, color }: any) => {
    const colors: any = {
        indigo: "text-indigo-600",
        slate: "text-slate-600",
        amber: "text-amber-600",
        emerald: "text-emerald-600"
    };
    return (
        <div className="p-4 md:p-6 bg-slate-50/50 rounded-[1.25rem] md:rounded-2xl border border-slate-100">
            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-lg md:text-2xl font-black tracking-tighter ${colors[color]}`}>{value}</p>
        </div>
    );
};

export default StoreStockReport;

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
    Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { InventoryItem } from '../lib/gate_system';

interface StockReport {
    report_id: string;
    report_date: string;
    items: InventoryItem[];
    status: 'AUDITED' | 'PENDING' | 'SYNCED';
}

const StoreStockReport: React.FC = () => {
    const [view, setView] = useState<'FOLDERS' | 'REPORT_VIEW' | 'MASTER_REPORT'>('FOLDERS');
    const [selectedReport, setSelectedReport] = useState<StockReport | null>(null);
    const [reports, setReports] = useState<StockReport[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ type: 'ITEM' | 'REPORT' | 'DELETE', data: any } | null>(null);
    const [passcode, setPasscode] = useState('');

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
            { name: "Transparent Tape", "itemCode": "TAP-146", category: "Stationery", currentStock: 3, unit: "Pcs", location: "Rack-2", totalInward: 3, totalOutward: 0, minThreshold: 10, lastUpdated: "2026-05-14T10:00:00Z" },
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

        const mockReports: StockReport[] = [
            {
                report_id: "SR-20260514-MASTER",
                report_date: "2026-05-14",
                status: 'SYNCED',
                items: masterItems
            }
        ];
        setReports(mockReports);
        setSelectedReport(mockReports[0]);
    }, []);

    const handleDeleteItem = (itemCode: string) => {
        if (passcode === 'ADMIN2026') {
            if (selectedReport) {
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

    const handleEditItem = (item: InventoryItem, newStock: number) => {
        if (selectedReport) {
            const updatedItems = selectedReport.items.map(i => 
                i.itemCode === item.itemCode ? { ...i, currentStock: newStock, lastUpdated: new Date().toISOString() } : i
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
        const dataToExport = selectedReport ? selectedReport.items : reports.flatMap(r => r.items);
        const fileName = selectedReport ? `Stock_Report_${selectedReport.report_id}` : `Master_Stock_Inventory_${new Date().toISOString().split('T')[0]}`;

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
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] print:bg-white print:block">
            {/* TOP COMMAND BAR */}
            <header className="h-auto md:h-20 bg-white border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-10 py-4 md:py-0 shrink-0 gap-4 md:gap-0 print:hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full md:w-auto">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-slate-900 leading-none">Store Stock Registry</h1>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Forensic Inventory Management & Audit</span>
                    </div>
                    <div className="hidden md:block h-8 w-px bg-slate-100"></div>
                    <nav className="flex gap-2">
                        <button onClick={() => setView('FOLDERS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'FOLDERS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Archive</button>
                        <button onClick={() => setView('MASTER_REPORT')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'MASTER_REPORT' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Master Report</button>
                    </nav>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="relative w-full md:w-auto flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search Reports..." 
                            className="w-full md:w-64 bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold focus:border-indigo-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                        {importSuccess ? (
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
                        )}
                    </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar print:overflow-visible print:p-0 print:block">
                {view === 'FOLDERS' && (
                    <div className="max-w-7xl mx-auto space-y-10">
                        {/* FOLDER SYSTEM */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FolderCard year="2026" month="May" count={reports.length} onClick={() => setView('REPORT_VIEW')} />
                            <FolderCard year="2026" month="April" count={0} locked />
                            <FolderCard year="2026" month="March" count={0} locked />
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
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">May-2026 Store Report</p>
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
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter">ENGLABS INDIA PVT LTD</h1>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Enterprise Forensic Audit Report</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Printed: {new Date().toLocaleDateString('en-GB')}</p>
                                </div>
                            </div>

                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl print:hidden"></div>
                            <div className="relative flex justify-between items-start">
                                <div>
                                    <button onClick={() => setView('FOLDERS')} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 hover:underline flex items-center gap-2 print:hidden">
                                        ← Back to Archive
                                    </button>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Store Report: {selectedReport.report_id}</h2>
                                    <div className="flex items-center gap-6 mt-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Ingested: {selectedReport.report_date}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Folder className="w-4 h-4" /> Path: /2026/May
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 print:hidden">
                                    <button onClick={handleExportPDF} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all border border-slate-100 shadow-sm" title="Print Forensic Report"><Printer className="w-5 h-5" /></button>
                                    <button onClick={handleShareWhatsApp} className="p-3 bg-slate-50 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all border border-slate-100 shadow-sm" title="Share via WhatsApp"><Share2 className="w-5 h-5" /></button>
                                    <button onClick={exportToExcel} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 shadow-sm" title="Download Audit Data"><Download className="w-5 h-5" /></button>
                                    <button 
                                        onClick={() => setModalConfig({ type: 'REPORT', data: selectedReport })}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                                    >
                                        <Edit3 className="w-4 h-4" /> Edit Audit
                                    </button>
                                </div>
                            </div>

                            {/* STATS STRIP */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-12 print:mt-6 print:border-b print:border-slate-200 print:pb-6 print:gap-4">
                                <ReportStat label="Stock Value" value="₹2,45,000" color="indigo" />
                                <ReportStat label="Items Audited" value={selectedReport.items.length.toString()} color="slate" />
                                <ReportStat label="Low Stock" value={selectedReport.items.filter(i => i.currentStock < i.minThreshold).length.toString()} color="amber" />
                                <ReportStat label="Accuracy" value="100%" color="emerald" />
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
                                        {selectedReport.items.filter(i => 
                                            i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            i.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            i.category.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map((item, index) => (
                                            <tr key={item.itemCode} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="py-6 px-8 text-center">
                                                    <span className="text-xs font-black text-slate-300 group-hover:text-indigo-500 transition-colors">{(index + 1).toString().padStart(3, '0')}</span>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <p className="font-black text-slate-900 text-sm">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.itemCode}</p>
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
                            {selectedReport.items.filter(i => 
                                i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                i.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                i.category.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((item, index) => (
                                <div key={item.itemCode} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:border-indigo-500/20 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">#{(index + 1).toString().padStart(3, '0')}</span>
                                            <h4 className="font-black text-slate-900 text-base mt-0.5">{item.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.itemCode}</p>
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
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Available Stock Level</label>
                                        <input 
                                            type="number" 
                                            defaultValue={modalConfig.data.currentStock}
                                            id="stock-input"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-2xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all"
                                        />
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
                                            handleEditItem(modalConfig.data, parseInt(val));
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
            </main>
        </div>
    );
};

const FolderCard = ({ year, month, count, locked, onClick }: any) => (
    <div 
        onClick={!locked ? onClick : undefined}
        className={`p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all group ${locked ? 'bg-slate-50/50 grayscale' : 'bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer'}`}
    >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${locked ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <Folder className="w-7 h-7" />
        </div>
        <div className="flex justify-between items-end">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{year}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{month}</p>
            </div>
            {locked ? (
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Locked</span>
            ) : (
                <div className="flex flex-col items-end">
                    <span className="text-indigo-600 text-sm font-black">{count}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Reports</span>
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

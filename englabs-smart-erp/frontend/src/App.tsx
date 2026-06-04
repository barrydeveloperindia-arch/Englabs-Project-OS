import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  BookOpen, 
  FileSpreadsheet, 
  Archive, 
  LogOut, 
  Search, 
  Plus, 
  AlertTriangle, 
  History, 
  Printer, 
  FileText,
  Lock,
  Loader2,
  Settings,
  ShieldAlert
} from 'lucide-react';

// Interfaces
interface UserSession {
  token: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
}

interface Item {
  id: number;
  name: string;
  category: string;
  opening_stock: number;
  current_stock: number;
  unit: string;
  min_threshold: number;
  location: string;
  last_updated: string;
}

interface Transaction {
  id: number;
  item_id: number;
  item_name?: string;
  item_category?: string;
  unit?: string;
  type: 'IN' | 'OUT';
  quantity: number;
  purpose: string;
  department: string;
  receiver_name: string;
  supplier_name: string;
  invoice_no: string;
  running_balance: number;
  timestamp: string;
  user_name?: string;
}

interface ActivityLog {
  id: number;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

interface ReportArchive {
  id: number;
  name: string;
  type: 'EXCEL' | 'PDF';
  created_by: string;
  timestamp: string;
}

interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'danger';
}

const BACKEND_URL = 'http://localhost:5000';

function App() {
  // Session & Auth State
  const [session, setSession] = useState<UserSession | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App Navigation State
  const [activeTab, setActiveTab] = useState<'inventory' | 'ledger' | 'reports' | 'archive'>('inventory');
  
  // Data State
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [reportsArchive, setReportsArchive] = useState<ReportArchive[]>([]);
  const [movementReport, setMovementReport] = useState<{ fastMoving: any[], slowMoving: any[] }>({ fastMoving: [], slowMoving: [] });

  // Filtering / Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLedgerItemId, setSelectedLedgerItemId] = useState<number | null>(null);
  const [ledgerData, setLedgerData] = useState<{ item: Item, ledger: Transaction[] } | null>(null);
  
  // Report Filter State
  const [reportCategory, setReportCategory] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Form / Modal States
  const [showItemModal, setShowItemModal] = useState(false);
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showOutwardModal, setShowOutwardModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // New Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemOpeningStock, setNewItemOpeningStock] = useState('0');
  const [newItemUnit, setNewItemUnit] = useState('Pcs');
  const [newItemMinThreshold, setNewItemMinThreshold] = useState('10');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [itemFormError, setItemFormError] = useState('');

  // Transaction Form States
  const [txItemId, setTxItemId] = useState<number>(0);
  const [txQuantity, setTxQuantity] = useState('1');
  const [txPurpose, setTxPurpose] = useState('');
  const [txDepartment, setTxDepartment] = useState('');
  const [txReceiverName, setTxReceiverName] = useState('');
  const [txSupplierName, setTxSupplierName] = useState('');
  const [txInvoiceNo, setTxInvoiceNo] = useState('');
  const [txError, setTxError] = useState('');

  // Real-time UI Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Refs for auto-focus
  const itemInputRef = useRef<HTMLInputElement>(null);
  const txInputRef = useRef<HTMLInputElement>(null);

  // Check storage for existing token
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('username');
    const savedRole = localStorage.getItem('role');

    if (savedToken && savedUser && savedRole) {
      setSession({
        token: savedToken,
        username: savedUser,
        role: savedRole as 'ADMIN' | 'STAFF'
      });
    }
  }, []);

  // Fetch initial data once session is active
  useEffect(() => {
    if (!session) return;

    fetchInventory();
    fetchTransactions();
    fetchLogs();
    fetchArchive();
    fetchMovement();

    // Setup Websocket
    const newSocket = io(BACKEND_URL);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      newSocket.emit('join_room', 'erp_updates');
    });

    // Handle real-time stock modifications
    newSocket.on('stock_updated', (data: any) => {
      // 1. Update items array
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === data.item_id 
            ? { ...item, current_stock: data.running_balance, last_updated: data.timestamp } 
            : item
        )
      );

      // 2. Prepend transaction list
      setTransactions(prev => [data, ...prev]);

      // 3. Add visual toast
      addToast(
        data.type === 'IN' ? 'Stock Inward' : 'Stock Outward',
        `${data.quantity} ${data.unit} of ${data.name} ${data.type === 'IN' ? 'added by' : 'issued to'} ${data.user}`,
        data.type === 'IN' ? 'info' : 'warning'
      );

      // 4. Update ledger if active
      if (selectedLedgerItemId === data.item_id) {
        fetchLedger(data.item_id);
      }

      // Refresh other feeds
      fetchLogs();
      fetchMovement();
    });

    newSocket.on('item_created', (newItem: Item) => {
      setItems(prev => [...prev, newItem]);
      addToast('New Item Cataloged', `${newItem.name} has been added to inventory.`, 'info');
      fetchLogs();
    });

    newSocket.on('item_updated', (updatedItem: Item) => {
      setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      addToast('Item Specs Modified', `${updatedItem.name} details were updated.`, 'info');
      if (selectedLedgerItemId === updatedItem.id) {
        fetchLedger(updatedItem.id);
      }
      fetchLogs();
    });

    newSocket.on('item_deleted', (data: { id: number }) => {
      setItems(prev => prev.filter(i => i.id !== data.id));
      if (selectedLedgerItemId === data.id) {
        setSelectedLedgerItemId(null);
        setLedgerData(null);
      }
      addToast('Item Deleted', `An item catalog row was deleted.`, 'danger');
      fetchLogs();
    });

    newSocket.on('alert_triggered', (data: any) => {
      addToast(
        '🚨 Low Stock Warning',
        `${data.name} is running low! Current Stock: ${data.current_stock} ${data.unit} (Threshold: ${data.min_threshold})`,
        'danger'
      );
    });

    newSocket.on('archive_updated', (newArchive: ReportArchive[]) => {
      setReportsArchive(newArchive);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [session, selectedLedgerItemId]);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!session) return;

      // Only respond to ALT shortcuts
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'i') {
          e.preventDefault();
          setActiveTab('inventory');
          setSelectedLedgerItemId(null);
        } else if (key === 'n') {
          e.preventDefault();
          openInwardModal();
        } else if (key === 'o') {
          e.preventDefault();
          openOutwardModal();
        } else if (key === 'l') {
          e.preventDefault();
          setActiveTab('ledger');
        } else if (key === 'r') {
          e.preventDefault();
          setActiveTab('reports');
        } else if (key === 'a') {
          e.preventDefault();
          setActiveTab('archive');
        }
      }

      if (e.key === 'Escape') {
        setShowItemModal(false);
        setShowInwardModal(false);
        setShowOutwardModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session]);

  // Toasts Alert System helper
  const addToast = (title: string, description: string, type: 'info' | 'warning' | 'danger') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, title, description, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // --- API CALLS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginError('Enter both username and password.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);

      setSession({
        token: data.token,
        username: data.username,
        role: data.role
      });
      addToast('Login Successful', `Welcome back, ${data.username}!`, 'info');
    } catch (err: any) {
      setLoginError(err.message || 'Network error.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setSession(null);
    setItems([]);
    setTransactions([]);
    setActivityLogs([]);
    setReportsArchive([]);
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${session?.token}` }
      });
      const data = await res.json();
      if (res.ok) setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/transactions`, {
        headers: { 'Authorization': `Bearer ${session?.token}` }
      });
      const data = await res.json();
      if (res.ok) setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/activity-logs`, {
        headers: { 'Authorization': `Bearer ${session?.token}` }
      });
      const data = await res.json();
      if (res.ok) setActivityLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchArchive = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/archive`, {
        headers: { 'Authorization': `Bearer ${session?.token}` }
      });
      const data = await res.json();
      if (res.ok) setReportsArchive(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMovement = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/movement`, {
        headers: { 'Authorization': `Bearer ${session?.token}` }
      });
      const data = await res.json();
      if (res.ok) setMovementReport(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLedger = async (itemId: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ledger/${itemId}`, {
        headers: { 'Authorization': `Bearer ${session?.token}` }
      });
      const data = await res.json();
      if (res.ok) setLedgerData(data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- ACTIONS ---

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemFormError('');

    if (!newItemName || !newItemCategory || !newItemUnit) {
      setItemFormError('Name, Category, and Unit are required.');
      return;
    }

    const payload = {
      name: newItemName,
      category: newItemCategory,
      opening_stock: parseInt(newItemOpeningStock) || 0,
      unit: newItemUnit,
      min_threshold: parseInt(newItemMinThreshold) || 10,
      location: newItemLocation
    };

    try {
      let res;
      if (editingItem) {
        res = await fetch(`${BACKEND_URL}/api/inventory/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${BACKEND_URL}/api/inventory`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save item spec.');
      }

      setShowItemModal(false);
      fetchInventory();
    } catch (err: any) {
      setItemFormError(err.message || 'Operation failed.');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to delete this item? This deletes its full transaction history ledger.")) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/inventory/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Delete failed.');
      }
      fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePostTransaction = async (e: React.FormEvent, type: 'IN' | 'OUT') => {
    e.preventDefault();
    setTxError('');

    if (!txItemId) {
      setTxError('Select an item.');
      return;
    }

    const qty = parseInt(txQuantity);
    if (!qty || qty <= 0) {
      setTxError('Enter a valid quantity.');
      return;
    }

    // Client-side validation: prevent negative stock
    if (type === 'OUT') {
      const selectedItem = items.find(i => i.id === txItemId);
      if (selectedItem && selectedItem.current_stock - qty < 0) {
        setTxError(`Insufficient Stock. Maximum available: ${selectedItem.current_stock} ${selectedItem.unit}.`);
        return;
      }
    }

    const payload = {
      item_id: txItemId,
      type,
      quantity: qty,
      purpose: type === 'OUT' ? txPurpose : '',
      department: type === 'OUT' ? txDepartment : '',
      receiver_name: type === 'OUT' ? txReceiverName : '',
      supplier_name: type === 'IN' ? txSupplierName : '',
      invoice_no: type === 'IN' ? txInvoiceNo : ''
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transaction failure.');
      }

      // Close modal & refresh
      if (type === 'IN') setShowInwardModal(false);
      else setShowOutwardModal(false);
      
      fetchInventory();
      fetchTransactions();
    } catch (err: any) {
      setTxError(err.message || 'Operation failed.');
    }
  };

  // Handle manual ledger select
  const selectLedgerItem = (itemId: number) => {
    setSelectedLedgerItemId(itemId);
    setActiveTab('ledger');
    fetchLedger(itemId);
  };

  // Open modals helper
  const openNewItemModal = () => {
    setEditingItem(null);
    setNewItemName('');
    setNewItemCategory('Consumables');
    setNewItemOpeningStock('0');
    setNewItemUnit('Pcs');
    setNewItemMinThreshold('10');
    setNewItemLocation('');
    setItemFormError('');
    setShowItemModal(true);
    setTimeout(() => itemInputRef.current?.focus(), 100);
  };

  const openEditItemModal = (item: Item) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setNewItemOpeningStock(item.opening_stock.toString());
    setNewItemUnit(item.unit);
    setNewItemMinThreshold(item.min_threshold.toString());
    setNewItemLocation(item.location || '');
    setItemFormError('');
    setShowItemModal(true);
    setTimeout(() => itemInputRef.current?.focus(), 100);
  };

  const openInwardModal = () => {
    if (items.length > 0) setTxItemId(items[0].id);
    setTxQuantity('1');
    setTxSupplierName('');
    setTxInvoiceNo('');
    setTxError('');
    setShowInwardModal(true);
    setTimeout(() => txInputRef.current?.focus(), 100);
  };

  const openOutwardModal = () => {
    if (items.length > 0) setTxItemId(items[0].id);
    setTxQuantity('1');
    setTxPurpose('');
    setTxDepartment('');
    setTxReceiverName('');
    setTxError('');
    setShowOutwardModal(true);
    setTimeout(() => txInputRef.current?.focus(), 100);
  };

  // --- REPORT EXPORTS ---

  const handleExportExcel = async () => {
    // Generate data array
    const dataToExport = filteredTransactions.map(t => ({
      'ID': t.id,
      'Timestamp': t.timestamp,
      'Item Name': t.item_name,
      'Category': t.item_category,
      'Type': t.type,
      'Quantity': t.quantity,
      'Unit': t.unit,
      'Running Balance': t.running_balance,
      'Department': t.department || 'N/A',
      'Receiver': t.receiver_name || 'N/A',
      'Supplier': t.supplier_name || 'N/A',
      'Invoice No': t.invoice_no || 'N/A',
      'Operator': t.user_name || 'N/A'
    }));

    const name = `ERP-Stock-Report-${new Date().toISOString().split('T')[0]}`;
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions Ledger");
    XLSX.writeFile(wb, `${name}.xlsx`);

    // Post to archive
    try {
      await fetch(`${BACKEND_URL}/api/reports/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({ name: `${name}.xlsx`, type: 'EXCEL' })
      });
      fetchArchive();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintPDF = async () => {
    window.print();

    const name = `ERP-PDF-Report-${new Date().toISOString().split('T')[0]}`;
    // Post to archive log
    try {
      await fetch(`${BACKEND_URL}/api/reports/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({ name: `${name}.pdf`, type: 'PDF' })
      });
      fetchArchive();
    } catch (err) {
      console.error(err);
    }
  };

  // --- FILTERED DATA COMPUTATION ---

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTransactions = transactions.filter(t => {
    if (reportCategory && t.item_category !== reportCategory) return false;
    if (reportType && t.type !== reportType) return false;
    if (reportStartDate && new Date(t.timestamp) < new Date(reportStartDate)) return false;
    if (reportEndDate && new Date(t.timestamp) > new Date(reportEndDate + ' 23:59:59')) return false;
    return true;
  });

  // Calculate quick metrics
  const totalItemsCount = items.length;
  const lowStockItemsCount = items.filter(item => item.current_stock < item.min_threshold).length;
  
  // Total Inventory Value logic (Assume nominal values or counts)
  const totalStockQty = items.reduce((acc, curr) => acc + curr.current_stock, 0);

  // Authentication Panel Render
  if (!session) {
    return (
      <div className="login-container">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-header">
            <LayoutDashboard className="login-logo" />
            <h1 className="login-title">ENGLABS PROJECTS</h1>
            <p className="login-subtitle">Smart ERP Dashboard - Security Verification</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {loginError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.75rem' }} disabled={isLoggingIn}>
            {isLoggingIn ? <Loader2 className="live-dot" style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={16} />}
            Access System
          </button>
          
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
            Hint: admin / admin123 or staff / staff123
          </div>
        </form>
      </div>
    );
  }

  // Primary Workspace Render
  return (
    <div className="app-container">
      {/* Toast Overlay Alerts */}
      <div className="alerts-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-content">
              <span className="toast-title">{t.title}</span>
              <span className="toast-desc">{t.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Command Module */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">
            <LayoutDashboard className="sidebar-logo" />
            <div className="sidebar-title-container">
              <span className="sidebar-title">ENGLABS ERP</span>
              <span className="sidebar-subtitle">Smart OS Dashboard</span>
            </div>
          </div>

          <nav className="sidebar-menu">
            <div 
              className={`menu-item ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => { setActiveTab('inventory'); setSelectedLedgerItemId(null); }}
            >
              <div className="menu-item-content">
                <Package className="menu-item-icon" />
                <span>Inventory Master</span>
              </div>
              <span className="shortcut-badge">Alt+I</span>
            </div>

            <div 
              className={`menu-item ${activeTab === 'ledger' ? 'active' : ''}`}
              onClick={() => setActiveTab('ledger')}
            >
              <div className="menu-item-content">
                <BookOpen className="menu-item-icon" />
                <span>Live Stock Ledger</span>
              </div>
              <span className="shortcut-badge">Alt+L</span>
            </div>

            <div 
              className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <div className="menu-item-content">
                <FileSpreadsheet className="menu-item-icon" />
                <span>Movement & Reports</span>
              </div>
              <span className="shortcut-badge">Alt+R</span>
            </div>

            <div 
              className={`menu-item ${activeTab === 'archive' ? 'active' : ''}`}
              onClick={() => setActiveTab('archive')}
            >
              <div className="menu-item-content">
                <Archive className="menu-item-icon" />
                <span>Archive & Logs</span>
              </div>
              <span className="shortcut-badge">Alt+A</span>
            </div>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">
              {session.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="username">{session.username}</span>
              <span className="user-role">{session.role} Panel</span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', gap: '0.5rem' }} onClick={handleLogout}>
            <LogOut size={14} />
            Exit Console
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="main-content">
        <header className="header">
          <div className="header-title-section">
            <h2 className="header-title">
              {activeTab === 'inventory' && 'Inventory Register'}
              {activeTab === 'ledger' && 'Unified Ledger Register'}
              {activeTab === 'reports' && 'Corporate Reports Hub'}
              {activeTab === 'archive' && 'Logs Archive Feed'}
            </h2>
            <div className="live-badge">
              <span className="live-dot"></span>
              Live Sync Active
            </div>
          </div>

          <div className="header-actions">
            {activeTab === 'inventory' && (
              <div className="search-container">
                <Search className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search materials, rack location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            <button className="btn btn-primary" onClick={openInwardModal}>
              <ArrowDownLeft size={16} />
              Stock IN (Alt+N)
            </button>
            <button className="btn btn-accent" onClick={openOutwardModal}>
              <ArrowUpRight size={16} />
              Stock OUT (Alt+O)
            </button>
          </div>
        </header>

        {/* Dynamic Content Panel */}
        <div className="content-body">

          {/* Core Dashboard Cards (Only on inventory tab) */}
          {activeTab === 'inventory' && (
            <div className="summary-grid">
              <div className="card primary">
                <div className="card-header-flex">
                  <span className="card-title">Total Cataloged Items</span>
                  <div className="card-icon-container">
                    <Package size={20} />
                  </div>
                </div>
                <span className="card-value">{totalItemsCount}</span>
                <span className="card-footer">Registered materials in ERP</span>
              </div>

              <div className="card">
                <div className="card-header-flex">
                  <span className="card-title">Total Physical Stock</span>
                  <div className="card-icon-container">
                    <History size={20} />
                  </div>
                </div>
                <span className="card-value">{totalStockQty}</span>
                <span className="card-footer">Aggregate inventory items count</span>
              </div>

              <div className="card danger">
                <div className="card-header-flex">
                  <span className="card-title">Low Stock Warnings</span>
                  <div className="card-icon-container">
                    <ShieldAlert size={20} />
                  </div>
                </div>
                <span className="card-value" style={{ color: lowStockItemsCount > 0 ? '#ef4444' : 'inherit' }}>
                  {lowStockItemsCount}
                </span>
                <span className="card-footer">Items below critical limit</span>
              </div>
            </div>
          )}

          {/* Module 1: Inventory Master */}
          {activeTab === 'inventory' && (
            <div className="section-container">
              <div className="section-header">
                <h3 className="section-title">
                  <Package size={18} className="menu-item-icon" />
                  Material Specifications Master List
                </h3>
                {session.role === 'ADMIN' && (
                  <button className="btn btn-primary" onClick={openNewItemModal}>
                    <Plus size={16} />
                    Add Item
                  </button>
                )}
              </div>

              <div className="table-container">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Current Balance</th>
                      <th>Unit</th>
                      <th>Threshold Level</th>
                      <th>Rack/Location</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => {
                      const isLow = item.current_stock < item.min_threshold;
                      return (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.category}</td>
                          <td>
                            <span 
                              className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}
                              style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                            >
                              {isLow && <AlertTriangle size={12} />}
                              {item.current_stock}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.unit}</td>
                          <td>{item.min_threshold} {item.unit}</td>
                          <td>{item.location || 'N/A'}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {new Date(item.last_updated).toLocaleString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                onClick={() => selectLedgerItem(item.id)}
                              >
                                View Ledger
                              </button>
                              {session.role === 'ADMIN' && (
                                <>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => openEditItemModal(item)}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="btn btn-danger" 
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No materials found matching search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Module 2: Live Stock Ledger */}
          {activeTab === 'ledger' && (
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 3fr' }}>
              <div className="section-container">
                <h3 className="section-title" style={{ marginBottom: '1rem' }}>Material List</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {items.map(item => (
                    <div 
                      key={item.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: selectedLedgerItemId === item.id ? 'var(--color-primary-light)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${selectedLedgerItemId === item.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer'
                      }}
                      onClick={() => selectLedgerItem(item.id)}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span>{item.category}</span>
                        <span style={{ color: item.current_stock < item.min_threshold ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                          Bal: {item.current_stock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-container">
                {ledgerData ? (
                  <div>
                    <div className="section-header">
                      <h3 className="section-title">
                        <BookOpen size={18} className="menu-item-icon" />
                        Ledger Sheet: {ledgerData.item.name}
                      </h3>
                      <button className="btn btn-secondary" onClick={() => window.print()}>
                        <Printer size={16} />
                        Print Ledger Sheet
                      </button>
                    </div>

                    <div className="ledger-meta">
                      <div className="meta-field">
                        <span className="meta-label">Category</span>
                        <span className="meta-value">{ledgerData.item.category}</span>
                      </div>
                      <div className="meta-field">
                        <span className="meta-label">Opening Stock</span>
                        <span className="meta-value">{ledgerData.item.opening_stock} {ledgerData.item.unit}</span>
                      </div>
                      <div className="meta-field">
                        <span className="meta-label">Current Balance</span>
                        <span className="meta-value" style={{ color: ledgerData.item.current_stock < ledgerData.item.min_threshold ? '#ef4444' : '#10b981' }}>
                          {ledgerData.item.current_stock} {ledgerData.item.unit}
                        </span>
                      </div>
                      <div className="meta-field">
                        <span className="meta-label">Warehouse Rack</span>
                        <span className="meta-value">{ledgerData.item.location || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="table-container">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Timestamp</th>
                            <th>Operation</th>
                            <th>Quantity In/Out</th>
                            <th>Supplier / Project Info</th>
                            <th>Invoice / Reference No</th>
                            <th>Issued To / Dept</th>
                            <th>Running Balance</th>
                            <th>Operator</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Opening Stock Line */}
                          <tr>
                            <td>-</td>
                            <td style={{ color: 'var(--text-muted)' }}>-</td>
                            <td><span className="badge badge-info">Opening</span></td>
                            <td>-</td>
                            <td style={{ color: 'var(--text-muted)' }}>Initial seed values</td>
                            <td style={{ color: 'var(--text-muted)' }}>-</td>
                            <td>-</td>
                            <td style={{ fontWeight: 'bold' }}>{ledgerData.item.opening_stock} {ledgerData.item.unit}</td>
                            <td style={{ color: 'var(--text-muted)' }}>SYSTEM</td>
                          </tr>
                          
                          {/* Transaction Lines */}
                          {ledgerData.ledger.map(tx => (
                            <tr key={tx.id}>
                              <td>{tx.id}</td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                {new Date(tx.timestamp).toLocaleString()}
                              </td>
                              <td>
                                <span className={`badge ${tx.type === 'IN' ? 'badge-success' : 'badge-warning'}`}>
                                  Stock {tx.type}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: tx.type === 'IN' ? '#10b981' : '#ef4444' }}>
                                {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                              </td>
                              <td>{tx.supplier_name || tx.purpose || 'N/A'}</td>
                              <td>{tx.invoice_no || 'N/A'}</td>
                              <td>{tx.receiver_name ? `${tx.receiver_name} (${tx.department})` : 'N/A'}</td>
                              <td style={{ fontWeight: 'bold' }}>{tx.running_balance} {ledgerData.item.unit}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{tx.user_name || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>Select a material from the sidebar list to view its real-time transaction ledger history.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Module 3: Movement & Reports */}
          {activeTab === 'reports' && (
            <div>
              {/* Movement Analysis Row */}
              <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="section-container">
                  <h3 className="section-title" style={{ color: 'var(--color-success)', marginBottom: '1rem' }}>
                    🚀 Fast-Moving Materials (Last 30 Days)
                  </h3>
                  <div className="table-container">
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Total Issued</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movementReport.fastMoving && movementReport.fastMoving.map(item => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td>{item.category}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--color-danger)' }}>
                              {item.total_issued} {item.unit}
                            </td>
                          </tr>
                        ))}
                        {(!movementReport.fastMoving || movementReport.fastMoving.length === 0) && (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                              Insufficient transaction history to evaluate.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="section-container">
                  <h3 className="section-title" style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>
                    🐢 Slow-Moving Materials (Active Stock / Low Inquiries)
                  </h3>
                  <div className="table-container">
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Stock Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movementReport.slowMoving && movementReport.slowMoving.map(item => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td>{item.category}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>
                              {item.current_stock} {item.unit}
                            </td>
                          </tr>
                        ))}
                        {(!movementReport.slowMoving || movementReport.slowMoving.length === 0) && (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                              Zero stock items.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Transactions Export Report Builder */}
              <div className="section-container">
                <div className="section-header">
                  <h3 className="section-title">
                    <FileSpreadsheet size={18} className="menu-item-icon" />
                    Transaction Report Log Builder
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={handlePrintPDF}>
                      <Printer size={14} />
                      Export PDF
                    </button>
                    <button className="btn btn-primary" onClick={handleExportExcel}>
                      <FileText size={14} />
                      Export Excel (Alt+R)
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Material Category</label>
                    <select 
                      className="form-select"
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                    >
                      <option value="">-- All Categories --</option>
                      <option value="Paints">Paints</option>
                      <option value="Steel">Steel</option>
                      <option value="Consumables">Consumables</option>
                      <option value="PPE">PPE</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Operation Type</label>
                    <select 
                      className="form-select"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <option value="">-- All Movements --</option>
                      <option value="IN">Stock Inward (IN)</option>
                      <option value="OUT">Stock Outward (OUT)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Start Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">End Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-container">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Timestamp</th>
                        <th>Material Name</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Invoice/Reference</th>
                        <th>Project / Supplier</th>
                        <th>Department</th>
                        <th>Operator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map(tx => (
                        <tr key={tx.id}>
                          <td>{tx.id}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {new Date(tx.timestamp).toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 600 }}>{tx.item_name}</td>
                          <td>{tx.item_category}</td>
                          <td>
                            <span className={`badge ${tx.type === 'IN' ? 'badge-success' : 'badge-warning'}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{tx.quantity} {tx.unit}</td>
                          <td>{tx.invoice_no || 'N/A'}</td>
                          <td>{tx.supplier_name || tx.purpose || 'N/A'}</td>
                          <td>{tx.department || 'N/A'}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{tx.user_name || 'N/A'}</td>
                        </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No transactions recorded matching the selected filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Module 4: Archive & Logs */}
          {activeTab === 'archive' && (
            <div className="dashboard-grid">
              <div className="section-container">
                <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>
                  <History size={18} className="menu-item-icon" />
                  Live Operational Audits
                </h3>

                <div className="activity-feed">
                  {activityLogs.map(log => (
                    <div key={log.id} className="feed-item">
                      <div className={`feed-icon ${log.action.includes('IN') ? 'in' : log.action.includes('OUT') ? 'out' : 'system'}`}>
                        {log.action.includes('IN') ? <ArrowDownLeft size={12} /> : log.action.includes('OUT') ? <ArrowUpRight size={12} /> : <Settings size={12} />}
                      </div>
                      <div className="feed-content">
                        <span className="feed-text">{log.details}</span>
                        <span className="feed-time">
                          {new Date(log.timestamp).toLocaleString()} by <strong>{log.username || 'SYSTEM'}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No logs archived yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="section-container">
                <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>
                  <Archive size={18} className="menu-item-icon" />
                  Report Exports History Cache
                </h3>

                <div className="activity-feed">
                  {reportsArchive.map(report => (
                    <div key={report.id} className="feed-item">
                      <div className="feed-icon system" style={{ backgroundColor: report.type === 'EXCEL' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: report.type === 'EXCEL' ? '#10b981' : '#ef4444' }}>
                        <FileText size={12} />
                      </div>
                      <div className="feed-content">
                        <span className="feed-text" style={{ fontWeight: 600 }}>{report.name}</span>
                        <span className="feed-time">
                          Format: <strong>{report.type}</strong> | Archived by <strong>{report.created_by}</strong> on {new Date(report.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {reportsArchive.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No reports generated and archived in this session.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Keyboard Shortcut HUD */}
        <div className="shortcuts-hud">
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>ERP Hotkeys (Alt+Key):</span>
          <div className="hud-item"><span className="shortcut-badge">Alt+I</span> Inventory</div>
          <div className="hud-item"><span className="shortcut-badge">Alt+L</span> Ledger</div>
          <div className="hud-item"><span className="shortcut-badge">Alt+R</span> Reports / Exports</div>
          <div className="hud-item"><span className="shortcut-badge">Alt+A</span> Audit Archives</div>
          <div className="hud-item"><span className="shortcut-badge">Alt+N</span> Inward Entry</div>
          <div className="hud-item"><span className="shortcut-badge">Alt+O</span> Outward Entry</div>
          <div className="hud-item"><span className="shortcut-badge">Esc</span> Close Panel</div>
        </div>
      </main>

      {/* MODAL 1: ADD / EDIT MATERIAL SPECIFICATION */}
      {showItemModal && (
        <div className="modal-overlay">
          <form className="modal-container" onSubmit={handleSaveItem}>
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? 'Modify Item Specification' : 'Catalog New Material'}</h3>
              <button type="button" className="btn-icon-only" onClick={() => setShowItemModal(false)}>Esc</button>
            </div>
            
            <div className="modal-body">
              {itemFormError && (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  {itemFormError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Material Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  ref={itemInputRef}
                  placeholder="e.g. MS Angle 50x50x6"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                  >
                    <option value="Paints">Paints</option>
                    <option value="Steel">Steel</option>
                    <option value="Consumables">Consumables</option>
                    <option value="PPE">PPE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Unit</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Pcs, LTR, Bags"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Opening Stock Qty</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="0"
                    disabled={!!editingItem} // Cannot modify opening stock after seed creation
                    value={newItemOpeningStock}
                    onChange={(e) => setNewItemOpeningStock(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Low Stock Limit (Min)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="10"
                    value={newItemMinThreshold}
                    onChange={(e) => setNewItemMinThreshold(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Warehouse Grid/Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Rack B-3, Section A"
                  value={newItemLocation}
                  onChange={(e) => setNewItemLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Specification</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: STOCK INWARD (CHECK-IN) */}
      {showInwardModal && (
        <div className="modal-overlay">
          <form className="modal-container" onSubmit={(e) => handlePostTransaction(e, 'IN')}>
            <div className="modal-header">
              <h3 className="modal-title">Record Stock Inward (IN)</h3>
              <button type="button" className="btn-icon-only" onClick={() => setShowInwardModal(false)}>Esc</button>
            </div>

            <div className="modal-body">
              {txError && (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  {txError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Select Inward Material</label>
                <select 
                  className="form-select"
                  value={txItemId}
                  onChange={(e) => setTxItemId(parseInt(e.target.value))}
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.current_stock} {item.unit} available)</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Inward Quantity</label>
                <input 
                  type="number" 
                  className="form-input" 
                  ref={txInputRef}
                  min="1"
                  value={txQuantity}
                  onChange={(e) => setTxQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supplier Corporate Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Chemilac Paint Ltd"
                  value={txSupplierName}
                  onChange={(e) => setTxSupplierName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Invoice / Challan Reference No</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. INVC-2026-9021"
                  value={txInvoiceNo}
                  onChange={(e) => setTxInvoiceNo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowInwardModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#10b981' }}>Complete Inward Record</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: STOCK OUTWARD (CHECK-OUT) */}
      {showOutwardModal && (
        <div className="modal-overlay">
          <form className="modal-container" onSubmit={(e) => handlePostTransaction(e, 'OUT')}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-accent)' }}>Record Stock Outward (OUT)</h3>
              <button type="button" className="btn-icon-only" onClick={() => setShowOutwardModal(false)}>Esc</button>
            </div>

            <div className="modal-body">
              {txError && (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  {txError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Select Outward Material</label>
                <select 
                  className="form-select"
                  value={txItemId}
                  onChange={(e) => setTxItemId(parseInt(e.target.value))}
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.current_stock} {item.unit} available)</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Outward Quantity</label>
                <input 
                  type="number" 
                  className="form-input" 
                  ref={txInputRef}
                  min="1"
                  value={txQuantity}
                  onChange={(e) => setTxQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department / Project Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. C001, Logistics"
                    value={txDepartment}
                    onChange={(e) => setTxDepartment(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Receiver Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Gaurav Sharma"
                    value={txReceiverName}
                    onChange={(e) => setTxReceiverName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Outward Purpose Description</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="e.g. Structural painting and priming work at Barwala site"
                  value={txPurpose}
                  onChange={(e) => setTxPurpose(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowOutwardModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-accent">Complete Outward Issue</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { initDb, dbRun, dbAll, dbGet } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'englabs_erp_secret_key_2026_production';

// Enable CORS for frontend development server
app.use(cors({
  origin: '*', // For development flexibility
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Real-time WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`👤 Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Middleware: Authenticate JWT Token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware: Admin Access Check
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Permission denied. Administrator access required.' });
  }
};

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await dbGet("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Log login activity
    await dbRun("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)", [
      user.id,
      'LOGIN',
      `User ${user.username} logged in successfully.`
    ]);

    res.json({
      token,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// --- INVENTORY CRUD ROUTES ---

// GET: All Inventory Items
app.get('/api/inventory', authenticateJWT, async (req, res) => {
  try {
    const items = await dbAll("SELECT * FROM items ORDER BY id ASC");
    res.json(items);
  } catch (err) {
    console.error("Fetch items error:", err);
    res.status(500).json({ error: 'Failed to fetch inventory items.' });
  }
});

// POST: Add New Item (Admin Only)
app.post('/api/inventory', authenticateJWT, requireAdmin, async (req, res) => {
  const { name, category, opening_stock, unit, min_threshold, location } = req.body;
  if (!name || !category || !unit) {
    return res.status(400).json({ error: 'Name, category, and unit are required.' });
  }

  try {
    const openingStockVal = parseInt(opening_stock) || 0;
    const minThresholdVal = parseInt(min_threshold) || 10;
    
    const result = await dbRun(`
      INSERT INTO items (name, category, opening_stock, current_stock, unit, min_threshold, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, category, openingStockVal, openingStockVal, unit, minThresholdVal, location || '']);

    // Log activity
    await dbRun("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)", [
      req.user.id,
      'CREATE_ITEM',
      `Created item: ${name} (Category: ${category}, Opening Stock: ${openingStockVal})`
    ]);

    // Retrieve full item
    const newItem = await dbGet("SELECT * FROM items WHERE id = ?", [result.id]);

    // Broadcast update
    io.emit('item_created', newItem);

    res.status(201).json(newItem);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'An item with this name already exists.' });
    }
    console.error("Add item error:", err);
    res.status(500).json({ error: 'Failed to create inventory item.' });
  }
});

// PUT: Edit Item (Admin Only)
app.put('/api/inventory/:id', authenticateJWT, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, category, unit, min_threshold, location } = req.body;

  if (!name || !category || !unit) {
    return res.status(400).json({ error: 'Name, category, and unit are required.' });
  }

  try {
    const item = await dbGet("SELECT * FROM items WHERE id = ?", [id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const minThresholdVal = parseInt(min_threshold) || 10;

    await dbRun(`
      UPDATE items 
      SET name = ?, category = ?, unit = ?, min_threshold = ?, location = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, category, unit, minThresholdVal, location || '', id]);

    // Log activity
    await dbRun("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)", [
      req.user.id,
      'EDIT_ITEM',
      `Updated item ${item.name} -> ${name} (Category: ${category}, Min: ${minThresholdVal})`
    ]);

    const updatedItem = await dbGet("SELECT * FROM items WHERE id = ?", [id]);

    // Broadcast update
    io.emit('item_updated', updatedItem);

    res.json(updatedItem);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'An item with this name already exists.' });
    }
    console.error("Update item error:", err);
    res.status(500).json({ error: 'Failed to update inventory item.' });
  }
});

// DELETE: Delete Item (Admin Only)
app.delete('/api/inventory/:id', authenticateJWT, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const item = await dbGet("SELECT * FROM items WHERE id = ?", [id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    await dbRun("DELETE FROM items WHERE id = ?", [id]);

    // Log activity
    await dbRun("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)", [
      req.user.id,
      'DELETE_ITEM',
      `Deleted item: ${item.name}`
    ]);

    // Broadcast delete
    io.emit('item_deleted', { id: parseInt(id) });

    res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ error: 'Failed to delete inventory item.' });
  }
});

// --- STOCK TRANSACTIONS (INWARD & OUTWARD LEDGER) ---

// POST: Record Inward / Outward Stock Transaction
app.post('/api/transactions', authenticateJWT, async (req, res) => {
  const {
    item_id,
    type, // 'IN' or 'OUT'
    quantity,
    purpose,
    department,
    receiver_name,
    supplier_name,
    invoice_no
  } = req.body;

  if (!item_id || !type || !quantity) {
    return res.status(400).json({ error: 'Item ID, type (IN/OUT), and quantity are required.' });
  }

  const qty = parseInt(quantity);
  if (qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than zero.' });
  }

  if (type !== 'IN' && type !== 'OUT') {
    return res.status(400).json({ error: 'Transaction type must be either IN or OUT.' });
  }

  try {
    // Run all inside a sequence database lock
    const item = await dbGet("SELECT * FROM items WHERE id = ?", [item_id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    let running_balance = item.current_stock;
    if (type === 'IN') {
      running_balance += qty;
    } else {
      // Validate negative stock prevention
      if (item.current_stock - qty < 0) {
        return res.status(400).json({ 
          error: `Insufficient stock. Requested: ${qty} ${item.unit}, Available: ${item.current_stock} ${item.unit}.`
        });
      }
      running_balance -= qty;
    }

    // Insert transaction
    const txResult = await dbRun(`
      INSERT INTO transactions (item_id, type, quantity, purpose, department, receiver_name, supplier_name, invoice_no, running_balance, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      item_id,
      type,
      qty,
      purpose || '',
      department || '',
      receiver_name || '',
      supplier_name || '',
      invoice_no || '',
      running_balance,
      req.user.id
    ]);

    // Update current stock of item
    await dbRun(`
      UPDATE items
      SET current_stock = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [running_balance, item_id]);

    // Log activity
    await dbRun("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)", [
      req.user.id,
      type === 'IN' ? 'CHECK_IN' : 'CHECK_OUT',
      `${type === 'IN' ? 'Stock IN' : 'Stock OUT'}: ${qty} ${item.unit} of ${item.name}. Purpose/Supplier: ${purpose || supplier_name || 'N/A'}`
    ]);

    // Broad socket updates
    const txData = {
      id: txResult.id,
      item_id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      type,
      quantity: qty,
      running_balance,
      user: req.user.username,
      timestamp: new Date().toISOString()
    };
    
    io.emit('stock_updated', txData);

    // If stock falls below threshold, broadcast alert
    if (running_balance < item.min_threshold) {
      io.emit('alert_triggered', {
        item_id,
        name: item.name,
        current_stock: running_balance,
        min_threshold: item.min_threshold,
        unit: item.unit
      });
    }

    res.status(201).json(txData);
  } catch (err) {
    console.error("Post transaction error:", err);
    res.status(500).json({ error: 'Failed to record transaction.' });
  }
});

// GET: All transactions history with filters
app.get('/api/transactions', authenticateJWT, async (req, res) => {
  const { item_id, type, department, start_date, end_date } = req.query;
  
  let query = `
    SELECT t.*, i.name as item_name, i.category as item_category, i.unit, u.username as user_name
    FROM transactions t
    JOIN items i ON t.item_id = i.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (item_id) {
    query += " AND t.item_id = ?";
    params.push(item_id);
  }
  if (type) {
    query += " AND t.type = ?";
    params.push(type);
  }
  if (department) {
    query += " AND t.department LIKE ?";
    params.push(`%${department}%`);
  }
  if (start_date) {
    query += " AND t.timestamp >= ?";
    params.push(`${start_date} 00:00:00`);
  }
  if (end_date) {
    query += " AND t.timestamp <= ?";
    params.push(`${end_date} 23:59:59`);
  }

  query += " ORDER BY t.timestamp DESC, t.id DESC";

  try {
    const transactions = await dbAll(query, params);
    res.json(transactions);
  } catch (err) {
    console.error("Fetch transactions error:", err);
    res.status(500).json({ error: 'Failed to fetch transaction logs.' });
  }
});

// GET: Specific Item Ledger (Shows opening stock, INs, OUTs, and running balance)
app.get('/api/ledger/:itemId', authenticateJWT, async (req, res) => {
  const { itemId } = req.params;

  try {
    const item = await dbGet("SELECT * FROM items WHERE id = ?", [itemId]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const txs = await dbAll(`
      SELECT t.*, u.username as user_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.item_id = ?
      ORDER BY t.timestamp ASC, t.id ASC
    `, [itemId]);

    res.json({
      item,
      ledger: txs
    });
  } catch (err) {
    console.error("Fetch ledger error:", err);
    res.status(500).json({ error: 'Failed to fetch ledger logs.' });
  }
});

// --- REPORTING AND METRICS ---

// GET: Fast and Slow Moving Items
app.get('/api/reports/movement', authenticateJWT, async (req, res) => {
  try {
    // Fast moving = high OUT transaction sum in last 30 days
    const fastMoving = await dbAll(`
      SELECT i.id, i.name, i.category, i.current_stock, i.unit, SUM(t.quantity) as total_issued
      FROM transactions t
      JOIN items i ON t.item_id = i.id
      WHERE t.type = 'OUT' AND t.timestamp >= datetime('now', '-30 days')
      GROUP BY t.item_id
      ORDER BY total_issued DESC
      LIMIT 5
    `);

    // Slow moving = low/zero activity in last 30 days (excluding items with zero stock)
    const slowMoving = await dbAll(`
      SELECT i.id, i.name, i.category, i.current_stock, i.unit, COALESCE(SUM(t.quantity), 0) as total_issued
      FROM items i
      LEFT JOIN transactions t ON t.item_id = i.id AND t.type = 'OUT' AND t.timestamp >= datetime('now', '-30 days')
      WHERE i.current_stock > 0
      GROUP BY i.id
      ORDER BY total_issued ASC, i.current_stock DESC
      LIMIT 5
    `);

    res.json({
      fastMoving,
      slowMoving
    });
  } catch (err) {
    console.error("Movement report error:", err);
    res.status(500).json({ error: 'Failed to fetch movement reports.' });
  }
});

// GET: Activity logs feed
app.get('/api/activity-logs', authenticateJWT, async (req, res) => {
  try {
    const logs = await dbAll(`
      SELECT l.*, u.username
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.timestamp DESC
      LIMIT 50
    `);
    res.json(logs);
  } catch (err) {
    console.error("Activity log error:", err);
    res.status(500).json({ error: 'Failed to fetch activity logs.' });
  }
});

// GET: Reports archive
app.get('/api/reports/archive', authenticateJWT, async (req, res) => {
  try {
    const archive = await dbAll("SELECT * FROM reports_archive ORDER BY timestamp DESC");
    res.json(archive);
  } catch (err) {
    console.error("Archive fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch reports archive.' });
  }
});

// POST: Add to Reports Archive
app.post('/api/reports/archive', authenticateJWT, async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Report name and type are required.' });
  }

  try {
    await dbRun("INSERT INTO reports_archive (name, type, created_by) VALUES (?, ?, ?)", [
      name,
      type,
      req.user.username
    ]);

    await dbRun("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)", [
      req.user.id,
      'EXPORT_REPORT',
      `Exported ${type} report: ${name}`
    ]);

    const updatedArchive = await dbAll("SELECT * FROM reports_archive ORDER BY timestamp DESC");
    io.emit('archive_updated', updatedArchive);

    res.status(201).json({ message: 'Report archived successfully.' });
  } catch (err) {
    console.error("Archive report error:", err);
    res.status(500).json({ error: 'Failed to archive report.' });
  }
});

// Start Express Server
const startServer = async () => {
  try {
    await initDb();
    server.listen(PORT, () => {
      console.log(`🚀 ENGLABS Smart ERP Backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to initialize backend server:", err);
    process.exit(1);
  }
};

startServer();

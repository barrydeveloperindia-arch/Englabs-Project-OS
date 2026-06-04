const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'erp.db');
const db = new sqlite3.Database(dbPath);

// Promise wrappers for database operations
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize the database tables and seed initial data
const initDb = async () => {
  console.log("⚙️ Initializing SQLite Database...");
  
  // Enable foreign keys
  await dbRun("PRAGMA foreign_keys = ON;");

  // Create Users Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Items Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      opening_stock INTEGER DEFAULT 0,
      current_stock INTEGER DEFAULT 0,
      unit TEXT NOT NULL,
      min_threshold INTEGER DEFAULT 10,
      location TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Transactions Table (Unified Ledger)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'IN' or 'OUT'
      quantity INTEGER NOT NULL,
      purpose TEXT,
      department TEXT,
      receiver_name TEXT,
      supplier_name TEXT,
      invoice_no TEXT,
      running_balance INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );
  `);

  // Create Activity Logs Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );
  `);

  // Create Reports Archive Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS reports_archive (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'EXCEL' or 'PDF'
      created_by TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✅ Tables verified.");

  // Seed Default Users
  const adminCount = await dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'");
  if (adminCount.count === 0) {
    const adminHash = await bcrypt.hash('admin123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);
    await dbRun("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", ['admin', adminHash, 'ADMIN']);
    await dbRun("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", ['staff', staffHash, 'STAFF']);
    console.log("👥 Seeded default users (admin/admin123, staff/staff123).");
  }

  // Seed Initial Items
  const itemsCount = await dbGet("SELECT COUNT(*) as count FROM items");
  if (itemsCount.count === 0) {
    const defaultItems = [
      { name: "Chemilac Black Paint", category: "Paints", opening: 50, current: 50, unit: "LTR", min: 15, loc: "Rack A-1" },
      { name: "Red Oxide Primer", category: "Paints", opening: 40, current: 40, unit: "LTR", min: 10, loc: "Rack A-2" },
      { name: "M.S. Angles (50x50x6mm)", category: "Steel", opening: 100, current: 100, unit: "Pcs", min: 20, loc: "Yard Section 2" },
      { name: "Welding Electrodes 3.15mm", category: "Consumables", opening: 80, current: 80, unit: "Bags", min: 25, loc: "Rack B-3" },
      { name: "NC Thinner", category: "Paints", opening: 30, current: 30, unit: "LTR", min: 8, loc: "Rack A-1" },
      { name: "Safety Helmet (Yellow)", category: "PPE", opening: 60, current: 60, unit: "Pcs", min: 15, loc: "Rack C-1" },
      { name: "Double Palm Leather Gloves", category: "PPE", opening: 120, current: 120, unit: "Pairs", min: 30, loc: "Rack C-2" },
      { name: "Cutting Wheel 4 inch", category: "Consumables", opening: 150, current: 150, unit: "Pcs", min: 40, loc: "Rack B-1" }
    ];

    for (const item of defaultItems) {
      await dbRun(`
        INSERT INTO items (name, category, opening_stock, current_stock, unit, min_threshold, location)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [item.name, item.category, item.opening, item.current, item.unit, item.min, item.loc]);
    }
    console.log("📦 Seeded default inventory items.");
  }
};

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDb
};

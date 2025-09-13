/**
 * Database Utilities for MCP Demo.
 */
import Database from 'better-sqlite3';
import path from 'path';

// Database file path
const DB_PATH = path.join(process.cwd(), 'demo.db');

// Initialize database.
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    initializeTables();
  }
  return db;
}

// Initialize database tables with sample data
function initializeTables() {
  if (!db) return;

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      category TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  insertSampleData();
}

function insertSampleData() {
  if (!db) return;

  // Check if data already exists.
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as {
    count: number;
  };
  if (userCount.count > 0) return;

  // Insert sample users.
  const insertUser = db.prepare(
    'INSERT INTO users (name, email, role) VALUES (?, ?, ?)'
  );
  insertUser.run('John Doe', 'john@example.com', 'admin');
  insertUser.run('Jane Smith', 'jane@example.com', 'user');
  insertUser.run('Bob Johnson', 'bob@example.com', 'user');

  // Insert sample products.
  const insertProduct = db.prepare(
    'INSERT INTO products (name, price, category, stock) VALUES (?, ?, ?, ?)'
  );
  insertProduct.run('Laptop', 999.99, 'Electronics', 10);
  insertProduct.run('Smartphone', 699.99, 'Electronics', 25);
  insertProduct.run('Coffee Mug', 12.99, 'Home', 50);
  insertProduct.run('T-Shirt', 19.99, 'Clothing', 30);

  // Insert sample orders.
  const insertOrder = db.prepare(
    'INSERT INTO orders (user_id, product_id, quantity, total, status) VALUES (?, ?, ?, ?, ?)'
  );
  insertOrder.run(1, 1, 1, 999.99, 'completed');
  insertOrder.run(2, 2, 2, 1399.98, 'pending');
  insertOrder.run(3, 3, 5, 64.95, 'shipped');
}

// Close database connection.
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

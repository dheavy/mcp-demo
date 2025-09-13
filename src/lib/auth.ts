/**
 * Authentication Utilities for MCP Demo.
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from './database';

// JWT secret (in production, use environment variable)
const JWT_SECRET =
  process.env.JWT_SECRET || 'mcp-demo-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      created_at: decoded.created_at || new Date().toISOString(),
    };
  } catch (error) {
    return null;
  }
}

export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const db = getDatabase();

    const existingUser = db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email);
    if (existingUser) {
      return { success: false, error: 'Username or email already exists' };
    }

    const hashedPassword = await hashPassword(password);

    const result = db
      .prepare(
        `
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `
      )
      .run(username, email, hashedPassword, 'user');

    const user = db
      .prepare(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?'
      )
      .get(result.lastInsertRowid) as User;

    const token = generateToken(user);

    return { success: true, user, token };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

export async function loginUser(
  username: string,
  password: string
): Promise<AuthResult> {
  try {
    const db = getDatabase();

    // Get user with password hash
    const user = db
      .prepare(
        `
      SELECT id, username, email, password_hash, role, created_at
      FROM users
      WHERE username = ? OR email = ?
    `
      )
      .get(username, username) as User & { password_hash: string };

    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Remove password hash from user object
    const { password_hash, ...userWithoutPassword } = user;

    // Generate token
    const token = generateToken(userWithoutPassword);

    return { success: true, user: userWithoutPassword, token };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

export function getUserById(id: number): User | null {
  try {
    const db = getDatabase();
    const user = db
      .prepare(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?'
      )
      .get(id) as User;
    return user || null;
  } catch (error) {
    return null;
  }
}

// Update user database schema to include authentication fields.
export function initializeAuthTables() {
  const db = getDatabase();

  // Check if password_hash column exists.
  const columns = db.prepare('PRAGMA table_info(users)').all() as Array<{
    name: string;
  }>;
  const hasPasswordHash = columns.some(col => col.name === 'password_hash');
  const hasUsername = columns.some(col => col.name === 'username');

  if (!hasPasswordHash) {
    // Add password_hash column.
    db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT;`);
  }

  if (!hasUsername) {
    // Add username column (without UNIQUE constraint first).
    db.exec(`ALTER TABLE users ADD COLUMN username TEXT;`);

    // Update existing users with default credentials.
    const defaultPassword = 'admin123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    db.prepare(
      `
      UPDATE users
      SET username = 'admin', password_hash = ?, role = 'admin'
      WHERE id = 1
    `
    ).run(hashedPassword);

    db.prepare(
      `
      UPDATE users
      SET username = 'jane', password_hash = ?, role = 'user'
      WHERE id = 2
    `
    ).run(hashedPassword);

    db.prepare(
      `
      UPDATE users
      SET username = 'bob', password_hash = ?, role = 'user'
      WHERE id = 3
    `
    ).run(hashedPassword);
  }
}

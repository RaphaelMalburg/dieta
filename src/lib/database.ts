import { sql } from '@vercel/postgres'
import Database from 'better-sqlite3'
import path from 'path'

interface User {
  id: number
  username: string
  password: string
  created_at: string
}

interface DietPlan {
  id: number
  user_id: number
  content: string
  created_at: string
  updated_at: string
}

interface ChatMessage {
  id: number
  user_id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// Check if we're in production (Vercel) or development
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL

let db: Database.Database | null = null

// Initialize database based on environment
async function initDatabase() {
  if (isProduction) {
    // Production: Use Vercel Postgres
    try {
      // Create tables if they don't exist
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      await sql`
        CREATE TABLE IF NOT EXISTS diet_plans (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      await sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          role VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      // Insert default users if they don't exist
      await sql`
        INSERT INTO users (username, password) 
        VALUES ('tainara', 'laquie'), ('raphael', 'laquie')
        ON CONFLICT (username) DO NOTHING
      `
      
      console.log('PostgreSQL database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize PostgreSQL database:', error)
      throw error
    }
  } else {
    // Development: Use SQLite
    try {
      const dbPath = path.join(process.cwd(), 'diet.db')
      db = new Database(dbPath, { 
        fileMustExist: false,
        readonly: false
      })
      
      // Test write access
      db.pragma('journal_mode = WAL')
      console.log('SQLite database opened successfully with write access')
      
      // Create tables
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS diet_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `)
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `)
      
      // Insert default users if they don't exist
      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)
      `)
      
      insertUser.run('tainara', 'laquie')
      insertUser.run('raphael', 'laquie')
      
      console.log('SQLite database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error)
      throw error
    }
  }
}

// User operations
export async function getUserByCredentials(username: string, password: string): Promise<User | undefined> {
  if (isProduction) {
    const result = await sql`
      SELECT * FROM users WHERE username = ${username} AND password = ${password}
    `
    return result.rows[0] as User | undefined
  } else {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
    return stmt.get(username, password) as User | undefined
  }
}

export async function getUserById(id: number): Promise<User | undefined> {
  if (isProduction) {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `
    return result.rows[0] as User | undefined
  } else {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
    return stmt.get(id) as User | undefined
  }
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  if (isProduction) {
    const result = await sql`
      SELECT * FROM users WHERE username = ${username}
    `
    return result.rows[0] as User | undefined
  } else {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?')
    return stmt.get(username) as User | undefined
  }
}

// Diet plan operations
export async function saveDietPlan(userId: number, content: string) {
  if (isProduction) {
    return await sql`
      INSERT INTO diet_plans (user_id, content, updated_at)
      VALUES (${userId}, ${content}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        content = ${content},
        updated_at = CURRENT_TIMESTAMP
    `
  } else {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO diet_plans (user_id, content, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `)
    return stmt.run(userId, content)
  }
}

export async function getDietPlan(userId: number): Promise<DietPlan | undefined> {
  if (isProduction) {
    const result = await sql`
      SELECT * FROM diet_plans WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 1
    `
    return result.rows[0] as DietPlan | undefined
  } else {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare('SELECT * FROM diet_plans WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1')
    return stmt.get(userId) as DietPlan | undefined
  }
}

// Chat message operations
export async function saveChatMessage(userId: number, role: 'user' | 'assistant', content: string) {
  if (isProduction) {
    return await sql`
      INSERT INTO chat_messages (user_id, role, content)
      VALUES (${userId}, ${role}, ${content})
    `
  } else {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare(`
      INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)
    `)
    return stmt.run(userId, role, content)
  }
}

export async function getChatMessages(userId: number, limit: number = 50): Promise<ChatMessage[]> {
  if (isProduction) {
    const result = await sql`
      SELECT * FROM chat_messages WHERE user_id = ${userId} 
      ORDER BY created_at DESC LIMIT ${limit}
    `
    return result.rows as ChatMessage[]
  } else {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    return stmt.all(userId, limit) as ChatMessage[]
  }
}

export async function clearChatHistory(userId: number) {
  if (isProduction) {
    return await sql`
      DELETE FROM chat_messages WHERE user_id = ${userId}
    `
  } else {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare('DELETE FROM chat_messages WHERE user_id = ?')
    return stmt.run(userId)
  }
}

// Initialize database on module load
initDatabase().catch(console.error)

export default db
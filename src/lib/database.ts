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

const dbPath = path.join(process.cwd(), 'diet.db')
const db = new Database(dbPath)

// Initialize database tables
export function initDatabase() {
  // Users table for storing user information
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Diet plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS diet_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `)

  // Chat messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
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
}

// User operations
export function getUserByCredentials(username: string, password: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
  return stmt.get(username, password) as User | undefined
}

export function getUserById(id: number): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
  return stmt.get(id) as User | undefined
}

export function getUserByUsername(username: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?')
  return stmt.get(username) as User | undefined
}

// Diet plan operations
export function saveDietPlan(userId: number, content: string) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO diet_plans (user_id, content, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `)
  return stmt.run(userId, content)
}

export function getDietPlan(userId: number): DietPlan | undefined {
  const stmt = db.prepare('SELECT * FROM diet_plans WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1')
  return stmt.get(userId) as DietPlan | undefined
}

// Chat message operations
export function saveChatMessage(userId: number, role: 'user' | 'assistant', content: string) {
  const stmt = db.prepare(`
    INSERT INTO chat_messages (user_id, role, content)
    VALUES (?, ?, ?)
  `)
  return stmt.run(userId, role, content)
}

export function getChatMessages(userId: number, limit: number = 50): ChatMessage[] {
  const stmt = db.prepare(`
    SELECT * FROM chat_messages 
    WHERE user_id = ? 
    ORDER BY created_at ASC 
    LIMIT ?
  `)
  return stmt.all(userId, limit) as ChatMessage[]
}

export function clearChatHistory(userId: number) {
  const stmt = db.prepare('DELETE FROM chat_messages WHERE user_id = ?')
  return stmt.run(userId)
}

// Initialize database on import
initDatabase()

export default db
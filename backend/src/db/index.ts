// ============================================
// AI Panel Studio — 数据库连接层 (sql.js)
// ============================================

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 项目根目录 (backend/src/db → 向上 3 级)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..')

let db: SqlJsDatabase | null = null

/**
 * 读取 SQL 文件内容
 */
function readSqlFile(relativePath: string): string {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`SQL file not found: ${fullPath}`)
  }
  return fs.readFileSync(fullPath, 'utf-8')
}

/**
 * 初始化数据库并加载种子数据
 * - 读取 database/init.sql 建表
 * - 读取 database/seed.sql 写入样例数据
 * - 如果 .env 配置了 DB_PATH 则落盘；否则内存模式
 */
export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db

  const SQL = await initSqlJs()

  const dbPath = process.env.DB_PATH || ':memory:'

  // 尝试从磁盘加载已有数据库，否则创建新的
  if (dbPath !== ':memory:' && fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON;')

  // 加载建表脚本
  const initSql = readSqlFile('database/init.sql')
  db.run(initSql)

  // 加载种子数据
  const seedSql = readSqlFile('database/seed.sql')
  db.run(seedSql)

  // 内存模式不需要落盘；文件模式保存一次
  if (dbPath !== ':memory:') {
    saveDatabase()
  }

  return db
}

/**
 * 获取当前数据库实例（必须先调用 initDatabase）
 */
export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * 将数据库持久化到磁盘
 */
export function saveDatabase(): void {
  if (!db) return
  const dbPath = process.env.DB_PATH || ':memory:'
  if (dbPath === ':memory:') return

  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const buffer = db.export()
  fs.writeFileSync(dbPath, buffer)
}

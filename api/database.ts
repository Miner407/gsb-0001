import initSqlJs, { type Database } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.resolve(__dirname, '..', 'data', 'medicine.db')
const DATA_DIR = path.dirname(DB_PATH)

let db: Database | null = null

function localNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export async function saveDb(): Promise<void> {
  if (!db) return
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

export async function getDb(): Promise<Database> {
  if (db) return db

  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      symptoms TEXT NOT NULL DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 0,
      expiry_date TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_medicines_expiry_date ON medicines(expiry_date)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_medicines_stock ON medicines(stock)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name)`)

  const count = db.exec('SELECT COUNT(*) AS cnt FROM medicines')
  const rowCount = count[0]?.values[0]?.[0] as number

  if (rowCount === 0) {
    const now = localNow()
    const samples = [
      { name: '布洛芬', symptoms: '头痛,发热,关节痛', stock: 20, expiry_date: '2027-03-15', location: '客厅药箱' },
      { name: '阿莫西林', symptoms: '感冒,咽喉炎,细菌感染', stock: 10, expiry_date: '2026-08-20', location: '卧室药箱' },
      { name: '复方感冒灵', symptoms: '感冒,流鼻涕,打喷嚏', stock: 5, expiry_date: '2026-07-10', location: '客厅药箱' },
      { name: '创可贴', symptoms: '小伤口,擦伤', stock: 30, expiry_date: '2028-01-01', location: '浴室药柜' },
      { name: '藿香正气水', symptoms: '中暑,肠胃不适,腹泻', stock: 3, expiry_date: '2026-07-05', location: '卧室药箱' },
    ]

    for (const s of samples) {
      db.run(
        `INSERT INTO medicines (name, symptoms, stock, expiry_date, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [s.name, s.symptoms, s.stock, s.expiry_date, s.location, now, now]
      )
    }

    await saveDb()
  }

  return db
}

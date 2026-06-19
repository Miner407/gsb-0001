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
      contraindications TEXT NOT NULL DEFAULT '',
      allergy_warning TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_medicines_expiry_date ON medicines(expiry_date)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_medicines_stock ON medicines(stock)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name)`)

  db.run(`
    CREATE TABLE IF NOT EXISTS drug_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL,
      conflict_medicine_id INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
      FOREIGN KEY (conflict_medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
    )
  `)
  db.run(`CREATE INDEX IF NOT EXISTS idx_conflicts_medicine ON drug_conflicts(medicine_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_conflicts_pair ON drug_conflicts(medicine_id, conflict_medicine_id)`)

  db.run(`
    CREATE TABLE IF NOT EXISTS medication_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL,
      daily_times INTEGER NOT NULL DEFAULT 1,
      dose_per_time REAL NOT NULL DEFAULT 1,
      dose_unit TEXT NOT NULL DEFAULT '片',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      remark TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
    )
  `)
  db.run(`CREATE INDEX IF NOT EXISTS idx_plans_medicine ON medication_plans(medicine_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_plans_status ON medication_plans(status)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_plans_date ON medication_plans(start_date, end_date)`)

  db.run(`
    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      medicine_id INTEGER NOT NULL,
      plan_daily_index INTEGER NOT NULL DEFAULT 1,
      dose REAL NOT NULL DEFAULT 1,
      dose_unit TEXT NOT NULL DEFAULT '片',
      taken_at TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'taken',
      remark TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (plan_id) REFERENCES medication_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
    )
  `)
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_plan ON medication_logs(plan_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_medicine ON medication_logs(medicine_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_taken ON medication_logs(taken_at)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_status ON medication_logs(status)`)

  const cols = db.exec("PRAGMA table_info(medicines)").flatMap(r => r.values.map(v => v[1] as string))
  if (!cols.includes('contraindications')) {
    db.run(`ALTER TABLE medicines ADD COLUMN contraindications TEXT NOT NULL DEFAULT ''`)
  }
  if (!cols.includes('allergy_warning')) {
    db.run(`ALTER TABLE medicines ADD COLUMN allergy_warning TEXT NOT NULL DEFAULT ''`)
  }

  const count = db.exec('SELECT COUNT(*) AS cnt FROM medicines')
  const rowCount = count[0]?.values[0]?.[0] as number

  if (rowCount === 0) {
    const now = localNow()
    const samples = [
      { name: '布洛芬', symptoms: '头痛,发热,关节痛', stock: 20, expiry_date: '2027-03-15', location: '客厅药箱', contraindications: '胃溃疡患者、孕妇禁用', allergy_warning: '对阿司匹林过敏者慎用' },
      { name: '阿莫西林', symptoms: '感冒,咽喉炎,细菌感染', stock: 10, expiry_date: '2026-08-20', location: '卧室药箱', contraindications: '青霉素过敏者禁用', allergy_warning: '可能引起皮疹，过敏体质者慎用' },
      { name: '复方感冒灵', symptoms: '感冒,流鼻涕,打喷嚏', stock: 5, expiry_date: '2026-07-10', location: '客厅药箱', contraindications: '严重肝肾功能不全者禁用', allergy_warning: '对马来酸氯苯那敏过敏者禁用' },
      { name: '创可贴', symptoms: '小伤口,擦伤', stock: 30, expiry_date: '2028-01-01', location: '浴室药柜', contraindications: '', allergy_warning: '胶布过敏者慎用' },
      { name: '藿香正气水', symptoms: '中暑,肠胃不适,腹泻', stock: 3, expiry_date: '2026-07-05', location: '卧室药箱', contraindications: '酒精过敏者、孕妇禁用', allergy_warning: '含乙醇，避免与头孢类同服' },
    ]

    const medicineIds: number[] = []
    for (const s of samples) {
      db.run(
        `INSERT INTO medicines (name, symptoms, stock, expiry_date, location, contraindications, allergy_warning, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.name, s.symptoms, s.stock, s.expiry_date, s.location, s.contraindications, s.allergy_warning, now, now]
      )
      const r = db.exec('SELECT last_insert_rowid() as id')
      medicineIds.push(r[0]?.values[0]?.[0] as number)
    }

    db.run(
      `INSERT INTO drug_conflicts (medicine_id, conflict_medicine_id, description, created_at) VALUES (?, ?, ?, ?)`,
      [medicineIds[1], medicineIds[4], '阿莫西林与含酒精的藿香正气水同服可能引发双硫仑样反应，禁止同用', now]
    )

    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const start = fmt(today)
    const end = fmt(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))

    db.run(
      `INSERT INTO medication_plans (medicine_id, daily_times, dose_per_time, dose_unit, start_date, end_date, remark, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [medicineIds[0], 3, 1, '片', start, end, '饭后服用', 'active', now, now]
    )
    db.run(
      `INSERT INTO medication_plans (medicine_id, daily_times, dose_per_time, dose_unit, start_date, end_date, remark, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [medicineIds[1], 2, 2, '粒', start, end, '早晚各一次', 'active', now, now]
    )

    await saveDb()
  }

  return db
}

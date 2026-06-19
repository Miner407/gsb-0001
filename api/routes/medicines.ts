import { Router, type Request, type Response } from 'express'
import { getDb, saveDb } from '../database.js'

const router = Router()

function toLocalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function localNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

interface MedicineRow {
  id: number
  name: string
  symptoms: string
  stock: number
  expiry_date: string
  location: string
  created_at: string
  updated_at: string
}

function mapRow(row: any[]): MedicineRow {
  return {
    id: row[0] as number,
    name: row[1] as string,
    symptoms: row[2] as string,
    stock: row[3] as number,
    expiry_date: row[4] as string,
    location: row[5] as string,
    created_at: row[6] as string,
    updated_at: row[7] as string,
  }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const { symptom, expiry_status, stock_status } = req.query

    let sql = 'SELECT * FROM medicines WHERE 1=1'
    const params: any[] = []

    if (symptom && typeof symptom === 'string') {
      sql += ' AND symptoms LIKE ?'
      params.push(`%${symptom}%`)
    }

    const today = toLocalDate(new Date())
    const thirtyDaysLater = toLocalDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

    if (expiry_status === 'expired') {
      sql += ' AND expiry_date < ?'
      params.push(today)
    } else if (expiry_status === 'expiring_soon') {
      sql += ' AND expiry_date >= ? AND expiry_date <= ?'
      params.push(today, thirtyDaysLater)
    } else if (expiry_status === 'safe') {
      sql += ' AND expiry_date > ?'
      params.push(thirtyDaysLater)
    }

    if (stock_status === 'low') {
      sql += ' AND stock <= 3'
    } else if (stock_status === 'normal') {
      sql += ' AND stock > 3'
    }

    sql += ' ORDER BY expiry_date ASC'

    const result = db.exec(sql, params)
    const medicines = result[0]?.values.map(mapRow) ?? []

    res.json({ success: true, data: medicines })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch medicines' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const id = Number(req.params.id)
    const result = db.exec('SELECT * FROM medicines WHERE id = ?', [id])

    if (!result[0]?.values.length) {
      res.status(404).json({ success: false, error: 'Medicine not found' })
      return
    }

    res.json({ success: true, data: mapRow(result[0].values[0]) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch medicine' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const { name, symptoms, stock, expiry_date, location } = req.body

    if (!name || symptoms === undefined || stock === undefined || !expiry_date || !location) {
      res.status(400).json({ success: false, error: 'Missing required fields: name, symptoms, stock, expiry_date, location' })
      return
    }

    const now = localNow()
    db.run(
      'INSERT INTO medicines (name, symptoms, stock, expiry_date, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, symptoms, stock, expiry_date, location, now, now]
    )

    const result = db.exec('SELECT last_insert_rowid() as id')
    const id = result[0]?.values[0]?.[0] as number

    await saveDb()

    const inserted = db.exec('SELECT * FROM medicines WHERE id = ?', [id])
    res.status(201).json({ success: true, data: mapRow(inserted[0].values[0]) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create medicine' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const id = Number(req.params.id)
    const { name, symptoms, stock, expiry_date, location } = req.body

    const existing = db.exec('SELECT * FROM medicines WHERE id = ?', [id])
    if (!existing[0]?.values.length) {
      res.status(404).json({ success: false, error: 'Medicine not found' })
      return
    }

    const now = localNow()
    db.run(
      'UPDATE medicines SET name = ?, symptoms = ?, stock = ?, expiry_date = ?, location = ?, updated_at = ? WHERE id = ?',
      [name, symptoms, stock, expiry_date, location, now, id]
    )

    await saveDb()

    const updated = db.exec('SELECT * FROM medicines WHERE id = ?', [id])
    res.json({ success: true, data: mapRow(updated[0].values[0]) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update medicine' })
  }
})

router.patch('/:id/consume', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const id = Number(req.params.id)
    const { amount } = req.body

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid consume amount' })
      return
    }

    const existing = db.exec('SELECT * FROM medicines WHERE id = ?', [id])
    if (!existing[0]?.values.length) {
      res.status(404).json({ success: false, error: 'Medicine not found' })
      return
    }

    const current = mapRow(existing[0].values[0])
    if (current.stock < amount) {
      res.status(400).json({ success: false, error: 'Insufficient stock' })
      return
    }

    const now = localNow()
    db.run('UPDATE medicines SET stock = stock - ?, updated_at = ? WHERE id = ?', [amount, now, id])

    await saveDb()

    const updated = db.exec('SELECT * FROM medicines WHERE id = ?', [id])
    res.json({ success: true, data: mapRow(updated[0].values[0]) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to consume medicine' })
  }
})

router.patch('/:id/restock', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const id = Number(req.params.id)
    const { amount } = req.body

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid restock amount' })
      return
    }

    const existing = db.exec('SELECT * FROM medicines WHERE id = ?', [id])
    if (!existing[0]?.values.length) {
      res.status(404).json({ success: false, error: 'Medicine not found' })
      return
    }

    const now = localNow()
    db.run('UPDATE medicines SET stock = stock + ?, updated_at = ? WHERE id = ?', [amount, now, id])

    await saveDb()

    const updated = db.exec('SELECT * FROM medicines WHERE id = ?', [id])
    res.json({ success: true, data: mapRow(updated[0].values[0]) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to restock medicine' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const id = Number(req.params.id)

    const existing = db.exec('SELECT * FROM medicines WHERE id = ?', [id])
    if (!existing[0]?.values.length) {
      res.status(404).json({ success: false, error: 'Medicine not found' })
      return
    }

    db.run('DELETE FROM medicines WHERE id = ?', [id])

    await saveDb()

    res.json({ success: true, message: 'Medicine deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete medicine' })
  }
})

export default router

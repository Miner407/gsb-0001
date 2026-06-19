import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

function toLocalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()

    const totalResult = db.exec('SELECT COUNT(*) FROM medicines')
    const total = (totalResult[0]?.values[0]?.[0] as number) ?? 0

    const today = toLocalDate(new Date())
    const thirtyDaysLater = toLocalDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

    const expiredResult = db.exec('SELECT COUNT(*) FROM medicines WHERE expiry_date < ?', [today])
    const expired = (expiredResult[0]?.values[0]?.[0] as number) ?? 0

    const expiringResult = db.exec('SELECT COUNT(*) FROM medicines WHERE expiry_date >= ? AND expiry_date <= ?', [today, thirtyDaysLater])
    const expiring_soon = (expiringResult[0]?.values[0]?.[0] as number) ?? 0

    const lowStockResult = db.exec('SELECT COUNT(*) FROM medicines WHERE stock <= 3')
    const low_stock = (lowStockResult[0]?.values[0]?.[0] as number) ?? 0

    res.json({ success: true, data: { total, expiring_soon, low_stock, expired } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

router.get('/expiring', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()

    const today = toLocalDate(new Date())
    const thirtyDaysLater = toLocalDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

    const result = db.exec(
      'SELECT * FROM medicines WHERE expiry_date >= ? AND expiry_date <= ? ORDER BY expiry_date ASC',
      [today, thirtyDaysLater]
    )
    const medicines = result[0]?.values.map(mapRow) ?? []

    res.json({ success: true, data: medicines })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch expiring medicines' })
  }
})

router.get('/low-stock', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()

    const result = db.exec('SELECT * FROM medicines WHERE stock <= 3 ORDER BY stock ASC')
    const medicines = result[0]?.values.map(mapRow) ?? []

    res.json({ success: true, data: medicines })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch low stock medicines' })
  }
})

export default router

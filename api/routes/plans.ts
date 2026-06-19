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

interface PlanRow {
  id: number
  medicine_id: number
  medicine_name: string
  daily_times: number
  dose_per_time: number
  dose_unit: string
  start_date: string
  end_date: string
  remark: string
  status: string
  created_at: string
  updated_at: string
  stock: number
  contraindications: string
  allergy_warning: string
}

interface LogRow {
  id: number
  plan_id: number
  medicine_id: number
  medicine_name: string
  plan_daily_index: number
  dose: number
  dose_unit: string
  taken_at: string
  status: string
  remark: string
}

function mapPlanRow(row: any[]): PlanRow {
  return {
    id: row[0] as number,
    medicine_id: row[1] as number,
    medicine_name: (row[2] as string) || '',
    daily_times: row[3] as number,
    dose_per_time: row[4] as number,
    dose_unit: (row[5] as string) || '片',
    start_date: row[6] as string,
    end_date: row[7] as string,
    remark: (row[8] as string) || '',
    status: (row[9] as string) || 'active',
    created_at: row[10] as string,
    updated_at: row[11] as string,
    stock: (row[12] as number) ?? 0,
    contraindications: (row[13] as string) || '',
    allergy_warning: (row[14] as string) || '',
  }
}

function mapLogRow(row: any[]): LogRow {
  return {
    id: row[0] as number,
    plan_id: row[1] as number,
    medicine_id: row[2] as number,
    medicine_name: (row[3] as string) || '',
    plan_daily_index: row[4] as number,
    dose: row[5] as number,
    dose_unit: (row[6] as string) || '片',
    taken_at: row[7] as string,
    status: (row[8] as string) || 'taken',
    remark: (row[9] as string) || '',
  }
}

function mapSimplePlanRow(row: any[]): PlanRow {
  return {
    id: row[0] as number,
    medicine_id: row[1] as number,
    medicine_name: '',
    daily_times: row[2] as number,
    dose_per_time: row[3] as number,
    dose_unit: (row[4] as string) || '片',
    start_date: row[5] as string,
    end_date: row[6] as string,
    remark: (row[7] as string) || '',
    status: (row[8] as string) || 'active',
    created_at: row[9] as string,
    updated_at: row[10] as string,
    stock: 0,
    contraindications: '',
    allergy_warning: '',
  }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const { medicine_id, status } = req.query

    let sql = `SELECT p.id, p.medicine_id, m.name, p.daily_times, p.dose_per_time, p.dose_unit,
               p.start_date, p.end_date, p.remark, p.status, p.created_at, p.updated_at,
               m.stock, m.contraindications, m.allergy_warning
               FROM medication_plans p
               LEFT JOIN medicines m ON m.id = p.medicine_id
               WHERE 1=1`
    const params: any[] = []

    if (medicine_id) {
      sql += ' AND p.medicine_id = ?'
      params.push(Number(medicine_id))
    }
    if (status && typeof status === 'string') {
      sql += ' AND p.status = ?'
      params.push(status)
    }
    sql += ' ORDER BY p.created_at DESC'

    const result = db.exec(sql, params)
    const plans = result[0]?.values.map(mapPlanRow) ?? []
    res.json({ success: true, data: plans })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch plans' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const id = Number(req.params.id)
    const result = db.exec(
      `SELECT p.id, p.medicine_id, m.name, p.daily_times, p.dose_per_time, p.dose_unit,
       p.start_date, p.end_date, p.remark, p.status, p.created_at, p.updated_at,
       m.stock, m.contraindications, m.allergy_warning
       FROM medication_plans p
       LEFT JOIN medicines m ON m.id = p.medicine_id
       WHERE p.id = ?`,
      [id]
    )
    if (!result[0]?.values.length) {
      res.status(404).json({ success: false, error: 'Plan not found' })
      return
    }
    res.json({ success: true, data: mapPlanRow(result[0].values[0]) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch plan' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const { medicine_id, daily_times, dose_per_time, dose_unit, start_date, end_date, remark } = req.body

    if (!medicine_id || !daily_times || daily_times <= 0 || !dose_per_time || dose_per_time <= 0 || !start_date || !end_date) {
      res.status(400).json({ success: false, error: 'Missing required fields: medicine_id, daily_times, dose_per_time, start_date, end_date' })
      return
    }

    if (new Date(start_date) > new Date(end_date)) {
      res.status(400).json({ success: false, error: 'Start date cannot be after end date' })
      return
    }

    const medRes = db.exec('SELECT * FROM medicines WHERE id = ?', [Number(medicine_id)])
    if (!medRes[0]?.values.length) {
      res.status(404).json({ success: false, error: 'Medicine not found' })
      return
    }

    const activePlansRes = db.exec(
      `SELECT p.id, p.medicine_id, m.name, p.start_date, p.end_date
       FROM medication_plans p
       LEFT JOIN medicines m ON m.id = p.medicine_id
       WHERE p.status = 'active' AND p.id != (SELECT COALESCE(MAX(id),-1) FROM medication_plans WHERE status='active' AND medicine_id = ?)
       AND ((p.start_date <= ? AND p.end_date >= ?) OR (p.start_date <= ? AND p.end_date >= ?) OR (p.start_date >= ? AND p.end_date <= ?))`,
      [Number(medicine_id), start_date, start_date, end_date, end_date, start_date, end_date]
    )
    const conflictPlans = activePlansRes[0]?.values.map(r => ({
      plan_id: r[0],
      medicine_id: r[1],
      medicine_name: r[2],
      start_date: r[3],
      end_date: r[4],
    })) ?? []

    const conflictsRes = db.exec(
      `SELECT DISTINCT c.conflict_medicine_id, m.name, c.description
       FROM drug_conflicts c
       LEFT JOIN medicines m ON m.id = c.conflict_medicine_id
       WHERE c.medicine_id = ?
       UNION
       SELECT DISTINCT c.medicine_id, m.name, c.description
       FROM drug_conflicts c
       LEFT JOIN medicines m ON m.id = c.medicine_id
       WHERE c.conflict_medicine_id = ?`,
      [Number(medicine_id), Number(medicine_id)]
    )
    const activePlanMedIds = new Set<number>()
    for (const cp of conflictPlans) activePlanMedIds.add(cp.medicine_id)
    const conflicts = (conflictsRes[0]?.values ?? [])
      .filter(r => activePlanMedIds.has(r[0] as number))
      .map(r => ({ conflict_medicine_id: r[0], conflict_medicine_name: r[1], description: r[2] }))

    const warnings: string[] = []
    const med = medRes[0].values[0]
    const contraindications = (med[6] as string) || ''
    const allergyWarning = (med[7] as string) || ''
    if (contraindications) warnings.push(`禁忌人群: ${contraindications}`)
    if (allergyWarning) warnings.push(`过敏提示: ${allergyWarning}`)
    for (const c of conflicts) warnings.push(`与 ${c.conflict_medicine_name} 冲突: ${c.description}`)

    const now = localNow()
    db.run(
      `INSERT INTO medication_plans (medicine_id, daily_times, dose_per_time, dose_unit, start_date, end_date, remark, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [Number(medicine_id), Number(daily_times), Number(dose_per_time), dose_unit || '片', start_date, end_date, remark || '', now, now]
    )
    const r = db.exec('SELECT last_insert_rowid() as id')
    const id = r[0]?.values[0]?.[0] as number
    await saveDb()

    const inserted = db.exec(
      `SELECT p.id, p.medicine_id, m.name, p.daily_times, p.dose_per_time, p.dose_unit,
       p.start_date, p.end_date, p.remark, p.status, p.created_at, p.updated_at,
       m.stock, m.contraindications, m.allergy_warning
       FROM medication_plans p
       LEFT JOIN medicines m ON m.id = p.medicine_id
       WHERE p.id = ?`,
      [id]
    )
    res.status(201).json({ success: true, data: mapPlanRow(inserted[0].values[0]), warnings })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create plan' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const id = Number(req.params.id)
    const { daily_times, dose_per_time, dose_unit, start_date, end_date, remark, status } = req.body

    const existing = db.exec('SELECT * FROM medication_plans WHERE id = ?', [id])
    if (!existing[0]?.values.length) {
      res.status(404).json({ success: false, error: 'Plan not found' })
      return
    }

    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      res.status(400).json({ success: false, error: 'Start date cannot be after end date' })
      return
    }

    const cur = mapSimplePlanRow(existing[0].values[0])
    const now = localNow()
    db.run(
      `UPDATE medication_plans SET daily_times = ?, dose_per_time = ?, dose_unit = ?, start_date = ?, end_date = ?, remark = ?, status = ?, updated_at = ? WHERE id = ?`,
      [
        daily_times ?? cur.daily_times,
        dose_per_time ?? cur.dose_per_time,
        dose_unit ?? cur.dose_unit,
        start_date ?? cur.start_date,
        end_date ?? cur.end_date,
        remark ?? cur.remark,
        status ?? cur.status,
        now,
        id,
      ]
    )
    await saveDb()
    res.json({ success: true, message: 'Plan updated' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update plan' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const id = Number(req.params.id)
    const existing = db.exec('SELECT * FROM medication_plans WHERE id = ?', [id])
    if (!existing[0]?.values.length) {
      res.status(404).json({ success: false, error: 'Plan not found' })
      return
    }
    db.run('DELETE FROM medication_plans WHERE id = ?', [id])
    await saveDb()
    res.json({ success: true, message: 'Plan deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete plan' })
  }
})

router.post('/:id/checkin', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const id = Number(req.params.id)
    const { daily_index, remark } = req.body
    const idx = Number(daily_index) || 1

    const planRes = db.exec(
      `SELECT p.id, p.medicine_id, m.name, p.daily_times, p.dose_per_time, p.dose_unit,
       p.start_date, p.end_date, p.status, m.stock
       FROM medication_plans p
       LEFT JOIN medicines m ON m.id = p.medicine_id
       WHERE p.id = ?`,
      [id]
    )
    if (!planRes[0]?.values.length) {
      res.status(404).json({ success: false, error: 'Plan not found' })
      return
    }
    const row = planRes[0].values[0]
    const medicineId = row[1] as number
    const dailyTimes = row[3] as number
    const dose = row[4] as number
    const doseUnit = (row[5] as string) || '片'
    const planStatus = row[8] as string
    const stock = row[9] as number

    if (planStatus !== 'active') {
      res.status(400).json({ success: false, error: 'Plan is not active' })
      return
    }
    if (idx < 1 || idx > dailyTimes) {
      res.status(400).json({ success: false, error: `Invalid daily_index, must be between 1 and ${dailyTimes}` })
      return
    }
    if (stock < dose) {
      res.status(400).json({ success: false, error: `Insufficient stock: need ${dose}${doseUnit}, only ${stock}${doseUnit} available. Please restock first.` })
      return
    }

    const today = toLocalDate(new Date())
    const alreadyRes = db.exec(
      `SELECT id FROM medication_logs WHERE plan_id = ? AND plan_daily_index = ? AND date(taken_at) = date(?) AND status = 'taken'`,
      [id, idx, today + ' 00:00:00']
    )
    if (alreadyRes[0]?.values.length) {
      res.status(400).json({ success: false, error: 'Already checked in for this dose today' })
      return
    }

    const now = localNow()
    db.run('UPDATE medicines SET stock = stock - ?, updated_at = ? WHERE id = ?', [dose, now, medicineId])
    db.run(
      `INSERT INTO medication_logs (plan_id, medicine_id, plan_daily_index, dose, dose_unit, taken_at, status, remark)
       VALUES (?, ?, ?, ?, ?, ?, 'taken', ?)`,
      [id, medicineId, idx, dose, doseUnit, now, remark || '']
    )
    await saveDb()

    const updatedMed = db.exec('SELECT stock FROM medicines WHERE id = ?', [medicineId])
    const newStock = updatedMed[0]?.values[0]?.[0] as number
    res.json({ success: true, data: { taken_at: now, dose, dose_unit: doseUnit, new_stock: newStock } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check in' })
  }
})

router.get('/today/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const today = toLocalDate(new Date())

    const activePlansRes = db.exec(
      `SELECT p.id, p.medicine_id, m.name, p.daily_times, p.dose_per_time, p.dose_unit,
              p.start_date, p.end_date, p.remark, m.stock, m.contraindications, m.allergy_warning
       FROM medication_plans p
       LEFT JOIN medicines m ON m.id = p.medicine_id
       WHERE p.status = 'active' AND p.start_date <= ? AND p.end_date >= ?`,
      [today, today]
    )
    const plans = (activePlansRes[0]?.values ?? []).map(r => ({
      id: r[0] as number,
      medicine_id: r[1] as number,
      medicine_name: r[2] as string,
      daily_times: r[3] as number,
      dose_per_time: r[4] as number,
      dose_unit: (r[5] as string) || '片',
      start_date: r[6] as string,
      end_date: r[7] as string,
      remark: (r[8] as string) || '',
      stock: r[9] as number,
      contraindications: (r[10] as string) || '',
      allergy_warning: (r[11] as string) || '',
    }))

    const takenLogsRes = db.exec(
      `SELECT l.id, l.plan_id, l.medicine_id, l.plan_daily_index, l.dose, l.dose_unit, l.taken_at, l.status
       FROM medication_logs l
       WHERE date(l.taken_at) = date(?) AND l.status = 'taken'`,
      [today + ' 00:00:00']
    )
    const taken = (takenLogsRes[0]?.values ?? []).map(r => ({
      id: r[0] as number,
      plan_id: r[1] as number,
      medicine_id: r[2] as number,
      plan_daily_index: r[3] as number,
      dose: r[4] as number,
      dose_unit: (r[5] as string) || '片',
      taken_at: r[6] as string,
      status: r[7] as string,
    }))

    type DoseItem = {
      plan_id: number
      medicine_id: number
      medicine_name: string
      daily_index: number
      daily_times: number
      dose: number
      dose_unit: string
      remark: string
      stock: number
      contraindications: string
      allergy_warning: string
      taken_at?: string
    }

    const pending: DoseItem[] = []
    const completed: DoseItem[] = []
    const missed: DoseItem[] = []

    const hour = new Date().getHours()
    for (const plan of plans) {
      for (let i = 1; i <= plan.daily_times; i++) {
        const item = {
          plan_id: plan.id,
          medicine_id: plan.medicine_id,
          medicine_name: plan.medicine_name,
          daily_index: i,
          daily_times: plan.daily_times,
          dose: plan.dose_per_time,
          dose_unit: plan.dose_unit,
          remark: plan.remark,
          stock: plan.stock,
          contraindications: plan.contraindications,
          allergy_warning: plan.allergy_warning,
        }
        const log = taken.find(t => t.plan_id === plan.id && t.plan_daily_index === i)
        if (log) {
          completed.push({ ...item, taken_at: log.taken_at })
        } else {
          const cutoff = plan.daily_times <= 1 ? 10 : (i === 1 ? 10 : i === 2 ? 15 : 20)
          if (hour > cutoff + 2) {
            missed.push(item)
          } else {
            pending.push(item)
          }
        }
      }
    }

    res.json({ success: true, data: { pending, completed, missed, date: today } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch today overview' })
  }
})

router.get('/logs/medicine/:medicineId', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const medicineId = Number(req.params.medicineId)
    const { days } = req.query
    const limitDays = Number(days) || 7

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - (limitDays - 1))
    const cutoffStr = toLocalDate(cutoff) + ' 00:00:00'

    const result = db.exec(
      `SELECT l.id, l.plan_id, l.medicine_id, m.name, l.plan_daily_index, l.dose, l.dose_unit, l.taken_at, l.status, l.remark
       FROM medication_logs l
       LEFT JOIN medicines m ON m.id = l.medicine_id
       WHERE l.medicine_id = ? AND l.taken_at >= ?
       ORDER BY l.taken_at DESC`,
      [medicineId, cutoffStr]
    )
    const logs = result[0]?.values.map(mapLogRow) ?? []
    res.json({ success: true, data: logs })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch logs' })
  }
})

export default router

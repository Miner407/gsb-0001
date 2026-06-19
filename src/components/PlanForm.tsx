import { type FormEvent, useState, useEffect } from 'react'
import type Medicine from './MedicineCard.types'

interface PlanFormProps {
  medicines: Medicine[]
  onSubmit: (data: { medicine_id: number; daily_times: number; dose_per_time: number; dose_unit: string; start_date: string; end_date: string; remark: string }) => void
  initialData?: any
  submitLabel?: string
}

const DOSE_UNITS = ['片', '粒', '袋', '毫升', '克', '喷']

export default function PlanForm({ medicines, onSubmit, initialData, submitLabel = '创建计划' }: PlanFormProps) {
  const todayStr = (() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })()
  const weekLaterStr = (() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })()

  const [medicineId, setMedicineId] = useState<number>(initialData?.medicine_id ?? (medicines[0]?.id ?? 0))
  const [dailyTimes, setDailyTimes] = useState<number>(initialData?.daily_times ?? 3)
  const [dosePerTime, setDosePerTime] = useState<number>(initialData?.dose_per_time ?? 1)
  const [doseUnit, setDoseUnit] = useState<string>(initialData?.dose_unit ?? '片')
  const [startDate, setStartDate] = useState<string>(initialData?.start_date ?? todayStr)
  const [endDate, setEndDate] = useState<string>(initialData?.end_date ?? weekLaterStr)
  const [remark, setRemark] = useState<string>(initialData?.remark ?? '')

  useEffect(() => {
    if (initialData) {
      setMedicineId(initialData.medicine_id ?? 0)
      setDailyTimes(initialData.daily_times ?? 3)
      setDosePerTime(initialData.dose_per_time ?? 1)
      setDoseUnit(initialData.dose_unit ?? '片')
      setStartDate(initialData.start_date ?? todayStr)
      setEndDate(initialData.end_date ?? weekLaterStr)
      setRemark(initialData.remark ?? '')
    }
  }, [initialData, todayStr, weekLaterStr])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({
      medicine_id: Number(medicineId),
      daily_times: Number(dailyTimes),
      dose_per_time: Number(dosePerTime),
      dose_unit: doseUnit,
      start_date: startDate,
      end_date: endDate,
      remark,
    })
  }

  const selected = medicines.find(m => m.id === Number(medicineId))
  const warnings: string[] = []
  if (selected) {
    if (selected.contraindications) warnings.push(`禁忌人群: ${selected.contraindications}`)
    if (selected.allergy_warning) warnings.push(`过敏提示: ${selected.allergy_warning}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">选择药品 *</label>
        <select
          value={medicineId}
          onChange={e => setMedicineId(Number(e.target.value))}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
        >
          {medicines.map(m => (
            <option key={m.id} value={m.id}>{m.name}（库存 {m.stock}）</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">每日次数 *</label>
          <input
            type="number"
            min={1}
            max={10}
            value={dailyTimes}
            onChange={e => setDailyTimes(Math.max(1, Math.min(10, Number(e.target.value))))}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">单次用量 *</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={dosePerTime}
              onChange={e => setDosePerTime(Math.max(0.1, Number(e.target.value)))}
              required
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            />
            <select
              value={doseUnit}
              onChange={e => setDoseUnit(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            >
              {DOSE_UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">开始日期 *</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">结束日期 *</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">备注</label>
        <textarea
          value={remark}
          onChange={e => setRemark(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          placeholder="例如：饭后服用、温水送服"
        />
      </div>
      {warnings.length > 0 && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
            <span className="text-sm font-semibold text-amber-700">安全提醒</span>
          </div>
          <ul className="list-inside list-disc space-y-1 text-xs text-amber-800">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
      <button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-teal-500/40 active:scale-[0.98]"
      >
        {submitLabel}
      </button>
    </form>
  )
}

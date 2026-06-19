import { type FormEvent, useState, useEffect } from 'react'

interface MedicineFormProps {
  onSubmit: (data: any) => void
  initialData?: any
  submitLabel?: string
}

export default function MedicineForm({ onSubmit, initialData, submitLabel = '保存' }: MedicineFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [symptoms, setSymptoms] = useState(initialData?.symptoms || '')
  const [stock, setStock] = useState(initialData?.stock ?? 0)
  const [expiryDate, setExpiryDate] = useState(initialData?.expiry_date || '')
  const [location, setLocation] = useState(initialData?.location || '')

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setSymptoms(initialData.symptoms || '')
      setStock(initialData.stock ?? 0)
      setExpiryDate(initialData.expiry_date || '')
      setLocation(initialData.location || '')
    }
  }, [initialData])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ name, symptoms, stock: Number(stock), expiry_date: expiryDate, location })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">药品名称 *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          placeholder="例如：布洛芬"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">适用症状 *</label>
        <input
          type="text"
          value={symptoms}
          onChange={e => setSymptoms(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          placeholder="多个症状用逗号分隔，例如：头痛,发热"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">库存数量 *</label>
          <input
            type="number"
            value={stock}
            onChange={e => setStock(Number(e.target.value))}
            required
            min={0}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">过期日期 *</label>
          <input
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">存放位置 *</label>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          placeholder="例如：客厅药箱"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-teal-500/40 active:scale-[0.98]"
      >
        {submitLabel}
      </button>
    </form>
  )
}

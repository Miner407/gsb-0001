import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedicineStore } from '@/store/medicineStore'
import MedicineCard from '@/components/MedicineCard'
import Modal from '@/components/Modal'
import MedicineForm from '@/components/MedicineForm'
import type Medicine from '@/components/MedicineCard.types'

export default function Medicines() {
  const navigate = useNavigate()
  const { medicines, loading, fetchMedicines, updateMedicine, consumeMedicine, restockMedicine, deleteMedicine } = useMedicineStore()

  const [searchSymptom, setSearchSymptom] = useState('')
  const [expiryFilter, setExpiryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null)
  const [consumeId, setConsumeId] = useState<number | null>(null)
  const [restockId, setRestockId] = useState<number | null>(null)
  const [amount, setAmount] = useState(1)

  const loadMedicines = useCallback(() => {
    const params: Record<string, string> = {}
    if (searchSymptom) params.symptom = searchSymptom
    if (expiryFilter) params.expiry_status = expiryFilter
    if (stockFilter) params.stock_status = stockFilter
    fetchMedicines(params)
  }, [searchSymptom, expiryFilter, stockFilter, fetchMedicines])

  useEffect(() => {
    loadMedicines()
  }, [loadMedicines])

  const handleEdit = (medicine: Medicine) => {
    setEditMedicine(medicine)
  }

  const handleEditSubmit = async (data: any) => {
    if (!editMedicine) return
    await updateMedicine(editMedicine.id, data)
    setEditMedicine(null)
  }

  const handleConsume = (id: number) => {
    setConsumeId(id)
    setAmount(1)
  }

  const handleConsumeConfirm = async () => {
    if (!consumeId) return
    await consumeMedicine(consumeId, amount)
    setConsumeId(null)
  }

  const handleRestock = (id: number) => {
    setRestockId(id)
    setAmount(5)
  }

  const handleRestockConfirm = async () => {
    if (!restockId) return
    await restockMedicine(restockId, amount)
    setRestockId(null)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('确定要删除这个药品吗？')) {
      await deleteMedicine(id)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>药品列表</h1>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                type="text"
                value={searchSymptom}
                onChange={e => setSearchSymptom(e.target.value)}
                placeholder="按症状关键词搜索..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition-all focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              />
            </div>
            <select
              value={expiryFilter}
              onChange={e => setExpiryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            >
              <option value="">全部过期状态</option>
              <option value="expired">已过期</option>
              <option value="expiring_soon">即将过期</option>
              <option value="safe">安全</option>
            </select>
            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            >
              <option value="">全部库存状态</option>
              <option value="low">库存不足</option>
              <option value="normal">库存正常</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : medicines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <p className="text-lg font-semibold text-slate-400">暂无药品</p>
            <p className="mt-1 text-sm text-slate-400">请返回仪表盘添加药品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {medicines.map(m => (
              <MedicineCard
                key={m.id}
                medicine={m}
                onEdit={handleEdit}
                onConsume={handleConsume}
                onRestock={handleRestock}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={!!editMedicine} onClose={() => setEditMedicine(null)} title="编辑药品">
        {editMedicine && <MedicineForm onSubmit={handleEditSubmit} initialData={editMedicine} submitLabel="保存修改" />}
      </Modal>

      <Modal open={!!consumeId} onClose={() => setConsumeId(null)} title="消耗库存">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">请输入消耗数量：</p>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
            min={1}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setConsumeId(null)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={handleConsumeConfirm}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-amber-700 active:scale-[0.98]"
            >
              确认消耗
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!restockId} onClose={() => setRestockId(null)} title="补货">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">请输入补货数量：</p>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
            min={1}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setRestockId(null)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={handleRestockConfirm}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:from-teal-600 hover:to-teal-700 active:scale-[0.98]"
            >
              确认补货
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

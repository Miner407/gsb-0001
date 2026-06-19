import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedicineStore } from '@/store/medicineStore'
import StatCard from '@/components/StatCard'
import Modal from '@/components/Modal'
import MedicineForm from '@/components/MedicineForm'

export default function Dashboard() {
  const navigate = useNavigate()
  const { stats, expiringList, lowStockList, fetchStats, fetchExpiring, fetchLowStock, createMedicine } = useMedicineStore()
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchExpiring()
    fetchLowStock()
  }, [fetchStats, fetchExpiring, fetchLowStock])

  const handleAdd = async (data: any) => {
    await createMedicine(data)
    setShowAddModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>家庭药箱</h1>
            <p className="mt-1 text-sm text-slate-500">守护家人健康，从管理药箱开始</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/medicines')}
              className="rounded-xl border border-teal-200 bg-white px-5 py-2.5 text-sm font-semibold text-teal-700 shadow-sm transition-all hover:bg-teal-50 hover:shadow-md"
            >
              查看全部药品
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-teal-500/40 active:scale-[0.98]"
            >
              + 新增药品
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="药品总数"
            value={stats.total}
            gradient="bg-gradient-to-br from-teal-400 to-teal-600"
            iconBg="bg-white/20"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m8 2 1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 12v4"/><path d="M10 14h4"/></svg>}
          />
          <StatCard
            title="即将过期"
            value={stats.expiring_soon}
            gradient="bg-gradient-to-br from-amber-400 to-amber-600"
            iconBg="bg-white/20"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          />
          <StatCard
            title="库存不足"
            value={stats.low_stock}
            gradient="bg-gradient-to-br from-rose-400 to-rose-600"
            iconBg="bg-white/20"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>}
          />
          <StatCard
            title="已过期"
            value={stats.expired}
            gradient="bg-gradient-to-br from-red-500 to-red-700"
            iconBg="bg-white/20"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800">即将过期提醒</h2>
            </div>
            {expiringList.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">暂无即将过期的药品 🎉</div>
            ) : (
              <div className="space-y-3">
                {expiringList.map(m => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const diffDays = Math.ceil((new Date(m.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-amber-50/60 px-4 py-3 transition-colors hover:bg-amber-50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                          {diffDays}天
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                          <p className="text-xs text-slate-500">{m.expiry_date} · {m.location}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-amber-600">库存 {m.stock}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800">低库存提醒</h2>
            </div>
            {lowStockList.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">所有药品库存充足 🎉</div>
            ) : (
              <div className="space-y-3">
                {lowStockList.map(m => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl bg-rose-50/60 px-4 py-3 transition-colors hover:bg-rose-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
                        {m.stock}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.location}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/medicines')}
                      className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 transition-all hover:bg-teal-100"
                    >
                      补货
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="新增药品">
        <MedicineForm onSubmit={handleAdd} submitLabel="添加药品" />
      </Modal>
    </div>
  )
}

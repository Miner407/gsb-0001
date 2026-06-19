import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedicineStore } from '@/store/medicineStore'
import StatCard from '@/components/StatCard'
import Modal from '@/components/Modal'
import MedicineForm from '@/components/MedicineForm'
import PlanForm from '@/components/PlanForm'

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    stats, expiringList, lowStockList, todayOverview,
    fetchStats, fetchExpiring, fetchLowStock, createMedicine,
    fetchTodayOverview, checkinDose, medicines, fetchMedicines, createPlan,
  } = useMedicineStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchStats()
    fetchExpiring()
    fetchLowStock()
    fetchTodayOverview()
    fetchMedicines()
  }, [fetchStats, fetchExpiring, fetchLowStock, fetchTodayOverview, fetchMedicines])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleAdd = async (data: any) => {
    await createMedicine(data)
    setShowAddModal(false)
  }

  const handleCheckin = async (planId: number, dailyIndex: number, medicineName: string) => {
    const res = await checkinDose(planId, dailyIndex)
    if (res.success) {
      setToast({ type: 'success', message: `${medicineName} 打卡成功，已扣减库存` })
    } else {
      setToast({ type: 'error', message: res.error || '打卡失败' })
    }
  }

  const handleCreatePlan = async (data: any) => {
    const res = await createPlan(data)
    if (res.success) {
      setShowPlanModal(false)
      const msg = res.warnings?.length
        ? `计划创建成功！安全提醒: ${res.warnings.join('；')}`
        : '计划创建成功'
      setToast({ type: 'success', message: msg })
    } else {
      setToast({ type: 'error', message: res.error || '创建失败' })
    }
  }

  const pending = todayOverview?.pending ?? []
  const completed = todayOverview?.completed ?? []
  const missed = todayOverview?.missed ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>家庭药箱</h1>
            <p className="mt-1 text-sm text-slate-500">守护家人健康，从管理药箱开始</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/medicines')}
              className="rounded-xl border border-teal-200 bg-white px-5 py-2.5 text-sm font-semibold text-teal-700 shadow-sm transition-all hover:bg-teal-50 hover:shadow-md"
            >
              查看全部药品
            </button>
            <button
              onClick={() => setShowPlanModal(true)}
              className="rounded-xl border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:bg-sky-50 hover:shadow-md"
            >
              + 用药计划
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
            title="今日待服"
            value={pending.length}
            gradient="bg-gradient-to-br from-sky-400 to-sky-600"
            iconBg="bg-white/20"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          />
          <StatCard
            title="已完成"
            value={completed.length}
            gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
            iconBg="bg-white/20"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M20 6 9 17l-5-5"/></svg>}
          />
          <StatCard
            title="漏服"
            value={missed.length}
            gradient="bg-gradient-to-br from-rose-400 to-rose-600"
            iconBg="bg-white/20"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>}
          />
        </div>

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800">今日用药提醒</h2>
              <span className="text-xs text-slate-400">{todayOverview?.date ?? ''}</span>
            </div>
          </div>

          {pending.length === 0 && completed.length === 0 && missed.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">今日暂无用药计划 🎉</div>
          ) : (
            <div className="space-y-6">
              {pending.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">{pending.length}</span>
                    <span className="text-sm font-semibold text-slate-700">待服用</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {pending.map(item => (
                      <div key={`${item.plan_id}-${item.daily_index}`} className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-slate-800">{item.medicine_name}</p>
                              <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                                第{item.daily_index}/{item.daily_times}次
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">
                              {item.dose} {item.dose_unit} · {item.remark || '无备注'}
                            </p>
                            {item.stock < item.dose && (
                              <p className="mt-1 text-xs font-semibold text-rose-600">⚠ 库存不足（仅剩 {item.stock} {item.dose_unit}）</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleCheckin(item.plan_id, item.daily_index, item.medicine_name)}
                            disabled={item.stock < item.dose}
                            className="shrink-0 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-sky-600 hover:to-sky-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            打卡服用
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {missed.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">{missed.length}</span>
                    <span className="text-sm font-semibold text-slate-700">漏服</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {missed.map(item => (
                      <div key={`${item.plan_id}-${item.daily_index}`} className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-slate-800">{item.medicine_name}</p>
                              <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                                第{item.daily_index}/{item.daily_times}次
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">{item.dose} {item.dose_unit} · {item.remark || '无备注'}</p>
                          </div>
                          <button
                            onClick={() => handleCheckin(item.plan_id, item.daily_index, item.medicine_name)}
                            disabled={item.stock < item.dose}
                            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            补打卡
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completed.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{completed.length}</span>
                    <span className="text-sm font-semibold text-slate-700">已完成</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {completed.map(item => (
                      <div key={`${item.plan_id}-${item.daily_index}`} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-slate-800">{item.medicine_name}</p>
                              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                第{item.daily_index}/{item.daily_times}次
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">{item.dose} {item.dose_unit} · {item.taken_at}</p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-emerald-600">✓ 已服用</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="新增药品">
        <MedicineForm onSubmit={handleAdd} submitLabel="添加药品" />
      </Modal>

      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title="创建用药计划">
        <PlanForm medicines={medicines} onSubmit={handleCreatePlan} submitLabel="创建计划" />
      </Modal>
    </div>
  )
}

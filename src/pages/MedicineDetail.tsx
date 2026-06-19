import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMedicineStore } from '@/store/medicineStore'
import Modal from '@/components/Modal'
import PlanForm from '@/components/PlanForm'

export default function MedicineDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const medicineId = Number(id)
  const {
    medicineDetail, plans, logs, medicines,
    fetchMedicineDetail, fetchPlans, fetchLogs, fetchMedicines,
    createPlan, updatePlan, deletePlan, restockMedicine,
    addConflict, removeConflict,
  } = useMedicineStore()

  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editPlan, setEditPlan] = useState<any>(null)
  const [showRestock, setShowRestock] = useState(false)
  const [restockAmount, setRestockAmount] = useState(5)
  const [showConflict, setShowConflict] = useState(false)
  const [conflictMedId, setConflictMedId] = useState<number>(0)
  const [conflictDesc, setConflictDesc] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    if (medicineId) {
      fetchMedicineDetail(medicineId)
      fetchPlans({ medicine_id: String(medicineId) })
      fetchLogs(medicineId, 7)
      fetchMedicines()
    }
  }, [medicineId, fetchMedicineDetail, fetchPlans, fetchLogs, fetchMedicines])

  const handleCreatePlan = async (data: any) => {
    const res = await createPlan(data)
    if (res.success) {
      setShowPlanModal(false)
      setEditPlan(null)
      const msg = res.warnings?.length
        ? `计划创建成功！安全提醒: ${res.warnings.join('；')}`
        : '计划创建成功'
      setToast({ type: 'success', message: msg })
    } else {
      setToast({ type: 'error', message: res.error || '操作失败' })
    }
  }

  const handleTogglePlanStatus = async (plan: any) => {
    const ok = await updatePlan(plan.id, { status: plan.status === 'active' ? 'inactive' : 'active' })
    setToast({ type: ok ? 'success' : 'error', message: ok ? '计划状态已更新' : '更新失败' })
  }

  const handleDeletePlan = async (planId: number) => {
    if (!window.confirm('确定删除此用药计划吗？')) return
    const ok = await deletePlan(planId)
    setToast({ type: ok ? 'success' : 'error', message: ok ? '计划已删除' : '删除失败' })
  }

  const handleRestock = async () => {
    await restockMedicine(medicineId, restockAmount)
    setShowRestock(false)
    await fetchMedicineDetail(medicineId)
    setToast({ type: 'success', message: `已补货 ${restockAmount} 份` })
  }

  const handleAddConflict = async () => {
    if (!conflictMedId) {
      setToast({ type: 'error', message: '请选择冲突药品' })
      return
    }
    const ok = await addConflict(medicineId, conflictMedId, conflictDesc)
    if (ok) {
      setShowConflict(false)
      setConflictMedId(0)
      setConflictDesc('')
      setToast({ type: 'success', message: '冲突记录已添加' })
    } else {
      setToast({ type: 'error', message: '添加失败，可能已存在' })
    }
  }

  const handleRemoveConflict = async (conflictId: number) => {
    await removeConflict(medicineId, conflictId)
    setToast({ type: 'success', message: '冲突记录已移除' })
  }

  if (!medicineDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-400">加载中...</div>
      </div>
    )
  }

  const otherMeds = medicines.filter(m => m.id !== medicineId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            {medicineDetail.name}
          </h1>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs text-slate-400">库存</div>
              <div className={`mt-1 text-2xl font-bold ${medicineDetail.stock <= 0 ? 'text-red-600' : medicineDetail.stock <= 3 ? 'text-amber-600' : 'text-teal-600'}`}>
                {medicineDetail.stock}
              </div>
              <button
                onClick={() => setShowRestock(true)}
                className="mt-2 w-full rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-all hover:bg-teal-100"
              >
                + 补货
              </button>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs text-slate-400">过期日期</div>
              <div className="mt-1 text-lg font-bold text-slate-800">{medicineDetail.expiry_date}</div>
              <div className="text-xs text-slate-500">{medicineDetail.location}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs text-slate-400">适用症状</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {medicineDetail.symptoms.split(',').map((s: string, i: number) => (
                  <span key={i} className="inline-block rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {(medicineDetail.contraindications || medicineDetail.allergy_warning) && (
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {medicineDetail.contraindications && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    <span className="text-sm font-bold text-amber-700">禁忌人群</span>
                  </div>
                  <p className="text-xs text-amber-800">{medicineDetail.contraindications}</p>
                </div>
              )}
              {medicineDetail.allergy_warning && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                    <span className="text-sm font-bold text-rose-700">过敏提示</span>
                  </div>
                  <p className="text-xs text-rose-800">{medicineDetail.allergy_warning}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600"><path d="m8 2 1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/></svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800">药物冲突</h2>
            </div>
            <button
              onClick={() => setShowConflict(true)}
              disabled={otherMeds.length === 0}
              className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 transition-all hover:bg-violet-100 disabled:opacity-40"
            >
              + 添加冲突
            </button>
          </div>
          {medicineDetail.conflicts?.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">暂无冲突记录</div>
          ) : (
            <div className="space-y-3">
              {medicineDetail.conflicts?.map(c => (
                <div key={c.id} className="flex items-start justify-between gap-3 rounded-xl bg-violet-50/50 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800">
                      ⚠ 与 <span className="text-violet-700">{c.conflict_medicine_name}</span> 冲突
                    </div>
                    {c.description && <p className="mt-1 text-xs text-slate-600">{c.description}</p>}
                  </div>
                  <button
                    onClick={() => handleRemoveConflict(c.id)}
                    className="shrink-0 rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-50"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800">用药计划</h2>
            </div>
            <button
              onClick={() => { setEditPlan(null); setShowPlanModal(true) }}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-sky-600 hover:to-sky-700"
            >
              + 新建计划
            </button>
          </div>
          {plans.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">暂无用药计划</div>
          ) : (
            <div className="space-y-3">
              {plans.map(p => (
                <div key={p.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {p.status === 'active' ? '进行中' : '已停用'}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        每日 {p.daily_times} 次 · 每次 {p.dose_per_time} {p.dose_unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePlanStatus(p)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100"
                      >
                        {p.status === 'active' ? '停用' : '启用'}
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p.id)}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    周期：{p.start_date} 至 {p.end_date}
                    {p.remark && ` · ${p.remark}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800">最近 7 天服用记录</h2>
          </div>
          {logs.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">近 7 天暂无服药记录</div>
          ) : (
            <div className="space-y-2">
              {logs.map(l => (
                <div key={l.id} className="flex items-center justify-between rounded-xl bg-emerald-50/40 px-4 py-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-800">第 {l.plan_daily_index} 次</span>
                    <span className="ml-2 text-xs text-slate-600">{l.dose} {l.dose_unit}</span>
                  </div>
                  <span className="text-xs text-slate-500">{l.taken_at}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <Modal open={showPlanModal} onClose={() => { setShowPlanModal(false); setEditPlan(null) }} title={editPlan ? '编辑计划' : '新建用药计划'}>
        <PlanForm
          medicines={medicines}
          onSubmit={handleCreatePlan}
          initialData={editPlan}
          submitLabel={editPlan ? '保存修改' : '创建计划'}
        />
      </Modal>

      <Modal open={showRestock} onClose={() => setShowRestock(false)} title="补货">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">当前库存：{medicineDetail.stock}</p>
          <input
            type="number"
            min={1}
            value={restockAmount}
            onChange={e => setRestockAmount(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowRestock(false)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={handleRestock}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:from-teal-600 hover:to-teal-700 active:scale-[0.98]"
            >
              确认补货
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showConflict} onClose={() => setShowConflict(false)} title="添加药物冲突">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">冲突药品</label>
            <select
              value={conflictMedId}
              onChange={e => setConflictMedId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            >
              <option value={0}>请选择药品</option>
              {otherMeds.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">冲突说明</label>
            <textarea
              rows={3}
              value={conflictDesc}
              onChange={e => setConflictDesc(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              placeholder="例如：同服会引发双硫仑样反应，禁止同用"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConflict(false)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={handleAddConflict}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-600 hover:to-violet-700 active:scale-[0.98]"
            >
              确认添加
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

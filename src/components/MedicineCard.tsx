import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type Medicine from './MedicineCard.types'

interface MedicineCardProps {
  medicine: Medicine
  onEdit: (medicine: Medicine) => void
  onConsume: (id: number) => void
  onRestock: (id: number) => void
  onDelete: (id: number) => void
}

function getExpiryStatus(expiryDate: string): { label: string; color: string; barColor: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: '已过期', color: 'text-red-600 bg-red-50', barColor: 'bg-red-500' }
  if (diffDays <= 30) return { label: `${diffDays}天后过期`, color: 'text-amber-600 bg-amber-50', barColor: 'bg-amber-500' }
  return { label: '安全', color: 'text-teal-600 bg-teal-50', barColor: 'bg-teal-500' }
}

function getStockStatus(stock: number): { label: string; color: string } {
  if (stock <= 0) return { label: '缺货', color: 'text-red-600' }
  if (stock <= 3) return { label: '库存不足', color: 'text-amber-600' }
  return { label: '库存充足', color: 'text-teal-600' }
}

export default function MedicineCard({ medicine, onEdit, onConsume, onRestock, onDelete }: MedicineCardProps) {
  const [showActions, setShowActions] = useState(false)
  const navigate = useNavigate()
  const expiry = getExpiryStatus(medicine.expiry_date)
  const stockStatus = getStockStatus(medicine.stock)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className={cn('absolute left-0 top-0 h-full w-1.5', expiry.barColor)} />

      <div className="p-5 pl-5">
        <div className="mb-3 flex items-start justify-between">
          <button
            onClick={() => navigate(`/medicines/${medicine.id}`)}
            className="flex-1 text-left transition-opacity hover:opacity-75"
          >
            <h3 className="text-lg font-bold text-slate-800">{medicine.name}</h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {medicine.symptoms.split(',').map((s: string, i: number) => (
                <span key={i} className="inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                  {s.trim()}
                </span>
              ))}
            </div>
          </button>
          <span className={cn('ml-2 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', expiry.color)}>
            {expiry.label}
          </span>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-400">库存</div>
            <div className={cn('text-lg font-bold', stockStatus.color)}>{medicine.stock}</div>
            <div className={cn('text-xs', stockStatus.color)}>{stockStatus.label}</div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-400">过期日期</div>
            <div className="text-sm font-semibold text-slate-700">{medicine.expiry_date}</div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-400">存放位置</div>
            <div className="text-sm font-semibold text-slate-700">{medicine.location}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/medicines/${medicine.id}`)}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100"
          >
            详情/计划
          </button>
          <button
            onClick={() => onConsume(medicine.id)}
            disabled={medicine.stock <= 0}
            className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            消耗
          </button>
          <button
            onClick={() => onRestock(medicine.id)}
            className="flex-1 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition-all hover:bg-teal-100"
          >
            补货
          </button>
          <button
            onClick={() => onEdit(medicine)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100"
          >
            编辑
          </button>
          <button
            onClick={() => setShowActions(!showActions)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </div>

        {showActions && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => { onDelete(medicine.id); setShowActions(false) }}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-100"
            >
              删除药品
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

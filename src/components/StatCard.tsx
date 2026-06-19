import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  icon: ReactNode
  gradient: string
  iconBg: string
}

export default function StatCard({ title, value, icon, gradient, iconBg }: StatCardProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-transform hover:-translate-y-1', gradient)}>
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="mt-2 text-4xl font-bold">{value}</p>
        </div>
        <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', iconBg)}>
          {icon}
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
    </div>
  )
}

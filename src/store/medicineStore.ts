import { create } from 'zustand'

interface Medicine {
  id: number
  name: string
  symptoms: string
  stock: number
  expiry_date: string
  location: string
  contraindications: string
  allergy_warning: string
  created_at: string
  updated_at: string
}

interface Conflict {
  id: number
  medicine_id: number
  conflict_medicine_id: number
  conflict_medicine_name: string
  description: string
  created_at: string
}

interface MedicineDetail extends Medicine {
  conflicts: Conflict[]
}

interface DashboardStats {
  total: number
  expiring_soon: number
  low_stock: number
  expired: number
}

interface Plan {
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

interface TodayDoseItem {
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

interface TodayOverview {
  pending: TodayDoseItem[]
  completed: TodayDoseItem[]
  missed: TodayDoseItem[]
  date: string
}

interface MedicationLog {
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

interface MedicineStore {
  medicines: Medicine[]
  medicineDetail: MedicineDetail | null
  stats: DashboardStats
  expiringList: Medicine[]
  lowStockList: Medicine[]
  plans: Plan[]
  todayOverview: TodayOverview | null
  logs: MedicationLog[]
  loading: boolean
  error: string | null
  fetchMedicines: (params?: Record<string, string>) => Promise<void>
  fetchMedicineDetail: (id: number) => Promise<void>
  fetchStats: () => Promise<void>
  fetchExpiring: () => Promise<void>
  fetchLowStock: () => Promise<void>
  createMedicine: (data: Omit<Medicine, 'id' | 'created_at' | 'updated_at' | 'contraindications' | 'allergy_warning'> & Partial<Pick<Medicine, 'contraindications' | 'allergy_warning'>>) => Promise<void>
  updateMedicine: (id: number, data: Partial<Medicine>) => Promise<void>
  consumeMedicine: (id: number, amount: number) => Promise<void>
  restockMedicine: (id: number, amount: number) => Promise<void>
  deleteMedicine: (id: number) => Promise<void>
  addConflict: (medicineId: number, conflictMedicineId: number, description: string) => Promise<boolean>
  removeConflict: (medicineId: number, conflictId: number) => Promise<boolean>
  fetchPlans: (params?: Record<string, string>) => Promise<void>
  createPlan: (data: { medicine_id: number; daily_times: number; dose_per_time: number; dose_unit?: string; start_date: string; end_date: string; remark?: string }) => Promise<{ success: boolean; warnings?: string[]; error?: string }>
  updatePlan: (id: number, data: any) => Promise<boolean>
  deletePlan: (id: number) => Promise<boolean>
  checkinDose: (planId: number, dailyIndex: number, remark?: string) => Promise<{ success: boolean; error?: string; data?: any }>
  fetchTodayOverview: () => Promise<void>
  fetchLogs: (medicineId: number, days?: number) => Promise<void>
}

const API_BASE = '/api'

export const useMedicineStore = create<MedicineStore>((set, get) => ({
  medicines: [],
  medicineDetail: null,
  stats: { total: 0, expiring_soon: 0, low_stock: 0, expired: 0 },
  expiringList: [],
  lowStockList: [],
  plans: [],
  todayOverview: null,
  logs: [],
  loading: false,
  error: null,

  fetchMedicines: async (params?: Record<string, string>) => {
    set({ loading: true, error: null })
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const res = await fetch(`${API_BASE}/medicines${query}`)
      const json = await res.json()
      if (json.success) {
        set({ medicines: json.data, loading: false })
      } else {
        set({ error: json.error, loading: false })
      }
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  fetchMedicineDetail: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/medicines/${id}`)
      const json = await res.json()
      if (json.success) {
        set({ medicineDetail: json.data, loading: false })
      } else {
        set({ error: json.error, loading: false })
      }
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  fetchStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`)
      const json = await res.json()
      if (json.success) {
        set({ stats: json.data })
      }
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  fetchExpiring: async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/expiring`)
      const json = await res.json()
      if (json.success) {
        set({ expiringList: json.data })
      }
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  fetchLowStock: async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/low-stock`)
      const json = await res.json()
      if (json.success) {
        set({ lowStockList: json.data })
      }
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  createMedicine: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchMedicines()
        await get().fetchStats()
        await get().fetchExpiring()
        await get().fetchLowStock()
      } else {
        set({ error: json.error, loading: false })
      }
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  updateMedicine: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchMedicines()
        await get().fetchStats()
        await get().fetchExpiring()
        await get().fetchLowStock()
      } else {
        set({ error: json.error, loading: false })
      }
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  consumeMedicine: async (id, amount) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/medicines/${id}/consume`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchMedicines()
        await get().fetchStats()
        await get().fetchExpiring()
        await get().fetchLowStock()
      } else {
        set({ error: json.error, loading: false })
      }
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  restockMedicine: async (id, amount) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/medicines/${id}/restock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchMedicines()
        await get().fetchStats()
        await get().fetchExpiring()
        await get().fetchLowStock()
      } else {
        set({ error: json.error, loading: false })
      }
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  deleteMedicine: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/medicines/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        await get().fetchMedicines()
        await get().fetchStats()
        await get().fetchExpiring()
        await get().fetchLowStock()
      } else {
        set({ error: json.error, loading: false })
      }
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  addConflict: async (medicineId, conflictMedicineId, description) => {
    try {
      const res = await fetch(`${API_BASE}/medicines/${medicineId}/conflicts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflict_medicine_id: conflictMedicineId, description }),
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchMedicineDetail(medicineId)
        return true
      }
      return false
    } catch {
      return false
    }
  },

  removeConflict: async (medicineId, conflictId) => {
    try {
      const res = await fetch(`${API_BASE}/medicines/${medicineId}/conflicts/${conflictId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        await get().fetchMedicineDetail(medicineId)
        return true
      }
      return false
    } catch {
      return false
    }
  },

  fetchPlans: async (params) => {
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const res = await fetch(`${API_BASE}/plans${query}`)
      const json = await res.json()
      if (json.success) set({ plans: json.data })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  createPlan: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchPlans()
        await get().fetchTodayOverview()
        return { success: true, warnings: json.warnings }
      }
      return { success: false, error: json.error }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  updatePlan: async (id, data) => {
    try {
      const res = await fetch(`${API_BASE}/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchPlans()
        await get().fetchTodayOverview()
        return true
      }
      return false
    } catch {
      return false
    }
  },

  deletePlan: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/plans/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        await get().fetchPlans()
        await get().fetchTodayOverview()
        return true
      }
      return false
    } catch {
      return false
    }
  },

  checkinDose: async (planId, dailyIndex, remark) => {
    try {
      const res = await fetch(`${API_BASE}/plans/${planId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_index: dailyIndex, remark }),
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchTodayOverview()
        await get().fetchMedicines()
        await get().fetchStats()
        await get().fetchLowStock()
        return { success: true, data: json.data }
      }
      return { success: false, error: json.error }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  fetchTodayOverview: async () => {
    try {
      const res = await fetch(`${API_BASE}/plans/today/overview`)
      const json = await res.json()
      if (json.success) set({ todayOverview: json.data })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  fetchLogs: async (medicineId, days = 7) => {
    try {
      const res = await fetch(`${API_BASE}/plans/logs/medicine/${medicineId}?days=${days}`)
      const json = await res.json()
      if (json.success) set({ logs: json.data })
    } catch (err: any) {
      set({ error: err.message })
    }
  },
}))

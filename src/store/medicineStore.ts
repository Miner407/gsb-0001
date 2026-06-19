import { create } from 'zustand'

interface Medicine {
  id: number
  name: string
  symptoms: string
  stock: number
  expiry_date: string
  location: string
  created_at: string
  updated_at: string
}

interface DashboardStats {
  total: number
  expiring_soon: number
  low_stock: number
  expired: number
}

interface MedicineStore {
  medicines: Medicine[]
  stats: DashboardStats
  expiringList: Medicine[]
  lowStockList: Medicine[]
  loading: boolean
  error: string | null
  fetchMedicines: (params?: Record<string, string>) => Promise<void>
  fetchStats: () => Promise<void>
  fetchExpiring: () => Promise<void>
  fetchLowStock: () => Promise<void>
  createMedicine: (data: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateMedicine: (id: number, data: Partial<Medicine>) => Promise<void>
  consumeMedicine: (id: number, amount: number) => Promise<void>
  restockMedicine: (id: number, amount: number) => Promise<void>
  deleteMedicine: (id: number) => Promise<void>
}

const API_BASE = '/api'

export const useMedicineStore = create<MedicineStore>((set, get) => ({
  medicines: [],
  stats: { total: 0, expiring_soon: 0, low_stock: 0, expired: 0 },
  expiringList: [],
  lowStockList: [],
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
}))

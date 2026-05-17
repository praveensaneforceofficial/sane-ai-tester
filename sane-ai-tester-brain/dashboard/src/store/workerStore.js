import { create } from 'zustand'
import api from '../services/api'

export const useWorkerStore = create((set, get) => ({
  workers: [],
  loading: false,
  error: null,
  
  fetchWorkers: async () => {
    set({ loading: true })
    try {
      const response = await api.get('/workers')
      // Axios interceptor already returns response.data, so response IS the parsed body
      // It could be an array directly, or { workers: [...] }
      const workers = Array.isArray(response) 
        ? response 
        : (response?.workers || response?.data || [])
      set({ workers, loading: false, error: null })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  getWorker: (workerId) => {
    return get().workers.find(w => w.worker_id === workerId)
  },
  
  getOnlineWorkers: () => {
    return get().workers.filter(w => w.status === 'online')
  },
}))
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
      set({ workers: response.data.workers || response.data, loading: false, error: null })
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
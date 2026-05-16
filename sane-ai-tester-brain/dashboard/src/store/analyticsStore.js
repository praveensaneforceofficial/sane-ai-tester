import { create } from 'zustand'
import api from '../services/api'

export const useAnalyticsStore = create((set) => ({
  metrics: null,
  tokenUsage: null,
  loading: false,
  
  fetchMetrics: async () => {
    set({ loading: true })
    try {
      const response = await api.get('/dashboard/stats')
      set({ metrics: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      set({ loading: false })
    }
  },
  
  fetchTokenUsage: async () => {
    try {
      const response = await api.get('/analytics/token-usage')
      set({ tokenUsage: response.data })
    } catch (error) {
      console.error('Failed to fetch token usage:', error)
    }
  },
}))
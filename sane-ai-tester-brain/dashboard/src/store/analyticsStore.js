import { create } from 'zustand'
import { analyticsApi } from '../services/api'

export const useAnalyticsStore = create((set, get) => ({
  metrics: null,
  tokenUsage: null,
  dailyMetrics: null,
  projectAnalytics: null,
  loading: false,
  tokenLoading: false,
  projectLoading: false,

  fetchMetrics: async () => {
    set({ loading: true })
    try {
      const data = await analyticsApi.getDashboardStats()
      set({ metrics: data, loading: false })
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      set({ loading: false })
    }
  },

  fetchTokenUsage: async (days = 7) => {
    set({ tokenLoading: true })
    try {
      const data = await analyticsApi.getTokenUsage(days)
      set({ tokenUsage: data, tokenLoading: false })
    } catch (error) {
      console.error('Failed to fetch token usage:', error)
      set({ tokenLoading: false })
    }
  },

  fetchDailyMetrics: async (days = 7) => {
    try {
      const data = await analyticsApi.getDailyMetrics(days)
      set({ dailyMetrics: data })
    } catch (error) {
      console.error('Failed to fetch daily metrics:', error)
    }
  },

  fetchProjectAnalytics: async () => {
    set({ projectLoading: true })
    try {
      const data = await analyticsApi.getProjectAnalytics()
      set({ projectAnalytics: data, projectLoading: false })
    } catch (error) {
      console.error('Failed to fetch project analytics:', error)
      set({ projectLoading: false })
    }
  },
}))
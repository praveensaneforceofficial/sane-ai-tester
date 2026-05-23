import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api', // Points to Node.js Central API
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // Silently reject error as per user request
    return Promise.reject(error)
  }
)

// Auth endpoints
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
}

// Worker endpoints
export const workerApi = {
  getAll: () => api.get('/workers'),
  getById: (workerId) => api.get(`/workers/${workerId}`),
  getOnline: () => api.get('/workers/online'),
  getTasks: (workerId, limit = 50) => api.get(`/workers/${workerId}/tasks`, { params: { limit } }),
}

// Task endpoints
export const taskApi = {
  send: (data) => api.post('/tasks/send', data),
  getHistory: (workerId, limit = 50) => api.get(`/tasks/history/${workerId}`, { params: { limit } }),
  getStatus: (taskId) => api.get(`/tasks/status/${taskId}`),
  retry: (taskId) => api.post(`/tasks/retry/${taskId}`),
  getActions: (taskId) => api.get(`/tasks/${taskId}/actions`),
}

// Custom Task endpoints
export const customTaskApi = {
  getAll: () => api.get('/custom-tasks'),
  create: (data) => api.post('/custom-tasks', data),
  updateStatus: (customTaskId, status) => api.put(`/custom-tasks/${customTaskId}/status`, { status }),
  delete: (customTaskId) => api.delete(`/custom-tasks/${customTaskId}`),
  startBrainAgent: () => api.post('/brain/trigger-orchestration'),
  checkAi: () => api.get('/brain/check-ai'),
  getActions: (customTaskId) => api.get(`/custom-tasks/${customTaskId}/actions`),
}

// Project endpoints
export const projectApi = {
  getAll: () => api.get('/projects'),
  getActive: () => api.get('/projects/active'),
  sync: () => api.post('/projects/sync', {}, { timeout: 180000 }), // 3 minutes timeout
  create: (data) => api.post('/projects', data),
  update: (projectId, data) => api.put(`/projects/${projectId}`, data),
  delete: (projectId) => api.delete(`/projects/${projectId}`),
}

// Analytics endpoints
export const analyticsApi = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getTokenUsage: (days = 7) => api.get('/analytics/token-usage', { params: { days } }),
  getWorkerPerformance: () => api.get('/analytics/worker-performance'),
  getDailyMetrics: (days = 7) => api.get('/analytics/daily-metrics', { params: { days } }),
  getProjectAnalytics: () => api.get('/analytics/projects'),
}

// Report endpoints
export const reportApi = {
  getTestSummary: (params) => api.get('/reports/test-summary', { params }),
  getFailedTests: (limit = 50) => api.get('/reports/failed-tests', { params: { limit } }),
  exportReport: (data) => api.post('/reports/export', data),
  getByTaskId: (taskId) => api.get(`/reports/task/${taskId}`),
}

// Health endpoint
export const healthApi = {
  check: () => api.get('/health'),
  detailed: () => api.get('/health/detailed'),
}

export default api
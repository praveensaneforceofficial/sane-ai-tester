export const API_BASE_URL = '/api'
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000'

export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
}

export const WORKER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy',
}

export const PRIORITY = {
  HIGH: { label: 'High', color: 'red', value: 3 },
  MEDIUM: { label: 'Medium', color: 'yellow', value: 2 },
  LOW: { label: 'Low', color: 'green', value: 1 },
}

export const STATUS_COLORS = {
  online: 'green',
  offline: 'gray',
  busy: 'yellow',
  pending: 'blue',
  completed: 'green',
  failed: 'red',
  running: 'purple',
}
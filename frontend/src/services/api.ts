import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mirage_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mirage_token')
      localStorage.removeItem('mirage_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/api/auth/login', data),
  register: (data: any) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
}

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactionsApi = {
  list: (params?: any) => api.get('/api/transactions/', { params }),
  recent: (limit = 10) => api.get('/api/transactions/recent', { params: { limit } }),
  flagged: () => api.get('/api/transactions/flagged'),
  create: (data: any) => api.post('/api/transactions/', data),
  simulate: (data: { amount: number; merchant: string; category: string; description?: string }) =>
    api.post('/api/transactions/simulate', data),
  attackSim: () => api.post('/api/transactions/attack-sim'),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getRiskScore: () => api.get('/api/analytics/risk-score'),
  refreshRiskScore: () => api.post('/api/analytics/risk-score/refresh'),
  getRiskTrend: (days = 7) => api.get('/api/analytics/risk-trend', { params: { days } }),
  getHeatmap: (days = 30) => api.get('/api/analytics/heatmap', { params: { days } }),
  getBehavioralProfile: () => api.get('/api/analytics/behavioral-profile'),
  getShapExplanation: () => api.get('/api/analytics/shap-explanation'),
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alertsApi = {
  list: (params?: any) => api.get('/api/alerts/', { params }),
  update: (id: number, data: any) => api.patch(`/api/alerts/${id}`, data),
  markAllRead: () => api.post('/api/alerts/mark-all-read'),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/api/admin/stats'),
  getUsers: () => api.get('/api/admin/users'),
}

// ── WebSocket URL ─────────────────────────────────────────────────────────────
export const getWsUrl = (userId: number, token: string): string => {
  const wsBase = BASE_URL.replace('http', 'ws')
  return `${wsBase}/ws/stream?token=${token}&user_id=${userId}`
}

export default api

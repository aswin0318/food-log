import axios from 'axios'

const api = axios.create({ baseURL: '' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/api/auth/register', data).then(r => r.data),
  login: (data) => api.post('/api/auth/login', data).then(r => r.data),
  logout: () => api.post('/api/auth/logout').then(r => r.data),
  getMe: () => api.get('/api/auth/me').then(r => r.data),
}

// ── Food ──────────────────────────────────────────────
export const foodApi = {
  createMeal: (data) => api.post('/api/food/meals', data).then(r => r.data),
  listMeals: (params) => api.get('/api/food/meals', { params }).then(r => r.data),
  getDailyMeals: (date) => api.get(`/api/food/meals/daily/${date}`).then(r => r.data),
  deleteMeal: (id) => api.delete(`/api/food/meals/${id}`).then(r => r.data),
}

// ── Macro ─────────────────────────────────────────────
export const macroApi = {
  getDailySummary: (date) => api.get(`/api/macro/daily/${date}`).then(r => r.data),
  getWeeklySummary: (startDate) => api.get(`/api/macro/weekly?start_date=${startDate}`).then(r => r.data),
  getTargets: () => api.get('/api/macro/targets').then(r => r.data),
  updateTargets: (data) => api.put('/api/macro/targets', data).then(r => r.data),
  onboard: (data) => api.post('/api/macro/onboard', data).then(r => r.data),
  getComparison: (date) => api.get(`/api/macro/comparison/${date}`).then(r => r.data),
}

// ── Compliance ────────────────────────────────────────
export const complianceApi = {
  checkCompliance: (date) => api.get(`/api/compliance/check/${date}`).then(r => r.data),
  getAlerts: (limit = 50) => api.get(`/api/compliance/alerts?limit=${limit}`).then(r => r.data),
  getUnreadAlerts: () => api.get('/api/compliance/alerts/unread').then(r => r.data),
  markAlertRead: (id) => api.put(`/api/compliance/alerts/${id}/read`).then(r => r.data),
  analyzePatterns: (days = 7) => api.post(`/api/compliance/analyze?days=${days}`).then(r => r.data),
}

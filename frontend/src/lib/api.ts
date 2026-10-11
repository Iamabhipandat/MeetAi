import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  resendVerification: (email: string) =>
    api.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`),
}

// ── Meetings ──────────────────────────────────────────────────────
export const meetingsApi = {
  list: () => api.get('/meetings/'),
  get: (id: number) => api.get(`/meetings/${id}`),
  create: (title: string, description?: string) =>
    api.post('/meetings/', { title, description }),
  start: (id: number) => api.post(`/meetings/${id}/start`),
  finish: (id: number) => api.post(`/meetings/${id}/finish`),
  delete: (id: number) => api.delete(`/meetings/${id}`),
}

// ── Rooms (Video) ──────────────────────────────────────────────────
export const roomsApi = {
  create: (meetingId: number) => api.post(`/rooms/${meetingId}/create`),
  getByCode: (code: string) => api.get(`/rooms/join/${code}`),
  getToken: (meetingId: number, name: string) =>
    api.post(`/rooms/${meetingId}/token?participant_name=${encodeURIComponent(name)}`),
  getGuestToken: (code: string, name: string) =>
    api.post(`/rooms/join/${code}/token?participant_name=${encodeURIComponent(name)}`),
}

// ── Transcripts ───────────────────────────────────────────────────
export const transcriptsApi = {
  list: (meetingId: number) => api.get(`/transcripts/meeting/${meetingId}`),
  add: (meetingId: number, speaker: string, content: string) =>
    api.post('/transcripts/', { meeting_id: meetingId, speaker, content }),
}

// ── Questions ─────────────────────────────────────────────────────
export const questionsApi = {
  list: (meetingId: number) => api.get(`/questions/meeting/${meetingId}`),
}

// ── AI ────────────────────────────────────────────────────────────
export const aiApi = {
  generateAnswer: (questionId: number) =>
    api.post(`/ai/questions/${questionId}/answer`),
}

// ── Summary ───────────────────────────────────────────────────────
export const summaryApi = {
  get: (meetingId: number, regenerate = false) =>
    api.get(`/summaries/meeting/${meetingId}${regenerate ? '?regenerate=true' : ''}`),
}

// ── Search ────────────────────────────────────────────────────────
export const searchApi = {
  search: (q: string, limit = 20) =>
    api.get('/search/', { params: { q, limit } }),
}

// ── Analytics ─────────────────────────────────────────────────────
export const analyticsApi = {
  get: () => api.get('/analytics/'),
}

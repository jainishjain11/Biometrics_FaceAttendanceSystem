import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authAPI = {
  register:  (data)    => api.post('/auth/register', data),
  login:     (data)    => api.post('/auth/login', data),
  me:        ()        => api.get('/auth/me'),
  listUsers: ()        => api.get('/auth/users'),
}

// ── Face endpoints ────────────────────────────────────────────────────────────
export const faceAPI = {
  register:      (formData) => axios.post(BASE_URL + '/face/register', formData, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  }),
  registerB64:   (userId, imageB64) => {
    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('image_b64', imageB64)
    return axios.post(BASE_URL + '/face/register', formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    })
  },
  recognize:     (image, runLiveness = true) =>
    api.post('/face/recognize', { image, run_liveness: runLiveness }),
  livenessCheck: (image) => api.post('/face/liveness-check', { image }),
  getUserFaces:  (userId) => api.get(`/face/user/${userId}`),
}

// ── Attendance endpoints ──────────────────────────────────────────────────────
export const attendanceAPI = {
  mark:      (userId, confidenceScore) =>
    api.post('/attendance/mark', { user_id: userId, confidence_score: confidenceScore }),
  today:     ()       => api.get('/attendance/today'),
  list:      (date)   => api.get('/attendance/list', { params: date ? { date } : {} }),
  userList:  (userId, date) =>
    api.get(`/attendance/user/${userId}`, { params: date ? { date } : {} }),
  checkToday: (userId) => api.get(`/attendance/check/${userId}`),
}

export default api

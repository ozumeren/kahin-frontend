// src/api/client.js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '/api/v1' : 'https://api.kahinmarket.com/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ... rest of the code

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
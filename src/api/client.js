// src/api/client.js
import axios from 'axios'
import { sanitizeObject, checkRateLimit, sanitizeError } from '../utils/security'

// API URL'yi environment'a göre belirle
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5001/api/v1' : 'https://api.kahinmarket.com/api/v1')

// Token refresh state
let isRefreshing = false
let refreshSubscribers = []

// Refresh token sonrası bekleyen istekleri çalıştır
const onRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

// Refresh bekleyen istekleri kuyruğa ekle
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback)
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 saniye timeout
})

// ============================================
// Request Interceptor
// ============================================
apiClient.interceptors.request.use(
  (config) => {
    // Token ekle
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Rate limiting kontrolü (hassas endpoint'ler için)
    const sensitiveEndpoints = ['/auth/login', '/auth/register', '/orders', '/orders/batch']
    const isSensitive = sensitiveEndpoints.some(ep => config.url?.includes(ep))

    if (isSensitive && config.method !== 'get') {
      const rateLimitKey = `api_${config.url}_${config.method}`
      const rateCheck = checkRateLimit(rateLimitKey, {
        maxRequests: config.url?.includes('/auth/') ? 5 : 20,
        windowMs: 60000
      })

      if (!rateCheck.allowed) {
        return Promise.reject({
          response: {
            status: 429,
            data: { message: rateCheck.message }
          }
        })
      }
    }

    // POST/PUT/PATCH isteklerinde data sanitization
    if (config.data && ['post', 'put', 'patch'].includes(config.method?.toLowerCase())) {
      // Auth endpoint'lerinde şifre sanitize edilmemeli
      const isAuthEndpoint = config.url?.includes('/auth/')
      if (!isAuthEndpoint) {
        config.data = sanitizeObject(config.data)
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================
// Response Interceptor
// ============================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Config yoksa (rate limit hatası gibi), direkt reject et
    if (!originalRequest) {
      return Promise.reject(error)
    }

    // Token expired - refresh dene
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Refresh endpoint'inde hata alırsak döngüye girme
      if (originalRequest.url?.includes('/auth/refresh')) {
        handleLogout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Refresh devam ediyorsa, kuyruğa ekle
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')

        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data

        localStorage.setItem('token', accessToken)
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
        }

        // Son aktivite zamanını güncelle
        localStorage.setItem('lastActivity', Date.now().toString())

        isRefreshing = false
        onRefreshed(accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        refreshSubscribers = []
        handleLogout()
        return Promise.reject(refreshError)
      }
    }

    // 403 Forbidden - yetkisiz erişim
    if (error.response?.status === 403) {
      console.warn('Yetkisiz erişim denemesi:', originalRequest.url)
    }

    // Hata mesajını sanitize et
    if (error.response?.data?.message) {
      error.userMessage = sanitizeError(error)
    }

    return Promise.reject(error)
  }
)

// ============================================
// Helper Functions
// ============================================

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('lastActivity')

  // Auth sayfasında değilsek login'e yönlendir
  if (!window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/register')) {
    window.location.href = '/login?expired=true'
  }
}

// ============================================
// API Helper Methods
// ============================================

// Güvenli GET isteği (rate limit ve cache ile)
apiClient.safeGet = async (url, config = {}) => {
  const cacheKey = `cache_${url}_${JSON.stringify(config.params || {})}`
  const cached = sessionStorage.getItem(cacheKey)

  if (cached && config.useCache !== false) {
    const { data, timestamp } = JSON.parse(cached)
    const maxAge = config.cacheMaxAge || 30000 // 30 saniye default

    if (Date.now() - timestamp < maxAge) {
      return { data, fromCache: true }
    }
  }

  const response = await apiClient.get(url, config)

  if (config.useCache !== false) {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data: response.data,
      timestamp: Date.now()
    }))
  }

  return response
}

// Toplu istek yapma (batch requests)
apiClient.batchRequests = async (requests) => {
  const results = await Promise.allSettled(
    requests.map(req => apiClient(req))
  )

  return results.map((result, index) => ({
    request: requests[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value.data : null,
    error: result.status === 'rejected' ? result.reason : null
  }))
}

export default apiClient

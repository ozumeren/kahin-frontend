import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import apiClient from '../api/client'
import { useWebSocket, useBalanceUpdates } from '../hooks/useWebSocket'
import {
  trackUserActivity,
  getInactivityDuration,
  resetActivityTime,
  secureStorage
} from '../utils/security'

const AuthContext = createContext(null)

// Güvenlik sabitleri
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 dakika
const INACTIVITY_WARNING = 5 * 60 * 1000 // 5 dakika kala uyarı
const ACTIVITY_CHECK_INTERVAL = 60 * 1000 // Her dakika kontrol

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [sessionInfo, setSessionInfo] = useState(null)
  const inactivityTimerRef = useRef(null)
  const warningTimerRef = useRef(null)

  // WebSocket hook'unu al
  const { isConnected, subscribeUser } = useWebSocket()

  // Bakiye güncellemelerini dinle
  const handleBalanceUpdate = useCallback((newBalance) => {
    if (import.meta.env.DEV) {
      console.log('AuthContext - WebSocket bakiye güncellendi:', newBalance)
    }

    setUser(prevUser => {
      if (!prevUser) return prevUser

      return {
        ...prevUser,
        balance: newBalance
      }
    })
  }, [])

  useBalanceUpdates(handleBalanceUpdate)

  // ============================================
  // Logout Function (önce tanımla)
  // ============================================

  const doLogout = useCallback(() => {
    // Timer'ları temizle
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }

    // Storage'ı temizle
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('lastActivity')
    secureStorage.remove('loginTime')

    // State'i temizle
    setUser(null)
    setSessionInfo(null)
    setShowInactivityWarning(false)
  }, [])

  // ============================================
  // Inactivity Logout
  // ============================================

  const handleInactivityLogout = useCallback(() => {
    console.log('Inaktivite nedeniyle oturum kapatılıyor...')
    setShowInactivityWarning(false)
    doLogout()
    window.location.href = '/login?reason=inactivity'
  }, [doLogout])

  const resetInactivityTimer = useCallback(() => {
    // Uyarıyı kapat
    setShowInactivityWarning(false)

    // Mevcut timer'ları temizle
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }

    // Sadece giriş yapmış kullanıcılar için timer başlat
    if (user) {
      // Uyarı timer'ı
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true)
      }, INACTIVITY_TIMEOUT - INACTIVITY_WARNING)

      // Logout timer'ı
      inactivityTimerRef.current = setTimeout(() => {
        handleInactivityLogout()
      }, INACTIVITY_TIMEOUT)
    }
  }, [user, handleInactivityLogout])

  // Activity tracking başlat
  useEffect(() => {
    if (user) {
      // Activity listener'ları başlat
      trackUserActivity()

      // İlk timer'ı başlat
      resetInactivityTimer()

      // Periyodik kontrol
      const checkInterval = setInterval(() => {
        const inactivityDuration = getInactivityDuration()

        if (inactivityDuration >= INACTIVITY_TIMEOUT) {
          handleInactivityLogout()
        } else if (inactivityDuration >= INACTIVITY_TIMEOUT - INACTIVITY_WARNING) {
          setShowInactivityWarning(true)
        }
      }, ACTIVITY_CHECK_INTERVAL)

      // Activity olduğunda timer'ı sıfırla
      const handleActivity = () => {
        resetActivityTime()
        resetInactivityTimer()
      }

      const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
      events.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true })
      })

      return () => {
        clearInterval(checkInterval)
        clearTimeout(inactivityTimerRef.current)
        clearTimeout(warningTimerRef.current)
        events.forEach(event => {
          window.removeEventListener(event, handleActivity)
        })
      }
    }
  }, [user, resetInactivityTimer, handleInactivityLogout])

  // ============================================
  // Auth Check on Mount
  // ============================================

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await apiClient.get('/users/me')
          setUser(response.data.data)

          // Session bilgisini kaydet
          setSessionInfo({
            loginTime: secureStorage.get('loginTime') || Date.now(),
            lastActivity: Date.now(),
            deviceInfo: getDeviceInfo()
          })
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  // WebSocket subscription
  useEffect(() => {
    if (user && isConnected) {
      if (import.meta.env.DEV) {
        console.log('Calling subscribeUser with userId:', user.id)
      }
      subscribeUser(user.id)
    }
  }, [user, isConnected, subscribeUser])

  // ============================================
  // Auth Methods
  // ============================================

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password })
    const { accessToken, refreshToken } = response.data

    // Token'ları kaydet
    localStorage.setItem('token', accessToken)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }

    // Session bilgilerini kaydet
    const loginTime = Date.now()
    secureStorage.set('loginTime', loginTime)
    localStorage.setItem('lastActivity', loginTime.toString())

    try {
      const userResponse = await apiClient.get('/users/me')
      const userData = userResponse.data.data
      setUser(userData)

      // Session info
      setSessionInfo({
        loginTime,
        lastActivity: loginTime,
        deviceInfo: getDeviceInfo()
      })

      // Inactivity timer'ı başlat
      resetActivityTime()

      // NOT: WebSocket subscription useEffect tarafından otomatik yapılacak
      // (user state değiştiğinde tetiklenir)

    } catch (error) {
      console.error('Failed to fetch user after login:', error)
      if (response.data.user) {
        setUser(response.data.user)
      }
    }

    return response.data
  }

  const register = async (username, email, password) => {
    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password
    })
    return response.data
  }

  const refreshUser = async () => {
    try {
      const response = await apiClient.get('/users/me')
      setUser(response.data.data)
      return response.data.data
    } catch (error) {
      console.error('Failed to refresh user:', error)
      return null
    }
  }

  // Oturumu uzat (uyarı gösterildiğinde)
  const extendSession = useCallback(() => {
    resetActivityTime()
    resetInactivityTimer()
    setShowInactivityWarning(false)
  }, [resetInactivityTimer])

  // ============================================
  // Context Value
  // ============================================

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout: doLogout,
    refreshUser,
    isAuthenticated: !!user,
    // Yeni güvenlik özellikleri
    showInactivityWarning,
    extendSession,
    sessionInfo,
    inactivityTimeout: INACTIVITY_TIMEOUT,
    inactivityWarning: INACTIVITY_WARNING
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// ============================================
// Helper Functions
// ============================================

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

import { createContext, useContext, useState, useEffect } from 'react'
import apiClient from '../api/client'
import { useWebSocket, useBalanceUpdates } from '../hooks/useWebSocket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // WebSocket hook'unu al
  const ws = useWebSocket()

  // Bakiye güncellemelerini dinle
  useBalanceUpdates((newBalance) => {
    console.log('🔄 AuthContext - WebSocket bakiye güncellendi:', newBalance, 'Current user:', user?.id)
    if (user) {
      setUser(prevUser => {
        const updated = {
          ...prevUser,
          balance: newBalance
        }
        console.log('👤 User state güncellendi:', { oldBalance: prevUser.balance, newBalance })
        return updated
      })
    } else {
      console.log('⚠️ User yok, bakiye güncellemesi atlanıyor')
    }
  })

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await apiClient.get('/users/me')
          setUser(response.data.data)
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  // Kullanıcı giriş yaptığında WebSocket'e subscribe ol
  useEffect(() => {
    if (user && ws.isConnected) {
      console.log('👤 WebSocket user subscription:', user.id)
      ws.subscribeUser(user.id)
    }
  }, [user, ws.isConnected])

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password })
    const { accessToken, user } = response.data
    
    localStorage.setItem('token', accessToken)
    try {
      const userResponse = await apiClient.get('/users/me')
      const userData = userResponse.data.data
      setUser(userData)
      
      // Kullanıcı giriş yaptıktan sonra WebSocket'e subscribe ol
      if (ws.isConnected) {
        console.log('👤 Login sonrası WebSocket user subscription:', userData.id)
        ws.subscribeUser(userData.id)
      }
    } catch (error) {
      console.error('Failed to fetch user after login:', error)
      // Token varsa en azından basic user bilgisi set et
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

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // ✅ YENİ: User bilgilerini yenile
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

  const value = {
    user,
    setUser,  // ✅ YENİ: Diğer componentlerin user'ı güncellemesine izin ver
    loading,
    login,
    register,
    logout,
    refreshUser,  // ✅ YENİ
    isAuthenticated: !!user
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
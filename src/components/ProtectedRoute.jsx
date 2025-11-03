import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, redirectTo = '/login', requireAdmin = false }) {
  const { isAuthenticated, loading, user } = useAuth()

  // Authentication kontrolü yapılıyor
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl px-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  // Giriş yapmamış, login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // Admin yetkisi gerekiyorsa ve kullanıcı admin değilse, ana sayfaya yönlendir
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  // Giriş yapmış, sayfayı göster
  return children
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * GuestRoute Component
 * 
 * Sadece giriş yapmamış kullanıcıların (guest) erişebileceği sayfaları kontrol eder.
 * Eğer kullanıcı giriş yapmışsa, belirtilen sayfaya yönlendirir.
 * 
 * @example
 * <Route 
 *   path="/login" 
 *   element={
 *     <GuestRoute>
 *       <LoginPage />
 *     </GuestRoute>
 *   } 
 * />
 */
export default function GuestRoute({ children, redirectTo = '/' }) {
  const { isAuthenticated, loading } = useAuth()

  // Authentication kontrolü yapılıyor
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  // Zaten giriş yapmış, ana sayfaya yönlendir
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // Giriş yapmamış, sayfayı göster
  return children
}

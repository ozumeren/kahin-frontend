import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, User, LogOut, Menu, X, Shield } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50" style={{ backgroundColor: '#111111', borderBottom: '1px solid #555555' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src="https://i.ibb.co/qL5cd5C1/Logo.png" 
              alt="Kahinmarket Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Eğer logo yüklenemezse, fallback icon göster
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'flex'
              }}
            />
            <div className="w-10 h-10 rounded-xl items-center justify-center transition-all hidden" style={{ backgroundColor: 'rgba(204, 255, 51, 0.2)', display: 'none' }}>
              <TrendingUp className="w-6 h-6" style={{ color: '#ccff33' }} />
            </div>
            <span className="text-2xl font-bold transition-colors" style={{ color: '#ffffff' }}>
              Kahinmarket
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link 
              to="/" 
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: isActive('/') ? '#555555' : 'transparent',
                color: '#ffffff'
              }}
            >
              Ana Sayfa
            </Link>
            <Link 
              to="/markets" 
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: isActive('/markets') ? '#555555' : 'transparent',
                color: '#ffffff'
              }}
            >
              Pazarlar
            </Link>
            {user && (
              <Link 
                to="/portfolio" 
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: isActive('/portfolio') ? '#555555' : 'transparent',
                  color: '#ffffff'
                }}
              >
                Portfolyo
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link 
                to="/admin" 
                className="px-4 py-2 rounded-lg font-medium flex items-center gap-1 transition-all"
                style={{
                  backgroundColor: isActive('/admin') ? '#555555' : 'transparent',
                  color: '#ffffff'
                }}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: '#555555', border: '1px solid #555555' }}>
                  <User className="w-4 h-4 flex-shrink-0" style={{ color: '#ffffff', opacity: 0.7 }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>{user.username}</span>
                    <span className="text-xs whitespace-nowrap" style={{ color: '#ffffff', opacity: 0.7 }}>
                      ₺{parseFloat(user.balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:brightness-110"
                  style={{ backgroundColor: 'transparent', color: '#ffffff' }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Çıkış</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:brightness-110"
                  style={{ backgroundColor: 'transparent', color: '#ffffff' }}
                >
                  Giriş
                </Link>
                <Link 
                  to="/register" 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:brightness-110 shadow-lg"
                  style={{ backgroundColor: '#555555', color: '#ffffff' }}
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 rounded-lg transition-all hover:brightness-110"
            style={{ backgroundColor: '#555555' }}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" style={{ color: '#ffffff' }} /> : <Menu className="w-6 h-6" style={{ color: '#ffffff' }} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4" style={{ borderTop: '1px solid #555555' }}>
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: isActive('/') ? '#555555' : 'transparent',
                  color: '#ffffff'
                }}
              >
                Ana Sayfa
              </Link>
              <Link
                to="/markets"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: isActive('/markets') ? '#555555' : 'transparent',
                  color: '#ffffff'
                }}
              >
                Pazarlar
              </Link>
              {user && (
                <Link
                  to="/portfolio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: isActive('/portfolio') ? '#555555' : 'transparent',
                    color: '#ffffff'
                  }}
                >
                  Portfolyo
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium flex items-center gap-1"
                  style={{
                    backgroundColor: isActive('/admin') ? '#555555' : 'transparent',
                    color: '#ffffff'
                  }}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}

              <div className="pt-4 mt-2 space-y-2" style={{ borderTop: '1px solid #555555' }}>
                {user ? (
                  <>
                    <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#555555', border: '1px solid #555555' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4" style={{ color: '#ffffff', opacity: 0.7 }} />
                        <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{user.username}</span>
                      </div>
                      <div className="text-xs" style={{ color: '#ffffff', opacity: 0.7 }}>
                        Bakiye: ₺{parseFloat(user.balance || 0).toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                      style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#FF0000', border: '1px solid rgba(255, 0, 0, 0.3)' }}
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-2 text-center rounded-lg font-medium hover:brightness-110 transition-all"
                      style={{ border: '1px solid #555555', color: '#ffffff' }}
                    >
                      Giriş
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-2 text-center rounded-lg font-medium hover:brightness-110 transition-all"
                      style={{ backgroundColor: '#555555', color: '#ffffff' }}
                    >
                      Kayıt Ol
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
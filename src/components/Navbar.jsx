import { Link, useLocation } from 'react-router-dom'
import { TrendingUp, Menu, X, User, LogOut, Shield } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'  // ← YENİ

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()  // ← YENİ
  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <TrendingUp className="w-8 h-8 text-brand-600" />
            <span className="text-xl font-bold">Kahin Market</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={`px-4 py-2 rounded-lg font-medium ${isActive('/') ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-100'}`}>
              Ana Sayfa
            </Link>
            <Link to="/markets" className={`px-4 py-2 rounded-lg font-medium ${isActive('/markets') ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-100'}`}>
              Pazarlar
            </Link>
            {user && (
              <Link to="/portfolio" className={`px-4 py-2 rounded-lg font-medium ${isActive('/portfolio') ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-100'}`}>
                Portfolyo
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className={`px-4 py-2 rounded-lg font-medium flex items-center gap-1 ${isActive('/admin') ? 'bg-purple-50 text-purple-700' : 'hover:bg-purple-50 hover:text-purple-700'}`}>
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">{user.username}</span>
                  <span className="text-xs text-gray-500">
                    ₺{parseFloat(user.balance || 0).toFixed(2)}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn btn-ghost">
                  <LogOut className="w-4 h-4" />
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Giriş</Link>
                <Link to="/register" className="btn btn-primary">Kayıt Ol</Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu - aynı kalacak, sadece user bilgisi güncellenecek */}
    </nav>
  )
}
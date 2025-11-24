import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, User, LogOut, Menu, X, Shield, Search, Trophy, Wallet, MessageCircle } from 'lucide-react'
import { useState } from 'react'

// Import category icons
import AllIcon from '../assets/all.svg'
import PoliticsIcon from '../assets/financial.svg'
import SportsIcon from '../assets/sports.svg'
import CryptoIcon from '../assets/crypto.svg'
import EconomyIcon from '../assets/icons-04.svg'
import EntertainmentIcon from '../assets/entertainment.svg'
import TechnologyIcon from '../assets/technology.svg'

export default function Navbar({ activeCategory, setActiveCategory, showCategories = false }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const categories = [
    { id: 'all', name: 'Tüm Marketler', icon: AllIcon },
    { id: 'politics', name: 'Siyaset', icon: PoliticsIcon },
    { id: 'sports', name: 'Spor', icon: SportsIcon },
    { id: 'crypto', name: 'Kripto', icon: CryptoIcon },
    { id: 'economy', name: 'Ekonomi', icon: EconomyIcon },
    { id: 'entertainment', name: 'Eğlence', icon: EntertainmentIcon },
    { id: 'technology', name: 'Teknoloji', icon: TechnologyIcon }
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/')
    }
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
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all hover:brightness-110"
              style={{
                backgroundColor: isActive('/leaderboard') ? '#555555' : 'transparent',
                color: '#ffffff'
              }}
            >
              <Trophy className="w-4 h-4" style={{ color: '#FFD700' }} />
              Liderlik
            </Link>
          </div>

          {/* Spacer to push search to the right */}
          <div className="flex-1"></div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex max-w-md mr-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#ffffff', opacity: 0.5 }} />
              <input
                type="text"
                placeholder="Market ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-all focus:outline-none"
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  border: '1px solid #555555'
                }}
              />
            </div>
          </form>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:brightness-110"
                    style={{ backgroundColor: '#555555', border: '1px solid #555555' }}
                  >
                    <User className="w-4 h-4 flex-shrink-0" style={{ color: '#ffffff', opacity: 0.7 }} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-tight" style={{ color: '#ffffff' }}>{user.username}</span>
                      <span className="text-xs leading-tight" style={{ color: '#ffffff', opacity: 0.7 }}>
                        ₺{parseFloat(user.balance || 0).toFixed(2)}
                      </span>
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50"
                      style={{ backgroundColor: '#1a1a1a', border: '1px solid #555555' }}
                    >
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-4 py-3 transition-all hover:brightness-110"
                        style={{
                          backgroundColor: isActive('/profile') ? '#555555' : 'transparent',
                          color: '#ffffff',
                          borderBottom: '1px solid #555555'
                        }}
                      >
                        <User className="w-4 h-4" />
                        Profilim
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-4 py-3 transition-all hover:brightness-110"
                        style={{
                          backgroundColor: isActive('/messages') ? '#555555' : 'transparent',
                          color: '#ffffff',
                          borderBottom: '1px solid #555555'
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Mesajlar
                      </Link>
                      <Link
                        to="/wallet"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-4 py-3 transition-all hover:brightness-110"
                        style={{
                          backgroundColor: isActive('/wallet') ? '#555555' : 'transparent',
                          color: '#ffffff',
                          borderBottom: '1px solid #555555'
                        }}
                      >
                        <Wallet className="w-4 h-4" />
                        Cüzdan
                      </Link>
                      <Link
                        to="/portfolio"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-4 py-3 transition-all hover:brightness-110"
                        style={{
                          backgroundColor: isActive('/portfolio') ? '#555555' : 'transparent',
                          color: '#ffffff',
                          borderBottom: '1px solid #555555'
                        }}
                      >
                        <TrendingUp className="w-4 h-4" />
                        Portfolyo
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 transition-all hover:brightness-110"
                        style={{ backgroundColor: 'transparent', color: '#FF0000' }}
                      >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
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

        {/* Category Navigation */}
        {showCategories && (
          <div className="py-3" style={{ borderTop: '1px solid #555555' }}>
            {/* Categories - Horizontal Scroll (both mobile and desktop) */}
            <nav className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    backgroundColor: activeCategory === cat.id ? '#555555' : 'transparent',
                    color: '#ffffff',
                    border: activeCategory === cat.id ? '1px solid #ccff33' : '1px solid transparent'
                  }}
                >
                  <img src={cat.icon} alt="" className="w-4 h-4" />
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Mobile Menu Popup */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu Panel */}
            <div
              className="md:hidden fixed top-16 right-4 z-50 w-64 rounded-xl animate-fade-in-scale"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #333333', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            >
              <div className="py-2">
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
          </>
        )}
      </div>
    </nav>
  )
}
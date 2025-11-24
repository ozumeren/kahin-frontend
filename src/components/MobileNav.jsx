import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Home,
  Trophy,
  Wallet,
  User,
  MessageCircle
} from 'lucide-react'

export default function MobileNav() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const navItems = [
    { path: '/', icon: Home, label: 'Ana Sayfa' },
    { path: '/leaderboard', icon: Trophy, label: 'Liderlik', iconColor: '#FFD700' },
    { path: '/wallet', icon: Wallet, label: 'Cüzdan', auth: true },
    { path: '/messages', icon: MessageCircle, label: 'Mesajlar', auth: true },
    { path: '/profile', icon: User, label: 'Profil', auth: true },
  ]

  const filteredItems = navItems.filter(item => !item.auth || isAuthenticated)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="flex items-center justify-around px-1 pt-2 pb-2 safe-area-bottom">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300 active:scale-95"
              style={{
                minWidth: '64px',
                minHeight: '56px'
              }}
            >
              {/* Active background glow */}
              {active && (
                <div
                  className="absolute inset-0 rounded-2xl transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(204, 255, 51, 0.15) 0%, rgba(204, 255, 51, 0.05) 100%)',
                    boxShadow: '0 0 20px rgba(204, 255, 51, 0.15)'
                  }}
                />
              )}

              {/* Icon container */}
              <div className="relative flex items-center justify-center w-7 h-7 mb-1">
                <Icon
                  className="transition-all duration-300"
                  style={{
                    width: active ? '24px' : '22px',
                    height: active ? '24px' : '22px',
                    color: active ? '#ccff33' : (item.iconColor || '#666666'),
                    filter: active ? 'drop-shadow(0 0 8px rgba(204, 255, 51, 0.5))' : 'none'
                  }}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>

              {/* Label */}
              <span
                className="relative text-xs font-medium transition-all duration-300"
                style={{
                  color: active ? '#ccff33' : '#888888',
                  fontSize: active ? '11px' : '10px',
                  letterSpacing: active ? '0.3px' : '0'
                }}
              >
                {item.label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: '#ccff33',
                    boxShadow: '0 0 8px rgba(204, 255, 51, 0.8)'
                  }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

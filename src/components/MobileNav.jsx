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
    { path: '/leaderboard', icon: Trophy, label: 'Liderlik' },
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass" style={{ borderTop: '1px solid #333333' }}>
      <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: active ? 'rgba(204, 255, 51, 0.1)' : 'transparent',
                minWidth: '60px'
              }}
            >
              <div
                className="relative flex items-center justify-center w-6 h-6 mb-1"
              >
                <Icon
                  className="w-5 h-5 transition-all duration-200"
                  style={{
                    color: active ? '#ccff33' : '#888888',
                    transform: active ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
                {active && (
                  <div
                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                    style={{ backgroundColor: '#ccff33' }}
                  />
                )}
              </div>
              <span
                className="text-xs font-medium transition-all duration-200"
                style={{
                  color: active ? '#ccff33' : '#888888',
                  fontSize: '10px'
                }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

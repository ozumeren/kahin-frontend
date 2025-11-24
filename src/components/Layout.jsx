import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './Navbar'
import WebSocketNotifications from './WebSocketNotifications'
import MobileNav from './MobileNav'
import { CustomToaster } from './ui/Toast'

export default function Layout() {
  const location = useLocation()
  const [activeCategory, setActiveCategory] = useState('all')

  // Show categories on homepage only
  const showCategories = location.pathname === '/'

  const contextValue = {
    activeCategory,
    setActiveCategory
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#111111' }}>
      {/* Custom Toast Notifications */}
      <CustomToaster />

      {/* Navbar */}
      <Navbar
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        showCategories={showCategories}
      />

      {/* WebSocket Notifications */}
      <WebSocketNotifications />

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet context={contextValue} />
      </main>

      {/* Footer - Hidden on mobile when bottom nav is visible */}
      <footer className="hidden md:block py-8 mt-16" style={{ borderTop: '1px solid #555555', backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4 text-center text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>
          <p>© 2025 Kahinmarket. Tüm hakları saklıdır.</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  )
} 
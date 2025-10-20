import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './Navbar'
import WebSocketNotifications from './WebSocketNotifications'

export default function Layout() {
  const location = useLocation()
  const [activeCategory, setActiveCategory] = useState('all')
  
  // Show categories on all pages
  const showCategories = true

  const contextValue = {
    activeCategory,
    setActiveCategory
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#111111' }}>
      <Navbar 
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        showCategories={showCategories}
      />
      <WebSocketNotifications />
      <main className="flex-1">
        <Outlet context={contextValue} />
      </main>
      <footer className="py-8 mt-16" style={{ borderTop: '1px solid #555555', backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4 text-center text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>
          <p>© 2025 Kahin Market. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
} 
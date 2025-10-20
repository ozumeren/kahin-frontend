import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import WebSocketNotifications from './WebSocketNotifications'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#111111' }}>
      <Navbar />
      <WebSocketNotifications />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-8 mt-16" style={{ borderTop: '1px solid #555555', backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4 text-center text-sm" style={{ color: '#EEFFDD', opacity: 0.7 }}>
          <p>© 2025 Kahin Market. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
} 
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 Kahin Market. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
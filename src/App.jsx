// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MarketsPage from './pages/MarketsPage'
import MarketDetailPage from './pages/MarketDetailPage'
import PortfolioPage from './pages/PortfolioPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="markets" element={<MarketsPage />} />
        <Route path="markets/:id" element={<MarketDetailPage />} />
        <Route 
          path="portfolio" 
          element={
            <ProtectedRoute>
              <PortfolioPage />
            </ProtectedRoute>
          } 
        />
        {/* Admin route kaldırıldı - artık ayrı bir CMS */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
    </Routes>
  )
}

export default App
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../hooks/useMarketQueries'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  AlertCircle,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export default function PortfolioPage() {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('positions')
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'Tüm Marketler' },
    { id: 'politics', name: 'Siyaset' },
    { id: 'sports', name: 'Spor' },
    { id: 'crypto', name: 'Kripto' },
    { id: 'economy', name: 'Ekonomi' },
    { id: 'entertainment', name: 'Eğlence' },
    { id: 'technology', name: 'Teknoloji' }
  ]

  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(isAuthenticated)

  const { data: ordersData } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const response = await apiClient.get('/orders/my')
      return response.data.data
    },
    enabled: isAuthenticated,
  })

  const { data: tradesData } = useQuery({
    queryKey: ['myTrades'],
    queryFn: async () => {
      const response = await apiClient.get('/trades/my/all')
      return response.data.data
    },
    enabled: isAuthenticated,
  })

  const orders = ordersData?.orders || []
  const tradeHistory = tradesData?.trades || []

  const tabs = [
    { id: 'positions', label: 'Pozisyonlar', icon: Target, count: portfolio?.positions?.length || 0 },
    { id: 'orders', label: 'Emirler', icon: Activity, count: orders.filter(o => o.status === 'pending').length },
    { id: 'history', label: 'İşlem Geçmişi', icon: Clock, count: tradeHistory.length },
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-16" style={{ backgroundColor: '#1D1D1F' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto rounded-2xl shadow-md p-8 text-center" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
              <AlertCircle className="w-8 h-8" style={{ color: '#ccff33' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#EEFFDD' }}>Giriş Yapın</h2>
            <p className="mb-6" style={{ color: '#EEFFDD', opacity: 0.7 }}>
              Portfolyonuzu görüntülemek için giriş yapmanız gerekiyor
            </p>
            <Link to="/login" className="inline-block px-6 py-3 rounded-lg font-medium transition-all hover:brightness-110" style={{ backgroundColor: '#555555', color: '#EEFFDD' }}>
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (portfolioLoading) {
    return (
      <div className="min-h-screen py-8" style={{ backgroundColor: '#1D1D1F' }}>
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-48 rounded-2xl" style={{ backgroundColor: '#555555' }}></div>
            <div className="h-96 rounded-2xl" style={{ backgroundColor: '#555555' }}></div>
          </div>
        </div>
      </div>
    )
  }

  const summary = portfolio?.summary || {}
  const positions = portfolio?.positions || []

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1F' }}>
      {/* Category Navigation */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#1D1D1F', borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4">
          <nav className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: activeCategory === cat.id ? '#555555' : 'transparent',
                  color: '#EEFFDD',
                  border: activeCategory === cat.id ? '1px solid #ccff33' : '1px solid transparent'
                }}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Header Section */}
      <div style={{ borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8" style={{ color: '#EEFFDD' }}>Portfolyo</h1>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-6" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#EEFFDD', opacity: 0.7 }}>Toplam Değer</span>
                <DollarSign className="w-5 h-5" style={{ color: '#ccff33' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: '#EEFFDD' }}>
                ₺{parseFloat(summary.totalValue || 0).toFixed(2)}
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#EEFFDD', opacity: 0.7 }}>Kâr/Zarar</span>
                <TrendingUp className="w-5 h-5" style={{ color: summary.totalPnL >= 0 ? '#ccff33' : '#ef4444' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: summary.totalPnL >= 0 ? '#ccff33' : '#ef4444' }}>
                {summary.totalPnL >= 0 ? '+' : ''}₺{parseFloat(summary.totalPnL || 0).toFixed(2)}
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#EEFFDD', opacity: 0.7 }}>Aktif Pozisyon</span>
                <Target className="w-5 h-5" style={{ color: '#3b82f6' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: '#EEFFDD' }}>
                {positions.length}
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#EEFFDD', opacity: 0.7 }}>Bekleyen Emir</span>
                <Activity className="w-5 h-5" style={{ color: '#a855f7' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: '#EEFFDD' }}>
                {orders.filter(o => o.status === 'pending').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4">
          <nav className="flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 py-4 font-medium transition-all"
                  style={{
                    borderBottom: activeTab === tab.id ? '2px solid #ccff33' : '2px solid transparent',
                    color: activeTab === tab.id ? '#ccff33' : '#EEFFDD',
                    opacity: activeTab === tab.id ? 1 : 0.7
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: '#555555', color: '#EEFFDD' }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'positions' && <PositionsPanel positions={positions} />}
        {activeTab === 'orders' && <OrdersPanel orders={orders} />}
        {activeTab === 'history' && <TradeHistoryPanel trades={tradeHistory} />}
      </div>
    </div>
  )
}

// Positions Panel
function PositionsPanel({ positions }) {
  if (!positions || positions.length === 0) {
    return (
      <div className="rounded-2xl shadow-md p-12 text-center" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#555555' }}>
          <Target className="w-10 h-10" style={{ color: '#EEFFDD', opacity: 0.5 }} />
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: '#EEFFDD' }}>Henüz pozisyon yok</h3>
        <p className="mb-6" style={{ color: '#EEFFDD', opacity: 0.7 }}>Pazarlara göz atın ve ilk pozisyonunuzu açın</p>
        <Link 
          to="/markets" 
          className="inline-block px-6 py-3 rounded-lg font-medium transition-all hover:brightness-110"
          style={{ backgroundColor: '#555555', color: '#EEFFDD' }}
        >
          Pazarları Keşfet
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {positions.map((position, index) => (
        <Link
          key={index}
          to={`/markets/${position.marketId}`}
          className="block rounded-xl shadow-md hover:shadow-lg transition-all p-6 group"
          style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 group-hover:text-brand-500 transition-colors" style={{ color: '#EEFFDD' }}>
                {position.marketTitle}
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: position.marketStatus === 'open' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: position.marketStatus === 'open' ? '#ccff33' : '#3b82f6'
                  }}
                >
                  {position.marketStatus === 'open' ? 'Açık' : 'Kapandı'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: position.outcome === 'YES' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: position.outcome === 'YES' ? '#ccff33' : '#ef4444'
                  }}
                >
                  {position.outcome}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ color: position.pnl >= 0 ? '#ccff33' : '#ef4444' }}>
              {position.pnl >= 0 ? '+' : ''}₺{parseFloat(position.pnl || 0).toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid #555555' }}>
            <div>
              <div className="text-sm mb-1" style={{ color: '#EEFFDD', opacity: 0.7 }}>Hisse</div>
              <div className="font-semibold" style={{ color: '#EEFFDD' }}>{position.quantity}</div>
            </div>
            <div>
              <div className="text-sm mb-1" style={{ color: '#EEFFDD', opacity: 0.7 }}>Ort. Fiyat</div>
              <div className="font-semibold" style={{ color: '#EEFFDD' }}>₺{parseFloat(position.avgPrice || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm mb-1" style={{ color: '#EEFFDD', opacity: 0.7 }}>Toplam</div>
              <div className="font-semibold" style={{ color: '#EEFFDD' }}>₺{parseFloat(position.totalValue || 0).toFixed(2)}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// Orders Panel
function OrdersPanel({ orders }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl shadow-md p-12 text-center" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#555555' }}>
          <Activity className="w-10 h-10" style={{ color: '#EEFFDD', opacity: 0.5 }} />
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: '#EEFFDD' }}>Henüz emir yok</h3>
        <p style={{ color: '#EEFFDD', opacity: 0.7 }}>Bir market seçip emir oluşturabilirsiniz</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-xl shadow-md p-6" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold mb-2" style={{ color: '#EEFFDD' }}>{order.marketTitle}</h4>
              <div className="flex items-center gap-3 text-sm">
                <span className="px-3 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: order.type === 'BUY' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: order.type === 'BUY' ? '#ccff33' : '#ef4444'
                  }}
                >
                  {order.type === 'BUY' ? 'AL' : 'SAT'}
                </span>
                <span className="px-3 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: order.outcome === 'YES' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: order.outcome === 'YES' ? '#ccff33' : '#ef4444'
                  }}
                >
                  {order.outcome}
                </span>
                <span style={{ color: '#EEFFDD', opacity: 0.7 }}>{order.quantity} Hisse</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm mb-1" style={{ color: '#EEFFDD', opacity: 0.7 }}>Fiyat</div>
              <div className="text-xl font-bold" style={{ color: '#EEFFDD' }}>₺{parseFloat(order.price).toFixed(2)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Trade History Panel
function TradeHistoryPanel({ trades }) {
  if (trades.length === 0) {
    return (
      <div className="rounded-2xl shadow-md p-12 text-center" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#555555' }}>
          <Clock className="w-10 h-10" style={{ color: '#EEFFDD', opacity: 0.5 }} />
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: '#EEFFDD' }}>Henüz işlem yok</h3>
        <p style={{ color: '#EEFFDD', opacity: 0.7 }}>İşlemleriniz burada görünecek</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {trades.map((trade) => (
        <div key={trade.id} className="rounded-xl shadow-md p-6" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold mb-2" style={{ color: '#EEFFDD' }}>{trade.marketTitle}</h4>
              <div className="flex items-center gap-3 text-sm">
                <span className="px-3 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: trade.buyerSide === 'YES' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: trade.buyerSide === 'YES' ? '#ccff33' : '#ef4444'
                  }}
                >
                  {trade.buyerSide}
                </span>
                <span style={{ color: '#EEFFDD', opacity: 0.7 }}>{trade.quantity} Hisse</span>
                <span className="text-xs" style={{ color: '#EEFFDD', opacity: 0.5 }}>
                  {new Date(trade.createdAt).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm mb-1" style={{ color: '#EEFFDD', opacity: 0.7 }}>Fiyat</div>
              <div className="text-xl font-bold" style={{ color: '#EEFFDD' }}>
                ₺{parseFloat(trade.price).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
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
    { 
      id: 'positions', 
      label: 'Pozisyonlar', 
      icon: Target,
      count: portfolio?.positions?.length || 0 
    },
    { 
      id: 'orders', 
      label: 'Emirler', 
      icon: Activity,
      count: orders.filter(o => o.status === 'pending').length 
    },
    { 
      id: 'history', 
      label: 'İşlem Geçmişi', 
      icon: Clock,
      count: tradeHistory.length 
    },
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-brand-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Giriş Yapın</h2>
            <p className="text-gray-600 mb-6">
              Portfolyonuzu görüntülemek için giriş yapmanız gerekiyor
            </p>
            <Link to="/login" className="inline-block px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors">
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (portfolioLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-white rounded-2xl"></div>
            <div className="h-96 bg-white rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  const summary = portfolio?.summary || {}
  const positions = portfolio?.positions || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Portfolyo</h1>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-brand-50 to-white rounded-xl p-6 border border-brand-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Toplam Değer</span>
                <DollarSign className="w-5 h-5 text-brand-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ₺{parseFloat(summary.totalValue || 0).toFixed(2)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Kâr/Zarar</span>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className={`text-3xl font-bold ${
                summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {summary.totalPnL >= 0 ? '+' : ''}₺{parseFloat(summary.totalPnL || 0).toFixed(2)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Aktif Pozisyon</span>
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {positions.length}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Bekleyen Emir</span>
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'pending').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <nav className="flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 font-medium transition-all ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
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
      <div className="bg-white rounded-2xl shadow-md p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Henüz pozisyon yok</h3>
        <p className="text-gray-600 mb-6">Pazarlara göz atın ve ilk pozisyonunuzu açın</p>
        <Link 
          to="/markets" 
          className="inline-block px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors"
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
          className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 group-hover:text-brand-600 transition-colors">
                {position.marketTitle}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  position.marketStatus === 'open' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {position.marketStatus === 'open' ? 'Açık' : 'Kapandı'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  position.outcome === 'YES' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {position.outcome}
                </span>
              </div>
            </div>
            <div className={`text-2xl font-bold ${
              position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {position.pnl >= 0 ? '+' : ''}₺{parseFloat(position.pnl || 0).toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-sm text-gray-600 mb-1">Hisse</div>
              <div className="font-semibold">{position.quantity}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Ort. Fiyat</div>
              <div className="font-semibold">₺{parseFloat(position.avgPrice || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Toplam</div>
              <div className="font-semibold">₺{parseFloat(position.totalValue || 0).toFixed(2)}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// Orders Panel
function OrdersPanel({ orders }) {
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const completedOrders = orders.filter(o => o.status !== 'pending')

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Henüz emir yok</h3>
        <p className="text-gray-600">Bir market seçip emir oluşturabilirsiniz</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bekleyen Emirler */}
      {pendingOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Bekleyen Emirler</h3>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">{order.marketTitle}</h4>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-3 py-1 rounded-full font-medium ${
                        order.type === 'BUY' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {order.type === 'BUY' ? 'AL' : 'SAT'}
                      </span>
                      <span className={`px-3 py-1 rounded-full font-medium ${
                        order.outcome === 'YES' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {order.outcome}
                      </span>
                      <span className="text-gray-600">{order.quantity} Hisse</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Fiyat</div>
                    <div className="text-xl font-bold">₺{parseFloat(order.price).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tamamlanan/İptal Edilen Emirler */}
      {completedOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Geçmiş Emirler</h3>
          <div className="space-y-3">
            {completedOrders.slice(0, 10).map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">{order.marketTitle}</h4>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-3 py-1 rounded-full font-medium ${
                        order.type === 'BUY' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {order.type === 'BUY' ? 'AL' : 'SAT'}
                      </span>
                      <span className={`px-3 py-1 rounded-full font-medium ${
                        order.outcome === 'YES' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {order.outcome}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'filled' 
                          ? 'bg-green-100 text-green-700' 
                          : order.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {order.status === 'filled' && <CheckCircle className="w-3 h-3" />}
                        {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                        {order.status === 'filled' ? 'Tamamlandı' : 
                         order.status === 'cancelled' ? 'İptal' : 
                         order.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Fiyat</div>
                    <div className="text-xl font-bold">₺{parseFloat(order.price).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Trade History Panel
function TradeHistoryPanel({ trades }) {
  if (trades.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Henüz işlem yok</h3>
        <p className="text-gray-600">İşlemleriniz burada görünecek</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {trades.map((trade) => (
        <div key={trade.id} className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold mb-2">{trade.marketTitle}</h4>
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${
                  trade.buyerSide === 'YES' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {trade.buyerSide}
                </span>
                <span className="text-gray-600">{trade.quantity} Hisse</span>
                <span className="text-gray-400 text-xs">
                  {new Date(trade.createdAt).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Fiyat</div>
              <div className="text-xl font-bold text-gray-900">
                ₺{parseFloat(trade.price).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
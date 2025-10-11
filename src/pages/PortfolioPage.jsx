import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Wallet, TrendingUp, TrendingDown, Target, 
  Clock, ChevronRight, AlertCircle, PieChart 
} from 'lucide-react'
import apiClient from '../api/client'
import { useCancelOrder } from '../hooks/useMarketQueries'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function PortfolioPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('positions') // positions, orders, history

  // Fetch portfolio
  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await apiClient.get('/portfolio')
      return response.data.data
    },
    enabled: isAuthenticated
  })

  // Fetch user orders
  const { data: orders } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const response = await apiClient.get('/orders')
      return response.data.data
    },
    enabled: isAuthenticated
  })

  // Fetch trade history
  const { data: tradeHistory } = useQuery({
    queryKey: ['myTrades'],
    queryFn: async () => {
      const response = await apiClient.get('/trades/my/all?limit=50')
      return response.data.trades
    },
    enabled: isAuthenticated
  })

  // ✅ Authentication yükleniyor
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  // ✅ Kullanıcı giriş yapmamış
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Giriş Yapın</h2>
          <p className="text-gray-600 mb-6">
            Portfolyonuzu görüntülemek için giriş yapmanız gerekiyor
          </p>
          <Link to="/login" className="btn btn-primary">
            Giriş Yap
          </Link>
        </div>
      </div>
    )
  }

  // ✅ Portfolio yükleniyor
  if (portfolioLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  const summary = portfolio?.summary || {}
  const positions = portfolio?.positions || []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Portfolyo</h1>
        <p className="text-gray-600">Pozisyonlarınız ve performansınız</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Current Balance */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-100 rounded-lg">
              <Wallet className="w-5 h-5 text-brand-600" />
            </div>
            <span className="text-sm text-gray-600">Mevcut Bakiye</span>
          </div>
          <p className="text-3xl font-bold">
            ₺{parseFloat(summary.currentBalance || 0).toFixed(2)}
          </p>
        </div>

        {/* Total Invested */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Yatırım</span>
          </div>
          <p className="text-3xl font-bold">
            ₺{parseFloat(summary.totalInvested || 0).toFixed(2)}
          </p>
        </div>

        {/* Unrealized P&L */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${
              parseFloat(summary.totalUnrealizedPnL || 0) >= 0 
                ? 'bg-yes-light' 
                : 'bg-no-light'
            }`}>
              {parseFloat(summary.totalUnrealizedPnL || 0) >= 0 
                ? <TrendingUp className="w-5 h-5 text-yes" />
                : <TrendingDown className="w-5 h-5 text-no" />
              }
            </div>
            <span className="text-sm text-gray-600">Gerçekleşmemiş K/Z</span>
          </div>
          <p className={`text-3xl font-bold ${
            parseFloat(summary.totalUnrealizedPnL || 0) >= 0 
              ? 'text-yes' 
              : 'text-no'
          }`}>
            {parseFloat(summary.totalUnrealizedPnL || 0) >= 0 ? '+' : ''}
            ₺{parseFloat(summary.totalUnrealizedPnL || 0).toFixed(2)}
          </p>
        </div>

        {/* Total P&L */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${
              parseFloat(summary.totalPnL || 0) >= 0 
                ? 'bg-yes-light' 
                : 'bg-no-light'
            }`}>
              <PieChart className={`w-5 h-5 ${
                parseFloat(summary.totalPnL || 0) >= 0 
                  ? 'text-yes' 
                  : 'text-no'
              }`} />
            </div>
            <span className="text-sm text-gray-600">Toplam K/Z</span>
          </div>
          <p className={`text-3xl font-bold ${
            parseFloat(summary.totalPnL || 0) >= 0 
              ? 'text-yes' 
              : 'text-no'
          }`}>
            {parseFloat(summary.totalPnL || 0) >= 0 ? '+' : ''}
            ₺{parseFloat(summary.totalPnL || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'positions', label: 'Pozisyonlar', count: positions.length },
              { id: 'orders', label: 'Açık Emirler', count: orders?.filter(o => o.status === 'OPEN').length || 0 },
              { id: 'history', label: 'İşlem Geçmişi', count: tradeHistory?.length || 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
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
      <div className="card text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Henüz pozisyon yok</h3>
        <p className="text-gray-600 mb-6">Pazarlara göz atın ve ilk pozisyonunuzu açın</p>
        <Link to="/markets" className="btn btn-primary">
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
          className="card hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 group-hover:text-brand-600 transition-colors">
                {position.marketTitle}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`badge ${
                  position.marketStatus === 'open' ? 'badge-success' : 'badge-info'
                }`}>
                  {position.marketStatus === 'open' ? 'Açık' : 'Kapandı'}
                </span>
                <span className={`font-medium ${
                  position.outcome === 'YES' ? 'text-yes' : 'text-no'
                }`}>
                  {position.outcome}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-600 mb-1">Miktar</p>
              <p className="font-semibold">{position.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Yatırım</p>
              <p className="font-semibold">₺{parseFloat(position.invested).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Mevcut Değer</p>
              <p className="font-semibold">₺{parseFloat(position.currentValue).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">K/Z</p>
              <p className={`font-semibold ${
                parseFloat(position.unrealizedPnL) >= 0 ? 'text-yes' : 'text-no'
              }`}>
                {parseFloat(position.unrealizedPnL) >= 0 ? '+' : ''}
                ₺{parseFloat(position.unrealizedPnL).toFixed(2)}
                <span className="text-xs ml-1">
                  ({position.pnlPercentage})
                </span>
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// Orders Panel
function OrdersPanel({ orders }) {
  const cancelOrderMutation = useCancelOrder();
  const openOrders = orders?.filter(order => order.status === 'OPEN') || [];

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Bu emri iptal etmek istediğinizden emin misiniz?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  if (openOrders.length === 0) {
    return (
      <div className="card text-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Açık emir yok</h3>
        <p className="text-gray-600">Tüm emirleriniz eşleşmiş veya iptal edilmiş</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {openOrders.map((order) => (
        <div key={order.id} className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Link 
                to={`/markets/${order.Market.id}`}
                className="text-lg font-semibold hover:text-brand-600 transition-colors"
              >
                {order.Market.title}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${
                  order.type === 'BUY' ? 'badge-success' : 'badge-error'
                }`}>
                  {order.type === 'BUY' ? 'ALIŞ' : 'SATIŞ'}
                </span>
                <span className={`text-sm font-medium ${
                  order.outcome ? 'text-yes' : 'text-no'
                }`}>
                  {order.outcome ? 'EVET' : 'HAYIR'}
                </span>
              </div>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => handleCancelOrder(order.id)}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? 'İptal ediliyor...' : 'İptal Et'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-600 mb-1">Miktar</p>
              <p className="font-semibold">{order.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Fiyat</p>
              <p className="font-semibold">₺{order.price}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Toplam</p>
              <p className="font-semibold">
                ₺{(order.quantity * parseFloat(order.price)).toFixed(2)}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            {format(new Date(order.createdAt), "dd MMM yyyy 'saat' HH:mm", { locale: tr })}
          </p>
        </div>
      ))}
    </div>
  )
}

// Trade History Panel
function TradeHistoryPanel({ trades }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600">Henüz işlem geçmişiniz yok</p>
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold">Tarih</th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Pazar</th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Tip</th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Taraf</th>
            <th className="text-right py-3 px-4 text-sm font-semibold">Miktar</th>
            <th className="text-right py-3 px-4 text-sm font-semibold">Fiyat</th>
            <th className="text-right py-3 px-4 text-sm font-semibold">Toplam</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 text-sm text-gray-600">
                {format(new Date(trade.createdAt), 'dd MMM HH:mm', { locale: tr })}
              </td>
              <td className="py-3 px-4 text-sm">
                <Link 
                  to={`/markets/${trade.Market.id}`}
                  className="hover:text-brand-600 transition-colors"
                >
                  {trade.Market.title.substring(0, 30)}...
                </Link>
              </td>
              <td className="py-3 px-4">
                <span className={`badge ${
                  trade.myAction === 'BUY' ? 'badge-success' : 'badge-error'
                }`}>
                  {trade.myAction}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`text-sm font-medium ${
                  trade.outcome ? 'text-yes' : 'text-no'
                }`}>
                  {trade.outcome ? 'EVET' : 'HAYIR'}
                </span>
              </td>
              <td className="py-3 px-4 text-right text-sm">{trade.quantity}</td>
              <td className="py-3 px-4 text-right text-sm font-mono">₺{trade.price}</td>
              <td className="py-3 px-4 text-right text-sm font-medium">₺{trade.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock } from 'lucide-react'
import apiClient from '../api/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast' 



export default function MarketDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('trade')

  // Fetch market
  const { data: market, isLoading: marketLoading } = useQuery({
    queryKey: ['market', id],
    queryFn: async () => {
      const response = await apiClient.get(`/markets/${id}`)
      return response.data.data
    }
  })

  // Fetch order book
  const { data: orderBook, isLoading: orderBookLoading } = useQuery({
    queryKey: ['orderbook', id],
    queryFn: async () => {
      const response = await apiClient.get(`/markets/${id}/orderbook`)
      return response.data.data
    },
    refetchInterval: 5000,
  })

  // Fetch recent trades
  const { data: recentTrades } = useQuery({
    queryKey: ['trades', id],
    queryFn: async () => {
      const response = await apiClient.get(`/trades/market/${id}?limit=20`)
      return response.data.trades
    },
    refetchInterval: 5000,
  })

  if (marketLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Pazar bulunamadı</h2>
          <Link to="/markets" className="text-brand-600 hover:underline">
            Pazarlara geri dön
          </Link>
        </div>
      </div>
    )
  }

  const yesProb = orderBook?.yes?.midPrice 
    ? (parseFloat(orderBook.yes.midPrice) * 100).toFixed(0)
    : 50
  const noProb = 100 - yesProb

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link to="/markets" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Pazarlara Geri Dön</span>
      </Link>

      {/* Market Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{market.title}</h1>
            <p className="text-gray-600">{market.description}</p>
          </div>
          <span className={`badge ${
            market.status === 'open' ? 'badge-success' : 
            market.status === 'closed' ? 'badge-info' : 'badge-error'
          }`}>
            {market.status === 'open' ? 'Açık' : market.status === 'closed' ? 'Kapandı' : 'Sonuçlandı'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Kapanış Tarihi</p>
            <p className="font-semibold">
              {format(new Date(market.closing_date), 'dd MMM yyyy', { locale: tr })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">İşlem Hacmi</p>
            <p className="font-semibold">₺2,450</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Katılımcılar</p>
            <p className="font-semibold">127</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Toplam İşlem</p>
            <p className="font-semibold">453</p>
          </div>
        </div>
      </div>

      {/* Probability Display */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="card bg-yes-light border-yes">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-yes-dark">EVET</h3>
            <span className="text-3xl font-bold text-yes-dark">{yesProb}%</span>
          </div>
          <div className="h-3 bg-yes-dark/20 rounded-full overflow-hidden">
            <div className="h-full bg-yes-dark transition-all" style={{ width: `${yesProb}%` }}></div>
          </div>
        </div>

        <div className="card bg-no-light border-no">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-no-dark">HAYIR</h3>
            <span className="text-3xl font-bold text-no-dark">{noProb}%</span>
          </div>
          <div className="h-3 bg-no-dark/20 rounded-full overflow-hidden">
            <div className="h-full bg-no-dark transition-all" style={{ width: `${noProb}%` }}></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'trade', label: 'İşlem Yap' },
              { id: 'orderbook', label: 'Order Book' },
              { id: 'trades', label: 'Son İşlemler' }
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
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'trade' && <TradingPanel marketId={id} market={market} />}
        {activeTab === 'orderbook' && <OrderBookPanel orderBook={orderBook} loading={orderBookLoading} />}
        {activeTab === 'trades' && <TradesPanel trades={recentTrades} />}
      </div>
    </div>
  )
}

// Trading, OrderBook, Trades panels aynı kalacak...
// (Artifact'taki önceki koddan kopyalayın)

// Trading Panel Component
function TradingPanel({ marketId, market }) {
  const [side, setSide] = useState('yes') // yes or no
  const [type, setType] = useState('BUY') // BUY or SELL
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { refreshUser } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.post('/orders', {
        marketId,
        type,
        outcome: side === 'yes',
        quantity: parseInt(quantity),
        price: parseFloat(price)
      })
      
      toast.success('Emir başarıyla oluşturuldu! ✅')
      
      // ✅ YENİ: Bakiyeyi yenile
      await refreshUser()
      
      setQuantity('')
      setPrice('')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Bir hata oluştu'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (market.status !== 'open') {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600">Bu pazar artık işlem için açık değil.</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* BUY Panel */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Satın Al</h3>
        
        {/* Outcome Selection */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setSide('yes')}
            className={`py-3 rounded-lg font-medium transition-colors ${
              side === 'yes'
                ? 'bg-yes text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            EVET
          </button>
          <button
            onClick={() => setSide('no')}
            className={`py-3 rounded-lg font-medium transition-colors ${
              side === 'no'
                ? 'bg-no text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            HAYIR
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Miktar (Adet)</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
              placeholder="10"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fiyat (₺)</label>
            <input
              type="number"
              min="0.01"
              max="0.99"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input"
              placeholder="0.75"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Hisse başına fiyat (0.01 - 0.99)</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Toplam Tutar:</span>
              <span className="font-semibold">
                ₺{quantity && price ? (quantity * price).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !quantity || !price}
            className="btn btn-yes w-full"
          >
            {loading ? 'İşleniyor...' : 'Satın Al'}
          </button>
        </form>
      </div>

      {/* SELL Panel */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Sat</h3>
        <p className="text-gray-600 text-sm mb-4">
          Satış yapmak için önce hisseniz olmalı. Giriş yapın ve portfolyonuzu kontrol edin.
        </p>
        <Link to="/login" className="btn btn-secondary w-full">
          Giriş Yap
        </Link>
      </div>
    </div>
  )
}

// Order Book Panel Component
function OrderBookPanel({ orderBook, loading }) {
  if (loading) {
    return <div className="card animate-pulse h-96"></div>
  }

  if (!orderBook) {
    return <div className="card">Order book yükleniyor...</div>
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* YES Order Book */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4 text-yes">EVET Order Book</h3>
        <OrderBookTable bids={orderBook.yes.bids} asks={orderBook.yes.asks} type="yes" />
      </div>

      {/* NO Order Book */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4 text-no">HAYIR Order Book</h3>
        <OrderBookTable bids={orderBook.no.bids} asks={orderBook.no.asks} type="no" />
      </div>
    </div>
  )
}

function OrderBookTable({ bids, asks, type }) {
  return (
    <div className="space-y-6">
      {/* Asks (Satış) */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Satış Emirleri</h4>
        {asks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Satış emri yok</p>
        ) : (
          <div className="space-y-1">
            {asks.slice(0, 5).map((ask, i) => (
              <div key={i} className="flex justify-between text-sm py-1 px-2 hover:bg-gray-50 rounded">
                <span className="font-mono text-no">{ask.price}</span>
                <span className="text-gray-600">{ask.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spread */}
      {bids.length > 0 && asks.length > 0 && (
        <div className="text-center py-2 bg-gray-50 rounded">
          <span className="text-xs text-gray-600">
            Spread: {(parseFloat(asks[0].price) - parseFloat(bids[0].price)).toFixed(3)}
          </span>
        </div>
      )}

      {/* Bids (Alış) */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Alış Emirleri</h4>
        {bids.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Alış emri yok</p>
        ) : (
          <div className="space-y-1">
            {bids.slice(0, 5).map((bid, i) => (
              <div key={i} className="flex justify-between text-sm py-1 px-2 hover:bg-gray-50 rounded">
                <span className="font-mono text-yes">{bid.price}</span>
                <span className="text-gray-600">{bid.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Recent Trades Panel Component
function TradesPanel({ trades }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600">Henüz işlem yapılmamış</p>
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold">Zaman</th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Taraf</th>
            <th className="text-right py-3 px-4 text-sm font-semibold">Fiyat</th>
            <th className="text-right py-3 px-4 text-sm font-semibold">Miktar</th>
            <th className="text-right py-3 px-4 text-sm font-semibold">Toplam</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 text-sm text-gray-600">
                {format(new Date(trade.createdAt), 'HH:mm:ss')}
              </td>
              <td className="py-3 px-4">
                <span className={`text-sm font-medium ${trade.outcome ? 'text-yes' : 'text-no'}`}>
                  {trade.outcome ? 'EVET' : 'HAYIR'}
                </span>
              </td>
              <td className="py-3 px-4 text-right text-sm font-mono">{trade.price}</td>
              <td className="py-3 px-4 text-right text-sm">{trade.quantity}</td>
              <td className="py-3 px-4 text-right text-sm font-medium">₺{trade.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
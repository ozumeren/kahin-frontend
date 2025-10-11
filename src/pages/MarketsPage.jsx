import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Filter, Clock, Users } from 'lucide-react'
import { useEffect } from 'react'
import apiClient from '../api/client'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useWebSocket } from '../hooks/useWebSocket'

export default function MarketsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const ws = useWebSocket()

  // Fetch markets
  const { data, isLoading, error } = useQuery({
    queryKey: ['markets', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const response = await apiClient.get(`/markets${params}`)
      return response.data.data
    }
  })

  useEffect(() => {
    if (data && data.length > 0) {
      data.forEach(market => {
        ws.subscribeToMarket(market.id)
      })

      return () => {
        data.forEach(market => {
          ws.unsubscribeFromMarket(market.id)
        })
      }
    }
  }, [data])

  // Filter markets by search
  const filteredMarkets = data?.filter(market =>
    market.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pazarlar</h1>
        <p className="text-gray-600">Aktif tahmin pazarlarını keşfet ve görüşünü paylaş</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pazar ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Tümü' },
            { value: 'open', label: 'Açık' },
            { value: 'closed', label: 'Kapandı' },
            { value: 'resolved', label: 'Sonuçlandı' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-800">
            Pazarlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredMarkets.length === 0 && (
        <div className="card text-center py-12">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Pazar bulunamadı</h3>
          <p className="text-gray-600">Arama kriterlerinize uygun pazar bulunamadı.</p>
        </div>
      )}

      {/* Markets Grid */}
      {!isLoading && !error && filteredMarkets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  )
}

function MarketCard({ market }) {
  // Calculate probability (placeholder - will be real data from order book later)
  const yesProb = 50 // TODO: Get from order book
  const noProb = 50

  const getStatusBadge = (status) => {
    const badges = {
      open: 'badge-success',
      closed: 'badge-info',
      resolved: 'badge-error'
    }
    const labels = {
      open: 'Açık',
      closed: 'Kapandı',
      resolved: 'Sonuçlandı'
    }
    return (
      <span className={`badge ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <Link to={`/markets/${market.id}`} className="card hover:shadow-lg transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold group-hover:text-brand-600 transition-colors flex-1">
          {market.title}
        </h3>
        {getStatusBadge(market.status)}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {market.description || 'Açıklama yok'}
      </p>

      {/* Probability Bars */}
      <div className="space-y-3 mb-4">
        {/* YES */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-yes">EVET</span>
            <span className="text-sm font-bold text-yes">{yesProb}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-yes transition-all"
              style={{ width: `${yesProb}%` }}
            ></div>
          </div>
        </div>

        {/* NO */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-no">HAYIR</span>
            <span className="text-sm font-bold text-no">{noProb}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-no transition-all"
              style={{ width: `${noProb}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>
            {formatDistanceToNow(new Date(market.closing_date), {
              addSuffix: true,
              locale: tr
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>125</span> {/* TODO: Get real trader count */}
        </div>
      </div>
    </Link>
  )
}
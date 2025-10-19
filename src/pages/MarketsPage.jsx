import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Users,
  Filter,
  ChevronRight,
  Loader
} from 'lucide-react'

export default function MarketsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeCategory, setActiveCategory] = useState('all')

  const { data: marketsData, isLoading, error } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const response = await apiClient.get('/markets')
      return response.data.data
    },
    staleTime: 30000,
  })

  const categories = [
    { id: 'all', name: 'Tüm Marketler' },
    { id: 'politics', name: 'Siyaset' },
    { id: 'sports', name: 'Spor' },
    { id: 'crypto', name: 'Kripto' },
    { id: 'economy', name: 'Ekonomi' },
    { id: 'entertainment', name: 'Eğlence' },
    { id: 'technology', name: 'Teknoloji' }
  ]

  const filters = [
    { id: 'all', label: 'Tümü' },
    { id: 'open', label: 'Açık' },
    { id: 'closed', label: 'Kapandı' },
    { id: 'resolved', label: 'Sonuçlandı' },
  ]

  const markets = marketsData?.markets || []

  console.log('Markets Page - Total markets:', markets.length)
  console.log('Markets Page - First market:', markets[0])
  console.log('Markets Page - Active category:', activeCategory)
  console.log('Markets Page - Active filter:', activeFilter)

  const filteredMarkets = markets.filter((market) => {
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'all' || market.status === activeFilter
    const matchesCategory = activeCategory === 'all' || market.category === activeCategory
    return matchesSearch && matchesFilter && matchesCategory
  })
  
  console.log('Markets Page - Filtered markets:', filteredMarkets.length)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1F' }}>
      {/* Categories - Navbar'ın tam altında */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#1D1D1F', borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4">
          <nav className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((cat) => (
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

      {/* Header */}
      <div style={{ borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-6" style={{ color: '#EEFFDD' }}>Tüm Pazarlar</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#EEFFDD', opacity: 0.5 }} />
            <input
              type="text"
              placeholder="Market ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-12"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5" style={{ color: '#EEFFDD', opacity: 0.7 }} />
            <div className="flex gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className="px-4 py-2 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: activeFilter === filter.id ? '#555555' : 'transparent',
                    color: '#EEFFDD',
                    border: `1px solid ${activeFilter === filter.id ? '#555555' : '#555555'}`
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm" style={{ color: '#EEFFDD', opacity: 0.7 }}>
              {filteredMarkets.length} market bulundu
            </div>
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
                <div className="h-6 rounded w-3/4 mb-4" style={{ backgroundColor: '#555555' }}></div>
                <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: '#555555' }}></div>
                <div className="h-4 rounded w-2/3 mb-4" style={{ backgroundColor: '#555555' }}></div>
                <div className="h-24 rounded" style={{ backgroundColor: '#555555' }}></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p className="font-medium mb-2" style={{ color: '#ef4444' }}>
              Pazarlar yüklenirken bir hata oluştu
            </p>
            <p className="text-sm" style={{ color: '#ef4444', opacity: 0.8 }}>
              Lütfen daha sonra tekrar deneyin
            </p>
          </div>
        )}

        {/* Markets Grid */}
        {!isLoading && !error && (
          <>
            {filteredMarkets.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#555555' }}>
                  <Search className="w-10 h-10" style={{ color: '#EEFFDD', opacity: 0.5 }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#EEFFDD' }}>Market bulunamadı</h3>
                <p style={{ color: '#EEFFDD', opacity: 0.7 }}>
                  Arama kriterlerinize uygun market bulunmuyor
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMarkets.map((market) => (
                  <Link
                    key={market.id}
                    to={`/markets/${market.id}`}
                    className="market-card group"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium`}
                          style={{
                            backgroundColor: market.status === 'open' ? 'rgba(34, 197, 94, 0.2)' : 
                                           market.status === 'closed' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                            color: market.status === 'open' ? '#ccff33' : 
                                  market.status === 'closed' ? '#3b82f6' : '#6b7280',
                            border: `1px solid ${market.status === 'open' ? 'rgba(34, 197, 94, 0.3)' : 
                                               market.status === 'closed' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`
                          }}
                        >
                          {market.status === 'open' ? 'Açık' : 
                           market.status === 'closed' ? 'Kapandı' : 'Sonuçlandı'}
                        </span>
                        <ChevronRight className="w-5 h-5 transition-colors" style={{ color: '#EEFFDD', opacity: 0.5 }} />
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold mb-3 line-clamp-2 group-hover:text-brand-500 transition-colors" style={{ color: '#EEFFDD' }}>
                        {market.title}
                      </h3>

                      {/* Description */}
                      {market.description && (
                        <p className="text-sm mb-4 line-clamp-2" style={{ color: '#EEFFDD', opacity: 0.7 }}>
                          {market.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm mb-4 pb-4" style={{ borderBottom: '1px solid #555555', color: '#EEFFDD', opacity: 0.7 }}>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>₺{parseFloat(market.volume || 0).toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{market.tradersCount || 0}</span>
                        </div>
                      </div>

                      {/* Prices */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <div className="text-xs font-medium mb-1" style={{ color: '#ccff33', opacity: 0.8 }}>EVET</div>
                          <div className="text-xl font-bold" style={{ color: '#ccff33' }}>
                            ₺{parseFloat(market.yesPrice || 0.50).toFixed(2)}
                          </div>
                        </div>
                        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <div className="text-xs font-medium mb-1" style={{ color: '#ef4444', opacity: 0.8 }}>HAYIR</div>
                          <div className="text-xl font-bold" style={{ color: '#ef4444' }}>
                            ₺{parseFloat(market.noPrice || 0.50).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
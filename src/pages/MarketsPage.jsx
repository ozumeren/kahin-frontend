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
    { id: 'all', name: 'Tümü', icon: '🎯' },
    { id: 'politics', name: 'Siyaset', icon: '🏛️' },
    { id: 'sports', name: 'Spor', icon: '⚽' },
    { id: 'crypto', name: 'Kripto', icon: '₿' },
    { id: 'economy', name: 'Ekonomi', icon: '📈' },
    { id: 'entertainment', name: 'Eğlence', icon: '🎬' },
    { id: 'technology', name: 'Teknoloji', icon: '💻' }
  ]

  const filters = [
    { id: 'all', label: 'Tümü' },
    { id: 'open', label: 'Açık' },
    { id: 'closed', label: 'Kapandı' },
    { id: 'resolved', label: 'Sonuçlandı' },
  ]

  const markets = marketsData?.markets || []

  const filteredMarkets = markets.filter((market) => {
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'all' || market.status === activeFilter
    const matchesCategory = activeCategory === 'all' || market.category === activeCategory
    return matchesSearch && matchesFilter && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-6">Tüm Pazarlar</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Market ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-brand-50 text-brand-700 border-2 border-brand-200'
                    : 'text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeFilter === filter.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-gray-600">
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
              <div key={i} className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-800 font-medium mb-2">
              Pazarlar yüklenirken bir hata oluştu
            </p>
            <p className="text-red-600 text-sm">
              Lütfen daha sonra tekrar deneyin
            </p>
          </div>
        )}

        {/* Markets Grid */}
        {!isLoading && !error && (
          <>
            {filteredMarkets.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Market bulunamadı</h3>
                <p className="text-gray-600">
                  Arama kriterlerinize uygun market bulunmuyor
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMarkets.map((market) => (
                  <Link
                    key={market.id}
                    to={`/markets/${market.id}`}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        market.status === 'open' 
                          ? 'bg-green-100 text-green-700' 
                          : market.status === 'closed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {market.status === 'open' ? 'Açık' : 
                         market.status === 'closed' ? 'Kapandı' : 'Sonuçlandı'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-3 group-hover:text-brand-600 transition-colors line-clamp-2">
                      {market.title}
                    </h3>

                    {/* Description */}
                    {market.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {market.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
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
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <div className="text-xs text-green-600 font-medium mb-1">EVET</div>
                        <div className="text-xl font-bold text-green-700">
                          ₺{parseFloat(market.yesPrice || 0.50).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <div className="text-xs text-red-600 font-medium mb-1">HAYIR</div>
                        <div className="text-xl font-bold text-red-700">
                          ₺{parseFloat(market.noPrice || 0.50).toFixed(2)}
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
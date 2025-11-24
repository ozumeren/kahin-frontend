import React, { useState, useEffect } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { TrendingUp, ChevronRight, Users, Star, Flame } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

// Import category icons
import AllIcon from '../assets/all.svg'
import PoliticsIcon from '../assets/financial.svg'
import SportsIcon from '../assets/sports.svg'
import CryptoIcon from '../assets/crypto.svg'
import EconomyIcon from '../assets/icons-04.svg'
import EntertainmentIcon from '../assets/entertainment.svg'
import TechnologyIcon from '../assets/technology.svg'

export default function HomePage() {
  const { activeCategory, setActiveCategory } = useOutletContext()
  const [searchParams] = useSearchParams()
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get search query from URL
  const searchQuery = searchParams.get('search') || ''

  // Featured markets query
  const { data: featuredData } = useQuery({
    queryKey: ['featuredMarkets'],
    queryFn: async () => {
      const response = await apiClient.get('/markets/featured')
      return response.data.data || []
    },
    staleTime: 60000 // 1 dakika cache
  })

  // Trending markets query
  const { data: trendingData } = useQuery({
    queryKey: ['trendingMarkets'],
    queryFn: async () => {
      const response = await apiClient.get('/markets/trending')
      return response.data.data || []
    },
    staleTime: 60000 // 1 dakika cache
  })

  const featuredMarkets = featuredData || []
  const trendingMarkets = trendingData || []

  const categories = [
    { id: 'all', name: 'Tüm Marketler', icon: AllIcon },
    { id: 'politics', name: 'Siyaset', icon: PoliticsIcon },
    { id: 'sports', name: 'Spor', icon: SportsIcon },
    { id: 'crypto', name: 'Kripto', icon: CryptoIcon },
    { id: 'economy', name: 'Ekonomi', icon: EconomyIcon },
    { id: 'entertainment', name: 'Eğlence', icon: EntertainmentIcon },
    { id: 'technology', name: 'Teknoloji', icon: TechnologyIcon }
  ]

  useEffect(() => {
    fetchMarkets()
  }, [])

  const fetchMarkets = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/markets')
      console.log('📊 API Response:', response.data)
      const fetchedMarkets = response.data.data || []
      console.log('📊 Fetched markets:', fetchedMarkets.length)
      setMarkets(fetchedMarkets)
      setError(null)
    } catch (err) {
      console.error('❌ Markets fetch error:', err)
      setError('Marketler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const filteredMarkets = markets.filter((market) => {
    const statusFilter = market.status === 'open' || market.status === 'closed'
    const categoryFilter = activeCategory === 'all' || market.category === activeCategory
    
    // Search filter
    const searchFilter = !searchQuery || 
      market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return statusFilter && categoryFilter && searchFilter
  })

  // Debug: Log market images
  useEffect(() => {
    if (filteredMarkets.length > 0) {
      console.log('=== Market Images Debug ===')
      filteredMarkets.forEach(m => {
        console.log(`Market: ${m.title}`)
        console.log(`  - image_url: ${m.image_url}`)
        console.log(`  - category: ${m.category}`)
      })
    }
  }, [filteredMarkets])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111111' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Featured Markets Section */}
        {featuredMarkets.length > 0 && !searchQuery && activeCategory === 'all' && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#EEFFDD' }}>
                <Star className="w-5 h-5" style={{ color: '#FFD700' }} />
                Öne Çıkan Marketler
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredMarkets.slice(0, 3).map((market) => (
                <Link
                  key={market.id}
                  to={`/markets/${market.id}`}
                  className="block p-5 rounded-xl transition-all hover:brightness-110"
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                      {market.image_url ? (
                        <img src={market.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Star className="w-6 h-6 m-3" style={{ color: '#FFD700' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1 line-clamp-2" style={{ color: '#EEFFDD' }}>{market.title}</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold" style={{ color: '#FFD700' }}>
                          {Math.round((market.yesMidPrice || 0.5) * 100)}%
                        </span>
                        <span style={{ color: '#888888' }}>EVET</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending Markets Section */}
        {trendingMarkets.length > 0 && !searchQuery && activeCategory === 'all' && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#EEFFDD' }}>
                <Flame className="w-5 h-5" style={{ color: '#FF6B35' }} />
                Trend Marketler
              </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {trendingMarkets.slice(0, 6).map((market, index) => (
                <Link
                  key={market.id}
                  to={`/markets/${market.id}`}
                  className="flex-shrink-0 w-64 p-4 rounded-xl transition-all hover:brightness-110"
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333333'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: '#FF6B35', color: '#ffffff' }}>
                      {index + 1}
                    </span>
                    <Flame className="w-4 h-4" style={{ color: '#FF6B35' }} />
                  </div>
                  <h4 className="font-medium text-sm mb-2 line-clamp-2" style={{ color: '#EEFFDD' }}>{market.title}</h4>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: '#ccff33' }}>{Math.round((market.yesMidPrice || 0.5) * 100)}% EVET</span>
                    <span style={{ color: '#888888' }}>₺{parseFloat(market.volume || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Markets Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#EEFFDD' }}>
              <TrendingUp className="w-6 h-6" style={{ color: '#ccff33' }} />
              {searchQuery ? `"${searchQuery}" için sonuçlar` : categories.find(c => c.id === activeCategory)?.name}
            </h3>
            <button
              onClick={fetchMarkets}
              className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ color: '#ccff33' }}
            >
              Yenile
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 mb-4" style={{ border: '4px solid #ccff33', borderTopColor: 'transparent' }}></div>
              <p style={{ color: '#EEFFDD', opacity: 0.7 }}>Marketler yükleniyor...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <p className="font-medium mb-4" style={{ color: '#ef4444' }}>{error}</p>
              <button 
                onClick={fetchMarkets}
                className="px-6 py-3 rounded-lg font-medium transition-all hover:brightness-110"
                style={{ backgroundColor: '#555555', color: '#EEFFDD' }}
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Markets Grid - YENİ TASARIM */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMarkets.length === 0 ? (
                <div className="col-span-full rounded-2xl p-12 text-center" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#555555' }}>
                    <TrendingUp className="w-10 h-10" style={{ color: '#EEFFDD', opacity: 0.5 }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#EEFFDD' }}>
                    {searchQuery ? 'Sonuç bulunamadı' : 'Henüz market yok'}
                  </h3>
                  <p style={{ color: '#EEFFDD', opacity: 0.7 }}>
                    {searchQuery ? `"${searchQuery}" için sonuç bulunamadı` : 'Bu kategoride market bulunmuyor'}
                  </p>
                </div>
              ) : (
                filteredMarkets.map((market) => {
                  const yesPrice = parseFloat(market.yesMidPrice || market.yesPrice || 0.50)
                  const noPrice = parseFloat(market.noMidPrice || market.noPrice || 0.50)
                  const yesPercentage = Math.round(yesPrice * 100)
                  
                  // Get category icon for fallback
                  const categoryIcon = categories.find(c => c.id === market.category)?.icon
                  
                  // Check if this is a multiple choice market
                  const isMultipleChoice = market.options && market.options.length > 0

                  return (
                    <div 
                      key={market.id}
                      className="market-card p-5 group"
                    >
                      <Link to={`/markets/${market.id}`} className="block">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4">
                          {/* Icon */}
                          <div 
                            className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)' }}
                          >
                            {market.image_url ? (
                              <img 
                                src={market.image_url}
                                alt={market.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Image failed to load:', market.image_url)
                                  console.log('Market data:', market)
                                  e.target.onerror = null // Prevent infinite loop
                                  e.target.style.display = 'none'
                                  e.target.parentElement.innerHTML = `<img src="${categoryIcon || AllIcon}" class="w-full h-full object-contain p-2" />`
                                }}
                              />
                            ) : (
                              <img 
                                src={categoryIcon || AllIcon}
                                alt={market.title}
                                className="w-full h-full object-contain p-2"
                              />
                            )}
                          </div>

                          {/* Title */}
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="text-base font-semibold line-clamp-2 group-hover:opacity-80 transition-opacity mb-2"
                              style={{ color: '#EEFFDD', opacity: 0.9 }}
                            >
                              {market.title}
                            </h3>
                            {isMultipleChoice ? (
                              <div className="text-xs" style={{ color: '#ccff33', opacity: 0.7 }}>
                                {market.options.length} seçenek
                              </div>
                            ) : (
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold" style={{ color: '#ccff33' }}>
                                  {yesPercentage}%
                                </span>
                                <span className="text-xs" style={{ color: '#EEFFDD', opacity: 0.5 }}>
                                  EVET
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isMultipleChoice ? (
                          /* Multiple Choice Options Display */
                          <div className="space-y-2 mb-3">
                            {market.options.slice(0, 3).map((option, idx) => (
                              <div 
                                key={option.id}
                                className="flex items-center justify-between py-2 px-3 rounded-lg"
                                style={{ 
                                  backgroundColor: 'rgba(204, 255, 51, 0.1)',
                                  border: '1px solid rgba(204, 255, 51, 0.2)'
                                }}
                              >
                                <span className="text-sm font-medium truncate" style={{ color: '#EEFFDD', opacity: 0.9 }}>
                                  {option.option_text}
                                </span>
                                <span className="text-sm font-bold ml-2" style={{ color: '#ccff33' }}>
                                  {parseFloat(option.probability || 50).toFixed(0)}%
                                </span>
                              </div>
                            ))}
                            {market.options.length > 3 && (
                              <div className="text-xs text-center py-1" style={{ color: '#EEFFDD', opacity: 0.5 }}>
                                +{market.options.length - 3} seçenek daha
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Binary Market Buttons */
                          <>
                            {/* Buttons */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <button
                                className="py-2.5 px-3 rounded-lg font-semibold text-sm transition-all hover:brightness-110"
                                style={{ 
                                  backgroundColor: 'rgba(204, 255, 51, 0.15)',
                                  color: '#ccff33',
                                  border: '1px solid rgba(204, 255, 51, 0.3)'
                                }}
                              >
                                Yes
                              </button>
                              <button
                                className="py-2.5 px-3 rounded-lg font-semibold text-sm transition-all hover:brightness-110"
                                style={{ 
                                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}
                              >
                                No
                              </button>
                            </div>

                            {/* Prices */}
                            <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-center" style={{ color: '#EEFFDD', opacity: 0.5 }}>
                              <div>₺100 → <span style={{ color: '#ccff33' }}>₺{(100 * yesPrice).toFixed(0)}</span></div>
                              <div>₺100 → <span style={{ color: '#ef4444' }}>₺{(100 * noPrice).toFixed(0)}</span></div>
                            </div>
                          </>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 text-xs" style={{ borderTop: '1px solid #555555', color: '#EEFFDD', opacity: 0.6 }}>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              ₺{parseFloat(market.volume || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {market.tradersCount || 0}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: market.status === 'open' ? 'rgba(204, 255, 51, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                              color: market.status === 'open' ? '#ccff33' : '#9ca3af'
                            }}
                          >
                            {market.status === 'open' ? 'Açık' : 'Kapandı'}
                          </span>
                        </div>
                      </Link>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
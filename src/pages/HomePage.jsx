import React, { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { TrendingUp, ChevronRight, Users } from 'lucide-react'
import apiClient from '../api/client'

export default function HomePage() {
  const { activeCategory, setActiveCategory } = useOutletContext()
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const categories = [
    { id: 'all', name: 'Tüm Marketler', icon: '🎯' },
    { id: 'politics', name: 'Siyaset', icon: '🏛️' },
    { id: 'sports', name: 'Spor', icon: '⚽' },
    { id: 'crypto', name: 'Kripto', icon: '₿' },
    { id: 'economy', name: 'Ekonomi', icon: '📈' },
    { id: 'entertainment', name: 'Eğlence', icon: '🎬' },
    { id: 'technology', name: 'Teknoloji', icon: '💻' }
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
    if (activeCategory === 'all') {
      return statusFilter
    }
    return statusFilter && market.category === activeCategory
  })

  const stats = {
    totalVolume: markets.reduce((sum, m) => sum + parseFloat(m.volume || 0), 0),
    totalTraders: markets.reduce((sum, m) => sum + (m.tradersCount || 0), 0),
    activeMarkets: markets.filter(m => m.status === 'open').length
  }

  const formatVolume = (volume) => {
    if (volume >= 1000) {
      return `₺${(volume / 1000).toFixed(1)}k`
    }
    return `₺${volume.toFixed(0)}`
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111111' }}>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#EEFFDD' }}>
            Geleceği Tahmin Et, Kazan
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#EEFFDD', opacity: 0.7 }}>
            Siyaset, spor, ekonomi ve daha fazlası hakkında tahminlerde bulun. 
            Bilgini paraya çevir.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Toplam Hacim', value: formatVolume(stats.totalVolume) },
            { label: 'Aktif Kullanıcı', value: `${stats.totalTraders.toLocaleString()}+` },
            { label: 'Aktif Market', value: stats.activeMarkets },
            { label: 'Başarı Oranı', value: '%99.2' }
          ].map((stat, idx) => (
            <div key={idx} className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: '#EEFFDD' }}>
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: '#EEFFDD', opacity: 0.7 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Markets Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#EEFFDD' }}>
              <TrendingUp className="w-6 h-6" style={{ color: '#ccff33' }} />
              {categories.find(c => c.id === activeCategory)?.name}
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
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#EEFFDD' }}>Henüz market yok</h3>
                  <p style={{ color: '#EEFFDD', opacity: 0.7 }}>Bu kategoride market bulunmuyor</p>
                </div>
              ) : (
                filteredMarkets.map((market) => {
                  const yesPrice = parseFloat(market.yesMidPrice || market.yesPrice || 0.50)
                  const noPrice = parseFloat(market.noMidPrice || market.noPrice || 0.50)
                  const yesPercentage = Math.round(yesPrice * 100)

                  return (
                    <div 
                      key={market.id}
                      className="rounded-2xl p-5 transition-all hover:shadow-xl border group"
                      style={{ 
                        backgroundColor: '#1D1D1F',
                        borderColor: '#555555'
                      }}
                    >
                      <Link to={`/markets/${market.id}`} className="block">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4">
                          {/* Icon */}
                          <div 
                            className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl"
                            style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)' }}
                          >
                            {market.image_url ? (
                              <img src={market.image_url} alt="" className="w-full h-full object-cover" />
                            ) : '📊'}
                          </div>

                          {/* Title */}
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="text-base font-semibold line-clamp-2 group-hover:opacity-80 transition-opacity mb-2"
                              style={{ color: '#EEFFDD', opacity: 0.9 }}
                            >
                              {market.title}
                            </h3>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold" style={{ color: '#ccff33' }}>
                                {yesPercentage}%
                              </span>
                              <span className="text-xs" style={{ color: '#EEFFDD', opacity: 0.5 }}>
                                EVET
                              </span>
                            </div>
                          </div>
                        </div>

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
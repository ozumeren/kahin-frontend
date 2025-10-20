import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, ChevronRight, Menu, X, Clock, Users } from 'lucide-react'
import apiClient from '../api/client'

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
      
      // API response: { success: true, count: X, data: [...markets] }
      const fetchedMarkets = response.data.data || []
      console.log('📊 Fetched markets:', fetchedMarkets.length)
      console.log('📊 First market:', fetchedMarkets[0])
      
      setMarkets(fetchedMarkets)
      setError(null)
    } catch (err) {
      console.error('❌ Markets fetch error:', err)
      setError('Marketler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Category filter - şimdilik category field olmadığı için sadece status'e göre filtrele
  const filteredMarkets = markets.filter((market) => {
    // Şimdilik sadece "open" marketleri göster
    if (activeCategory === 'all') {
      return market.status === 'open' || market.status === 'closed'
    }
    // Category field olmadığı için şimdilik tüm marketleri göster
    return market.status === 'open' || market.status === 'closed'
  })

  console.log('🔍 Active category:', activeCategory)
  console.log('🔍 Total markets:', markets.length)
  console.log('🔍 Filtered markets:', filteredMarkets.length)

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
      {/* Category Navigation */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#111111', borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <nav className="hidden md:flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all`}
                  style={{
                    backgroundColor: activeCategory === cat.id ? '#555555' : 'transparent',
                    color: '#ffffff',
                    border: activeCategory === cat.id ? '1px solid #ccff33' : '1px solid transparent'
                  }}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </nav>

            <button 
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#555555', color: '#ffffff' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span>{categories.find(c => c.id === activeCategory)?.icon}</span>
              <span className="text-sm font-medium">{categories.find(c => c.id === activeCategory)?.name}</span>
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2" style={{ borderTop: '1px solid #555555' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id)
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: activeCategory === cat.id ? '#555555' : 'transparent',
                    color: '#ffffff'
                  }}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Toplam Hacim', value: formatVolume(stats.totalVolume) },
            { label: 'Aktif Kullanıcı', value: `${stats.totalTraders.toLocaleString()}+` },
            { label: 'Aktif Market', value: stats.activeMarkets },
            { label: 'Başarı Oranı', value: '%99.2' }
          ].map((stat, idx) => (
            <div key={idx} className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: '#ffffff' }}>
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Markets Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
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
              <p style={{ color: '#ffffff', opacity: 0.7 }}>Marketler yükleniyor...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
              <p className="font-medium mb-4" style={{ color: '#FF0000' }}>{error}</p>
              <button 
                onClick={fetchMarkets}
                className="px-6 py-3 rounded-lg font-medium transition-all hover:brightness-110"
                style={{ backgroundColor: '#555555', color: '#ffffff' }}
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Markets Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredMarkets.length === 0 ? (
                <div className="col-span-full rounded-2xl p-12 text-center" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#555555' }}>
                    <TrendingUp className="w-10 h-10" style={{ color: '#ffffff', opacity: 0.5 }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#ffffff' }}>Henüz market yok</h3>
                  <p style={{ color: '#ffffff', opacity: 0.7 }}>Bu kategoride market bulunmuyor</p>
                </div>
              ) : (
                filteredMarkets.map((market) => (
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
                            backgroundColor: market.status === 'open' ? 'rgba(204, 255, 51, 0.2)' : 
                                           market.status === 'closed' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                            color: market.status === 'open' ? '#ccff33' : 
                                  market.status === 'closed' ? '#3b82f6' : '#6b7280',
                            border: `1px solid ${market.status === 'open' ? 'rgba(204, 255, 51, 0.3)' : 
                                               market.status === 'closed' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`
                          }}
                        >
                          {market.status === 'open' ? 'Açık' : 
                           market.status === 'closed' ? 'Kapandı' : 'Sonuçlandı'}
                        </span>
                        <ChevronRight className="w-5 h-5 transition-colors" style={{ color: '#ffffff', opacity: 0.5 }} />
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold mb-3 group-hover:text-brand-500 transition-colors line-clamp-2" style={{ color: '#ffffff' }}>
                        {market.title}
                      </h3>

                      {/* Description */}
                      {market.description && (
                        <p className="text-sm mb-4 line-clamp-2" style={{ color: '#ffffff', opacity: 0.7 }}>
                          {market.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm mb-4 pb-4" style={{ borderBottom: '1px solid #555555', color: '#ffffff', opacity: 0.7 }}>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>₺{parseFloat(market.volume || 0).toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{market.tradersCount || 0}</span>
                        </div>
                        {market.closing_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(market.closing_date).toLocaleDateString('tr-TR')}</span>
                          </div>
                        )}
                      </div>

                      {/* Prices - Şimdilik sabit fiyat göster */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)', border: '1px solid rgba(204, 255, 51, 0.2)' }}>
                          <div className="text-xs font-medium mb-1" style={{ color: '#ccff33', opacity: 0.8 }}>EVET</div>
                          <div className="text-xl font-bold" style={{ color: '#ccff33' }}>
                            ₺{(market.yesMidPrice || market.yesPrice || 0.50).toFixed(2)}
                          </div>
                        </div>
                        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.2)' }}>
                          <div className="text-xs font-medium mb-1" style={{ color: '#FF0000', opacity: 0.8 }}>HAYIR</div>
                          <div className="text-xl font-bold" style={{ color: '#FF0000' }}>
                            ₺{(market.noMidPrice || market.noPrice || 0.50).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
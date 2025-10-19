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
    { id: 'all', name: 'Tüm Marketler'},
    { id: 'politics', name: 'Siyaset' },
    { id: 'sports', name: 'Spor'},
    { id: 'crypto', name: 'Kripto' },
    { id: 'economy', name: 'Ekonomi' },
    { id: 'entertainment', name: 'Eğlence' },
    { id: 'technology', name: 'Teknoloji' }
  ]

  useEffect(() => {
    fetchMarkets()
  }, [])

  const fetchMarkets = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/markets')
      const fetchedMarkets = response.data.data.markets || []
      console.log('Fetched markets:', fetchedMarkets)
      console.log('First market:', fetchedMarkets[0])
      setMarkets(fetchedMarkets)
      setError(null)
    } catch (err) {
      console.error('Markets fetch error:', err)
      setError('Marketler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const filteredMarkets = markets.filter((market) => {
    if (activeCategory === 'all') return true
    return market.category === activeCategory
  })
  
  console.log('Active category:', activeCategory)
  console.log('Total markets:', markets.length)
  console.log('Filtered markets:', filteredMarkets.length)

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
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1F' }}>
      {/* Category Navigation */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#1D1D1F', borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <nav className="hidden md:flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
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

            <button 
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#555555', color: '#EEFFDD' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
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
                    color: '#EEFFDD'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
              <TrendingUp className="w-6 h-6 text-brand-500" />
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent mb-4"></div>
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

          {/* Markets Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredMarkets.length === 0 ? (
                <div className="col-span-full rounded-2xl p-12 text-center" style={{ backgroundColor: '#1D1D1F', border: '1px solid #555555' }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#555555' }}>
                    <TrendingUp className="w-10 h-10" style={{ color: '#EEFFDD', opacity: 0.5 }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#EEFFDD' }}>Henüz market yok</h3>
                  <p style={{ color: '#EEFFDD', opacity: 0.7 }}>Bu kategoride market bulunmuyor</p>
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          market.status === 'open' 
                            ? 'bg-yes/20 text-yes border border-yes/30' 
                            : market.status === 'closed'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-500/20 border border-gray-500/30'
                        }`} style={{ color: market.status === 'open' ? '#ccff33' : '#3b82f6' }}>
                          {market.status === 'open' ? 'Açık' : 
                           market.status === 'closed' ? 'Kapandı' : 'Sonuçlandı'}
                        </span>
                        <ChevronRight className="w-5 h-5 transition-colors" style={{ color: '#EEFFDD', opacity: 0.5 }} />
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold mb-3 group-hover:text-brand-500 transition-colors line-clamp-2" style={{ color: '#EEFFDD' }}>
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
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ChevronRight, Menu, X, Clock, Users, Wifi } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

const HomePage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { isConnected: wsConnected, onMessage } = useWebSocket();

  const categories = [
    { id: 'all', name: 'Tüm Marketler', icon: '🎯' },
    { id: 'politics', name: 'Siyaset', icon: '🏛️' },
    { id: 'sports', name: 'Spor', icon: '⚽' },
    { id: 'crypto', name: 'Kripto', icon: '₿' },
    { id: 'economy', name: 'Ekonomi', icon: '📈' },
    { id: 'entertainment', name: 'Eğlence', icon: '🎬' },
    { id: 'technology', name: 'Teknoloji', icon: '💻' }
  ];

  useEffect(() => {
    fetchMarkets();
  }, []);

  // WebSocket'ten gelen market güncellemelerini dinle
  useEffect(() => {
    if (!wsConnected) return;

    // Tüm market güncellemelerini dinle
    const unsubscribe = onMessage('__market_updates__', (data) => {
      if (data.type === 'market_update' || data.type === 'orderbook_update') {
        // Market listesini güncelle
        setMarkets(prevMarkets => 
          prevMarkets.map(market => {
            if (market.id === data.marketId) {
              // Order book verisinden fiyatları çıkar
              const orderBook = data.data || data.orderBook;
              if (orderBook) {
                return {
                  ...market,
                  yesPrice: orderBook.yes?.midPrice || 
                           orderBook.yes?.bids?.[0]?.price || 
                           market.yesPrice,
                  noPrice: orderBook.no?.midPrice || 
                          orderBook.no?.bids?.[0]?.price || 
                          market.noPrice
                };
              }
            }
            return market;
          })
        );
      }
      
      // Yeni trade geldiğinde de fiyatları güncelle
      if (data.type === 'new_trade') {
        const trade = data.data;
        if (trade && trade.marketId) {
          // Trade'den sonra market'i yeniden fetch etmek yerine
          // mevcut fiyatı trade fiyatı ile güncelle
          setMarkets(prevMarkets => 
            prevMarkets.map(market => {
              if (market.id === trade.marketId) {
                const priceStr = parseFloat(trade.price).toFixed(2);
                if (trade.outcome) {
                  return { ...market, yesPrice: priceStr };
                } else {
                  return { ...market, noPrice: priceStr };
                }
              }
              return market;
            })
          );
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [wsConnected, onMessage]);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.kahinmarket.com/api/v1/markets');
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Market data received:', data.data);
        console.log('📊 First market prices:', {
          yesPrice: data.data[0]?.yesPrice,
          noPrice: data.data[0]?.noPrice
        });
        setMarkets(data.data);
      } else {
        setError('Marketler yüklenemedi');
      }
    } catch (err) {
      setError('Bağlantı hatası: ' + err.message);
      console.error('Market fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkets = activeCategory === 'all' 
    ? markets.filter(m => m.status === 'open')
    : markets.filter(m => m.status === 'open' && m.category === activeCategory);

  const stats = {
    totalVolume: markets.reduce((sum, m) => sum + parseFloat(m.volume || 0), 0),
    activeMarkets: markets.filter(m => m.status === 'open').length,
    totalTraders: markets.reduce((sum, m) => sum + parseInt(m.tradersCount || 0), 0)
  };

  const formatVolume = (volume) => {
    if (!volume) return '₺0';
    const num = parseFloat(volume);
    if (num >= 1000000) return `₺${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `₺${(num / 1000).toFixed(0)}K`;
    return `₺${num.toFixed(0)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Kapandı';
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Yarın';
    return `${diffDays} gün`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* WebSocket Status */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all ${
          wsConnected 
            ? 'bg-green-100 border border-green-300 text-green-700' 
            : 'bg-yellow-100 border border-yellow-300 text-yellow-700'
        }`}>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">
            {wsConnected ? 'Gerçek Zamanlı' : 'Bağlanıyor...'}
          </span>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <nav className="hidden md:flex space-x-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </nav>

            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{cat.icon}</span>
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
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Geleceği Tahmin Et, Kazan
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Siyaset, spor, ekonomi ve daha fazlası hakkında tahminlerde bulun. 
            Bilgini paraya çevir.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatVolume(stats.totalVolume)}
            </div>
            <div className="text-gray-600 text-sm">Toplam Hacim</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalTraders.toLocaleString()}+
            </div>
            <div className="text-gray-600 text-sm">Aktif Kullanıcı</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.activeMarkets}
            </div>
            <div className="text-gray-600 text-sm">Aktif Market</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">%99.2</div>
            <div className="text-gray-600 text-sm">Başarı Oranı</div>
          </div>
        </div>

        {/* Markets Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-brand-600" />
              {categories.find(c => c.id === activeCategory)?.name}
            </h3>
            <button 
              onClick={fetchMarkets}
              className="text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center"
            >
              Yenile
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
              <p className="text-gray-600 mt-4">Marketler yükleniyor...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-xl shadow-md p-6 bg-red-50 border border-red-200 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <button 
                onClick={fetchMarkets}
                className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Markets Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredMarkets.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">Bu kategoride market bulunamadı</p>
                </div>
              ) : (
                filteredMarkets.map(market => (
                  <Link
                    key={market.id}
                    to={`/markets/${market.id}`}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer group block"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-gray-900 font-semibold text-lg group-hover:text-brand-600 transition-colors flex-1">
                        {market.title}
                      </h4>
                      {market.trending && (
                        <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-medium ml-2">
                          🔥 Trend
                        </span>
                      )}
                    </div>

                    {market.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {market.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        💰 {formatVolume(market.volume)}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {parseInt(market.tradersCount || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(market.closing_date)}
                      </span>
                    </div>

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
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
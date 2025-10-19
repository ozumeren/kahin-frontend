import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Clock, Wifi, RefreshCw, X, BarChart3 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ParentSize } from '@visx/responsive';
import { useMarketWebSocket, useNewTrades } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useMarket, useOrderBook, useMarketTrades, useCreateOrder, usePortfolio } from '../hooks/useMarketQueries';
import MarketChart from '../components/MarketChart';
import VolumeBarChart from '../components/VolumeBarChart';

const MarketDetailPage = () => {
  const { id: marketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // React Query hooks - API verilerini yönet
  const { data: market, isLoading: marketLoading, error: marketError } = useMarket(marketId);
  const { data: initialOrderBook, isLoading: orderBookLoading } = useOrderBook(marketId);
  const { data: trades = [], isLoading: tradesLoading } = useMarketTrades(marketId, 100);
  const { data: portfolio } = usePortfolio(!!user);
  const createOrderMutation = useCreateOrder();

  // Modal states
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [orderType, setOrderType] = useState('BUY');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderPrice, setOrderPrice] = useState('');

  // Chart options
  const [chartTimeframe, setChartTimeframe] = useState('all');
  const [showChartGrid, setShowChartGrid] = useState(true);
  const [showChartArea, setShowChartArea] = useState(true);

  // WebSocket hook - real-time güncellemeler için
  const { isConnected: wsConnected, orderBook: liveOrderBook, lastUpdate } = useMarketWebSocket(marketId);
  
  // WebSocket'ten yeni trade geldiğinde trades listesini güncelle
  const handleNewTrade = useCallback((newTrade) => {
    queryClient.invalidateQueries({ queryKey: ['trades', marketId] });
  }, [queryClient, marketId]);
  
  useNewTrades(marketId, handleNewTrade);

// Prepare chart data from trades with timeframe filtering
const chartData = useMemo(() => {
  if (!trades || trades.length === 0) return [];

  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  let filteredTrades = sortedTrades;
  const now = new Date();
  
  if (chartTimeframe !== 'all') {
    const cutoffTime = new Date(now);
    
    switch (chartTimeframe) {
      case '1h':
        cutoffTime.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoffTime.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoffTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoffTime.setDate(now.getDate() - 7);
        break;
      default:
        break;
    }
    
    filteredTrades = sortedTrades.filter(trade => 
      new Date(trade.createdAt) >= cutoffTime
    );
  }

  // ✅ DÜZELTME: Her trade için hem EVET hem HAYIR fiyatını hesapla
  return filteredTrades.map((trade) => {
    const tradePrice = parseFloat(trade.price);
    
    return {
      time: new Date(trade.createdAt).toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      timestamp: new Date(trade.createdAt).getTime(),
      // EVET fiyatı: outcome=true ise direkt fiyat, false ise 100-fiyat
      yes: trade.outcome ? tradePrice : (100 - tradePrice),
      // HAYIR fiyatı: outcome=false ise direkt fiyat, true ise 100-fiyat
      no: !trade.outcome ? tradePrice : (100 - tradePrice),
    };
  });
}, [trades, chartTimeframe]);

  // Calculate probabilities from order book or latest trades
  const probabilities = useMemo(() => {
    const orderBook = liveOrderBook || initialOrderBook;
    
    // Önce emir defterinden orta noktayı hesapla (spread'in ortası)
    if (orderBook?.yes?.bids || orderBook?.yes?.asks || orderBook?.no?.bids || orderBook?.no?.asks) {
      const prices = [];
      
      // EVET tarafı - en iyi alış ve satış
      if (orderBook.yes?.bids && orderBook.yes.bids.length > 0) {
        prices.push(parseFloat(orderBook.yes.bids[0].price));
      }
      if (orderBook.yes?.asks && orderBook.yes.asks.length > 0) {
        prices.push(parseFloat(orderBook.yes.asks[0].price));
      }
      
      // HAYIR tarafı - fiyatı EVET'e çevir (100 - hayır_fiyatı)
      if (orderBook.no?.bids && orderBook.no.bids.length > 0) {
        const noPrice = parseFloat(orderBook.no.bids[0].price);
        prices.push(100 - noPrice);
      }
      if (orderBook.no?.asks && orderBook.no.asks.length > 0) {
        const noPrice = parseFloat(orderBook.no.asks[0].price);
        prices.push(100 - noPrice);
      }
      
      // Tüm fiyatların ortalamasını al
      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        return { 
          yes: Math.round(avgPrice * 10) / 10, 
          no: Math.round((100 - avgPrice) * 10) / 10 
        };
      }
    }
    
    // Emir yoksa son işlemlere bak
    if (chartData.length > 0) {
      const recentTrades = chartData.slice(-10); // Son 10 işlem
      const yesTrades = recentTrades.filter(t => t.yes !== null);
      const noTrades = recentTrades.filter(t => t.no !== null);
      
      if (yesTrades.length > 0 || noTrades.length > 0) {
        const prices = [];
        
        yesTrades.forEach(t => prices.push(t.yes));
        noTrades.forEach(t => prices.push(100 - t.no));
        
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        return { 
          yes: Math.round(avgPrice * 10) / 10, 
          no: Math.round((100 - avgPrice) * 10) / 10 
        };
      }
    }
    
    // Hiç veri yoksa 50-50
    return { yes: 50, no: 50 };
  }, [liveOrderBook, initialOrderBook, chartData]);

  // Mevcut order book'u al (WebSocket veya initial)
  const orderBook = useMemo(() => {
    return liveOrderBook || initialOrderBook || { 
      yes: { bids: [], asks: [] }, 
      no: { bids: [], asks: [] } 
    };
  }, [liveOrderBook, initialOrderBook]);

  if (marketLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
            <p className="text-gray-600">Pazar yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (marketError || !market) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">Pazar bulunamadı veya yüklenirken hata oluştu.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 text-brand-600 hover:text-brand-700"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const yesBestBid = orderBook.yes?.bids?.[0];
  const noBestBid = orderBook.no?.bids?.[0];

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('İşlem yapmak için giriş yapmalısınız');
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        marketId: market.id,
        outcome: selectedOutcome,
        quantity: parseInt(orderQuantity),
        price: parseFloat(orderPrice),
        type: orderType
      });

      toast.success('Emir başarıyla oluşturuldu!');
      setShowBuyModal(false);
      setOrderQuantity('');
      setOrderPrice('');
    } catch (error) {
      toast.error(error.message || 'Emir oluşturulurken hata oluştu');
    }
  };

  return (
    <>
      {/* Buy/Sell Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                {orderType === 'BUY' ? 'Hisse Satın Al' : 'Hisse Sat'} - {selectedOutcome ? 'EVET' : 'HAYIR'}
              </h3>
              <button onClick={() => setShowBuyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miktar (Adet)
                </label>
                <input
                  type="number"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Örn: 10"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiyat (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Örn: 65.00"
                  min="0.01"
                  max="100"
                  required
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Toplam Tutar:</span>
                  <span className="font-bold">
                    ₺{(parseFloat(orderQuantity || 0) * parseFloat(orderPrice || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={createOrderMutation.isPending || !orderQuantity || !orderPrice}
                className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${
                  createOrderMutation.isPending || !orderQuantity || !orderPrice
                    ? 'bg-gray-400 cursor-not-allowed'
                    : selectedOutcome
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {createOrderMutation.isPending ? 'İşleniyor...' : `${orderType === 'BUY' ? 'Satın Al' : 'Sat'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri Dön</span>
        </button>

        {/* Market Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{market.title}</h1>
              {market.description && (
                <p className="text-gray-600">{market.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {wsConnected && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Wifi className="w-4 h-4" />
                  <span>Canlı</span>
                </div>
              )}
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                market.status === 'open' ? 'bg-green-100 text-green-700' : 
                market.status === 'closed' ? 'bg-blue-100 text-blue-700' : 
                'bg-gray-100 text-gray-700'
              }`}>
                {market.status === 'open' ? 'Açık' : 
                 market.status === 'closed' ? 'Kapandı' : 'Sonuçlandı'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <div>
                <p className="text-sm text-gray-600">Hacim</p>
                <p className="font-bold">₺{parseFloat(market.volume || 0).toLocaleString('tr-TR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              <div>
                <p className="text-sm text-gray-600">Katılımcılar</p>
                <p className="font-bold">{market.tradersCount || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              <div>
                <p className="text-sm text-gray-600">Kapanış</p>
                <p className="font-bold">
                  {market.closing_date 
                    ? new Date(market.closing_date).toLocaleDateString('tr-TR')
                    : 'Belirsiz'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Price Chart with Visx */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-600" />
                Fiyat Grafiği
              </h3>
              {wsConnected && (
                <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
              )}
            </div>

            {/* Chart Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Timeframe selector */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { value: '1h', label: '1S' },
                  { value: '6h', label: '6S' },
                  { value: '24h', label: '24S' },
                  { value: '7d', label: '7G' },
                  { value: 'all', label: 'Tümü' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setChartTimeframe(value)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      chartTimeframe === value
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Chart options */}
              <button
                onClick={() => setShowChartGrid(!showChartGrid)}
                className={`p-2 rounded-lg transition-colors ${
                  showChartGrid ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Grid'i göster/gizle"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16M4 12h16M4 19h16" />
                </svg>
              </button>

              <button
                onClick={() => setShowChartArea(!showChartArea)}
                className={`p-2 rounded-lg transition-colors ${
                  showChartArea ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Alan dolgusunu göster/gizle"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Responsive Chart Container */}
          <div className="w-full" style={{ height: '400px' }}>
            <ParentSize>
              {({ width, height }) => (
                <MarketChart
                  data={chartData}
                  width={width}
                  height={height}
                  showGrid={showChartGrid}
                  showArea={showChartArea}
                  animated={true}
                />
              )}
            </ParentSize>
          </div>

          {/* Volume Chart */}
          <div className="w-full mt-6 pt-6 border-t" style={{ height: '180px' }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-700">İşlem Hacmi</h4>
                {trades.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {trades.length} işlem
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">EVET</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">HAYIR</span>
                </div>
              </div>
            </div>
            <ParentSize>
              {({ width }) => (
                <VolumeBarChart
                  trades={trades}
                  width={width}
                  height={130}
                  intervalMinutes={chartTimeframe === '1h' ? 5 : chartTimeframe === '6h' ? 15 : 60}
                  showYesNo={true}
                />
              )}
            </ParentSize>
          </div>

          {/* Current Probabilities Display */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-700 font-medium mb-1">EVET İhtimali</div>
              <div className="text-3xl font-bold text-green-700">
                {probabilities.yes.toFixed(1)}%
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-700 font-medium mb-1">HAYIR İhtimali</div>
              <div className="text-3xl font-bold text-red-700">
                {probabilities.no.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Trading Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* EVET Panel */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border-2 border-green-200">
            <h3 className="text-lg font-bold mb-4 text-green-800">EVET</h3>
            
            <div className="mb-4 space-y-2">
              {yesBestBid && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700 font-medium">En İyi Alış:</span>
                  <span className="font-bold text-green-800">₺{parseFloat(yesBestBid.price).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-700 font-medium">Miktar:</span>
                <span className="font-bold text-green-800">{yesBestBid?.quantity || 0} adet</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <button
                onClick={() => {
                  setSelectedOutcome(true);
                  setOrderType('BUY');
                  setShowBuyModal(true);
                }}
                disabled={market.status !== 'open' || !user}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
              >
                {!user ? 'Giriş Yapın' : 'EVET Satın Al'}
              </button>
              <button
                onClick={() => {
                  setSelectedOutcome(true);
                  setOrderType('SELL');
                  setShowBuyModal(true);
                }}
                disabled={market.status !== 'open' || !user}
                className="w-full bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-green-800 font-medium py-3 rounded-lg transition-colors"
              >
                EVET Sat
              </button>
            </div>

            {/* EVET Order Book */}
            <div className="pt-4 border-t border-green-300">
              <h4 className="text-sm font-bold text-green-800 mb-3">Emir Defteri</h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-semibold text-green-700 mb-1.5">Alış Emirleri (Bids)</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(orderBook.yes?.bids || []).slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 px-2 bg-white/60 rounded">
                        <span className="font-medium text-green-800">₺{parseFloat(order.price).toFixed(2)}</span>
                        <span className="text-gray-600">{order.quantity}</span>
                      </div>
                    ))}
                    {(!orderBook.yes?.bids || orderBook.yes.bids.length === 0) && (
                      <p className="text-xs text-gray-500 italic py-2">Emir yok</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-green-700 mb-1.5">Satış Emirleri (Asks)</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(orderBook.yes?.asks || []).slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 px-2 bg-white/60 rounded">
                        <span className="font-medium text-green-800">₺{parseFloat(order.price).toFixed(2)}</span>
                        <span className="text-gray-600">{order.quantity}</span>
                      </div>
                    ))}
                    {(!orderBook.yes?.asks || orderBook.yes.asks.length === 0) && (
                      <p className="text-xs text-gray-500 italic py-2">Emir yok</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HAYIR Panel */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md p-6 border-2 border-red-200">
            <h3 className="text-lg font-bold mb-4 text-red-800">HAYIR</h3>
            
            <div className="mb-4 space-y-2">
              {noBestBid && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-red-700 font-medium">En İyi Alış:</span>
                  <span className="font-bold text-red-800">₺{parseFloat(noBestBid.price).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-700 font-medium">Miktar:</span>
                <span className="font-bold text-red-800">{noBestBid?.quantity || 0} adet</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <button
                onClick={() => {
                  setSelectedOutcome(false);
                  setOrderType('BUY');
                  setShowBuyModal(true);
                }}
                disabled={market.status !== 'open' || !user}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
              >
                {!user ? 'Giriş Yapın' : 'HAYIR Satın Al'}
              </button>
              <button
                onClick={() => {
                  setSelectedOutcome(false);
                  setOrderType('SELL');
                  setShowBuyModal(true);
                }}
                disabled={market.status !== 'open' || !user}
                className="w-full bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-red-800 font-medium py-3 rounded-lg transition-colors"
              >
                HAYIR Sat
              </button>
            </div>

            {/* HAYIR Order Book */}
            <div className="pt-4 border-t border-red-300">
              <h4 className="text-sm font-bold text-red-800 mb-3">Emir Defteri</h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-semibold text-red-700 mb-1.5">Alış Emirleri (Bids)</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(orderBook.no?.bids || []).slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 px-2 bg-white/60 rounded">
                        <span className="font-medium text-red-800">₺{parseFloat(order.price).toFixed(2)}</span>
                        <span className="text-gray-600">{order.quantity}</span>
                      </div>
                    ))}
                    {(!orderBook.no?.bids || orderBook.no.bids.length === 0) && (
                      <p className="text-xs text-gray-500 italic py-2">Emir yok</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-red-700 mb-1.5">Satış Emirleri (Asks)</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(orderBook.no?.asks || []).slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 px-2 bg-white/60 rounded">
                        <span className="font-medium text-red-800">₺{parseFloat(order.price).toFixed(2)}</span>
                        <span className="text-gray-600">{order.quantity}</span>
                      </div>
                    ))}
                    {(!orderBook.no?.asks || orderBook.no.asks.length === 0) && (
                      <p className="text-xs text-gray-500 italic py-2">Emir yok</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Son İşlemler</h3>
            <div className="space-y-2">
              {tradesLoading ? (
                <p className="text-sm text-gray-500">Yükleniyor...</p>
              ) : trades.length > 0 ? (
                trades.slice(0, 10).map((trade, idx) => (
                  <div key={idx} className={`flex justify-between items-center text-sm py-2 px-3 rounded ${
                    trade.outcome ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <span className={`font-semibold ${trade.outcome ? 'text-green-700' : 'text-red-700'}`}>
                      {trade.outcome ? 'EVET' : 'HAYIR'}
                    </span>
                    <span className="font-medium">₺{parseFloat(trade.price).toFixed(2)}</span>
                    <span className="text-gray-600">{trade.quantity} adet</span>
                    <span className="text-xs text-gray-500">
                      {new Date(trade.createdAt).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Henüz işlem yok</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketDetailPage;
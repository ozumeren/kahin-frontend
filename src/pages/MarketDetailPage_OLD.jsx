import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, MessageCircle, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ParentSize } from '@visx/responsive';
import { useMarketWebSocket, useNewTrades } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useMarket, useOrderBook, useMarketTrades, useCreateOrder, usePortfolio } from '../hooks/useMarketQueries';
import MarketChart from '../components/MarketChart';

const MarketDetailPage = () => {
  const { id: marketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // React Query hooks
  const { data: market, isLoading: marketLoading, error: marketError } = useMarket(marketId);
  const { data: initialOrderBook, isLoading: orderBookLoading } = useOrderBook(marketId);
  const { data: trades = [], isLoading: tradesLoading } = useMarketTrades(marketId, 100);
  const { data: portfolio } = usePortfolio(!!user);
  const createOrderMutation = useCreateOrder();

  // Modal states
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [chartTimeframe, setChartTimeframe] = useState('ALL');

  // WebSocket hook
  const { isConnected: wsConnected, orderBook: liveOrderBook, lastUpdate } = useMarketWebSocket(marketId);
  
  const handleNewTrade = useCallback((newTrade) => {
    queryClient.invalidateQueries({ queryKey: ['trades', marketId] });
  }, [queryClient, marketId]);
  
  useNewTrades(marketId, handleNewTrade);

  // Chart data
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const sortedTrades = [...trades].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return sortedTrades.map((trade) => {
      let tradePrice = parseFloat(trade.price);
      if (tradePrice <= 1) tradePrice = tradePrice * 100;
      const yesProbability = trade.outcome ? tradePrice : (100 - tradePrice);
      return {
        time: new Date(trade.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(trade.createdAt).getTime(),
        yes: yesProbability,
        no: 100 - yesProbability,
      };
    });
  }, [trades, chartTimeframe]);

  const orderBook = useMemo(() => {
    return liveOrderBook || initialOrderBook || { 
      yes: { bids: [], asks: [] }, 
      no: { bids: [], asks: [] } 
    };
  }, [liveOrderBook, initialOrderBook]);

  if (marketLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p style={{ color: '#666666' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (marketError || !market) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-center">
          <p style={{ color: '#666666' }}>Market not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isMultipleChoice = market?.options && market.options.length > 0;
  const isBinaryMarket = !isMultipleChoice;
        timestamp: new Date(trade.createdAt).getTime(),
        yes: yesProbability,
        no: noProbability,
      };
    });

    return tradeData;
  }, [trades, chartTimeframe]);

  // Calculate probabilities from latest trades
  const probabilities = useMemo(() => {
    // chartData'dan al (trade'lere göre)
    if (chartData.length > 0) {
      const lastTrade = chartData[chartData.length - 1];
      return {
        yes: Math.round(lastTrade.yes * 10) / 10,
        no: Math.round(lastTrade.no * 10) / 10
      };
    }
    
    return { yes: 50, no: 50 };
  }, [chartData]);

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
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: '#ccff33' }} />
            <p style={{ color: '#ffffff', opacity: 0.7 }}>Pazar yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (marketError || !market) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg p-6" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
          <p style={{ color: '#FF0000' }}>Pazar bulunamadı veya yüklenirken hata oluştu.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 hover:opacity-80 transition-opacity"
            style={{ color: '#ccff33' }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const yesBestBid = orderBook.yes?.bids?.[0];
  const noBestBid = orderBook.no?.bids?.[0];

  // Check if this is a multiple choice market
  const isMultipleChoice = market?.options && market.options.length > 0;
  const isBinaryMarket = !isMultipleChoice;

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
          <div className="rounded-xl shadow-2xl max-w-md w-full p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>
                {orderType === 'BUY' ? 'Hisse Satın Al' : 'Hisse Sat'} - {
                  isMultipleChoice 
                    ? market.options.find(opt => opt.id === selectedOutcome)?.option_text || 'Seçenek'
                    : selectedOutcome ? 'EVET' : 'HAYIR'
                }
              </h3>
              <button onClick={() => setShowBuyModal(false)} className="hover:opacity-80 transition-opacity" style={{ color: '#ffffff', opacity: 0.7 }}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
                  Miktar (Adet)
                </label>
                <input
                  type="number"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all"
                  style={{ backgroundColor: '#555555', color: '#ffffff', border: '1px solid #555555' }}
                  placeholder="Örn: 10"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
                  Fiyat (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all"
                  style={{ backgroundColor: '#555555', color: '#ffffff', border: '1px solid #555555' }}
                  placeholder="Örn: 65.00"
                  min="0.01"
                  max="100"
                  required
                />
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid #555555' }}>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: '#ffffff', opacity: 0.7 }}>Toplam Tutar:</span>
                  <span className="font-bold" style={{ color: '#ffffff' }}>
                    ₺{(parseFloat(orderQuantity || 0) * parseFloat(orderPrice || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={createOrderMutation.isPending || !orderQuantity || !orderPrice}
                className="w-full py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: createOrderMutation.isPending || !orderQuantity || !orderPrice
                    ? '#555555'
                    : selectedOutcome ? '#ccff33' : '#FF0000',
                  color: '#ffffff',
                  cursor: (createOrderMutation.isPending || !orderQuantity || !orderPrice) ? 'not-allowed' : 'pointer',
                  opacity: (createOrderMutation.isPending || !orderQuantity || !orderPrice) ? 0.5 : 1
                }}
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
          className="inline-flex items-center gap-2 mb-6 transition-colors hover:opacity-80"
          style={{ color: '#ffffff' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri Dön</span>
        </button>

        {/* Market Header */}
        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              {/* Market Image */}
              <div 
                className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl"
                style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)' }}
              >
                {market.image_url ? (
                  <img 
                    src={market.image_url} 
                    alt={market.title}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  '📊'
                )}
              </div>
              
              {/* Market Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>{market.title}</h1>
                {market.description && (
                  <p style={{ color: '#ffffff', opacity: 0.7 }}>{market.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {wsConnected && (
                <div className="flex items-center gap-2 text-sm" style={{ color: '#ccff33' }}>
                  <Wifi className="w-4 h-4" />
                  <span>Canlı</span>
                </div>
              )}
              <span 
                className="px-4 py-2 rounded-full text-sm font-medium"
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
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid #555555' }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#ccff33' }} />
              <div>
                <p className="text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>Hacim</p>
                <p className="font-bold" style={{ color: '#ffffff' }}>₺{parseFloat(market.volume || 0).toLocaleString('tr-TR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#ccff33' }} />
              <div>
                <p className="text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>Katılımcılar</p>
                <p className="font-bold" style={{ color: '#ffffff' }}>{market.tradersCount || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: '#ccff33' }} />
              <div>
                <p className="text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>Kapanış</p>
                <p className="font-bold" style={{ color: '#ffffff' }}>
                  {market.closing_date 
                    ? new Date(market.closing_date).toLocaleDateString('tr-TR')
                    : 'Belirsiz'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Price Chart with Visx - Only for Binary Markets */}
        {isBinaryMarket && (
        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
                <BarChart3 className="w-5 h-5" style={{ color: '#ccff33' }} />
                Fiyat Grafiği
              </h3>
              {wsConnected && (
                <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#ccff33' }} />
              )}
            </div>

            {/* Chart Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Timeframe selector */}
              <div className="flex rounded-lg p-1" style={{ backgroundColor: '#555555' }}>
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
                    className="px-3 py-1 rounded text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: chartTimeframe === value ? '#111111' : 'transparent',
                      color: chartTimeframe === value ? '#ccff33' : '#ffffff',
                      opacity: chartTimeframe === value ? 1 : 0.7
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Chart options */}
              <button
                onClick={() => setShowChartGrid(!showChartGrid)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: showChartGrid ? 'rgba(204, 255, 51, 0.1)' : 'transparent',
                  color: showChartGrid ? '#ccff33' : '#ffffff',
                  opacity: showChartGrid ? 1 : 0.5
                }}
                title="Grid'i göster/gizle"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16M4 12h16M4 19h16" />
                </svg>
              </button>

              <button
                onClick={() => setShowChartArea(!showChartArea)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: showChartArea ? 'rgba(204, 255, 51, 0.1)' : 'transparent',
                  color: showChartArea ? '#ccff33' : '#ffffff',
                  opacity: showChartArea ? 1 : 0.5
                }}
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
          <div className="w-full mt-6 pt-6" style={{ height: '180px', borderTop: '1px solid #555555' }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold" style={{ color: '#ffffff' }}>İşlem Hacmi</h4>
                {trades.length > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full" style={{ color: '#ffffff', opacity: 0.7, backgroundColor: '#555555' }}>
                    {trades.length} işlem
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ccff33' }}></div>
                  <span style={{ color: '#ffffff', opacity: 0.7 }}>EVET</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FF0000' }}></div>
                  <span style={{ color: '#ffffff', opacity: 0.7 }}>HAYIR</span>
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
          {isBinaryMarket && (
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid #555555' }}>
              <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)', border: '1px solid rgba(204, 255, 51, 0.3)' }}>
                <div className="text-sm font-medium mb-1" style={{ color: '#ccff33' }}>EVET İhtimali</div>
                <div className="text-3xl font-bold" style={{ color: '#ccff33' }}>
                  {probabilities.yes.toFixed(1)}%
                </div>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
                <div className="text-sm font-medium mb-1" style={{ color: '#FF0000' }}>HAYIR İhtimali</div>
                <div className="text-3xl font-bold" style={{ color: '#FF0000' }}>
                  {probabilities.no.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
          
          {isMultipleChoice && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6 pt-6" style={{ borderTop: '1px solid #555555' }}>
              {market.options.map(option => (
                <div key={option.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)', border: '1px solid rgba(204, 255, 51, 0.3)' }}>
                  <div className="text-xs font-medium mb-1 truncate" style={{ color: '#ccff33' }} title={option.option_text}>
                    {option.option_text}
                  </div>
                  <div className="text-2xl font-bold" style={{ color: '#ccff33' }}>
                    {parseFloat(option.probability || 50).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Trading Panels */}
        {isMultipleChoice ? (
          /* Multiple Choice Options */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {market.options.map((option, idx) => (
              <div 
                key={option.id}
                className="rounded-xl p-6" 
                style={{ 
                  backgroundColor: 'rgba(204, 255, 51, 0.1)', 
                  border: '2px solid rgba(204, 255, 51, 0.3)' 
                }}
              >
                <div className="mb-4">
                  {option.option_image_url && (
                    <img 
                      src={option.option_image_url} 
                      alt={option.option_text}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="text-lg font-bold" style={{ color: '#ccff33' }}>
                    {option.option_text}
                  </h3>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium" style={{ color: '#ccff33', opacity: 0.8 }}>İhtimal:</span>
                    <span className="font-bold text-2xl" style={{ color: '#ccff33' }}>
                      {parseFloat(option.probability || 50).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium" style={{ color: '#ccff33', opacity: 0.8 }}>EVET Fiyatı:</span>
                    <span className="font-bold" style={{ color: '#ccff33' }}>
                      ₺{parseFloat(option.yes_price || 50).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium" style={{ color: '#ccff33', opacity: 0.8 }}>Hacim:</span>
                    <span className="font-bold" style={{ color: '#ccff33' }}>
                      ₺{(parseFloat(option.total_yes_volume || 0) + parseFloat(option.total_no_volume || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedOutcome(option.id);
                      setOrderType('BUY');
                      setShowBuyModal(true);
                    }}
                    disabled={market.status !== 'open' || !user}
                    className="w-full font-medium py-3 rounded-lg transition-colors"
                    style={{
                      backgroundColor: (market.status !== 'open' || !user) ? '#555555' : '#ccff33',
                      color: '#ffffff',
                      cursor: (market.status !== 'open' || !user) ? 'not-allowed' : 'pointer',
                      opacity: (market.status !== 'open' || !user) ? 0.5 : 1
                    }}
                  >
                    {!user ? 'Giriş Yapın' : 'EVET Satın Al'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOutcome(option.id);
                      setOrderType('SELL');
                      setShowBuyModal(true);
                    }}
                    disabled={market.status !== 'open' || !user}
                    className="w-full font-medium py-3 rounded-lg transition-colors"
                    style={{
                      backgroundColor: (market.status !== 'open' || !user) ? '#555555' : 'rgba(204, 255, 51, 0.2)',
                      color: '#ccff33',
                      cursor: (market.status !== 'open' || !user) ? 'not-allowed' : 'pointer',
                      opacity: (market.status !== 'open' || !user) ? 0.5 : 1,
                      border: '1px solid rgba(204, 255, 51, 0.3)'
                    }}
                  >
                    EVET Sat
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Binary Market (EVET/HAYIR) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* EVET Panel */}
          <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)', border: '2px solid rgba(204, 255, 51, 0.3)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#ccff33' }}>EVET</h3>
            
            <div className="mb-4 space-y-2">
              {yesBestBid && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium" style={{ color: '#ccff33', opacity: 0.8 }}>En İyi Alış:</span>
                  <span className="font-bold" style={{ color: '#ccff33' }}>₺{parseFloat(yesBestBid.price).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium" style={{ color: '#ccff33', opacity: 0.8 }}>Miktar:</span>
                <span className="font-bold" style={{ color: '#ccff33' }}>{yesBestBid?.quantity || 0} adet</span>
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
                className="w-full font-medium py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: (market.status !== 'open' || !user) ? '#555555' : '#ccff33',
                  color: '#ffffff',
                  cursor: (market.status !== 'open' || !user) ? 'not-allowed' : 'pointer',
                  opacity: (market.status !== 'open' || !user) ? 0.5 : 1
                }}
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
                className="w-full font-medium py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: (market.status !== 'open' || !user) ? '#555555' : 'rgba(204, 255, 51, 0.2)',
                  color: '#ccff33',
                  cursor: (market.status !== 'open' || !user) ? 'not-allowed' : 'pointer',
                  opacity: (market.status !== 'open' || !user) ? 0.5 : 1,
                  border: '1px solid rgba(204, 255, 51, 0.3)'
                }}
              >
                EVET Sat
              </button>
            </div>

            {/* EVET Order Book */}
            <div className="pt-4" style={{ borderTop: '1px solid rgba(204, 255, 51, 0.3)' }}>
              <h4 className="text-sm font-bold mb-3" style={{ color: '#ccff33' }}>Emir Defteri</h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-semibold mb-1.5" style={{ color: '#ccff33', opacity: 0.8 }}>Alış Emirleri (Bids)</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(orderBook.yes?.bids || []).slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 px-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <span className="font-medium" style={{ color: '#ccff33' }}>₺{parseFloat(order.price).toFixed(2)}</span>
                        <span style={{ color: '#ffffff', opacity: 0.7 }}>{order.quantity}</span>
                      </div>
                    ))}
                    {(!orderBook.yes?.bids || orderBook.yes.bids.length === 0) && (
                      <p className="text-xs italic py-2" style={{ color: '#ffffff', opacity: 0.5 }}>Emir yok</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold mb-1.5" style={{ color: '#ccff33', opacity: 0.8 }}>Satış Emirleri (Asks)</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(orderBook.yes?.asks || []).slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 px-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <span className="font-medium" style={{ color: '#ccff33' }}>₺{parseFloat(order.price).toFixed(2)}</span>
                        <span style={{ color: '#ffffff', opacity: 0.7 }}>{order.quantity}</span>
                      </div>
                    ))}
                    {(!orderBook.yes?.asks || orderBook.yes.asks.length === 0) && (
                      <p className="text-xs italic py-2" style={{ color: '#ffffff', opacity: 0.5 }}>Emir yok</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HAYIR Panel */}
          <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '2px solid rgba(255, 0, 0, 0.3)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#FF0000' }}>HAYIR</h3>
            
            <div className="mb-4 space-y-2">
              {noBestBid && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium" style={{ color: '#FF0000', opacity: 0.8 }}>En İyi Alış:</span>
                  <span className="font-bold" style={{ color: '#FF0000' }}>₺{parseFloat(noBestBid.price).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium" style={{ color: '#FF0000', opacity: 0.8 }}>Miktar:</span>
                <span className="font-bold" style={{ color: '#FF0000' }}>{noBestBid?.quantity || 0} adet</span>
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
                className="w-full font-medium py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: (market.status !== 'open' || !user) ? '#555555' : '#FF0000',
                  color: '#ffffff',
                  cursor: (market.status !== 'open' || !user) ? 'not-allowed' : 'pointer',
                  opacity: (market.status !== 'open' || !user) ? 0.5 : 1
                }}
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
                className="w-full font-medium py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: (market.status !== 'open' || !user) ? '#555555' : 'rgba(255, 0, 0, 0.2)',
                  color: '#FF0000',
                  cursor: (market.status !== 'open' || !user) ? 'not-allowed' : 'pointer',
                  opacity: (market.status !== 'open' || !user) ? 0.5 : 1,
                  border: '1px solid rgba(255, 0, 0, 0.3)'
                }}
              >
                HAYIR Sat
              </button>
            </div>

            {/* HAYIR Order Book */}
            <div className="pt-4" style={{ borderTop: '1px solid rgba(255, 0, 0, 0.3)' }}>
              <h4 className="text-sm font-bold mb-3" style={{ color: '#FF0000' }}>Emir Defteri</h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-semibold mb-1.5" style={{ color: '#FF0000', opacity: 0.8 }}>Alış Emirleri (Bids)</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(orderBook.no?.bids || []).slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 px-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <span className="font-medium" style={{ color: '#FF0000' }}>₺{parseFloat(order.price).toFixed(2)}</span>
                        <span style={{ color: '#ffffff', opacity: 0.7 }}>{order.quantity}</span>
                      </div>
                    ))}
                    {(!orderBook.no?.bids || orderBook.no.bids.length === 0) && (
                      <p className="text-xs italic py-2" style={{ color: '#ffffff', opacity: 0.5 }}>Emir yok</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold mb-1.5" style={{ color: '#FF0000', opacity: 0.8 }}>Satış Emirleri (Asks)</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(orderBook.no?.asks || []).slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 px-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <span className="font-medium" style={{ color: '#FF0000' }}>₺{parseFloat(order.price).toFixed(2)}</span>
                        <span style={{ color: '#ffffff', opacity: 0.7 }}>{order.quantity}</span>
                      </div>
                    ))}
                    {(!orderBook.no?.asks || orderBook.no.asks.length === 0) && (
                      <p className="text-xs italic py-2" style={{ color: '#ffffff', opacity: 0.5 }}>Emir yok</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Recent Trades */}
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#ffffff' }}>Son İşlemler</h3>
            <div className="space-y-2">
              {tradesLoading ? (
                <p className="text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>Yükleniyor...</p>
              ) : trades.length > 0 ? (
                trades.slice(0, 10).map((trade, idx) => (
                  <div 
                    key={idx} 
                    className="flex justify-between items-center text-sm py-2 px-3 rounded"
                    style={{ 
                      backgroundColor: trade.outcome ? 'rgba(204, 255, 51, 0.1)' : 'rgba(255, 0, 0, 0.1)'
                    }}
                  >
                    <span className="font-semibold" style={{ color: trade.outcome ? '#ccff33' : '#FF0000' }}>
                      {trade.outcome ? 'EVET' : 'HAYIR'}
                    </span>
                    <span className="font-medium" style={{ color: '#ffffff' }}>₺{parseFloat(trade.price).toFixed(2)}</span>
                    <span style={{ color: '#ffffff', opacity: 0.7 }}>{trade.quantity} adet</span>
                    <span className="text-xs" style={{ color: '#ffffff', opacity: 0.5 }}>
                      {new Date(trade.createdAt).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm italic" style={{ color: '#ffffff', opacity: 0.7 }}>Henüz işlem yok</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketDetailPage;
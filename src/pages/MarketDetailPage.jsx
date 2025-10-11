import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Clock, Wifi, RefreshCw, X, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { useMarketWebSocket, useNewTrades } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useMarket, useOrderBook, useMarketTrades, useCreateOrder } from '../hooks/useMarketQueries';

const MarketDetailPage = () => {
  const { id: marketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // React Query hooks - API verilerini yönet
  const { data: market, isLoading: marketLoading, error: marketError } = useMarket(marketId);
  const { data: initialOrderBook, isLoading: orderBookLoading } = useOrderBook(marketId);
  const { data: trades = [], isLoading: tradesLoading } = useMarketTrades(marketId, 100);
  const createOrderMutation = useCreateOrder();

  // Modal states
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [orderType, setOrderType] = useState('BUY');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderPrice, setOrderPrice] = useState('');

  // Chart tab
  const [chartTimeframe, setChartTimeframe] = useState('1h'); // 1h, 4h, 1d, all

  // WebSocket hook - real-time güncellemeler için
  const { isConnected: wsConnected, orderBook: liveOrderBook, lastUpdate } = useMarketWebSocket(marketId);
  
  // WebSocket'ten yeni trade geldiğinde trades listesini güncelle
  const handleNewTrade = useCallback((newTrade) => {
    console.log('🆕 Yeni trade alındı:', newTrade);
    // Trades listesini invalidate et, böylece yeniden fetch edilir
    queryClient.invalidateQueries({ queryKey: ['trades', marketId] });
  }, [queryClient, marketId]);
  
  // Yeni trade'leri dinle
  useNewTrades(marketId, handleNewTrade);

  // Prepare chart data from trades
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    // Sort trades by time (oldest first for chart)
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Group by outcome and create price points
    const data = sortedTrades.map((trade, idx) => ({
      time: new Date(trade.createdAt).toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      timestamp: new Date(trade.createdAt).getTime(),
      yes: trade.outcome ? parseFloat(trade.price) : null,
      no: !trade.outcome ? parseFloat(trade.price) : null,
    }));

    // Fill in missing values (carry forward last known price)
    let lastYes = 50;
    let lastNo = 50;
    
    return data.map(point => ({
      ...point,
      yes: point.yes !== null ? (lastYes = point.yes) : lastYes,
      no: point.no !== null ? (lastNo = point.no) : lastNo,
    }));
  }, [trades]);

  const handleOpenBuyModal = (outcome, type = 'BUY') => {
    if (!user) {
      createOrderMutation.reset(); // Önceki hataları temizle
      navigate('/login');
      return;
    }
    setSelectedOutcome(outcome);
    setOrderType(type);
    setOrderQuantity('');
    // Mevcut piyasa fiyatını default olarak ayarla
    const currentPrice = outcome ? yesPrice : noPrice;
    setOrderPrice(currentPrice.toFixed(2));
    setShowBuyModal(true);
  };

  const handleCloseBuyModal = () => {
    setShowBuyModal(false);
    setSelectedOutcome(null);
    setOrderQuantity('');
    setOrderPrice('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    const quantity = parseInt(orderQuantity);
    const price = parseFloat(orderPrice);

    if (!quantity || quantity <= 0) {
      return; // React Query mutation otomatik olarak hata yönetir
    }

    if (!price || price <= 0 || price > 100) {
      return; // React Query mutation otomatik olarak hata yönetir
    }

    // React Query mutation kullanarak order oluştur
    createOrderMutation.mutate(
      {
        marketId,
        type: orderType,
        outcome: selectedOutcome,
        quantity,
        price
      },
      {
        onSuccess: () => {
          // Modal'ı kapat
          handleCloseBuyModal();
          // NOT: fetchMarketData() artık gerekli değil!
          // React Query otomatik olarak ilgili verileri invalidate edip yenileyecek
        }
      }
    );
  };

  if (marketLoading || orderBookLoading || tradesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (marketError || !market) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Market bulunamadı</h2>
          <a href="/" className="text-brand-600 hover:underline">Anasayfaya dön</a>
        </div>
      </div>
    );
  }

  const orderBook = liveOrderBook || initialOrderBook;
  const yesPrice = parseFloat(orderBook?.yes?.midPrice) || 0.50;
  const noPrice = parseFloat(orderBook?.no?.midPrice) || 0.50;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* WebSocket Status */}
      <div className="fixed top-20 right-4 z-50">
        <div className={`px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm ${
          wsConnected 
            ? 'bg-green-100 border border-green-300 text-green-700' 
            : 'bg-yellow-100 border border-yellow-300 text-yellow-700'
        }`}>
          <Wifi className="w-4 h-4" />
          <span className="font-medium">
            {wsConnected ? 'Canlı' : 'Bağlanıyor...'}
          </span>
          {lastUpdate && (
            <span className="text-xs opacity-75">
              {lastUpdate.toLocaleTimeString('tr-TR')}
            </span>
          )}
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedOutcome ? 'EVET' : 'HAYIR'} {orderType === 'BUY' ? 'Al' : 'Sat'}
              </h3>
              <button onClick={handleCloseBuyModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emir Tipi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('BUY')}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      orderType === 'BUY' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ALIŞ
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('SELL')}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      orderType === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    SATIŞ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Miktar</label>
                <input
                  type="number"
                  min="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Örn: 10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Örn: 0.50"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mevcut fiyat: ₺{selectedOutcome ? yesPrice.toFixed(2) : noPrice.toFixed(2)}
                  <br />
                  <span className="text-brand-600 font-medium">Kazanan hisse değeri: 1.00 TL</span>
                </p>
              </div>

              {orderQuantity && orderPrice && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Toplam Tutar:</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₺{(parseFloat(orderQuantity) * parseFloat(orderPrice)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={createOrderMutation.isPending}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                  createOrderMutation.isPending ? 'bg-gray-400 cursor-not-allowed' :
                  selectedOutcome ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
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
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
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
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              market.status === 'open' ? 'bg-green-100 text-green-700' : 
              market.status === 'closed' ? 'bg-blue-100 text-blue-700' : 
              'bg-gray-100 text-gray-700'
            }`}>
              {market.status === 'open' ? 'Açık' : 
               market.status === 'closed' ? 'Kapandı' : 'Sonuçlandı'}
            </span>
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
                  {market.closing_date ? new Date(market.closing_date).toLocaleDateString('tr-TR') : 'Belirsiz'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-600" />
              Fiyat Grafiği
            </h3>
            {wsConnected && <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />}
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  formatter={(value) => `₺${value.toFixed(2)}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="yes" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="EVET"
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="no" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="HAYIR"
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Henüz yeterli veri yok</p>
            </div>
          )}
        </div>

        {/* Trading Panels */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border-2 border-green-200">
            <h3 className="text-lg font-bold mb-2 text-green-800">EVET</h3>
            <div className="text-4xl font-bold text-green-700 mb-2">
              ₺{yesPrice.toFixed(2)}
            </div>
            <p className="text-xs text-green-600 mb-4">Kazanç: ₺1.00</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenBuyModal(true, 'BUY')}
                disabled={market.status !== 'open'}
                className={`py-3 rounded-lg font-semibold text-white transition-colors ${
                  market.status === 'open' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {market.status === 'open' ? 'Al' : 'Kapalı'}
              </button>
              <button
                onClick={() => handleOpenBuyModal(true, 'SELL')}
                disabled={market.status !== 'open'}
                className={`py-3 rounded-lg font-semibold transition-colors ${
                  market.status === 'open' ? 'bg-white text-green-700 border-2 border-green-600 hover:bg-green-50' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {market.status === 'open' ? 'Sat' : 'Kapalı'}
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md p-6 border-2 border-red-200">
            <h3 className="text-lg font-bold mb-2 text-red-800">HAYIR</h3>
            <div className="text-4xl font-bold text-red-700 mb-2">
              ₺{noPrice.toFixed(2)}
            </div>
            <p className="text-xs text-red-600 mb-4">Kazanç: ₺1.00</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenBuyModal(false, 'BUY')}
                disabled={market.status !== 'open'}
                className={`py-3 rounded-lg font-semibold text-white transition-colors ${
                  market.status === 'open' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {market.status === 'open' ? 'Al' : 'Kapalı'}
              </button>
              <button
                onClick={() => handleOpenBuyModal(false, 'SELL')}
                disabled={market.status !== 'open'}
                className={`py-3 rounded-lg font-semibold transition-colors ${
                  market.status === 'open' ? 'bg-white text-red-700 border-2 border-red-600 hover:bg-red-50' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {market.status === 'open' ? 'Sat' : 'Kapalı'}
              </button>
            </div>
          </div>
        </div>

        {/* Order Books */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* YES Order Book */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
              <span>EVET Emir Defteri</span>
              {wsConnected && <RefreshCw className="w-4 h-4 animate-spin text-green-600" />}
            </h3>
            
            {/* ALIŞ EMİRLERİ (BIDS) */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Alış Emirleri
              </h4>
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600 grid grid-cols-3 gap-2 pb-1 border-b">
                  <span>Fiyat</span>
                  <span>Miktar</span>
                  <span className="text-right">Toplam</span>
                </div>
                {orderBook?.yes?.bids?.slice(0, 5).map((bid, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-green-600 font-medium">₺{bid.price}</span>
                    <span>{bid.quantity}</span>
                    <span className="text-right text-gray-600">₺{bid.total}</span>
                  </div>
                ))}
                {(!orderBook?.yes?.bids || orderBook.yes.bids.length === 0) && (
                  <div className="text-center text-gray-400 py-2 text-xs">Emir yok</div>
                )}
              </div>
            </div>

            {/* SATIŞ EMİRLERİ (ASKS) */}
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Satış Emirleri
              </h4>
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600 grid grid-cols-3 gap-2 pb-1 border-b">
                  <span>Fiyat</span>
                  <span>Miktar</span>
                  <span className="text-right">Toplam</span>
                </div>
                {orderBook?.yes?.asks?.slice(0, 5).map((ask, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-red-600 font-medium">₺{ask.price}</span>
                    <span>{ask.quantity}</span>
                    <span className="text-right text-gray-600">₺{ask.total}</span>
                  </div>
                ))}
                {(!orderBook?.yes?.asks || orderBook.yes.asks.length === 0) && (
                  <div className="text-center text-gray-400 py-2 text-xs">Emir yok</div>
                )}
              </div>
            </div>
          </div>

          {/* NO Order Book */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
              <span>HAYIR Emir Defteri</span>
              {wsConnected && <RefreshCw className="w-4 h-4 animate-spin text-red-600" />}
            </h3>
            
            {/* ALIŞ EMİRLERİ (BIDS) */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Alış Emirleri
              </h4>
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600 grid grid-cols-3 gap-2 pb-1 border-b">
                  <span>Fiyat</span>
                  <span>Miktar</span>
                  <span className="text-right">Toplam</span>
                </div>
                {orderBook?.no?.bids?.slice(0, 5).map((bid, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-green-600 font-medium">₺{bid.price}</span>
                    <span>{bid.quantity}</span>
                    <span className="text-right text-gray-600">₺{bid.total}</span>
                  </div>
                ))}
                {(!orderBook?.no?.bids || orderBook.no.bids.length === 0) && (
                  <div className="text-center text-gray-400 py-2 text-xs">Emir yok</div>
                )}
              </div>
            </div>

            {/* SATIŞ EMİRLERİ (ASKS) */}
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Satış Emirleri
              </h4>
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600 grid grid-cols-3 gap-2 pb-1 border-b">
                  <span>Fiyat</span>
                  <span>Miktar</span>
                  <span className="text-right">Toplam</span>
                </div>
                {orderBook?.no?.asks?.slice(0, 5).map((ask, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-red-600 font-medium">₺{ask.price}</span>
                    <span>{ask.quantity}</span>
                    <span className="text-right text-gray-600">₺{ask.total}</span>
                  </div>
                ))}
                {(!orderBook?.no?.asks || orderBook.no.asks.length === 0) && (
                  <div className="text-center text-gray-400 py-2 text-xs">Emir yok</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Son İşlemler</h3>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-600 grid grid-cols-4 gap-2 pb-2 border-b">
              <span>Taraf</span>
              <span>Fiyat</span>
              <span>Miktar</span>
              <span className="text-right">Zaman</span>
            </div>
            {trades.slice(0, 10).map((trade, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 text-sm">
                <span className={trade.outcome ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {trade.outcome ? 'EVET' : 'HAYIR'}
                </span>
                <span>₺{parseFloat(trade.price).toFixed(2)}</span>
                <span>{trade.quantity}</span>
                <span className="text-right text-gray-600">
                  {new Date(trade.createdAt).toLocaleTimeString('tr-TR')}
                </span>
              </div>
            ))}
            {trades.length === 0 && (
              <div className="text-center text-gray-500 py-8">Henüz işlem yok</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetailPage;
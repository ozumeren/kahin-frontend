import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Clock, Wifi, RefreshCw } from 'lucide-react';

const MarketDetailWithWebSocket = () => {
  const { id: marketId } = useParams();
  const [market, setMarket] = useState(null);
  const [orderBook, setOrderBook] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch initial market data
  useEffect(() => {
    fetchMarketData();
  }, [marketId]);

  // WebSocket connection
  useEffect(() => {
    if (!marketId) return;

    let ws = null;
    let isCleaningUp = false;

    const connect = () => {
      try {
        ws = new WebSocket('wss://api.kahinmarket.com/ws');

        ws.onopen = () => {
          if (isCleaningUp) {
            ws.close();
            return;
          }
          console.log('✅ WebSocket connected to market:', marketId);
          setWsConnected(true);

          // Subscribe to this market
          ws.send(JSON.stringify({
            type: 'subscribe',
            marketId: marketId
          }));
        };

        ws.onmessage = (event) => {
          if (isCleaningUp) return;
          
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'orderbook_update' && data.marketId === marketId) {
              setOrderBook(data.orderBook);
              setLastUpdate(new Date());
            }

            if (data.type === 'trade' && data.marketId === marketId) {
              setTrades(prev => [data.trade, ...prev].slice(0, 20));
            }
          } catch (error) {
            console.error('WebSocket message error:', error);
          }
        };

        ws.onclose = () => {
          if (isCleaningUp) return;
          console.log('🔴 WebSocket disconnected from market');
          setWsConnected(false);
        };

        ws.onerror = (error) => {
          console.warn('⚠️ WebSocket error (backend may not be ready):', error.type);
          setWsConnected(false);
        };
      } catch (error) {
        console.warn('⚠️ WebSocket connection failed:', error);
        setWsConnected(false);
      }
    };

    connect();

    return () => {
      isCleaningUp = true;
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'unsubscribe',
            marketId: marketId
          }));
        }
        ws.close();
      }
    };
  }, [marketId]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      
      // Fetch market
      const marketRes = await fetch(`https://api.kahinmarket.com/api/v1/markets/${marketId}`);
      const marketData = await marketRes.json();
      setMarket(marketData.data);

      // Fetch order book
      const obRes = await fetch(`https://api.kahinmarket.com/api/v1/markets/${marketId}/orderbook`);
      const obData = await obRes.json();
      setOrderBook(obData.data);

      // Fetch recent trades
      const tradesRes = await fetch(`https://api.kahinmarket.com/api/v1/trades/market/${marketId}?limit=20`);
      const tradesData = await tradesRes.json();
      setTrades(tradesData.trades || []);

    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Market bulunamadı</h2>
          <a href="/" className="text-brand-600 hover:underline">Anasayfaya dön</a>
        </div>
      </div>
    );
  }

  const yesPrice = orderBook?.yes?.midPrice || 50;
  const noPrice = orderBook?.no?.midPrice || 50;

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

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <a href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Geri Dön</span>
        </a>

        {/* Market Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{market.title}</h1>
              {market.description && (
                <p className="text-gray-600">{market.description}</p>
              )}
            </div>
            <span className={`badge ${
              market.status === 'open' ? 'badge-success' : 
              market.status === 'closed' ? 'badge-info' : 'badge-error'
            }`}>
              {market.status === 'open' ? 'Açık' : 
               market.status === 'closed' ? 'Kapandı' : 'Sonuçlandı'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Hacim</div>
              <div className="text-lg font-bold">₺{parseFloat(market.volume || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Kullanıcılar</div>
              <div className="text-lg font-bold">{market.tradersCount || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Bitiş</div>
              <div className="text-lg font-bold">
                {new Date(market.closing_date).toLocaleDateString('tr-TR')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Kategori</div>
              <div className="text-lg font-bold capitalize">{market.category || 'Genel'}</div>
            </div>
          </div>
        </div>

        {/* Trading Panels */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* YES Panel */}
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-green-800">EVET</h3>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-3xl font-bold text-green-600">
                  ₺{parseFloat(yesPrice).toFixed(2)}
                </span>
              </div>
            </div>
            <button className="w-full btn btn-yes py-4 text-lg">
              EVET Satın Al
            </button>
          </div>

          {/* NO Panel */}
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-800">HAYIR</h3>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <span className="text-3xl font-bold text-red-600">
                  ₺{parseFloat(noPrice).toFixed(2)}
                </span>
              </div>
            </div>
            <button className="w-full btn btn-no py-4 text-lg">
              HAYIR Satın Al
            </button>
          </div>
        </div>

        {/* Order Book */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* YES Order Book */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
              <span>EVET Emir Defteri</span>
              {wsConnected && <RefreshCw className="w-4 h-4 animate-spin text-green-600" />}
            </h3>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600 grid grid-cols-3 gap-2 pb-2 border-b">
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
                <div className="text-center text-gray-500 py-4 text-sm">
                  Emir yok
                </div>
              )}
            </div>
          </div>

          {/* NO Order Book */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
              <span>HAYIR Emir Defteri</span>
              {wsConnected && <RefreshCw className="w-4 h-4 animate-spin text-red-600" />}
            </h3>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600 grid grid-cols-3 gap-2 pb-2 border-b">
                <span>Fiyat</span>
                <span>Miktar</span>
                <span className="text-right">Toplam</span>
              </div>
              {orderBook?.no?.bids?.slice(0, 5).map((bid, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-red-600 font-medium">₺{bid.price}</span>
                  <span>{bid.quantity}</span>
                  <span className="text-right text-gray-600">₺{bid.total}</span>
                </div>
              ))}
              {(!orderBook?.no?.bids || orderBook.no.bids.length === 0) && (
                <div className="text-center text-gray-500 py-4 text-sm">
                  Emir yok
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="card">
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
              <div className="text-center text-gray-500 py-8">
                Henüz işlem yok
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetailWithWebSocket;
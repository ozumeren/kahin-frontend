import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Users, Info, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket, useOrderBook, useMarketTrades, useCreateOrder, usePortfolio } from '../hooks/useMarketQueries';
import { useMarketWebSocket, useNewTrades } from '../hooks/useWebSocket';
import toast from 'react-hot-toast';
import PriceChart from '../components/PriceChart';
import OutcomeCard from '../components/OutcomeCard';
import TradingPanel from '../components/TradingPanel';
import MarketStats from '../components/MarketStats';

const MarketDetailPageV2 = () => {
  const { id: marketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // API Data
  const { data: market, isLoading: marketLoading } = useMarket(marketId);
  const { data: orderBook } = useOrderBook(marketId);
  const { data: trades = [] } = useMarketTrades(marketId, 100);
  const { data: portfolio } = usePortfolio(!!user);
  
  // WebSocket
  const wsConnected = useMarketWebSocket(marketId);
  const newTrades = useNewTrades(marketId);
  
  // Local State
  const [selectedOutcome, setSelectedOutcome] = useState('YES');
  const [orderType, setOrderType] = useState('BUY');
  const [showAllOutcomes, setShowAllOutcomes] = useState(false);
  
  // Create order mutation
  const createOrderMutation = useCreateOrder();
  
  if (marketLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
               style={{ borderColor: '#ccff33' }}></div>
          <p style={{ color: '#ffffff' }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (!market) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: '#ffffff' }}>Market bulunamadı</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-lg font-medium"
            style={{ backgroundColor: '#ccff33', color: '#000000' }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate percentages
  const yesPrice = parseFloat(market.yesMidPrice || market.yesPrice || 0.50);
  const noPrice = parseFloat(market.noMidPrice || market.noPrice || 0.50);
  const yesPercentage = Math.round(yesPrice * 100);
  const noPercentage = Math.round(noPrice * 100);
  
  // Check if multiple choice market
  const isMultipleChoice = market.options && market.options.length > 0;
  
  // Format outcomes for display
  const outcomes = isMultipleChoice 
    ? market.options 
    : [
        { id: 'YES', name: 'Evet', price: yesPrice, percentage: yesPercentage, color: '#00ff88' },
        { id: 'NO', name: 'Hayır', price: noPrice, percentage: noPercentage, color: '#ff4444' }
      ];
  
  // Top outcomes for display
  const topOutcomes = outcomes.slice(0, 3);
  const otherOutcomes = outcomes.slice(3);
  
  // Total volume
  const totalVolume = parseFloat(market.volume || 0);
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#1a1a1a' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
              style={{ color: '#888888' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Marketler
            </button>
            
            {wsConnected && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#ccff33' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#ccff33' }}></div>
                <span>Canlı</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Info & Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Title Card */}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="flex items-start gap-4 mb-6">
                {market.image_url ? (
                  <img 
                    src={market.image_url} 
                    alt={market.title}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                       style={{ backgroundColor: '#1a1a1a' }}>
                    📊
                  </div>
                )}
                
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
                    {market.title}
                  </h1>
                  {market.description && (
                    <p className="text-sm" style={{ color: '#888888' }}>
                      {market.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm" style={{ color: '#666666' }}>
                      <Clock className="w-4 h-4 inline mr-1" />
                      {market.endDate ? new Date(market.endDate).toLocaleDateString('tr-TR') : 'Süresiz'}
                    </span>
                    <span className="text-sm" style={{ color: '#666666' }}>
                      <Users className="w-4 h-4 inline mr-1" />
                      {market.traders || 0} katılımcı
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Primary Outcomes Display */}
              <div className="grid grid-cols-2 gap-3">
                {!isMultipleChoice && (
                  <>
                    <button
                      onClick={() => setSelectedOutcome('YES')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedOutcome === 'YES' ? 'border-opacity-100' : 'border-opacity-30'
                      }`}
                      style={{ 
                        backgroundColor: 'rgba(0, 255, 136, 0.05)',
                        borderColor: '#00ff88'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: '#ffffff' }}>Evet</span>
                        <TrendingUp className="w-4 h-4" style={{ color: '#00ff88' }} />
                      </div>
                      <div className="text-2xl font-bold mb-1" style={{ color: '#00ff88' }}>
                        %{yesPercentage}
                      </div>
                      <div className="text-sm" style={{ color: '#666666' }}>
                        {yesPrice.toFixed(2)}₺
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setSelectedOutcome('NO')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedOutcome === 'NO' ? 'border-opacity-100' : 'border-opacity-30'
                      }`}
                      style={{ 
                        backgroundColor: 'rgba(255, 68, 68, 0.05)',
                        borderColor: '#ff4444'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: '#ffffff' }}>Hayır</span>
                        <TrendingDown className="w-4 h-4" style={{ color: '#ff4444' }} />
                      </div>
                      <div className="text-2xl font-bold mb-1" style={{ color: '#ff4444' }}>
                        %{noPercentage}
                      </div>
                      <div className="text-sm" style={{ color: '#666666' }}>
                        {noPrice.toFixed(2)}₺
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Chart */}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #1a1a1a' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>Fiyat Grafiği</h3>
              <PriceChart 
                trades={trades} 
                height={300}
                isMultipleChoice={isMultipleChoice}
                outcomes={outcomes}
              />
            </div>
            
            {/* Volume Stats */}
            <MarketStats 
              volume={totalVolume}
              traders={market.traders}
              liquidity={market.liquidity}
              createdAt={market.createdAt}
            />
            
            {/* All Outcomes List (for multiple choice) */}
            {isMultipleChoice && (
              <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #1a1a1a' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>
                    Tüm Seçenekler ({outcomes.length})
                  </h3>
                  {outcomes.length > 5 && (
                    <button
                      onClick={() => setShowAllOutcomes(!showAllOutcomes)}
                      className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                      style={{ color: '#ccff33' }}
                    >
                      {showAllOutcomes ? 'Daha az göster' : 'Tümünü göster'}
                      <ChevronDown className={`w-4 h-4 transform transition-transform ${
                        showAllOutcomes ? 'rotate-180' : ''
                      }`} />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {(showAllOutcomes ? outcomes : outcomes.slice(0, 5)).map((outcome) => (
                    <OutcomeCard
                      key={outcome.id}
                      outcome={outcome}
                      isSelected={selectedOutcome === outcome.id}
                      onClick={() => setSelectedOutcome(outcome.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Trading Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <TradingPanel
                market={market}
                selectedOutcome={selectedOutcome}
                orderType={orderType}
                setOrderType={setOrderType}
                portfolio={portfolio}
                orderBook={orderBook}
                onCreateOrder={createOrderMutation.mutate}
                isCreatingOrder={createOrderMutation.isPending}
                user={user}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetailPageV2;
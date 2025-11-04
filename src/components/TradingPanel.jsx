import React, { useState } from 'react';
import { Info, TrendingUp, AlertCircle, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

const TradingPanel = ({ 
  market, 
  selectedOutcome,
  setSelectedOutcome,
  orderType, 
  setOrderType,
  portfolio,
  orderBook,
  onCreateOrder,
  isCreatingOrder,
  user
}) => {
  const [contracts, setContracts] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [orderMode, setOrderMode] = useState('market'); // market or limit
  
  // Calculate prices
  const yesPrice = parseFloat(market.yesMidPrice || market.yesPrice || 0.50);
  const noPrice = parseFloat(market.noMidPrice || market.noPrice || 0.50);
  const currentPrice = selectedOutcome === 'YES' ? yesPrice : noPrice;
  
  // Calculate total cost
  const priceToUse = orderMode === 'limit' && limitPrice ? parseFloat(limitPrice) : currentPrice;
  const totalCost = contracts * priceToUse;
  const potentialProfit = contracts * (1 - priceToUse);
  const returnPercentage = ((potentialProfit / totalCost) * 100).toFixed(1);
  
  // User balance
  const userBalance = portfolio?.balance || 0;
  const hasEnoughBalance = userBalance >= totalCost;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('İşlem yapmak için giriş yapmalısınız');
      return;
    }
    
    if (!contracts || contracts <= 0) {
      toast.error('Geçerli bir kontrat miktarı giriniz');
      return;
    }
    
    if (orderMode === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error('Geçerli bir limit fiyat giriniz');
      return;
    }
    
    if (!hasEnoughBalance && orderType === 'BUY') {
      toast.error('Yetersiz bakiye');
      return;
    }
    
    const orderData = {
      marketId: market.id,
      type: orderType,
      outcome: selectedOutcome,
      quantity: contracts,
      price: orderMode === 'limit' ? parseFloat(limitPrice) : null,
      orderType: orderMode === 'limit' ? 'limit' : 'market'
    };
    
    onCreateOrder(orderData);
  };
  
  const handleContractsChange = (value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= 10000) {
      setContracts(numValue);
    }
  };
  
  const adjustContracts = (amount) => {
    const newValue = contracts + amount;
    if (newValue >= 1 && newValue <= 10000) {
      setContracts(newValue);
    }
  };
  
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111111', border: '1px solid #1a1a1a' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: '#1a1a1a' }}>
        <h3 className="font-semibold mb-3" style={{ color: '#ffffff' }}>İşlem Paneli</h3>
        
        {/* Buy/Sell Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg" style={{ backgroundColor: '#0a0a0a' }}>
          <button
            onClick={() => setOrderType('BUY')}
            className={`py-2 px-4 rounded-md font-medium transition-all ${
              orderType === 'BUY' ? 'shadow-lg' : ''
            }`}
            style={{
              backgroundColor: orderType === 'BUY' ? '#00ff88' : 'transparent',
              color: orderType === 'BUY' ? '#000000' : '#666666'
            }}
          >
            Satın Al
          </button>
          <button
            onClick={() => setOrderType('SELL')}
            className={`py-2 px-4 rounded-md font-medium transition-all ${
              orderType === 'SELL' ? 'shadow-lg' : ''
            }`}
            style={{
              backgroundColor: orderType === 'SELL' ? '#ff4444' : 'transparent',
              color: orderType === 'SELL' ? '#ffffff' : '#666666'
            }}
          >
            Sat
          </button>
        </div>
      </div>
      
      {/* Outcome Selection */}
      <div className="p-4 border-b" style={{ borderColor: '#1a1a1a' }}>
        <label className="text-xs font-medium mb-2 block" style={{ color: '#666666' }}>
          Seçim
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedOutcome('YES');
            }}
            className={`py-3 px-4 rounded-lg font-medium transition-all relative z-10 ${
              selectedOutcome === 'YES' ? 'ring-2' : ''
            }`}
            style={{
              backgroundColor: selectedOutcome === 'YES' ? 'rgba(0, 255, 136, 0.1)' : '#0a0a0a',
              color: selectedOutcome === 'YES' ? '#00ff88' : '#666666',
              borderColor: '#00ff88',
              border: selectedOutcome === 'YES' ? '1px solid' : '1px solid #1a1a1a',
              cursor: 'pointer'
            }}
          >
            <div className="text-sm">Evet</div>
            <div className="text-lg font-bold mt-1">{yesPrice.toFixed(2)}₺</div>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedOutcome('NO');
            }}
            className={`py-3 px-4 rounded-lg font-medium transition-all relative z-10 ${
              selectedOutcome === 'NO' ? 'ring-2' : ''
            }`}
            style={{
              backgroundColor: selectedOutcome === 'NO' ? 'rgba(255, 68, 68, 0.1)' : '#0a0a0a',
              color: selectedOutcome === 'NO' ? '#ff4444' : '#666666',
              borderColor: '#ff4444',
              border: selectedOutcome === 'NO' ? '1px solid' : '1px solid #1a1a1a',
              cursor: 'pointer'
            }}
          >
            <div className="text-sm">Hayır</div>
            <div className="text-lg font-bold mt-1">{noPrice.toFixed(2)}₺</div>
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Contracts Input */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: '#666666' }}>
            Kontrat Sayısı
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustContracts(-10)}
              className="p-2 rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              <Minus className="w-4 h-4" style={{ color: '#ffffff' }} />
            </button>
            <input
              type="number"
              value={contracts}
              onChange={(e) => handleContractsChange(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg text-center font-medium"
              style={{
                backgroundColor: '#0a0a0a',
                color: '#ffffff',
                border: '1px solid #1a1a1a'
              }}
              min="1"
              max="10000"
            />
            <button
              type="button"
              onClick={() => adjustContracts(1)}
              className="p-2 rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              <Plus className="w-4 h-4" style={{ color: '#ffffff' }} />
            </button>
          </div>
        </div>
        
        {/* Order Type Toggle */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: '#666666' }}>
            Emir Tipi
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg" style={{ backgroundColor: '#0a0a0a' }}>
            <button
              type="button"
              onClick={() => setOrderMode('market')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-all`}
              style={{
                backgroundColor: orderMode === 'market' ? '#1a1a1a' : 'transparent',
                color: orderMode === 'market' ? '#ffffff' : '#666666'
              }}
            >
              Piyasa
            </button>
            <button
              type="button"
              onClick={() => setOrderMode('limit')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-all`}
              style={{
                backgroundColor: orderMode === 'limit' ? '#1a1a1a' : 'transparent',
                color: orderMode === 'limit' ? '#ffffff' : '#666666'
              }}
            >
              Limit
            </button>
          </div>
        </div>
        
        {/* Limit Price Input */}
        {orderMode === 'limit' && (
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: '#666666' }}>
              Limit Fiyat (₺)
            </label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              max="0.99"
              className="w-full px-3 py-2 rounded-lg"
              style={{
                backgroundColor: '#0a0a0a',
                color: '#ffffff',
                border: '1px solid #1a1a1a'
              }}
            />
          </div>
        )}
        
        {/* Interest Rate Info */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(204, 255, 51, 0.05)', border: '1px solid rgba(204, 255, 51, 0.2)' }}>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: '#ccff33' }}>Kazanç %3.5 Faiz</span>
            <Info className="w-3 h-3" style={{ color: '#ccff33' }} />
          </div>
        </div>
        
        {/* Cost Summary */}
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#666666' }}>Toplam Maliyet</span>
            <span style={{ color: '#ffffff' }}>{totalCost.toFixed(2)}₺</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#666666' }}>Potansiyel Kar</span>
            <span style={{ color: '#00ff88' }}>+{potentialProfit.toFixed(2)}₺</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#666666' }}>Getiri</span>
            <span style={{ color: '#00ff88' }}>+{returnPercentage}%</span>
          </div>
        </div>
        
        {/* Balance Warning */}
        {user && !hasEnoughBalance && orderType === 'BUY' && (
          <div className="rounded-lg p-3 flex items-center gap-2" 
               style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
            <AlertCircle className="w-4 h-4" style={{ color: '#ff4444' }} />
            <span className="text-xs" style={{ color: '#ff4444' }}>
              Yetersiz bakiye. Mevcut: {userBalance.toFixed(2)}₺
            </span>
          </div>
        )}
        
        {/* Submit Button */}
        {user ? (
          <button
            type="submit"
            disabled={isCreatingOrder || (orderType === 'BUY' && !hasEnoughBalance)}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: orderType === 'BUY' ? '#00ff88' : '#ff4444',
              color: orderType === 'BUY' ? '#000000' : '#ffffff'
            }}
          >
            {isCreatingOrder ? 'İşleniyor...' : `${orderType === 'BUY' ? 'Satın Al' : 'Sat'}`}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => window.location.href = '/login'}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90"
            style={{
              backgroundColor: '#ccff33',
              color: '#000000'
            }}
          >
            İşlem için Giriş Yap
          </button>
        )}
        
        {/* Footer Note */}
        <p className="text-xs text-center" style={{ color: '#666666' }}>
          Piyasayı anında girdikten sonra iptal edemezsiniz
        </p>
      </form>
    </div>
  );
};

export default TradingPanel;
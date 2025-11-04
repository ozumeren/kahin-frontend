import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const OutcomeCard = ({ outcome, isSelected, onClick, showBuyButton = true }) => {
  const percentageChange = outcome.change || 0;
  const isPositive = percentageChange >= 0;
  
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] ${
        isSelected ? 'ring-2' : ''
      }`}
      style={{
        backgroundColor: isSelected ? 'rgba(204, 255, 51, 0.05)' : '#0f0f0f',
        borderColor: isSelected ? '#ccff33' : '#1a1a1a',
        border: '1px solid',
        ringColor: isSelected ? '#ccff33' : 'transparent'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {outcome.image && (
              <img 
                src={outcome.image} 
                alt={outcome.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-sm" style={{ color: '#ffffff' }}>
                {outcome.name}
              </h4>
              {outcome.party && (
                <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
                  {outcome.party}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold" style={{ color: outcome.color || '#ffffff' }}>
                  {outcome.percentage}%
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" style={{ color: '#00ff88' }} />
                  ) : (
                    <TrendingDown className="w-3 h-3" style={{ color: '#ff4444' }} />
                  )}
                  <span 
                    className="text-xs font-medium"
                    style={{ color: isPositive ? '#00ff88' : '#ff4444' }}
                  >
                    {isPositive ? '+' : ''}{percentageChange}%
                  </span>
                </div>
              </div>
            </div>
            
            {showBuyButton && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(outcome.id, 'YES');
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                  style={{ 
                    backgroundColor: '#2563eb',
                    color: '#ffffff'
                  }}
                >
                  Evet {outcome.yesPrice}₺
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(outcome.id, 'NO');
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: '#ff4dc4',
                    border: '1px solid #ff4dc4'
                  }}
                >
                  Hayır {outcome.noPrice}₺
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutcomeCard;
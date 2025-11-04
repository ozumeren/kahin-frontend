import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const OutcomeCard = ({ outcome, isSelected, onClick, showBuyButton = true }) => {
  const percentageChange = outcome.change || 0;
  const isPositive = percentageChange >= 0;
  
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.01] ${
        isSelected ? 'ring-2' : ''
      }`}
      style={{
        backgroundColor: isSelected ? 'rgba(204, 255, 51, 0.1)' : '#111111',
        borderColor: isSelected ? '#ccff33' : '#555555',
        border: '2px solid',
        ringColor: isSelected ? '#ccff33' : 'transparent'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {outcome.image && (
              <img 
                src={outcome.image} 
                alt={outcome.name}
                className="w-12 h-12 rounded-lg object-cover border-2"
                style={{ borderColor: '#555555' }}
              />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-base" style={{ color: '#ffffff' }}>
                {outcome.name}
              </h4>
              {outcome.party && (
                <p className="text-xs mt-1" style={{ color: '#888888' }}>
                  {outcome.party}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-3xl font-bold" style={{ color: isSelected ? '#ccff33' : '#ffffff' }}>
                  {outcome.percentage}%
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" style={{ color: '#ccff33' }} />
                  ) : (
                    <TrendingDown className="w-4 h-4" style={{ color: '#FF0000' }} />
                  )}
                  <span 
                    className="text-sm font-medium"
                    style={{ color: isPositive ? '#ccff33' : '#FF0000' }}
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
                    e.preventDefault();
                    e.stopPropagation();
                    onClick(outcome.id, 'YES');
                  }}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                  style={{ 
                    backgroundColor: '#ccff33',
                    color: '#111111'
                  }}
                >
                  Evet {outcome.yesPrice}₺
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick(outcome.id, 'NO');
                  }}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                  style={{ 
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    color: '#FF0000',
                    border: '2px solid #FF0000'
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
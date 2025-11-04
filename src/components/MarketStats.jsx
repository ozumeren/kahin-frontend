import React from 'react';
import { TrendingUp, Users, DollarSign, Clock, Activity, BarChart3 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const MarketStats = ({ volume = 0, traders = 0, liquidity = 0, createdAt }) => {
  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M ₺`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K ₺`;
    }
    return `${value.toFixed(2)} ₺`;
  };
  
  const stats = [
    {
      label: 'Toplam Hacim',
      value: formatCurrency(volume),
      icon: TrendingUp,
      color: '#00ff88',
      bgColor: 'rgba(0, 255, 136, 0.1)'
    },
    {
      label: 'Katılımcı',
      value: traders.toLocaleString('tr-TR'),
      icon: Users,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      label: 'Likidite',
      value: formatCurrency(liquidity),
      icon: DollarSign,
      color: '#ccff33',
      bgColor: 'rgba(204, 255, 51, 0.1)'
    },
    {
      label: 'Oluşturulma',
      value: createdAt ? formatDistanceToNow(new Date(createdAt), { locale: tr, addSuffix: true }) : '-',
      icon: Clock,
      color: '#ff4dc4',
      bgColor: 'rgba(255, 77, 196, 0.1)'
    }
  ];
  
  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #1a1a1a' }}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5" style={{ color: '#ffffff' }} />
        <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>
          Market İstatistikleri
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="rounded-lg p-4 transition-all hover:scale-[1.02]"
            style={{ backgroundColor: '#0f0f0f', border: '1px solid #1a1a1a' }}
          >
            <div className="flex items-start justify-between mb-2">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: stat.bgColor }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              {stat.trend && (
                <span 
                  className="text-xs font-medium"
                  style={{ color: stat.trend > 0 ? '#00ff88' : '#ff4444' }}
                >
                  {stat.trend > 0 ? '+' : ''}{stat.trend}%
                </span>
              )}
            </div>
            <div className="text-xs mb-1" style={{ color: '#666666' }}>
              {stat.label}
            </div>
            <div className="text-xl font-bold" style={{ color: '#ffffff' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      
      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: '#1a1a1a' }}>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: '#00ff88' }} />
            <span style={{ color: '#666666' }}>Son İşlem</span>
          </div>
          <span style={{ color: '#ffffff' }}>Şimdi</span>
        </div>
      </div>
    </div>
  );
};

export default MarketStats;
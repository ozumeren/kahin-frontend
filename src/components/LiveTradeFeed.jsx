import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'

export default function LiveTradeFeed({ marketId, wsData }) {
  const [recentTrades, setRecentTrades] = useState([])

  useEffect(() => {
    if (wsData?.type === 'trade' && wsData?.trade) {
      // Add new trade to the top
      setRecentTrades(prev => [
        wsData.trade,
        ...prev.slice(0, 9) // Keep only last 10
      ])
    }
  }, [wsData])

  if (recentTrades.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-gray-500">Canlı işlemler burada görünecek...</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Canlı İşlemler</h3>
        <div className="flex items-center gap-1 text-xs text-yes">
          <div className="w-2 h-2 bg-yes rounded-full animate-pulse"></div>
          <span>Canlı</span>
        </div>
      </div>

      <div className="space-y-2">
        {recentTrades.map((trade, index) => (
          <div
            key={trade.id || index}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg animate-fade-in"
          >
            <div className="flex items-center gap-2">
              {trade.myAction === 'BUY' ? (
                <TrendingUp className="w-4 h-4 text-yes" />
              ) : (
                <TrendingDown className="w-4 h-4 text-no" />
              )}
              <span className={`text-sm font-medium ${
                trade.outcome ? 'text-yes' : 'text-no'
              }`}>
                {trade.outcome ? 'EVET' : 'HAYIR'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-mono">₺{trade.price}</span>
              <span className="text-sm text-gray-600">{trade.quantity}</span>
              <span className="text-xs text-gray-500">
                {format(new Date(trade.createdAt), 'HH:mm:ss')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import {
  Trophy,
  Medal,
  TrendingUp,
  Users,
  Crown,
  Loader
} from 'lucide-react'

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState('all')

  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['leaderboard', timeframe],
    queryFn: async () => {
      const response = await apiClient.get('/users/leaderboard', {
        params: { limit: 50, timeframe }
      })
      return response.data.data
    }
  })

  const timeframes = [
    { id: 'all', label: 'Tüm Zamanlar' },
    { id: 'month', label: 'Bu Ay' },
    { id: 'week', label: 'Bu Hafta' }
  ]

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6" style={{ color: '#FFD700' }} />
    if (rank === 2) return <Medal className="w-6 h-6" style={{ color: '#C0C0C0' }} />
    if (rank === 3) return <Medal className="w-6 h-6" style={{ color: '#CD7F32' }} />
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold" style={{ color: '#888888' }}>#{rank}</span>
  }

  const getRankStyle = (rank) => {
    if (rank === 1) return { backgroundColor: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)' }
    if (rank === 2) return { backgroundColor: 'rgba(192, 192, 192, 0.1)', border: '1px solid rgba(192, 192, 192, 0.3)' }
    if (rank === 3) return { backgroundColor: 'rgba(205, 127, 50, 0.1)', border: '1px solid rgba(205, 127, 50, 0.3)' }
    return { backgroundColor: '#111111', border: '1px solid #555555' }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-8" style={{ backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin" style={{ color: '#ccff33' }} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-8" style={{ backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4">
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <p style={{ color: '#FF0000' }}>Leaderboard yüklenirken bir hata oluştu.</p>
          </div>
        </div>
      </div>
    )
  }

  const leaders = leaderboardData?.leaders || leaderboardData || []

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111111' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(204, 255, 51, 0.2)' }}>
              <Trophy className="w-6 h-6" style={{ color: '#ccff33' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: '#ffffff' }}>Liderlik Tablosu</h1>
              <p className="text-sm" style={{ color: '#888888' }}>En başarılı traderları keşfedin</p>
            </div>
          </div>

          {/* Timeframe Tabs */}
          <div className="flex gap-2">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: timeframe === tf.id ? '#ccff33' : 'transparent',
                  color: timeframe === tf.id ? '#111111' : '#ffffff',
                  border: timeframe === tf.id ? 'none' : '1px solid #555555'
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="container mx-auto px-4 py-8">
        {leaders.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#555555' }}>
              <Users className="w-10 h-10" style={{ color: '#ffffff', opacity: 0.5 }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#ffffff' }}>Henüz veri yok</h3>
            <p style={{ color: '#ffffff', opacity: 0.7 }}>Bu dönem için henüz liderlik tablosu oluşmamış</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 3 Featured */}
            {leaders.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {leaders.slice(0, 3).map((user, index) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    className="rounded-xl p-6 text-center transition-all hover:brightness-110"
                    style={getRankStyle(index + 1)}
                  >
                    <div className="flex justify-center mb-3">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
                      style={{ backgroundColor: '#555555', color: '#ffffff' }}>
                      {user.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <h3 className="font-semibold mb-1" style={{ color: '#ffffff' }}>{user.username}</h3>
                    <div className="flex items-center justify-center gap-1" style={{ color: '#ccff33' }}>
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold">₺{parseFloat(user.totalProfit || user.profit || 0).toFixed(2)}</span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: '#888888' }}>
                      {user.totalTrades || user.trades || 0} işlem
                    </p>
                  </Link>
                ))}
              </div>
            )}

            {/* Rest of the list */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #555555' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#1a1a1a' }}>
                    <th className="px-6 py-4 text-left text-sm font-medium" style={{ color: '#888888' }}>Sıra</th>
                    <th className="px-6 py-4 text-left text-sm font-medium" style={{ color: '#888888' }}>Trader</th>
                    <th className="px-6 py-4 text-right text-sm font-medium" style={{ color: '#888888' }}>Kâr</th>
                    <th className="px-6 py-4 text-right text-sm font-medium hidden md:table-cell" style={{ color: '#888888' }}>İşlem Sayısı</th>
                    <th className="px-6 py-4 text-right text-sm font-medium hidden lg:table-cell" style={{ color: '#888888' }}>Başarı Oranı</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.slice(3).map((user, index) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:brightness-110"
                      style={{
                        backgroundColor: '#111111',
                        borderTop: '1px solid #333333'
                      }}
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium" style={{ color: '#888888' }}>#{index + 4}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/profile/${user.id}`} className="flex items-center gap-3 hover:opacity-80">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                            style={{ backgroundColor: '#555555', color: '#ffffff' }}>
                            {user.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="font-medium" style={{ color: '#ffffff' }}>{user.username}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold" style={{ color: parseFloat(user.totalProfit || user.profit || 0) >= 0 ? '#ccff33' : '#FF0000' }}>
                          {parseFloat(user.totalProfit || user.profit || 0) >= 0 ? '+' : ''}₺{parseFloat(user.totalProfit || user.profit || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right hidden md:table-cell">
                        <span style={{ color: '#ffffff' }}>{user.totalTrades || user.trades || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right hidden lg:table-cell">
                        <span style={{ color: '#ffffff' }}>{user.winRate ? `${(user.winRate * 100).toFixed(1)}%` : '-'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

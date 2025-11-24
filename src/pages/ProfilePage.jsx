import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import {
  User,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Edit3,
  Save,
  X,
  Loader,
  Trophy,
  BarChart3,
  Percent
} from 'lucide-react'

export default function ProfilePage() {
  const { id } = useParams()
  const { user: currentUser, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ bio: '' })

  // Kendi profilimiz mi yoksa başkasının mı?
  const isOwnProfile = !id || id === 'me' || id === currentUser?.id

  // Profil verisi
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['profile', isOwnProfile ? 'me' : id],
    queryFn: async () => {
      if (isOwnProfile) {
        const response = await apiClient.get('/users/me')
        return response.data.data || response.data
      } else {
        const response = await apiClient.get(`/users/${id}/public`)
        return response.data.data || response.data
      }
    },
    enabled: isOwnProfile ? isAuthenticated : true
  })

  // Kullanıcı istatistikleri
  const { data: statsData } = useQuery({
    queryKey: ['userStats', isOwnProfile ? 'me' : id],
    queryFn: async () => {
      if (isOwnProfile) {
        const response = await apiClient.get('/users/me/stats')
        return response.data.data || response.data
      }
      return null
    },
    enabled: isOwnProfile && isAuthenticated
  })

  // Profil güncelleme mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.put('/users/me', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile', 'me'])
      setIsEditing(false)
    }
  })

  const handleEdit = () => {
    setEditForm({ bio: profileData?.bio || '' })
    setIsEditing(true)
  }

  const handleSave = () => {
    updateProfileMutation.mutate(editForm)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({ bio: '' })
  }

  if (!isAuthenticated && isOwnProfile) {
    return (
      <div className="min-h-screen py-16" style={{ backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto rounded-2xl p-8 text-center" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(204, 255, 51, 0.2)' }}>
              <User className="w-8 h-8" style={{ color: '#ccff33' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>Giriş Yapın</h2>
            <p className="mb-6" style={{ color: '#ffffff', opacity: 0.7 }}>
              Profilinizi görüntülemek için giriş yapmanız gerekiyor
            </p>
            <Link to="/login" className="inline-block px-6 py-3 rounded-lg font-medium transition-all hover:brightness-110" style={{ backgroundColor: '#555555', color: '#ffffff' }}>
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    )
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
            <p style={{ color: '#FF0000' }}>Profil yüklenirken bir hata oluştu.</p>
          </div>
        </div>
      </div>
    )
  }

  const profile = profileData || {}
  const stats = statsData || {}

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111111' }}>
      {/* Profile Header */}
      <div style={{ borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
              style={{ backgroundColor: '#555555', color: '#ffffff' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                profile.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold" style={{ color: '#ffffff' }}>{profile.username}</h1>
                {isOwnProfile && (
                  <button
                    onClick={handleEdit}
                    className="p-2 rounded-lg transition-all hover:brightness-110"
                    style={{ backgroundColor: '#555555' }}
                  >
                    <Edit3 className="w-4 h-4" style={{ color: '#ffffff' }} />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-3 max-w-md">
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Kendinizden bahsedin..."
                    className="w-full px-4 py-2 rounded-lg text-sm resize-none"
                    style={{ backgroundColor: '#1a1a1a', color: '#ffffff', border: '1px solid #555555' }}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:brightness-110"
                      style={{ backgroundColor: '#ccff33', color: '#111111' }}
                    >
                      <Save className="w-4 h-4" />
                      Kaydet
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:brightness-110"
                      style={{ backgroundColor: '#555555', color: '#ffffff' }}
                    >
                      <X className="w-4 h-4" />
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#888888' }}>{profile.bio || 'Henüz bir açıklama eklenmemiş'}</p>
              )}

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-sm" style={{ color: '#888888' }}>
                  <Calendar className="w-4 h-4" />
                  <span>Katılım: {new Date(profile.createdAt || profile.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            </div>

            {/* Balance (only for own profile) */}
            {isOwnProfile && (
              <div className="rounded-xl p-4 text-right" style={{ backgroundColor: '#1a1a1a', border: '1px solid #555555' }}>
                <div className="text-sm mb-1" style={{ color: '#888888' }}>Bakiye</div>
                <div className="text-2xl font-bold" style={{ color: '#ccff33' }}>
                  ₺{parseFloat(profile.balance || 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-6" style={{ color: '#ffffff' }}>İstatistikler</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: '#888888' }}>Toplam İşlem</span>
              <BarChart3 className="w-5 h-5" style={{ color: '#ccff33' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
              {stats.totalTrades || profile.totalTrades || 0}
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: '#888888' }}>Toplam Kâr</span>
              <TrendingUp className="w-5 h-5" style={{ color: '#ccff33' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: parseFloat(stats.totalProfit || profile.totalProfit || 0) >= 0 ? '#ccff33' : '#FF0000' }}>
              {parseFloat(stats.totalProfit || profile.totalProfit || 0) >= 0 ? '+' : ''}₺{parseFloat(stats.totalProfit || profile.totalProfit || 0).toFixed(2)}
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: '#888888' }}>Başarı Oranı</span>
              <Percent className="w-5 h-5" style={{ color: '#3b82f6' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
              {stats.winRate ? `${(stats.winRate * 100).toFixed(1)}%` : profile.winRate ? `${(profile.winRate * 100).toFixed(1)}%` : '-'}
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: '#888888' }}>Aktif Pozisyon</span>
              <Target className="w-5 h-5" style={{ color: '#a855f7' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
              {stats.activePositions || profile.activePositions || 0}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {isOwnProfile && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>Hızlı Erişim</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/portfolio"
                className="rounded-xl p-6 transition-all hover:brightness-110 flex items-center gap-4"
                style={{ backgroundColor: '#111111', border: '1px solid #555555' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(204, 255, 51, 0.2)' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: '#ccff33' }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: '#ffffff' }}>Portfolyo</h3>
                  <p className="text-sm" style={{ color: '#888888' }}>Pozisyonlarınızı görüntüleyin</p>
                </div>
              </Link>

              <Link
                to="/leaderboard"
                className="rounded-xl p-6 transition-all hover:brightness-110 flex items-center gap-4"
                style={{ backgroundColor: '#111111', border: '1px solid #555555' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 215, 0, 0.2)' }}>
                  <Trophy className="w-6 h-6" style={{ color: '#FFD700' }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: '#ffffff' }}>Liderlik Tablosu</h3>
                  <p className="text-sm" style={{ color: '#888888' }}>Sıralamanızı görün</p>
                </div>
              </Link>

              <Link
                to="/"
                className="rounded-xl p-6 transition-all hover:brightness-110 flex items-center gap-4"
                style={{ backgroundColor: '#111111', border: '1px solid #555555' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                  <Target className="w-6 h-6" style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: '#ffffff' }}>Marketler</h3>
                  <p className="text-sm" style={{ color: '#888888' }}>Yeni fırsatları keşfedin</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

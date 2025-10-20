import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import { 
  Users, 
  TrendingUp, 
  PlusCircle, 
  Search,
  DollarSign,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Award,
  Shield
} from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { id: 'users', label: 'Kullanıcılar', icon: Users },
    { id: 'markets', label: 'Marketler', icon: TrendingUp },
    { id: 'add-shares', label: 'Hisse Ekle', icon: PlusCircle },
    { id: 'create-market', label: 'Market Oluştur', icon: Award },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111111' }}>
      {/* Header */}
      <div className="border-b" style={{ backgroundColor: '#111111', borderColor: '#555555' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)' }}>
              <Shield className="w-6 h-6" style={{ color: '#ccff33' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#ffffff' }}>Admin Panel</h1>
              <p style={{ color: '#ffffff', opacity: 0.7 }}>Sistem yönetimi ve kontrol paneli</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 py-3 border-b-2 font-medium transition-all"
                  style={{
                    borderColor: activeTab === tab.id ? '#ccff33' : 'transparent',
                    color: activeTab === tab.id ? '#ccff33' : '#ffffff',
                    opacity: activeTab === tab.id ? 1 : 0.7
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'users' && <UsersPanel searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {activeTab === 'markets' && <MarketsPanel />}
        {activeTab === 'add-shares' && <AddSharesPanel />}
        {activeTab === 'create-market' && <CreateMarketPanel />}
      </div>
    </div>
  )
}

// Users Panel
function UsersPanel({ searchQuery, setSearchQuery }) {
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState(null)
  const [balanceAmount, setBalanceAmount] = useState('')

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', searchQuery],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/users?search=${searchQuery}`)
      return response.data.data
    }
  })

  const addBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }) => {
      const response = await apiClient.post(`/admin/users/${userId}/add-balance`, {
        amount: parseFloat(amount),
        description: 'Admin tarafından eklenen bakiye'
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Bakiye başarıyla eklendi')
      queryClient.invalidateQueries(['adminUsers'])
      setSelectedUser(null)
      setBalanceAmount('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Bakiye eklenirken hata oluştu')
    }
  })

  const handleAddBalance = () => {
    if (!balanceAmount || balanceAmount <= 0) {
      toast.error('Geçerli bir miktar girin')
      return
    }
    addBalanceMutation.mutate({ userId: selectedUser.id, amount: balanceAmount })
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl shadow-md p-12 text-center" style={{ backgroundColor: '#111111' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#ccff33' }}></div>
        <p style={{ color: '#ffffff' }}>Yükleniyor...</p>
      </div>
    )
  }

  const users = usersData?.users || []

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#ffffff', opacity: 0.7 }} />
          <input
            type="text"
            placeholder="Kullanıcı ara (isim veya email)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: '#222222', 
              color: '#ffffff',
              border: '1px solid #555555'
            }}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl shadow-md overflow-hidden" style={{ backgroundColor: '#111111' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b" style={{ backgroundColor: '#222222', borderColor: '#555555' }}>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#ffffff' }}>Kullanıcı</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#ffffff' }}>Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#ffffff' }}>Bakiye</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#ffffff' }}>Rol</th>
                <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: '#ffffff' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#555555' }}>
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-opacity-5" style={{ backgroundColor: '#111111' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)' }}>
                        <Users className="w-5 h-5" style={{ color: '#ccff33' }} />
                      </div>
                      <span className="font-medium" style={{ color: '#ffffff' }}>{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4" style={{ color: '#ffffff', opacity: 0.7 }}>{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold" style={{ color: '#ffffff' }}>
                      ₺{parseFloat(user.balance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                      backgroundColor: user.role === 'admin' ? 'rgba(204, 255, 51, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: user.role === 'admin' ? '#ccff33' : '#ffffff'
                    }}>
                      {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      style={{ backgroundColor: '#FF0000', color: '#ffffff' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#cc0000'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#FF0000'}
                    >
                      <DollarSign className="w-4 h-4" />
                      Bakiye Ekle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#555555' }} />
            <p style={{ color: '#ffffff' }}>Kullanıcı bulunamadı</p>
          </div>
        )}
      </div>

      {/* Add Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl max-w-md w-full p-6" style={{ backgroundColor: '#111111', color: '#ffffff' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>Bakiye Ekle</h3>
            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: '#ffffff', opacity: 0.7 }}>
                Kullanıcı: <span className="font-semibold" style={{ color: '#ffffff' }}>{selectedUser.username}</span>
              </p>
              <p className="text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>
                Mevcut Bakiye: <span className="font-semibold" style={{ color: '#ffffff' }}>₺{parseFloat(selectedUser.balance || 0).toFixed(2)}</span>
              </p>
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="Eklenecek miktar"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 mb-4"
              style={{ 
                backgroundColor: '#222222', 
                color: '#ffffff',
                border: '1px solid #555555'
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setBalanceAmount('')
                }}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors"
                style={{ backgroundColor: '#333333', color: '#ffffff', border: '1px solid #555555' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#444444'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#333333'}
              >
                İptal
              </button>
              <button
                onClick={handleAddBalance}
                disabled={addBalanceMutation.isPending}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#FF0000', color: '#ffffff' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#cc0000'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#FF0000'}
              >
                {addBalanceMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Markets Panel
function MarketsPanel() {
  const queryClient = useQueryClient()

  const { data: marketsData, isLoading, error } = useQuery({
    queryKey: ['adminMarkets'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/admin/markets')
        console.log('Admin markets response:', response.data)
        // The API returns { success: true, data: [markets array] }
        return response.data
      } catch (error) {
        console.error('Error fetching admin markets:', error)
        throw error
      }
    }
  })

  const closeMarketMutation = useMutation({
    mutationFn: async (marketId) => {
      const response = await apiClient.post(`/admin/markets/${marketId}/close`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Market başarıyla kapatıldı')
      queryClient.invalidateQueries(['adminMarkets'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Market kapatılırken hata oluştu')
    }
  })

  const resolveMarketMutation = useMutation({
    mutationFn: async ({ marketId, outcome }) => {
      const response = await apiClient.post(`/admin/markets/${marketId}/resolve`, { outcome })
      return response.data
    },
    onSuccess: () => {
      toast.success('Market başarıyla sonuçlandırıldı')
      queryClient.invalidateQueries(['adminMarkets'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Market sonuçlandırılırken hata oluştu')
    }
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl shadow-md p-12 text-center" style={{ backgroundColor: '#111111' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#ccff33' }}></div>
        <p style={{ color: '#ffffff' }}>Yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl shadow-md p-12 text-center" style={{ backgroundColor: '#111111' }}>
        <p style={{ color: '#FF0000' }}>Marketler yüklenirken hata oluştu: {error.message}</p>
        <button
          onClick={() => queryClient.invalidateQueries(['adminMarkets'])}
          className="mt-4 px-4 py-2 rounded-lg"
          style={{ backgroundColor: '#FF0000', color: '#ffffff' }}
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  // Extract markets from the API response structure: { success: true, data: [markets array] }
  const markets = marketsData?.data || []
  
  console.log('Processed markets:', markets)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#ffffff' }}>Market Yönetimi</h2>
            <p className="text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>
              Mevcut marketleri görüntüleyin ve sonuçlandırın
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: '#ccff33' }}>{markets.length}</div>
              <div className="text-xs" style={{ color: '#ffffff', opacity: 0.7 }}>Toplam Market</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: '#ccff33' }}>
                {markets.filter(m => m.status === 'open').length}
              </div>
              <div className="text-xs" style={{ color: '#ffffff', opacity: 0.7 }}>Açık</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: '#FF6600' }}>
                {markets.filter(m => m.status === 'closed').length}
              </div>
              <div className="text-xs" style={{ color: '#ffffff', opacity: 0.7 }}>Kapalı</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: '#555555' }}>
                {markets.filter(m => m.status === 'resolved').length}
              </div>
              <div className="text-xs" style={{ color: '#ffffff', opacity: 0.7 }}>Sonuçlandı</div>
            </div>
          </div>
        </div>
        
        {/* Status Filter */}
        <div className="flex gap-2">
          <span className="text-sm font-medium" style={{ color: '#ffffff', opacity: 0.7 }}>Durum:</span>
          <div className="flex gap-1">
            {['Tümü', 'Açık', 'Kapalı', 'Sonuçlandı'].map((status) => (
              <button
                key={status}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: status === 'Tümü' ? '#ccff33' : 'rgba(255,255,255,0.1)',
                  color: status === 'Tümü' ? '#000000' : '#ffffff'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="space-y-4">
        {markets.map((market) => (
          <div key={market.id} className="rounded-2xl shadow-lg p-6 transition-all hover:shadow-xl" style={{ backgroundColor: '#111111', border: '1px solid #333333' }}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>{market.title}</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: market.status === 'open' ? '#ccff33' : market.status === 'closed' ? '#FF0000' : '#555555',
                    color: market.status === 'open' ? '#000000' : '#ffffff'
                  }}>
                    {market.status === 'open' ? 'Açık' : 
                     market.status === 'closed' ? 'Kapandı' : 'Sonuçlandı'}
                  </span>
                </div>
                {market.description && (
                  <p className="text-sm mb-4" style={{ color: '#ffffff', opacity: 0.7 }}>{market.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#ffffff', opacity: 0.7 }}>Kategori:</span>
                    <span style={{ color: '#ccff33' }}>{market.category || 'Genel'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#ffffff', opacity: 0.7 }}>Hacim:</span>
                    <span style={{ color: '#ffffff', fontWeight: '600' }}>₺{parseFloat(market.volume || 0).toLocaleString('tr-TR')}</span>
                  </div>
                  {market.closing_date && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: '#ffffff', opacity: 0.7 }}>Kapanış:</span>
                      <span style={{ color: '#ffffff' }}>{new Date(market.closing_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                </div>
              </div>
              {market.status === 'closed' && (
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-medium text-center mb-2" style={{ color: '#ffffff', opacity: 0.7 }}>
                    Market Sonuçlandır
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => resolveMarketMutation.mutate({ marketId: market.id, outcome: true })}
                      disabled={resolveMarketMutation.isPending || closeMarketMutation.isPending}
                      className="px-6 py-3 rounded-xl transition-all text-sm font-bold disabled:opacity-50 hover:scale-105"
                      style={{ backgroundColor: '#ccff33', color: '#000000', boxShadow: '0 4px 12px rgba(204, 255, 51, 0.3)' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#a3cc26'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ccff33'}
                    >
                      {resolveMarketMutation.isPending ? '⏳ İşleniyor...' : '✓ EVET'}
                    </button>
                    <button
                      onClick={() => resolveMarketMutation.mutate({ marketId: market.id, outcome: false })}
                      disabled={resolveMarketMutation.isPending || closeMarketMutation.isPending}
                      className="px-6 py-3 rounded-xl transition-all text-sm font-bold disabled:opacity-50 hover:scale-105"
                      style={{ backgroundColor: '#FF0000', color: '#ffffff', boxShadow: '0 4px 12px rgba(255, 0, 0, 0.3)' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#cc0000'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#FF0000'}
                    >
                      {resolveMarketMutation.isPending ? '⏳ İşleniyor...' : '✗ HAYIR'}
                    </button>
                  </div>
                </div>
              )}
              {market.status === 'open' && (
                <div className="flex flex-col gap-3">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)' }}>
                      <TrendingUp className="w-6 h-6" style={{ color: '#ccff33' }} />
                    </div>
                    <p className="text-xs font-medium mb-3" style={{ color: '#ccff33' }}>Aktif Market</p>
                  </div>
                  <button
                    onClick={() => closeMarketMutation.mutate(market.id)}
                    disabled={closeMarketMutation.isPending || resolveMarketMutation.isPending}
                    className="px-4 py-2 rounded-xl transition-all text-sm font-bold disabled:opacity-50 hover:scale-105"
                    style={{ 
                      backgroundColor: '#FF6600', 
                      color: '#ffffff', 
                      boxShadow: '0 4px 12px rgba(255, 102, 0, 0.3)' 
                    }}
                    onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#e55a00')}
                    onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#FF6600')}
                  >
                    {closeMarketMutation.isPending ? '⏳ Kapatılıyor...' : '🔒 Marketi Kapat'}
                  </button>
                </div>
              )}
              {market.status === 'resolved' && (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: 'rgba(85, 85, 85, 0.3)' }}>
                    <CheckCircle className="w-6 h-6" style={{ color: '#555555' }} />
                  </div>
                  <p className="text-xs font-medium" style={{ color: '#555555' }}>Tamamlandı</p>
                </div>
              )}
          </div>
        </div>
      ))}

        {markets.length === 0 && (
          <div className="rounded-2xl shadow-lg p-12 text-center" style={{ backgroundColor: '#111111', border: '1px solid #333333' }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(204, 255, 51, 0.1)' }}>
              <TrendingUp className="w-8 h-8" style={{ color: '#ccff33' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#ffffff' }}>Henüz market bulunmuyor</h3>
            <p className="text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>
              Yeni bir market oluşturmak için "Market Oluştur" sekmesini kullanabilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Add Shares Panel
function AddSharesPanel() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    marketId: '',
    userId: '',
    outcome: 'YES',
    quantity: '',
    price: '',
  })

  const { data: marketsData } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const response = await apiClient.get('/markets')
      return response.data.data
    }
  })

  const addSharesMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/admin/shares/add', {
        ...data,
        quantity: parseInt(data.quantity),
        price: parseFloat(data.price)
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Hisse başarıyla eklendi')
      setFormData({
        marketId: '',
        userId: '',
        outcome: 'YES',
        quantity: '',
        price: '',
      })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Hisse eklenirken hata oluştu')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    addSharesMutation.mutate(formData)
  }

  const markets = marketsData?.markets || []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl shadow-md p-8" style={{ backgroundColor: '#111111', color: '#ffffff' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>Kullanıcıya Hisse Ekle</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Market</label>
            <select
              value={formData.marketId}
              onChange={(e) => setFormData({ ...formData, marketId: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: '#222222', 
                color: '#ffffff',
                border: '1px solid #555555'
              }}
            >
              <option value="" style={{ backgroundColor: '#222222', color: '#ffffff' }}>Market seçin</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id} style={{ backgroundColor: '#222222', color: '#ffffff' }}>
                  {market.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Kullanıcı ID</label>
            <input
              type="number"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: '#222222', 
                color: '#ffffff',
                border: '1px solid #555555'
              }}
              placeholder="Kullanıcı ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Sonuç</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, outcome: 'YES' })}
                className="px-4 py-3 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: formData.outcome === 'YES' ? '#ccff33' : '#333333',
                  color: formData.outcome === 'YES' ? '#000000' : '#ffffff'
                }}
              >
                EVET
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, outcome: 'NO' })}
                className="px-4 py-3 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: formData.outcome === 'NO' ? '#FF0000' : '#333333',
                  color: '#ffffff'
                }}
              >
                HAYIR
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Miktar</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                min="1"
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#222222', 
                  color: '#ffffff',
                  border: '1px solid #555555'
                }}
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Fiyat</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0.01"
                max="0.99"
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#222222', 
                  color: '#ffffff',
                  border: '1px solid #555555'
                }}
                placeholder="0.50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={addSharesMutation.isPending}
            className="w-full py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: '#FF0000',
              color: '#ffffff'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#cc0000'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#FF0000'}
          >
            {addSharesMutation.isPending ? 'Ekleniyor...' : 'Hisse Ekle'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Create Market Panel
function CreateMarketPanel() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'politics',
    closing_date: '',
    type: 'binary',
    image_url: '',
    options: ['EVET', 'HAYIR']
  })
  const [imageFile, setImageFile] = useState(null)
  const [customOptions, setCustomOptions] = useState([''])

  const categories = [
    { id: 'politics', name: 'Siyaset' },
    { id: 'sports', name: 'Spor' },
    { id: 'crypto', name: 'Kripto' },
    { id: 'economy', name: 'Ekonomi' },
    { id: 'entertainment', name: 'Eğlence' },
    { id: 'technology', name: 'Teknoloji' },
  ]

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('image', file)
      const response = await apiClient.post('/admin/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    }
  })

  const createMarketMutation = useMutation({
    mutationFn: async (data) => {
      let finalData = { ...data }
      
      // Upload image if selected
      if (imageFile) {
        try {
          const imageResponse = await uploadImageMutation.mutateAsync(imageFile)
          finalData.image_url = imageResponse.data.url
        } catch (error) {
          toast.error('Görsel yüklenirken hata oluştu')
          throw error
        }
      }
      
      // Handle options for multiple choice markets
      if (finalData.type === 'multiple_choice') {
        finalData.options = customOptions.filter(opt => opt.trim() !== '')
      }
      
      const response = await apiClient.post('/admin/markets', finalData)
      return response.data
    },
    onSuccess: () => {
      toast.success('Market başarıyla oluşturuldu')
      queryClient.invalidateQueries(['markets'])
      queryClient.invalidateQueries(['adminMarkets'])
      setFormData({
        title: '',
        description: '',
        category: 'politics',
        closing_date: '',
        type: 'binary',
        image_url: '',
        options: ['EVET', 'HAYIR']
      })
      setImageFile(null)
      setCustomOptions([''])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Market oluşturulurken hata oluştu')
    }
  })

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
    }
  }

  const addOption = () => {
    setCustomOptions([...customOptions, ''])
  }

  const removeOption = (index) => {
    if (customOptions.length > 2) {
      setCustomOptions(customOptions.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index, value) => {
    const newOptions = [...customOptions]
    newOptions[index] = value
    setCustomOptions(newOptions)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation for multiple choice markets
    if (formData.type === 'multiple_choice') {
      const validOptions = customOptions.filter(opt => opt.trim() !== '')
      if (validOptions.length < 2) {
        toast.error('En az 2 seçenek girmelisiniz')
        return
      }
    }
    
    createMarketMutation.mutate(formData)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl shadow-md p-8" style={{ backgroundColor: '#111111', color: '#ffffff' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>Yeni Market Oluştur</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Başlık</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: '#222222', 
                color: '#ffffff',
                border: '1px solid #555555',
                focusRingColor: '#ccff33'
              }}
              placeholder="Market başlığı"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: '#222222', 
                color: '#ffffff',
                border: '1px solid #555555',
                focusRingColor: '#ccff33'
              }}
              placeholder="Market açıklaması"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: '#222222', 
                color: '#ffffff',
                border: '1px solid #555555',
                focusRingColor: '#ccff33'
              }}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} style={{ backgroundColor: '#222222', color: '#ffffff' }}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Market Türü</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'binary' })}
                className="px-4 py-3 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: formData.type === 'binary' ? '#ccff33' : '#333333',
                  color: formData.type === 'binary' ? '#000000' : '#ffffff'
                }}
              >
                İkili (Evet/Hayır)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'multiple_choice' })}
                className="px-4 py-3 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: formData.type === 'multiple_choice' ? '#ccff33' : '#333333',
                  color: formData.type === 'multiple_choice' ? '#000000' : '#ffffff'
                }}
              >
                Çoklu Seçenekli
              </button>
            </div>
          </div>

          {formData.type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Seçenekler</label>
              <div className="space-y-3">
                {customOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Seçenek ${index + 1}`}
                      className="flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: '#222222', 
                        color: '#ffffff',
                        border: '1px solid #555555'
                      }}
                    />
                    {customOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="px-3 py-3 rounded-xl transition-colors"
                        style={{ backgroundColor: '#FF0000', color: '#ffffff' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="w-full px-4 py-3 rounded-xl font-medium transition-colors border-2 border-dashed"
                  style={{ borderColor: '#555555', color: '#ffffff' }}
                >
                  + Seçenek Ekle
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Market Görseli (Opsiyonel)</label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#222222', 
                  color: '#ffffff',
                  border: '1px solid #555555'
                }}
              />
              <div className="text-sm" style={{ color: '#ffffff', opacity: 0.7 }}>
                Alternatif olarak görsel URL'si girebilirsiniz:
              </div>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#222222', 
                  color: '#ffffff',
                  border: '1px solid #555555'
                }}
              />
              {(imageFile || formData.image_url) && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#222222' }}>
                  <p className="text-sm" style={{ color: '#ccff33' }}>
                    ✓ {imageFile ? `Dosya seçildi: ${imageFile.name}` : 'Görsel URL girildi'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>Kapanış Tarihi</label>
            <input
              type="datetime-local"
              value={formData.closing_date}
              onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: '#222222', 
                color: '#ffffff',
                border: '1px solid #555555',
                focusRingColor: '#ccff33'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={createMarketMutation.isPending}
            className="w-full py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: '#FF0000',
              color: '#ffffff'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#cc0000'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#FF0000'}
          >
            {createMarketMutation.isPending ? 'Oluşturuluyor...' : 'Market Oluştur'}
          </button>
        </form>
      </div>
    </div>
  )
}
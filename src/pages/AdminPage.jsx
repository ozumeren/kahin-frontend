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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-gray-600">Sistem yönetimi ve kontrol paneli</p>
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
                  className={`flex items-center gap-2 py-3 border-b-2 font-medium transition-all ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
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
      <div className="bg-white rounded-2xl shadow-md p-12 text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Yükleniyor...</p>
      </div>
    )
  }

  const users = usersData?.users || []

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Kullanıcı ara (isim veya email)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kullanıcı</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Bakiye</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rol</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-900">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      ₺{parseFloat(user.balance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
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
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Kullanıcı bulunamadı</p>
          </div>
        )}
      </div>

      {/* Add Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Bakiye Ekle</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Kullanıcı: <span className="font-semibold text-gray-900">{selectedUser.username}</span>
              </p>
              <p className="text-sm text-gray-600">
                Mevcut Bakiye: <span className="font-semibold text-gray-900">₺{parseFloat(selectedUser.balance || 0).toFixed(2)}</span>
              </p>
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="Eklenecek miktar"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setBalanceAmount('')
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddBalance}
                disabled={addBalanceMutation.isPending}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium transition-colors disabled:opacity-50"
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

  const { data: marketsData, isLoading } = useQuery({
    queryKey: ['adminMarkets'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/markets')
      return response.data.data
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
      <div className="bg-white rounded-2xl shadow-md p-12 text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Yükleniyor...</p>
      </div>
    )
  }

  const markets = marketsData?.markets || []

  return (
    <div className="space-y-4">
      {markets.map((market) => (
        <div key={market.id} className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{market.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{market.description}</p>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  market.status === 'open' 
                    ? 'bg-green-100 text-green-700' 
                    : market.status === 'closed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {market.status === 'open' ? 'Açık' : 
                   market.status === 'closed' ? 'Kapandı' : 'Sonuçlandı'}
                </span>
                <span className="text-sm text-gray-600">
                  Hacim: ₺{parseFloat(market.volume || 0).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
            {market.status === 'closed' && (
              <div className="flex gap-2">
                <button
                  onClick={() => resolveMarketMutation.mutate({ marketId: market.id, outcome: 'YES' })}
                  disabled={resolveMarketMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  EVET
                </button>
                <button
                  onClick={() => resolveMarketMutation.mutate({ marketId: market.id, outcome: 'NO' })}
                  disabled={resolveMarketMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  HAYIR
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {markets.length === 0 && (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Market bulunamadı</p>
        </div>
      )}
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
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6">Kullanıcıya Hisse Ekle</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Market</label>
            <select
              value={formData.marketId}
              onChange={(e) => setFormData({ ...formData, marketId: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Market seçin</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı ID</label>
            <input
              type="number"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Kullanıcı ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sonuç</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, outcome: 'YES' })}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  formData.outcome === 'YES'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                EVET
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, outcome: 'NO' })}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  formData.outcome === 'NO'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                HAYIR
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Miktar</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0.01"
                max="0.99"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={addSharesMutation.isPending}
            className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium transition-colors disabled:opacity-50"
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
  })

  const categories = [
    { id: 'politics', name: 'Siyaset' },
    { id: 'sports', name: 'Spor' },
    { id: 'crypto', name: 'Kripto' },
    { id: 'economy', name: 'Ekonomi' },
    { id: 'entertainment', name: 'Eğlence' },
    { id: 'technology', name: 'Teknoloji' },
  ]

  const createMarketMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/admin/markets', data)
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
      })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Market oluşturulurken hata oluştu')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMarketMutation.mutate(formData)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6">Yeni Market Oluştur</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Market başlığı"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Market açıklaması"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kapanış Tarihi</label>
            <input
              type="datetime-local"
              value={formData.closing_date}
              onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={createMarketMutation.isPending}
            className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium transition-colors disabled:opacity-50"
          >
            {createMarketMutation.isPending ? 'Oluşturuluyor...' : 'Market Oluştur'}
          </button>
        </form>
      </div>
    </div>
  )
}
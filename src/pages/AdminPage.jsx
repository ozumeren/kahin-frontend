import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { 
  Users, DollarSign, Plus, TrendingUp, 
  Settings, Search, X, Check, AlertCircle,
  Target, Clock, CheckCircle, Package
} from 'lucide-react'
import apiClient from '../api/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Link, Navigate } from 'react-router-dom'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('users') // users, markets, create-market, add-shares
  const [searchQuery, setSearchQuery] = useState('')

  // Authentication ve authorization kontrolü
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Pazarları ve kullanıcıları yönetin</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'users', label: 'Kullanıcılar', icon: Users },
              { id: 'markets', label: 'Pazarlar', icon: Target },
              { id: 'add-shares', label: 'Hisse Ekle', icon: Package },
              { id: 'create-market', label: 'Pazar Oluştur', icon: Plus }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
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

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', searchQuery],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/users?search=${searchQuery}`)
      return response.data.data
    }
  })

  // Add balance mutation
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
    return <div className="card"><p>Yükleniyor...</p></div>
  }

  const users = usersData?.users || []

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Kullanıcı ara (isim veya email)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold">ID</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Kullanıcı Adı</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Email</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Rol</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Bakiye</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Kayıt Tarihi</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600">#{user.id}</td>
                <td className="py-3 px-4 text-sm font-medium">{user.username}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`badge ${user.role === 'admin' ? 'badge-error' : 'badge-info'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-sm font-mono">
                  ₺{parseFloat(user.balance).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-sm text-gray-600">
                  {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: tr })}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="btn btn-sm btn-secondary"
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Para Ekle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Para Ekle</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Kullanıcı: <strong>{selectedUser.username}</strong></p>
              <p className="text-sm text-gray-600">Mevcut Bakiye: <strong>₺{parseFloat(selectedUser.balance).toFixed(2)}</strong></p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Eklenecek Miktar (₺)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="input w-full"
                placeholder="Örn: 1000"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-secondary flex-1"
              >
                İptal
              </button>
              <button
                onClick={handleAddBalance}
                disabled={addBalanceMutation.isPending}
                className="btn btn-primary flex-1"
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
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch markets
  const { data: markets, isLoading } = useQuery({
    queryKey: ['adminMarkets', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' 
        ? '/admin/markets' 
        : `/admin/markets?status=${statusFilter}`
      const response = await apiClient.get(url)
      return response.data.data
    }
  })

  // Close market mutation
  const closeMarketMutation = useMutation({
    mutationFn: async (marketId) => {
      const response = await apiClient.post(`/admin/markets/${marketId}/close`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Pazar başarıyla kapatıldı')
      queryClient.invalidateQueries(['adminMarkets'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Pazar kapatılırken hata oluştu')
    }
  })

  // Resolve market mutation
  const resolveMarketMutation = useMutation({
    mutationFn: async ({ marketId, outcome }) => {
      const response = await apiClient.post(`/admin/markets/${marketId}/resolve`, { outcome })
      return response.data
    },
    onSuccess: () => {
      toast.success('Pazar başarıyla sonuçlandırıldı')
      queryClient.invalidateQueries(['adminMarkets'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Pazar sonuçlandırılırken hata oluştu')
    }
  })

  const handleResolveMarket = (marketId, outcome) => {
    if (window.confirm(`Bu pazarı ${outcome ? 'EVET' : 'HAYIR'} olarak sonuçlandırmak istediğinizden emin misiniz?`)) {
      resolveMarketMutation.mutate({ marketId, outcome })
    }
  }

  const handleCloseMarket = (marketId) => {
    if (window.confirm('Bu pazarı kapatmak istediğinizden emin misiniz?')) {
      closeMarketMutation.mutate(marketId)
    }
  }

  if (isLoading) {
    return <div className="card"><p>Yükleniyor...</p></div>
  }

  return (
    <div>
      {/* Filter */}
      <div className="mb-6 flex gap-3">
        {['all', 'open', 'closed', 'resolved'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`btn btn-sm ${
              statusFilter === status ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            {status === 'all' ? 'Tümü' : status === 'open' ? 'Açık' : status === 'closed' ? 'Kapalı' : 'Sonuçlanmış'}
          </button>
        ))}
      </div>

      {/* Markets List */}
      <div className="space-y-4">
        {markets?.map((market) => (
          <div key={market.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Link to={`/markets/${market.id}`} className="text-lg font-semibold hover:text-brand-600 transition-colors">
                  {market.title}
                </Link>
                <p className="text-sm text-gray-600 mt-1">{market.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge ${
                    market.status === 'open' ? 'badge-success' : 
                    market.status === 'closed' ? 'badge-warning' : 
                    'badge-info'
                  }`}>
                    {market.status === 'open' ? 'Açık' : market.status === 'closed' ? 'Kapalı' : 'Sonuçlanmış'}
                  </span>
                  {market.status === 'resolved' && (
                    <span className={`badge ${market.outcome ? 'badge-success' : 'badge-error'}`}>
                      Sonuç: {market.outcome ? 'EVET' : 'HAYIR'}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {market.status === 'open' && (
                  <button
                    onClick={() => handleCloseMarket(market.id)}
                    className="btn btn-sm btn-warning"
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Kapat
                  </button>
                )}
                {market.status === 'closed' && (
                  <>
                    <button
                      onClick={() => handleResolveMarket(market.id, true)}
                      className="btn btn-sm btn-success"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      EVET
                    </button>
                    <button
                      onClick={() => handleResolveMarket(market.id, false)}
                      className="btn btn-sm btn-error"
                    >
                      <X className="w-4 h-4 mr-1" />
                      HAYIR
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 text-sm">
              <div>
                <p className="text-gray-600">ID</p>
                <p className="font-medium">#{market.id}</p>
              </div>
              <div>
                <p className="text-gray-600">Oluşturulma</p>
                <p className="font-medium">{format(new Date(market.createdAt), 'dd MMM yyyy', { locale: tr })}</p>
              </div>
              <div>
                <p className="text-gray-600">Kapanış Tarihi</p>
                <p className="font-medium">{format(new Date(market.closing_date), 'dd MMM yyyy', { locale: tr })}</p>
              </div>
              <div>
                <p className="text-gray-600">Güncellenme</p>
                <p className="font-medium">{format(new Date(market.updatedAt), 'dd MMM HH:mm', { locale: tr })}</p>
              </div>
            </div>
          </div>
        ))}
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
    closing_date: '',
    image_url: ''
  })

  const createMarketMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/admin/markets', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Pazar başarıyla oluşturuldu')
      queryClient.invalidateQueries(['adminMarkets'])
      setFormData({ title: '', description: '', closing_date: '', image_url: '' })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Pazar oluşturulurken hata oluştu')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.closing_date) {
      toast.error('Başlık ve kapanış tarihi gereklidir')
      return
    }

    createMarketMutation.mutate(formData)
  }

  return (
    <div className="max-w-2xl">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Yeni Pazar Oluştur</h2>

        {/* Fiyatlandırma Bilgisi */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Fiyatlandırma Bilgisi</p>
              <p>Hisseler <span className="font-bold">0.01 TL - 0.99 TL</span> arasında işlem görür.</p>
              <p className="mt-1">Market sonuçlandığında kazanan tarafın hisseleri <span className="font-bold text-green-700">1.00 TL</span> değerinde ödenir.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input w-full"
              placeholder="Örn: Bitcoin 2025 sonunda 100k olacak mı?"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full min-h-[100px]"
              placeholder="Pazarın detaylı açıklaması..."
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Görsel URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="input w-full"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pazar kartında gösterilecek avatar görseli (opsiyonel)
            </p>
            {formData.image_url && (
              <div className="mt-3 flex items-center gap-3">
                <p className="text-xs text-gray-600">Önizleme:</p>
                <img 
                  src={formData.image_url} 
                  alt="Preview"
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Closing Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Kapanış Tarihi <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.closing_date}
              onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Bu tarihte pazar otomatik olarak kapatılacaktır
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createMarketMutation.isPending}
            className="btn btn-primary w-full"
          >
            {createMarketMutation.isPending ? 'Oluşturuluyor...' : 'Pazar Oluştur'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Add Shares Panel
function AddSharesPanel() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    userId: '',
    marketId: '',
    outcome: true,
    quantity: ''
  })

  // Fetch users
  const { data: usersData } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users')
      return response.data.data
    }
  })

  // Fetch markets
  const { data: marketsData } = useQuery({
    queryKey: ['adminMarkets'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/markets?status=open')
      return response.data.data
    }
  })

  // Add shares mutation
  const addSharesMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(`/admin/users/${data.userId}/add-shares`, {
        marketId: data.marketId,
        outcome: data.outcome,
        quantity: parseInt(data.quantity)
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Hisse başarıyla eklendi')
      setFormData({ userId: '', marketId: '', outcome: true, quantity: '' })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Hisse eklenirken hata oluştu')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.userId || !formData.marketId || !formData.quantity || formData.quantity <= 0) {
      toast.error('Tüm alanları doldurun ve pozitif bir miktar girin')
      return
    }

    addSharesMutation.mutate(formData)
  }

  const users = usersData?.users || []
  const markets = marketsData || []

  return (
    <div className="max-w-2xl">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Kullanıcıya Hisse Ekle</h2>
        <p className="text-gray-600 mb-6">
          Test ve demo amaçlı kullanıcılara direkt hisse ekleyebilirsiniz.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Kullanıcı <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="input w-full"
            >
              <option value="">Kullanıcı seçin...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email}) - Bakiye: ₺{parseFloat(user.balance).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Market Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Pazar <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.marketId}
              onChange={(e) => setFormData({ ...formData, marketId: e.target.value })}
              className="input w-full"
            >
              <option value="">Pazar seçin...</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.title}
                </option>
              ))}
            </select>
          </div>

          {/* Outcome Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Hisse Tipi <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="outcome"
                  checked={formData.outcome === true}
                  onChange={() => setFormData({ ...formData, outcome: true })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">EVET (Yes)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="outcome"
                  checked={formData.outcome === false}
                  onChange={() => setFormData({ ...formData, outcome: false })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">HAYIR (No)</span>
              </label>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Miktar <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="input w-full"
              placeholder="Örn: 100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Eklenecek hisse adedi
            </p>
          </div>

          {/* Info Box */}
          {formData.userId && formData.marketId && formData.quantity > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Özet:</p>
                  <ul className="space-y-1">
                    <li>
                      <strong>{users.find(u => u.id == formData.userId)?.username}</strong> kullanıcısına
                    </li>
                    <li>
                      <strong>{formData.quantity}</strong> adet <strong>{formData.outcome ? 'EVET' : 'HAYIR'}</strong> hissesi eklenecek
                    </li>
                    <li className="text-xs text-blue-600 mt-2">
                      Not: Bu işlem kullanıcının bakiyesini etkilemez
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={addSharesMutation.isPending}
            className="btn btn-primary w-full"
          >
            {addSharesMutation.isPending ? 'Ekleniyor...' : 'Hisse Ekle'}
          </button>
        </form>
      </div>
    </div>
  )
}

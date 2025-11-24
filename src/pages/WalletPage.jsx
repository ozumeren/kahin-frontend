import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Lock,
  TrendingUp,
  AlertCircle,
  Loader,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function WalletPage() {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  // Bakiye bilgisi
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet/balance')
      return response.data.data || response.data
    },
    enabled: isAuthenticated
  })

  // Kilitli fonlar
  const { data: lockedFunds } = useQuery({
    queryKey: ['lockedFunds'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet/locked-funds')
      return response.data.data || response.data
    },
    enabled: isAuthenticated
  })

  // İşlem geçmişi
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['walletHistory'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet/history')
      return response.data.data || response.data
    },
    enabled: isAuthenticated
  })

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (amount) => {
      const response = await apiClient.post('/wallet/deposit', { amount: parseFloat(amount) })
      return response.data
    },
    onSuccess: () => {
      toast.success('Para yatırma işlemi başarılı!')
      queryClient.invalidateQueries(['walletBalance'])
      queryClient.invalidateQueries(['walletHistory'])
      if (refreshUser) refreshUser()
      setDepositAmount('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'İşlem başarısız')
    }
  })

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount) => {
      const response = await apiClient.post('/wallet/withdraw', { amount: parseFloat(amount) })
      return response.data
    },
    onSuccess: () => {
      toast.success('Çekim talebi oluşturuldu!')
      queryClient.invalidateQueries(['walletBalance'])
      queryClient.invalidateQueries(['walletHistory'])
      if (refreshUser) refreshUser()
      setWithdrawAmount('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'İşlem başarısız')
    }
  })

  const handleDeposit = (e) => {
    e.preventDefault()
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Geçerli bir miktar girin')
      return
    }
    depositMutation.mutate(depositAmount)
  }

  const handleWithdraw = (e) => {
    e.preventDefault()
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Geçerli bir miktar girin')
      return
    }
    if (parseFloat(withdrawAmount) > parseFloat(balanceData?.available || 0)) {
      toast.error('Yetersiz bakiye')
      return
    }
    withdrawMutation.mutate(withdrawAmount)
  }

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: Wallet },
    { id: 'deposit', label: 'Para Yatır', icon: ArrowDownCircle },
    { id: 'withdraw', label: 'Para Çek', icon: ArrowUpCircle },
    { id: 'history', label: 'İşlem Geçmişi', icon: Clock }
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-16" style={{ backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto rounded-2xl p-8 text-center" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(204, 255, 51, 0.2)' }}>
              <AlertCircle className="w-8 h-8" style={{ color: '#ccff33' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>Giriş Yapın</h2>
            <p className="mb-6" style={{ color: '#ffffff', opacity: 0.7 }}>
              Cüzdanınızı görüntülemek için giriş yapmanız gerekiyor
            </p>
            <Link to="/login" className="inline-block px-6 py-3 rounded-lg font-medium transition-all hover:brightness-110" style={{ backgroundColor: '#555555', color: '#ffffff' }}>
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (balanceLoading) {
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

  const balance = balanceData || {}
  const history = historyData?.transactions || historyData || []

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111111' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(204, 255, 51, 0.2)' }}>
              <Wallet className="w-6 h-6" style={{ color: '#ccff33' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: '#ffffff' }}>Cüzdan</h1>
              <p className="text-sm" style={{ color: '#888888' }}>Bakiyenizi yönetin</p>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#888888' }}>Toplam Bakiye</span>
                <Wallet className="w-5 h-5" style={{ color: '#ccff33' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: '#ccff33' }}>
                ₺{parseFloat(balance.total || user?.balance || 0).toFixed(2)}
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#888888' }}>Kullanılabilir</span>
                <TrendingUp className="w-5 h-5" style={{ color: '#3b82f6' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: '#ffffff' }}>
                ₺{parseFloat(balance.available || user?.balance || 0).toFixed(2)}
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#888888' }}>Kilitli (Emirlerde)</span>
                <Lock className="w-5 h-5" style={{ color: '#a855f7' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: '#ffffff' }}>
                ₺{parseFloat(lockedFunds?.total || balance.locked || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #555555' }}>
        <div className="container mx-auto px-4">
          <nav className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 py-4 font-medium transition-all whitespace-nowrap"
                  style={{
                    borderBottom: activeTab === tab.id ? '2px solid #ccff33' : '2px solid transparent',
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>Hesap Özeti</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid #333333' }}>
                  <span style={{ color: '#888888' }}>Toplam Yatırılan</span>
                  <span className="font-semibold" style={{ color: '#ffffff' }}>₺{parseFloat(balance.totalDeposited || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid #333333' }}>
                  <span style={{ color: '#888888' }}>Toplam Çekilen</span>
                  <span className="font-semibold" style={{ color: '#ffffff' }}>₺{parseFloat(balance.totalWithdrawn || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span style={{ color: '#888888' }}>Toplam Kâr/Zarar</span>
                  <span className="font-semibold" style={{ color: parseFloat(balance.totalPnL || 0) >= 0 ? '#ccff33' : '#FF0000' }}>
                    {parseFloat(balance.totalPnL || 0) >= 0 ? '+' : ''}₺{parseFloat(balance.totalPnL || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center py-4" style={{ color: '#888888' }}>
              <p className="text-sm">Bu bir demo hesaptır. Gerçek para işlemi yapılmamaktadır.</p>
            </div>
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="max-w-md mx-auto">
            <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>Para Yatır</h3>
              <form onSubmit={handleDeposit}>
                <div className="mb-4">
                  <label className="block text-sm mb-2" style={{ color: '#888888' }}>Miktar (₺)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-lg text-lg"
                    style={{ backgroundColor: '#1a1a1a', color: '#ffffff', border: '1px solid #555555' }}
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 mb-6">
                  {[100, 500, 1000, 5000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDepositAmount(amount.toString())}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110"
                      style={{ backgroundColor: '#555555', color: '#ffffff' }}
                    >
                      ₺{amount}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={depositMutation.isLoading}
                  className="w-full py-3 rounded-lg font-medium transition-all hover:brightness-110 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#ccff33', color: '#111111' }}
                >
                  {depositMutation.isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ArrowDownCircle className="w-5 h-5" />
                      Para Yatır
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-center mt-4" style={{ color: '#888888' }}>
                Demo hesap - Sanal para yüklenir
              </p>
            </div>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="max-w-md mx-auto">
            <div className="rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>Para Çek</h3>
              <form onSubmit={handleWithdraw}>
                <div className="mb-4">
                  <label className="block text-sm mb-2" style={{ color: '#888888' }}>Miktar (₺)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    max={balance.available || 0}
                    className="w-full px-4 py-3 rounded-lg text-lg"
                    style={{ backgroundColor: '#1a1a1a', color: '#ffffff', border: '1px solid #555555' }}
                  />
                  <p className="text-xs mt-2" style={{ color: '#888888' }}>
                    Kullanılabilir: ₺{parseFloat(balance.available || user?.balance || 0).toFixed(2)}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={withdrawMutation.isLoading}
                  className="w-full py-3 rounded-lg font-medium transition-all hover:brightness-110 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#555555', color: '#ffffff' }}
                >
                  {withdrawMutation.isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ArrowUpCircle className="w-5 h-5" />
                      Para Çek
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-center mt-4" style={{ color: '#888888' }}>
                Demo hesap - Sanal para çekilir
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin" style={{ color: '#ccff33' }} />
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-xl p-12 text-center" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#555555' }}>
                  <Clock className="w-10 h-10" style={{ color: '#ffffff', opacity: 0.5 }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#ffffff' }}>Henüz işlem yok</h3>
                <p style={{ color: '#888888' }}>İşlem geçmişiniz burada görünecek</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((tx, index) => (
                  <div key={tx.id || index} className="rounded-xl p-4" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: tx.type === 'deposit' ? 'rgba(204, 255, 51, 0.2)' :
                              tx.type === 'withdraw' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(59, 130, 246, 0.2)'
                          }}>
                          {tx.type === 'deposit' ? (
                            <ArrowDownCircle className="w-5 h-5" style={{ color: '#ccff33' }} />
                          ) : tx.type === 'withdraw' ? (
                            <ArrowUpCircle className="w-5 h-5" style={{ color: '#FF0000' }} />
                          ) : (
                            <RefreshCw className="w-5 h-5" style={{ color: '#3b82f6' }} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: '#ffffff' }}>
                            {tx.type === 'deposit' ? 'Para Yatırma' :
                              tx.type === 'withdraw' ? 'Para Çekme' :
                                tx.type === 'trade' ? 'İşlem' : tx.type}
                          </p>
                          <p className="text-xs" style={{ color: '#888888' }}>
                            {new Date(tx.createdAt || tx.created_at).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold"
                          style={{ color: tx.type === 'deposit' || parseFloat(tx.amount) > 0 ? '#ccff33' : '#FF0000' }}>
                          {tx.type === 'deposit' || parseFloat(tx.amount) > 0 ? '+' : ''}₺{Math.abs(parseFloat(tx.amount || 0)).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1 justify-end">
                          {tx.status === 'completed' ? (
                            <CheckCircle className="w-3 h-3" style={{ color: '#ccff33' }} />
                          ) : tx.status === 'pending' ? (
                            <Clock className="w-3 h-3" style={{ color: '#FFD700' }} />
                          ) : (
                            <XCircle className="w-3 h-3" style={{ color: '#FF0000' }} />
                          )}
                          <span className="text-xs" style={{ color: '#888888' }}>
                            {tx.status === 'completed' ? 'Tamamlandı' : tx.status === 'pending' ? 'Bekliyor' : 'İptal'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

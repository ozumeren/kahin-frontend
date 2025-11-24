import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  Users,
  User,
  MoreVertical,
  Trash2,
  Edit3,
  X,
  Loader,
  AlertCircle,
  Check,
  CheckCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatUsername, setNewChatUsername] = useState('')
  const messagesEndRef = useRef(null)

  // Konuşmalar listesi
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiClient.get('/messages/conversations')
      return response.data.data || response.data
    },
    enabled: isAuthenticated,
    refetchInterval: 10000 // 10 saniyede bir yenile
  })

  // Seçili konuşmanın mesajları
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/messages/conversations/${selectedConversation.id}/messages`)
      return response.data.data || response.data
    },
    enabled: !!selectedConversation?.id,
    refetchInterval: 5000 // 5 saniyede bir yenile
  })

  // Okunmamış sayısı
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const response = await apiClient.get('/messages/unread-count')
      return response.data.data || response.data
    },
    enabled: isAuthenticated
  })

  // Mesaj gönderme
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }) => {
      const response = await apiClient.post(`/messages/conversations/${conversationId}/messages`, { content })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedConversation?.id])
      queryClient.invalidateQueries(['conversations'])
      setMessageText('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Mesaj gönderilemedi')
    }
  })

  // Yeni özel sohbet başlatma
  const startPrivateChatMutation = useMutation({
    mutationFn: async (username) => {
      const response = await apiClient.post('/messages/conversations/private', { username })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['conversations'])
      setSelectedConversation(data.data || data)
      setShowNewChat(false)
      setNewChatUsername('')
      toast.success('Sohbet başlatıldı')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Sohbet başlatılamadı')
    }
  })

  // Mesaj silme
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      const response = await apiClient.delete(`/messages/${messageId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedConversation?.id])
      toast.success('Mesaj silindi')
    }
  })

  // Okundu işaretleme
  useEffect(() => {
    if (selectedConversation?.id) {
      apiClient.post(`/messages/conversations/${selectedConversation.id}/read`).catch(() => {})
    }
  }, [selectedConversation?.id, messagesData])

  // Mesaj sonuna scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedConversation?.id) return
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: messageText.trim()
    })
  }

  const handleStartChat = (e) => {
    e.preventDefault()
    if (!newChatUsername.trim()) return
    startPrivateChatMutation.mutate(newChatUsername.trim())
  }

  const conversations = conversationsData?.conversations || conversationsData || []
  const messages = messagesData?.messages || messagesData || []

  // Arama filtresi
  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.participants?.find(p => p.id !== user?.id)
    const name = conv.name || otherUser?.username || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

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
              Mesajlarınızı görüntülemek için giriş yapmanız gerekiyor
            </p>
            <Link to="/login" className="inline-block px-6 py-3 rounded-lg font-medium transition-all hover:brightness-110" style={{ backgroundColor: '#555555', color: '#ffffff' }}>
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111111' }}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex h-[calc(100vh-120px)] rounded-xl overflow-hidden" style={{ border: '1px solid #555555' }}>
          {/* Sol Panel - Konuşmalar */}
          <div className="w-full md:w-80 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid #555555', backgroundColor: '#111111' }}>
            {/* Header */}
            <div className="p-4" style={{ borderBottom: '1px solid #555555' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>Mesajlar</h2>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-2 rounded-lg transition-all hover:brightness-110"
                  style={{ backgroundColor: '#ccff33' }}
                >
                  <Plus className="w-5 h-5" style={{ color: '#111111' }} />
                </button>
              </div>

              {/* Arama */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#888888' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sohbet ara..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#1a1a1a', color: '#ffffff', border: '1px solid #555555' }}
                />
              </div>
            </div>

            {/* Konuşma Listesi */}
            <div className="flex-1 overflow-y-auto">
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin" style={{ color: '#ccff33' }} />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2" style={{ color: '#555555' }} />
                  <p className="text-sm" style={{ color: '#888888' }}>Henüz mesaj yok</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const otherUser = conv.participants?.find(p => p.id !== user?.id)
                  const isGroup = conv.type === 'group'
                  const name = isGroup ? conv.name : otherUser?.username || 'Kullanıcı'
                  const lastMessage = conv.lastMessage || conv.last_message
                  const isSelected = selectedConversation?.id === conv.id
                  const hasUnread = conv.unreadCount > 0

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className="w-full p-4 flex items-center gap-3 transition-all hover:brightness-110"
                      style={{
                        backgroundColor: isSelected ? '#1a1a1a' : 'transparent',
                        borderBottom: '1px solid #333333'
                      }}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#555555' }}>
                        {isGroup ? (
                          <Users className="w-6 h-6" style={{ color: '#ffffff' }} />
                        ) : (
                          <span className="text-lg font-bold" style={{ color: '#ffffff' }}>
                            {name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate" style={{ color: '#ffffff' }}>{name}</span>
                          {lastMessage && (
                            <span className="text-xs" style={{ color: '#888888' }}>
                              {new Date(lastMessage.createdAt || lastMessage.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm truncate" style={{ color: '#888888' }}>
                          {lastMessage?.content || 'Henüz mesaj yok'}
                        </p>
                      </div>
                      {hasUnread && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: '#ccff33', color: '#111111' }}>
                          {conv.unreadCount}
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Sağ Panel - Mesajlar */}
          <div className="hidden md:flex flex-1 flex-col" style={{ backgroundColor: '#0a0a0a' }}>
            {selectedConversation ? (
              <>
                {/* Sohbet Header */}
                <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid #555555', backgroundColor: '#111111' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#555555' }}>
                    {selectedConversation.type === 'group' ? (
                      <Users className="w-5 h-5" style={{ color: '#ffffff' }} />
                    ) : (
                      <span className="font-bold" style={{ color: '#ffffff' }}>
                        {(selectedConversation.participants?.find(p => p.id !== user?.id)?.username || 'K').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{ color: '#ffffff' }}>
                      {selectedConversation.type === 'group'
                        ? selectedConversation.name
                        : selectedConversation.participants?.find(p => p.id !== user?.id)?.username || 'Kullanıcı'}
                    </h3>
                  </div>
                </div>

                {/* Mesajlar */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader className="w-6 h-6 animate-spin" style={{ color: '#ccff33' }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#555555' }} />
                        <p style={{ color: '#888888' }}>Henüz mesaj yok. İlk mesajı gönderin!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId === user?.id || msg.sender_id === user?.id
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className="max-w-[70%] rounded-2xl px-4 py-2 relative group"
                            style={{
                              backgroundColor: isOwn ? '#ccff33' : '#1a1a1a',
                              color: isOwn ? '#111111' : '#ffffff'
                            }}
                          >
                            {!isOwn && (
                              <p className="text-xs font-medium mb-1" style={{ color: '#ccff33' }}>
                                {msg.sender?.username || 'Kullanıcı'}
                              </p>
                            )}
                            <p className="break-words">{msg.content}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs" style={{ opacity: 0.7 }}>
                                {new Date(msg.createdAt || msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOwn && (
                                msg.read ? (
                                  <CheckCheck className="w-4 h-4" style={{ color: '#111111' }} />
                                ) : (
                                  <Check className="w-4 h-4" style={{ opacity: 0.7 }} />
                                )
                              )}
                            </div>

                            {/* Mesaj silme butonu */}
                            {isOwn && (
                              <button
                                onClick={() => deleteMessageMutation.mutate(msg.id)}
                                className="absolute -top-2 -right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ backgroundColor: '#FF0000' }}
                              >
                                <Trash2 className="w-3 h-3" style={{ color: '#ffffff' }} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Mesaj Gönderme */}
                <form onSubmit={handleSendMessage} className="p-4" style={{ borderTop: '1px solid #555555', backgroundColor: '#111111' }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: '#1a1a1a', color: '#ffffff', border: '1px solid #555555' }}
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim() || sendMessageMutation.isLoading}
                      className="px-4 py-3 rounded-xl transition-all hover:brightness-110 disabled:opacity-50"
                      style={{ backgroundColor: '#ccff33', color: '#111111' }}
                    >
                      {sendMessageMutation.isLoading ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-20 h-20 mx-auto mb-4" style={{ color: '#555555' }} />
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#ffffff' }}>Mesajlarınız</h3>
                  <p style={{ color: '#888888' }}>Bir sohbet seçin veya yeni bir sohbet başlatın</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yeni Sohbet Modal */}
      {showNewChat && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md mx-4 rounded-xl p-6" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>Yeni Sohbet</h3>
              <button onClick={() => setShowNewChat(false)} className="p-2 rounded-lg hover:brightness-110" style={{ backgroundColor: '#555555' }}>
                <X className="w-5 h-5" style={{ color: '#ffffff' }} />
              </button>
            </div>

            <form onSubmit={handleStartChat}>
              <div className="mb-4">
                <label className="block text-sm mb-2" style={{ color: '#888888' }}>Kullanıcı Adı</label>
                <input
                  type="text"
                  value={newChatUsername}
                  onChange={(e) => setNewChatUsername(e.target.value)}
                  placeholder="Kullanıcı adını girin..."
                  className="w-full px-4 py-3 rounded-lg"
                  style={{ backgroundColor: '#1a1a1a', color: '#ffffff', border: '1px solid #555555' }}
                />
              </div>

              <button
                type="submit"
                disabled={!newChatUsername.trim() || startPrivateChatMutation.isLoading}
                className="w-full py-3 rounded-lg font-medium transition-all hover:brightness-110 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#ccff33', color: '#111111' }}
              >
                {startPrivateChatMutation.isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Sohbet Başlat
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

// WebSocket URL'yi environment'a göre belirle
const WS_URL = import.meta.env.VITE_WS_URL || 
  (import.meta.env.DEV ? 'ws://localhost:5001/ws' : 'wss://api.kahinmarket.com/ws')

// Singleton WebSocket manager
class WebSocketManager {
  constructor() {
    this.ws = null
    this.reconnectTimeout = null
    this.subscribedMarkets = new Set()
    this.messageHandlers = new Map()
    this.isCleaningUp = false
    this.isConnected = false
    this.listeners = new Set()
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot() {
    return this.isConnected
  }

  notify() {
    this.listeners.forEach(listener => listener())
  }

  connect() {
    if (this.isCleaningUp || this.ws?.readyState === WebSocket.OPEN) return
    
    try {
      this.ws = new WebSocket(WS_URL)

      this.ws.onopen = () => {
        if (this.isCleaningUp) {
          this.ws.close()
          return
        }
        console.log('✅ WebSocket connected')
        this.isConnected = true
        this.notify()
        
        this.subscribedMarkets.forEach(marketId => {
          this.subscribeToMarketInternal(marketId)
        })
      }

      this.ws.onmessage = (event) => {
        if (this.isCleaningUp) return
        
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.warn('⚠️ WebSocket error:', error.type)
      }

      this.ws.onclose = () => {
        if (this.isCleaningUp) return
        
        console.log('🔴 WebSocket disconnected')
        this.isConnected = false
        this.notify()
        this.ws = null
        
        if (!this.reconnectTimeout && !this.isCleaningUp) {
          this.reconnectTimeout = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...')
            this.reconnectTimeout = null
            this.connect()
          }, 5000)
        }
      }
    } catch (error) {
      console.warn('⚠️ WebSocket not available:', error)
      this.isConnected = false
      this.notify()
    }
  }

  handleMessage(data) {
    const { type, marketId } = data

    // Orderbook güncellemeleri
    if (type === 'orderbook_update' && marketId) {
      const handlers = this.messageHandlers.get(marketId) || []
      handlers.forEach(handler => handler(data))
      
      const globalHandlers = this.messageHandlers.get('__market_updates__') || []
      globalHandlers.forEach(handler => handler(data))
    }

    // Yeni trade bildirimi
    if (type === 'new_trade' && marketId) {
      const handlers = this.messageHandlers.get(marketId) || []
      handlers.forEach(handler => handler(data))
      
      const globalHandlers = this.messageHandlers.get('__global_trades__') || []
      globalHandlers.forEach(handler => handler(data))
      
      const updateHandlers = this.messageHandlers.get('__market_updates__') || []
      updateHandlers.forEach(handler => handler(data))
    }

    // Kişiselleştirilmiş emir dolum bildirimi
    if (type === 'my_order_filled') {
      const handlers = this.messageHandlers.get('__my_orders__') || []
      handlers.forEach(handler => handler(data))
    }

    // Kişiselleştirilmiş emir iptal bildirimi
    if (type === 'my_order_cancelled') {
      const handlers = this.messageHandlers.get('__my_orders__') || []
      handlers.forEach(handler => handler(data))
    }

    // Bakiye güncelleme bildirimi
    if (type === 'balance_updated') {
      const handlers = this.messageHandlers.get('__balance_updates__') || []
      handlers.forEach(handler => handler(data))
    }

    // Market update (genel)
    if (type === 'market_update') {
      const globalHandlers = this.messageHandlers.get('__market_updates__') || []
      globalHandlers.forEach(handler => handler(data))
      
      this.messageHandlers.forEach(handlers => {
        handlers.forEach(handler => handler(data))
      })
    }
  }

  subscribeToMarketInternal(marketId, userId = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.subscribedMarkets.add(marketId)
      return
    }

    this.subscribedMarkets.add(marketId)

    this.ws.send(JSON.stringify({
      type: 'subscribe',
      marketId,
      userId
    }))

    console.log(`📡 Subscribed to market: ${marketId}${userId ? ` (user: ${userId})` : ''}`)
  }

  subscribeUser(userId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    this.ws.send(JSON.stringify({
      type: 'subscribe_user',
      userId
    }))

    console.log(`👤 Subscribed user: ${userId}`)
  }

  unsubscribeFromMarket(marketId) {
    this.subscribedMarkets.delete(marketId)

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        marketId
      }))
      
      console.log(`📴 Unsubscribed from market: ${marketId}`)
    }

    this.messageHandlers.delete(marketId)
  }

  onMessage(marketId, handler) {
    if (!this.messageHandlers.has(marketId)) {
      this.messageHandlers.set(marketId, [])
    }
    
    this.messageHandlers.get(marketId).push(handler)

    return () => {
      const handlers = this.messageHandlers.get(marketId) || []
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }
}

// Singleton instance
const wsManager = new WebSocketManager()

// WebSocket'i başlat
wsManager.connect()

export function useWebSocket() {
  const isConnected = useSyncExternalStore(
    (callback) => wsManager.subscribe(callback),
    () => wsManager.getSnapshot()
  )

  useEffect(() => {
    // Component mount olduğunda bağlantıyı kontrol et
    if (!wsManager.isConnected) {
      wsManager.connect()
    }
  }, [])

  return {
    isConnected,
    subscribeToMarket: (marketId, userId) => wsManager.subscribeToMarketInternal(marketId, userId),
    subscribeUser: (userId) => wsManager.subscribeUser(userId),
    unsubscribeFromMarket: (marketId) => wsManager.unsubscribeFromMarket(marketId),
    onMessage: (marketId, handler) => wsManager.onMessage(marketId, handler)
  }
}

// Market-specific hook
export function useMarketWebSocket(marketId, userId = null) {
  const { isConnected, subscribeToMarket, unsubscribeFromMarket, onMessage } = useWebSocket()
  const [orderBook, setOrderBook] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const cleanupRef = useRef(null)

  useEffect(() => {
    if (!marketId) return

    subscribeToMarket(marketId, userId)

    cleanupRef.current = onMessage(marketId, (data) => {
      if (data.type === 'orderbook_update' && data.marketId === marketId) {
        const receivedOrderBook = data.data || data.orderBook
        setOrderBook(receivedOrderBook)
        setLastUpdate(new Date())
      }
    })

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      unsubscribeFromMarket(marketId)
    }
  }, [marketId, userId, isConnected])

  return {
    isConnected,
    orderBook,
    lastUpdate
  }
}

// Hook for listening to new trades
export function useNewTrades(marketId, onNewTrade) {
  const { isConnected, onMessage } = useWebSocket()
  const cleanupRef = useRef(null)

  useEffect(() => {
    if (!onNewTrade) return

    // Belirli bir market için trade'leri dinle
    if (marketId) {
      cleanupRef.current = onMessage(marketId, (data) => {
        if (data.type === 'new_trade') {
          onNewTrade(data.data)
        }
      })
    } else {
      // Tüm marketler için trade'leri dinle
      cleanupRef.current = onMessage('__global_trades__', (data) => {
        if (data.type === 'new_trade') {
          onNewTrade(data.data)
        }
      })
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [isConnected, marketId, onNewTrade])

  return {
    isConnected
  }
}

// Hook for listening to personal order events
export function useMyOrderEvents(onOrderFilled, onOrderCancelled) {
  const ws = useWebSocket()
  const cleanupRef = useRef(null)

  useEffect(() => {
    if (!ws) return

    cleanupRef.current = ws.onMessage('__my_orders__', (data) => {
      if (data.type === 'my_order_filled' && onOrderFilled) {
        onOrderFilled(data.data)
      }
      if (data.type === 'my_order_cancelled' && onOrderCancelled) {
        onOrderCancelled(data.data)
      }
    })

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [ws?.isConnected, onOrderFilled, onOrderCancelled])

  return {
    isConnected: ws.isConnected
  }
}

// Hook for listening to balance updates
export function useBalanceUpdates(ws, onBalanceUpdate) {
  const cleanupRef = useRef(null)
  const callbackRef = useRef(onBalanceUpdate)

  // Callback'i ref'te sakla
  useEffect(() => {
    callbackRef.current = onBalanceUpdate
  }, [onBalanceUpdate])

  useEffect(() => {
    if (!ws) return

    cleanupRef.current = ws.onMessage('__balance_updates__', (data) => {
      if (data.type === 'balance_updated' && callbackRef.current) {
        callbackRef.current(data.data.balance)
      }
    })

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [ws?.isConnected])

  return {
    isConnected: ws?.isConnected
  }
}
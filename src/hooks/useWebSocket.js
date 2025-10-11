import { useEffect, useRef, useState } from 'react'

// WebSocket URL'yi environment'a göre belirle
const WS_URL = import.meta.env.VITE_WS_URL || 
  (import.meta.env.DEV ? 'ws://localhost:5001/ws' : 'wss://api.kahinmarket.com/ws')

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const subscribedMarkets = useRef(new Set())
  const messageHandlers = useRef(new Map())
  const isCleaningUpRef = useRef(false)

  useEffect(() => {
    isCleaningUpRef.current = false
    connect()

    return () => {
      isCleaningUpRef.current = true
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [])

  const connect = () => {
    if (isCleaningUpRef.current) return
    
    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (isCleaningUpRef.current) {
          ws.close()
          return
        }
        console.log('✅ WebSocket connected')
        setIsConnected(true)
        
        subscribedMarkets.current.forEach(marketId => {
          subscribeToMarket(marketId)
        })
      }

      ws.onmessage = (event) => {
        if (isCleaningUpRef.current) return
        
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.warn('⚠️ WebSocket error (backend may not be ready):', error.type)
      }

      ws.onclose = () => {
        if (isCleaningUpRef.current) return
        
        console.log('🔴 WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null
        
        if (!reconnectTimeoutRef.current && !isCleaningUpRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...')
            reconnectTimeoutRef.current = null
            connect()
          }, 5000)
        }
      }
    } catch (error) {
      console.warn('⚠️ WebSocket not available:', error)
      setIsConnected(false)
    }
  }

  const handleMessage = (data) => {
    const { type, marketId } = data

    // Orderbook güncellemeleri
    if (type === 'orderbook_update' && marketId) {
      const handlers = messageHandlers.current.get(marketId) || []
      handlers.forEach(handler => handler(data))
    }

    // Yeni trade bildirimi
    if (type === 'new_trade' && marketId) {
      const handlers = messageHandlers.current.get(marketId) || []
      handlers.forEach(handler => handler(data))
      
      // Global trade handler'ları da tetikle (tüm pazarlar için)
      const globalHandlers = messageHandlers.current.get('__global_trades__') || []
      globalHandlers.forEach(handler => handler(data))
    }

    // Kişiselleştirilmiş emir dolum bildirimi
    if (type === 'my_order_filled') {
      const handlers = messageHandlers.current.get('__my_orders__') || []
      handlers.forEach(handler => handler(data))
    }

    // Kişiselleştirilmiş emir iptal bildirimi
    if (type === 'my_order_cancelled') {
      const handlers = messageHandlers.current.get('__my_orders__') || []
      handlers.forEach(handler => handler(data))
    }

    // Market update (genel)
    if (type === 'market_update') {
      messageHandlers.current.forEach(handlers => {
        handlers.forEach(handler => handler(data))
      })
    }
  }

  const subscribeToMarket = (marketId, userId = null) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      subscribedMarkets.current.add(marketId)
      return
    }

    subscribedMarkets.current.add(marketId)

    wsRef.current.send(JSON.stringify({
      type: 'subscribe',
      marketId,
      userId
    }))

    console.log(`📡 Subscribed to market: ${marketId}${userId ? ` (user: ${userId})` : ''}`)
  }

  const unsubscribeFromMarket = (marketId) => {
    subscribedMarkets.current.delete(marketId)

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        marketId
      }))
      
      console.log(`📴 Unsubscribed from market: ${marketId}`)
    }

    messageHandlers.current.delete(marketId)
  }

  const onMessage = (marketId, handler) => {
    if (!messageHandlers.current.has(marketId)) {
      messageHandlers.current.set(marketId, [])
    }
    
    messageHandlers.current.get(marketId).push(handler)

    return () => {
      const handlers = messageHandlers.current.get(marketId) || []
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  return {
    isConnected,
    subscribeToMarket,
    unsubscribeFromMarket,
    onMessage
  }
}

// Market-specific hook
export function useMarketWebSocket(marketId, userId = null) {
  const ws = useWebSocket()
  const [orderBook, setOrderBook] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const cleanupRef = useRef(null)

  useEffect(() => {
    if (!marketId || !ws) return

    ws.subscribeToMarket(marketId, userId)

    cleanupRef.current = ws.onMessage(marketId, (data) => {
      // ✅ DÜZELTME: Backend'den gelen data yapısını doğru parse et
      if (data.type === 'orderbook_update' && data.marketId === marketId) {
        // Backend'den gelen data.data içinde orderBook var
        const receivedOrderBook = data.data || data.orderBook
        console.log('📊 Order book güncellendi:', receivedOrderBook)
        setOrderBook(receivedOrderBook)
        setLastUpdate(new Date())
      }
    })

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      ws.unsubscribeFromMarket(marketId)
    }
  }, [marketId, userId, ws?.isConnected])

  return {
    isConnected: ws.isConnected,
    orderBook,
    lastUpdate
  }
}

// Hook for listening to new trades
export function useNewTrades(marketId, onNewTrade) {
  const ws = useWebSocket()
  const cleanupRef = useRef(null)

  useEffect(() => {
    if (!ws || !onNewTrade) return

    // Belirli bir market için trade'leri dinle
    if (marketId) {
      cleanupRef.current = ws.onMessage(marketId, (data) => {
        if (data.type === 'new_trade') {
          onNewTrade(data.data)
        }
      })
    } else {
      // Tüm marketler için trade'leri dinle
      cleanupRef.current = ws.onMessage('__global_trades__', (data) => {
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
  }, [ws?.isConnected, marketId, onNewTrade])

  return {
    isConnected: ws.isConnected
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
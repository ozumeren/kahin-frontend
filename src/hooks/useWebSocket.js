import { useEffect, useRef, useState } from 'react'

const WS_URL = 'wss://api.kahinmarket.com/ws'

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const subscribedMarkets = useRef(new Set())
  const messageHandlers = useRef(new Map())

  useEffect(() => {
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  const connect = () => {
  try {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      setIsConnected(true)
      
      subscribedMarkets.current.forEach(marketId => {
        subscribeToMarket(marketId)
      })
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      // ✅ Sessizce handle et
      console.warn('⚠️ WebSocket error (backend may not be ready):', error.type)
    }

    ws.onclose = () => {
      console.log('🔴 WebSocket disconnected')
      setIsConnected(false)
      
      // ✅ Sadece 1 kez reconnect dene, sonra bırak
      if (!reconnectTimeoutRef.current) {
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

    if (type === 'orderbook_update' && marketId) {
      // Call all handlers for this market
      const handlers = messageHandlers.current.get(marketId) || []
      handlers.forEach(handler => handler(data))
    }

    if (type === 'market_update') {
      // Broadcast to all market handlers
      messageHandlers.current.forEach(handlers => {
        handlers.forEach(handler => handler(data))
      })
    }
  }

  const subscribeToMarket = (marketId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Queue subscription for when connected
      subscribedMarkets.current.add(marketId)
      return
    }

    subscribedMarkets.current.add(marketId)

    wsRef.current.send(JSON.stringify({
      type: 'subscribe',
      marketId
    }))

    console.log(`📡 Subscribed to market: ${marketId}`)
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

    // Remove handlers
    messageHandlers.current.delete(marketId)
  }

  const onMessage = (marketId, handler) => {
    if (!messageHandlers.current.has(marketId)) {
      messageHandlers.current.set(marketId, [])
    }
    
    messageHandlers.current.get(marketId).push(handler)

    // Return cleanup function
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
export function useMarketWebSocket(marketId) {
  const ws = useWebSocket()
  const [orderBook, setOrderBook] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    if (!marketId) return

    // Subscribe
    ws.subscribeToMarket(marketId)

    // Setup message handler
    const cleanup = ws.onMessage(marketId, (data) => {
      if (data.type === 'orderbook_update' && data.marketId === marketId) {
        setOrderBook(data.orderBook)
        setLastUpdate(new Date())
      }
    })

    // Cleanup
    return () => {
      cleanup()
      ws.unsubscribeFromMarket(marketId)
    }
  }, [marketId])

  return {
    isConnected: ws.isConnected,
    orderBook,
    lastUpdate
  }
}
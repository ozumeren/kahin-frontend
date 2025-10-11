import { useEffect, useState } from 'react'
import { useNewTrades, useMyOrderEvents } from '../hooks/useWebSocket'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

/**
 * WebSocket Notifications Component
 * 
 * Bu component yeni WebSocket mesajlarını dinler ve kullanıcıya bildirim gösterir:
 * - new_trade: Yeni işlem gerçekleştiğinde
 * - my_order_filled: Kullanıcının emri eşleştiğinde
 * - my_order_cancelled: Kullanıcının emri iptal edildiğinde
 */
export default function WebSocketNotifications({ marketId = null }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [recentTrades, setRecentTrades] = useState([])

  // Yeni trade'leri dinle
  useNewTrades(marketId, (trade) => {
    console.log('🆕 Yeni trade:', trade)
    
    // Son 5 trade'i sakla
    setRecentTrades(prev => [trade, ...prev].slice(0, 5))
    
    // Eğer kullanıcı bu trade'de yer alıyorsa bildirim göster
    if (user && (trade.buyerId === user.id || trade.sellerId === user.id)) {
      const isBuyer = trade.buyerId === user.id
      showToast(
        `Trade gerçekleşti! ${trade.quantity} adet @ ${trade.price} TL (${isBuyer ? 'Aldınız' : 'Sattınız'})`,
        'success'
      )
    }
  })

  // Kişisel emir olaylarını dinle
  useMyOrderEvents(
    // onOrderFilled
    (orderData) => {
      console.log('✅ Emir eşleşti:', orderData)
      
      const status = orderData.status === 'FILLED' ? 'Tamamen' : 'Kısmen'
      const outcome = orderData.outcome ? 'YES' : 'NO'
      
      showToast(
        `${status} eşleşti! ${orderData.orderType} ${orderData.filledQuantity} ${outcome} @ ${orderData.avgFillPrice} TL`,
        'success',
        5000
      )
    },
    // onOrderCancelled
    (orderData) => {
      console.log('❌ Emir iptal edildi:', orderData)
      
      const outcome = orderData.outcome ? 'YES' : 'NO'
      let reason = 'İptal edildi'
      
      if (orderData.reason === 'market_resolved') {
        reason = 'Pazar sonuçlandı'
      } else if (orderData.reason === 'market_closed') {
        reason = 'Pazar kapandı'
      } else if (orderData.reason === 'user_cancelled') {
        reason = 'İptal ettiniz'
      }
      
      let refundMsg = ''
      if (orderData.refundType === 'balance' && orderData.refundAmount > 0) {
        refundMsg = ` ${orderData.refundAmount} TL iade edildi.`
      } else if (orderData.refundType === 'shares') {
        refundMsg = ` ${orderData.quantity} ${outcome} hisse iade edildi.`
      }
      
      showToast(
        `${reason}: ${orderData.orderType} ${orderData.quantity} ${outcome} @ ${orderData.price} TL${refundMsg}`,
        'info',
        7000
      )
    }
  )

  // Bu component görsel bir şey render etmez, sadece bildirimleri yönetir
  return null
}

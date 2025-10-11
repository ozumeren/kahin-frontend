import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

// Market detaylarını getir
export function useMarket(marketId) {
  return useQuery({
    queryKey: ['market', marketId],
    queryFn: async () => {
      const response = await apiClient.get(`/markets/${marketId}`);
      return response.data.data;
    },
    enabled: !!marketId,
    staleTime: 30000, // 30 saniye - WebSocket varsa daha güncel data gelir
  });
}

// Order book verilerini getir
export function useOrderBook(marketId) {
  return useQuery({
    queryKey: ['orderBook', marketId],
    queryFn: async () => {
      const response = await apiClient.get(`/markets/${marketId}/orderbook`);
      return response.data.data;
    },
    enabled: !!marketId,
    staleTime: 10000, // 10 saniye - WebSocket varsa daha güncel data gelir
    refetchInterval: 15000, // 15 saniyede bir otomatik refresh (WebSocket olmadığında)
  });
}

// Market'e ait trade'leri getir
export function useMarketTrades(marketId, limit = 100) {
  return useQuery({
    queryKey: ['trades', marketId, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/trades/market/${marketId}?limit=${limit}`);
      return response.data.trades || [];
    },
    enabled: !!marketId,
    staleTime: 20000, // 20 saniye
  });
}

// Order oluşturma mutation
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData) => {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Başarılı mesajı göster
      toast.success(data.message || 'Emir başarıyla oluşturuldu!');

      // İlgili market verilerini invalidate et
      const { marketId } = variables;
      
      // Market detaylarını yenile (volume, traders count güncellenebilir)
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
      
      // Order book'u yenile (yeni emir eklenmiş olabilir)
      queryClient.invalidateQueries({ queryKey: ['orderBook', marketId] });
      
      // Trade listesini yenile (eşleşme olduysa yeni trade oluşmuştur)
      queryClient.invalidateQueries({ queryKey: ['trades', marketId] });
      
      // Kullanıcının açık emirlerini yenile (portfolio sayfası için)
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      
      // Portfolio verilerini yenile (bakiye ve pozisyonlar değişmiş olabilir)
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      
      // Genel markets listesini yenile (volume güncellenmiş olabilir)
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    },
    onError: (error) => {
      // Hata mesajını göster
      const message = error.response?.data?.message || error.message || 'Emir oluşturulurken bir hata oluştu';
      toast.error(message);
    },
  });
}

// Order iptal etme mutation (bonus)
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      const response = await apiClient.delete(`/orders/${orderId}`);
      return response.data;
    },
    onSuccess: (data, orderId) => {
      toast.success('Emir iptal edildi');
      
      // Tüm order ve portfolio verilerini yenile
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['orderBook'] }); // Market'teki order book'u da güncelle
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Emir iptal edilemedi';
      toast.error(message);
    },
  });
}

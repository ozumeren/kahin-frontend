import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

// Portfolio verilerini getir
export function usePortfolio(enabled = true) {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await apiClient.get('/portfolio');
      return response.data.data;
    },
    enabled: enabled, // Sadece enabled=true ise çalış
    staleTime: 10000, // 10 saniye
    retry: 1, // Hata durumunda sadece 1 kez tekrar dene
  });
}

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
    retry: (failureCount, error) => {
      // 400/404 hatalarında tekrar deneme
      if (error?.response?.status === 400 || error?.response?.status === 404) {
        return failureCount < 2; // 2 kere daha dene
      }
      // Diğer hatalar için normal retry logic
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('OrderBook fetch hatası:', error.response?.status, error.response?.data?.message);
      }
    }
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
    staleTime: 5000, // 5 saniye - daha sık güncellensin
    refetchInterval: 10000, // 10 saniyede bir otomatik refresh
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

// Fiyat geçmişi (candles) verilerini getir
export function usePriceCandles(marketId, options = {}) {
  const { interval = '1h', outcome = 'true', limit = 100 } = options;

  return useQuery({
    queryKey: ['candles', marketId, interval, outcome],
    queryFn: async () => {
      const response = await apiClient.get(`/markets/${marketId}/candles`, {
        params: { interval, outcome, limit }
      });
      return response.data.data || [];
    },
    enabled: !!marketId,
    staleTime: 60000, // 1 dakika
    refetchInterval: 60000, // 1 dakikada bir yenile
  });
}

// 24 saatlik istatistikleri getir
export function useMarket24hStats(marketId, outcome = 'true') {
  return useQuery({
    queryKey: ['market24hStats', marketId, outcome],
    queryFn: async () => {
      const response = await apiClient.get(`/markets/${marketId}/stats/24h`, {
        params: { outcome }
      });
      return response.data.data;
    },
    enabled: !!marketId,
    staleTime: 30000, // 30 saniye
  });
}

// Order iptal etme mutation
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
      queryClient.invalidateQueries({ queryKey: ['orderBook'] });
      queryClient.invalidateQueries({ queryKey: ['conditionalOrders'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Emir iptal edilemedi';
      toast.error(message);
    },
  });
}

// Koşullu emirleri getir (stop-loss, take-profit)
export function useConditionalOrders(marketId = null) {
  return useQuery({
    queryKey: ['conditionalOrders', marketId],
    queryFn: async () => {
      const params = marketId ? { marketId } : {};
      const response = await apiClient.get('/orders/conditional', { params });
      return response.data.data || [];
    },
    staleTime: 10000,
  });
}

// Emir güncelleme mutation
export function useAmendOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, price, quantity }) => {
      const response = await apiClient.patch(`/orders/${orderId}`, { price, quantity });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Emir güncellendi');
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['orderBook'] });
      queryClient.invalidateQueries({ queryKey: ['conditionalOrders'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Emir güncellenemedi';
      toast.error(message);
    },
  });
}

// Toplu emir oluşturma mutation
export function useCreateBatchOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orders) => {
      const response = await apiClient.post('/orders/batch', { orders });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.data?.created || 0} emir oluşturuldu`);
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['orderBook'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Emirler oluşturulamadı';
      toast.error(message);
    },
  });
}

// Toplu emir iptal mutation
export function useCancelBatchOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderIds) => {
      const response = await apiClient.delete('/orders/batch', { data: { order_ids: orderIds } });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.data?.cancelled || 0} emir iptal edildi`);
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['orderBook'] });
      queryClient.invalidateQueries({ queryKey: ['conditionalOrders'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Emirler iptal edilemedi';
      toast.error(message);
    },
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';
import { withTimeout } from '@/lib/supabase/withTimeout';

function todayAlgiersDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Algiers',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function num(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function useDashboardStats() {
  const supabase = supabaseClient;

  return useQuery({
    queryKey: ['dashboard-stats'],
    retry: 2,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const today = todayAlgiersDate();

      const [todayStats, lowStock, stockValue, bestProduct] = await Promise.all([
        withTimeout(
          supabase
            .from('v_daily_stats')
            .select('sale_date, revenue_ttc, units_sold, profit_ht')
            .eq('sale_date', today)
            .maybeSingle()
        ),
        withTimeout(
          supabase
            .from('v_low_stock')
            .select('id', { count: 'exact', head: true })
        ),
        withTimeout(
          supabase
            .from('v_stock_value')
            .select('total_sale_value_ttc')
        ),
        withTimeout(
          supabase
            .from('v_top_products')
            .select('product_name, total_sold')
            .limit(1)
            .maybeSingle()
        ),
      ]);

      const errors = [todayStats.error, lowStock.error, stockValue.error, bestProduct.error].filter(Boolean);
      if (errors.length) {
        console.error('[useDashboardStats] Supabase errors:', errors);
        throw errors[0];
      }

      const totalStockValue = (stockValue.data || []).reduce(
        (sum, row) => sum + num(row.total_sale_value_ttc),
        0
      );

      return {
        revenue_today: num(todayStats.data?.revenue_ttc),
        units_sold_today: num(todayStats.data?.units_sold),
        low_stock_count: lowStock.count || 0,
        best_product: bestProduct.data?.product_name || '',
        best_product_qty: num(bestProduct.data?.total_sold),
        total_stock_value: totalStockValue,
        profit_today: num(todayStats.data?.profit_ht),
        date: today,
      };
    },
  });
}

export function useLowStockItems() {
  const supabase = supabaseClient;

  return useQuery({
    queryKey: ['low-stock-items'],
    retry: 2,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('v_low_stock')
          .select('id, product_name, color_name, size, quantity, barcode')
          .order('quantity', { ascending: true })
          .limit(10)
      );

      if (error) {
        console.error('[useLowStockItems] Supabase error:', error);
        throw error;
      }

      return (data || []).map((item) => ({
        id: item.id,
        product_name: item.product_name,
        color_name: item.color_name,
        size: item.size,
        quantity: num(item.quantity),
        barcode: item.barcode,
      }));
    },
  });
}

export function useTopProducts() {
  const supabase = supabaseClient;

  return useQuery({
    queryKey: ['top-products'],
    retry: 2,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('v_top_products')
          .select('product_name, total_sold, total_revenue_ttc')
          .order('total_sold', { ascending: false })
          .limit(5)
      );

      if (error) {
        console.error('[useTopProducts] Supabase error:', error);
        throw error;
      }

      return (data || []).map((product) => ({
        product_name: product.product_name,
        total_sold: num(product.total_sold),
        total_revenue_ttc: num(product.total_revenue_ttc),
      }));
    },
  });
}
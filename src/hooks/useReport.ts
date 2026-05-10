'use client';

import { useQuery, } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';
import { withTimeout } from '@/lib/supabase/withTimeout';

type Period = 'today' | 'week' | 'month';

function todayAlgiers(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Algiers',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Algiers',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

function num(v: any): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function useReport(period: Period) {
  const supabase = supabaseClient;

  return useQuery({
    queryKey: ['report', period],
    retry: 2,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const today = todayAlgiers();
      let startDate: string;
      if (period === 'today') startDate = today;
      else if (period === 'week') startDate = daysAgo(6);
      else startDate = daysAgo(29);

      const [todayStats, chartData, topProducts, stockValue, lowStock] = await Promise.all([
        withTimeout(
          supabase
            .from('v_daily_stats')
            .select('revenue_ttc, profit_ht, units_sold')
            .eq('sale_date', today)
            .maybeSingle()
        ),
        withTimeout(
          supabase
            .from('v_daily_stats')
            .select('sale_date, revenue_ttc, profit_ht')
            .gte('sale_date', startDate)
            .order('sale_date', { ascending: true })
        ),
        withTimeout(
          supabase
            .from('v_top_products')
            .select('product_name, total_sold, total_revenue_ttc')
            .order('total_sold', { ascending: false })
            .limit(10)
        ),
        withTimeout(
          supabase.from('v_stock_value').select('total_sale_value_ttc')
        ),
        withTimeout(
          supabase.from('v_low_stock').select('id', { count: 'exact', head: true })
        ),
      ]);

      const errors = [todayStats, chartData, topProducts, stockValue, lowStock]
        .map((r) => r.error)
        .filter(Boolean);
      if (errors.length) throw errors[0];

      const totalStock = (stockValue.data || []).reduce(
        (sum, row) => sum + num(row.total_sale_value_ttc), 0
      );

      return {
        revenue: num(todayStats.data?.revenue_ttc),
        profit: num(todayStats.data?.profit_ht),
        transactions: num(todayStats.data?.units_sold),
        stockValue: totalStock,
        lowStockCount: lowStock.count || 0,
        chart: (chartData.data || []).map((d: any) => ({
          name: new Date(d.sale_date).toLocaleDateString('fr-FR', { weekday: 'short' }),
          revenue: num(d.revenue_ttc),
          profit: num(d.profit_ht),
        })),
        topProducts: (topProducts.data || []).map((p: any) => ({
          name: p.product_name,
          sold: num(p.total_sold),
          revenue: num(p.total_revenue_ttc),
        })),
      };
    },
  });
}
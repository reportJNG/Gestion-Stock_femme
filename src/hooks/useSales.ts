'use client';

import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { withTimeout } from '@/lib/supabase/withTimeout';

const PAGE_SIZE = 20;

function num(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfDay(date: string): string {
  return `${date}T00:00:00+01:00`;
}

function endOfDay(date: string): string {
  return `${date}T23:59:59+01:00`;
}

export function useSales(from?: string, to?: string, page: number = 0) {
  const supabase = supabaseClient;
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sales', from, to, page, user?.id],
    enabled: !!user,
    retry: 2,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      let request = supabase
        .from('sales')
        .select('id, sale_number, total_ttc, customer_name, created_at, sale_items(id)', {
          count: 'exact',
        })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (user?.id) request = request.eq('sold_by', user.id);
      if (from) request = request.gte('created_at', startOfDay(from));
      if (to) request = request.lte('created_at', endOfDay(to));

      const { data, error, count } = await withTimeout(request);

      if (error) {
        console.error('[useSales] Supabase error:', error);
        throw error;
      }

      return {
        success: true,
        total: count || 0,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        sales: (data || []).map((sale) => ({
          id: sale.id,
          sale_number: sale.sale_number,
          total_ttc: num(sale.total_ttc),
          customer_name: sale.customer_name || '',
          items_count: Array.isArray(sale.sale_items) ? sale.sale_items.length : 0,
          created_at: sale.created_at,
        })),
      };
    },
  });
}

export function useSaleDetail(saleId: string) {
  const supabase = supabaseClient;
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sale', saleId, user?.id],
    enabled: !!saleId && !!user,
    retry: 1,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: sale, error: saleError } = await withTimeout(
        supabase
          .from('sales')
          .select('*, profiles(full_name, email)')
          .eq('id', saleId)
          .maybeSingle()
      );

      if (saleError) {
        console.error('[useSaleDetail] Sale error:', saleError);
        throw saleError;
      }

      if (!sale) return null;

      if (sale.sold_by !== user?.id) {
        throw new Error('You can only view your own sales');
      }

      const { data: items, error: itemsError } = await withTimeout(
        supabase
          .from('sale_items')
          .select('*')
          .eq('sale_id', saleId)
          .order('created_at', { ascending: true })
      );

      if (itemsError) {
        console.error('[useSaleDetail] Items error:', itemsError);
        throw itemsError;
      }

      const profile = sale.profiles as { full_name: string | null; email: string | null } | null;
      const soldByName = profile?.full_name || profile?.email || '';

      return {
        success: true,
        data: {
          sale: {
            id: sale.id,
            sale_number: sale.sale_number,
            total_ht: num(sale.total_ht),
            tva_amount: num(sale.tva_amount),
            total_ttc: num(sale.total_ttc),
            customer_name: sale.customer_name || '',
            sold_by_name: soldByName,
            created_at: sale.created_at,
            synced_from_offline: sale.synced_from_offline || false,
          },
          items: (items || []).map((item) => ({
            id: item.id,
            sale_id: saleId,
            barcode: item.barcode,
            product_name: item.product_name,
            category_name: item.category_name,
            size: item.size,
            color_name: item.color_name,
            quantity: num(item.quantity),
            unit_price_ht: num(item.unit_price_ht),
            tva_rate: num(item.tva_rate),
            unit_price_ttc: num(item.unit_price_ttc),
            subtotal_ttc: num(item.subtotal_ttc),
          })),
        },
      };
    },
  });
}
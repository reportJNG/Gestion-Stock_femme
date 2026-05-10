'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';



function parseSettingValue(value: unknown): string | number {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

export function useSettings() {
const supabase = supabaseClient;
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('key', { ascending: true });

      if (error) {
        console.error('[useSettings] Supabase error:', error);
        throw error;
      }

      const map: Record<string, string | number> = {};
      data?.forEach((setting) => {
        map[setting.key] = parseSettingValue(setting.value);
      });

      return {
        low_stock_threshold: Number(map.low_stock_threshold ?? 5),
        tva_rate: Number(map.tva_rate ?? 19),
        shop_name: String(map.shop_name ?? 'Ma Boutique'),
        currency: String(map.currency ?? 'DZD'),
        archive_retention_days: Number(map.archive_retention_days ?? 365),
      };
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string | number }) => {
      const { data, error } = await supabase
        .from('settings')
        .upsert(
          {
            key,
            value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-items'] });
    },
  });

  return { settings, isLoading, updateSetting };
}

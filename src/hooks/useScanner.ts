'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';



export type ScanResult = {
  success: boolean;
  sale_id?: string;
  sale_number?: string;
  product_name?: string;
  color?: string;
  size?: string;
  price_ttc?: number;
  error?: string;
  message?: string;
};

export function useScanner() {
const supabase = supabaseClient;
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async ({
      barcode,
      customerName,
      soldBy,
    }: {
      barcode: string;
      customerName?: string;
      soldBy?: string;
    }): Promise<ScanResult> => {
      const { data, error } = await supabase.rpc('sell_by_barcode', {
        p_barcode: barcode,
        p_customer_name: customerName || null,
        p_sold_by: soldBy || null,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data as ScanResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });

  return {
    scan: scanMutation.mutateAsync,
    isScanning: scanMutation.isPending,
    scanResult: scanMutation.data,
    scanError: scanMutation.error,
    reset: scanMutation.reset,
  };
}
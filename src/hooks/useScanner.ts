'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAppBarcode, normalizeScannedBarcode } from '@/lib/barcode/scan';
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
      const normalizedBarcode = normalizeScannedBarcode(barcode);

      if (!isAppBarcode(normalizedBarcode)) {
        return {
          success: false,
          error: 'CODE_BARRES_INVALIDE',
          message: 'Code-barres invalide',
        };
      }

      const { data, error } = await supabase.rpc('sell_by_barcode', {
        p_barcode: normalizedBarcode,
        p_customer_name: customerName || null,
        p_sold_by: soldBy || null,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data as ScanResult;
    },
    onSuccess: (result) => {
      if (!result.success) return;

      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['top-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
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

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {addOfflineSale, getCachedVariantByBarcode, decrementCachedVariantStock } from '@/lib/offline/db';
import { useNetworkStatus } from './useNetworkStatus';

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
  offline?: boolean;
};

export function useScanner() {
  const supabase = createClient();
  const isOnline = useNetworkStatus();
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
      if (isOnline) {
        const { data, error } = await supabase.rpc('sell_by_barcode', {
          p_barcode: barcode,
          p_customer_name: customerName || null,
          p_sold_by: soldBy || null,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const result = data as ScanResult;
        return result;
      } else {
        const cached = await getCachedVariantByBarcode(barcode);
        if (!cached) {
          return { success: false, error: 'CODE_INTROUVABLE', message: 'Code-barres non trouve dans le cache' };
        }

        if (cached.quantity < 1) {
          return { success: false, error: 'STOCK_EPUISE', message: 'Stock epuise' };
        }

        await decrementCachedVariantStock(barcode);
        await addOfflineSale({
          barcode,
          customerName,
          soldBy,
          createdAt: new Date(),
        });

        return {
          success: true,
          offline: true,
          product_name: cached.productName,
          color: cached.colorName,
          size: cached.size,
          price_ttc: cached.salePrice * (1 + cached.tvaRate / 100),
        };
      }
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

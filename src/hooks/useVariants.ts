'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';



export function useVariants() {
const supabase = supabaseClient;
  const queryClient = useQueryClient();

  const addStock = useMutation({
    mutationFn: async ({
      variantId,
      quantity,
      notes,
      createdBy,
    }: {
      variantId: string;
      quantity: number;
      notes?: string;
      createdBy?: string;
    }) => {
      const { data, error } = await supabase.rpc('add_stock_to_variant', {
        p_variant_id: variantId,
        p_quantity_add: quantity,
        p_notes: notes || null,
        p_created_by: createdBy || null,
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string; message?: string } | null;
      if (result?.success === false) {
        throw new Error(result.message || result.error || 'Erreur stock');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-items'] });
    },
  });

  const archiveVariant = useMutation({
    mutationFn: async (variantId: string) => {
      const { data, error } = await supabase.rpc('archive_variant', {
        p_variant_id: variantId,
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string; message?: string } | null;
      if (result?.success === false) {
        throw new Error(result.message || result.error || 'Erreur archive');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['archives'] });
    },
  });

  const unarchiveVariant = useMutation({
    mutationFn: async (id: string) => {
      const { data: variantRows, error: variantError } = await supabase
        .from('product_variants')
        .update({
          is_archived: false,
          archived_at: null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id');

      if (variantError) throw variantError;
      if (variantRows && variantRows.length > 0) return { success: true };

      const { error: productError } = await supabase
        .from('products')
        .update({
          is_archived: false,
          archived_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (productError) throw productError;

      const { error: variantsError } = await supabase
        .from('product_variants')
        .update({
          is_archived: false,
          archived_at: null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', id);

      if (variantsError) throw variantsError;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['archives'] });
    },
  });

  return { addStock, archiveVariant, unarchiveVariant };
}

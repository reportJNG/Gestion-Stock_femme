'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';



export function useBrandManagement() {
const supabase = supabaseClient;
  const queryClient = useQueryClient();

  const createBrand = useMutation({
    mutationFn: async (name: string) => {
      const cleanName = name.trim();
      if (!cleanName) throw new Error('Nom de marque obligatoire');

      const { data, error } = await supabase
        .from('brands')
        .insert({ name: cleanName })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteBrand = useMutation({
    mutationFn: async (brandId: string) => {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return { createBrand, deleteBrand };
}

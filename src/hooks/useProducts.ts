'use client';

import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';
import { withTimeout } from '@/lib/supabase/withTimeout';

const PAGE_SIZE = 20;

type VariantFullRow = {
  id: string;
  barcode: string;
  size: string;
  size_code: string;
  quantity: number | string;
  is_active: boolean;
  is_archived: boolean;
  variant_created_at?: string;
  product_id: string;
  product_name: string;
  description?: string | null;
  cost_price: number | string;
  sale_price: number | string;
  tva_rate: number | string;
  price_ttc: number | string;
  margin_ht: number | string;
  margin_pct: number | string;
  image_url?: string | null;
  seq_number: number;
  product_archived: boolean;
  category_id: string;
  category_code: string;
  category_name: string;
  size_type: string;
  color_id: string;
  color_code: string;
  color_name: string;
  color_hex?: string | null;
  brand_name?: string | null;
};

type ProductListItem = {
  id: string;
  name: string;
  category_name: string;
  brand_name?: string;
  sale_price: number;
  price_ttc: number;
  image_url?: string;
  total_variants: number;
  total_stock: number;
  variants: Array<{
    id: string;
    color_name: string;
    size: string;
    barcode: string;
    quantity: number;
  }>;
};

function num(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function aggregateProducts(rows: VariantFullRow[]): ProductListItem[] {
  const map = new Map<string, ProductListItem>();

  rows.forEach((row) => {
    const existing = map.get(row.product_id);
    const variant = {
      id: row.id,
      color_name: row.color_name,
      size: row.size,
      barcode: row.barcode,
      quantity: num(row.quantity),
    };

    if (!existing) {
      map.set(row.product_id, {
        id: row.product_id,
        name: row.product_name,
        category_name: row.category_name,
        brand_name: row.brand_name || undefined,
        sale_price: num(row.sale_price),
        price_ttc: num(row.price_ttc),
        image_url: row.image_url || undefined,
        total_variants: 1,
        total_stock: num(row.quantity),
        variants: [variant],
      });
      return;
    }

    existing.total_variants += 1;
    existing.total_stock += num(row.quantity);
    existing.variants.push(variant);
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function useProducts(query?: string, categoryId?: string, page: number = 0) {
  const supabase = supabaseClient;

  return useQuery({
    queryKey: ['products', query, categoryId, page],
    retry: 2,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      let request = supabase
        .from('v_variant_full')
        .select('*')
        .eq('product_archived', false)
        .eq('is_archived', false)
        .order('product_name', { ascending: true });

      if (categoryId) {
        request = request.eq('category_id', categoryId);
      }

      const { data, error } = await withTimeout(request);

      if (error) {
        console.error('[useProducts] Supabase error:', error);
        throw error;
      }

      const rawRows = (data || []) as VariantFullRow[];
      const normalizedQuery = (query || '').trim().toLowerCase();
      const filteredRows = normalizedQuery
        ? rawRows.filter((row) =>
            [
              row.product_name,
              row.category_name,
              row.brand_name || '',
              row.barcode,
              row.color_name,
              row.size,
            ].some((value) => value.toLowerCase().includes(normalizedQuery))
          )
        : rawRows;

      const products = aggregateProducts(filteredRows);
      const start = page * PAGE_SIZE;
      const paginatedProducts = products.slice(start, start + PAGE_SIZE);

      return {
        success: true,
        total: products.length,
        limit: PAGE_SIZE,
        offset: start,
        products: paginatedProducts,
      };
    },
  });
}

export function useProductDetail(productId: string) {
  const supabase = supabaseClient;

  return useQuery({
    queryKey: ['product', productId],
    retry: 2,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('v_variant_full')
          .select('*')
          .eq('product_id', productId)
          .order('color_name', { ascending: true })
          .order('size_code', { ascending: true })
      );

      if (error) {
        console.error('[useProductDetail] Supabase error:', error);
        throw error;
      }

      const rows = (data || []) as VariantFullRow[];
      const first = rows[0];
      if (!first) return null;

      const { data: productRow, error: productError } = await withTimeout(
        supabase
          .from('products')
          .select('brand_id')
          .eq('id', productId)
          .maybeSingle()
      );

      if (productError) {
        console.warn('[useProductDetail] Product brand warning:', productError);
      }

      const colorsMap = new Map<string, { id: string; code: string; name_fr: string; hex: string }>();
      const sizesMap = new Map<string, { size: string; size_code: string }>();

      rows.forEach((row) => {
        colorsMap.set(row.color_id, {
          id: row.color_id,
          code: row.color_code,
          name_fr: row.color_name,
          hex: row.color_hex || '#cccccc',
        });
        sizesMap.set(row.size_code, {
          size: row.size,
          size_code: row.size_code,
        });
      });

      return {
        success: true,
        data: {
          product: {
            id: first.product_id,
            name: first.product_name,
            description: first.description || '',
            category: {
              id: first.category_id,
              code: first.category_code,
              name_fr: first.category_name,
            },
            brand: first.brand_name
              ? { id: productRow?.brand_id || '', name: first.brand_name }
              : undefined,
            cost_price: num(first.cost_price),
            sale_price: num(first.sale_price),
            tva_rate: num(first.tva_rate),
            price_ttc: num(first.price_ttc),
            margin_ht: num(first.margin_ht),
            margin_pct: num(first.margin_pct),
            image_url: first.image_url || undefined,
            seq_number: first.seq_number,
            is_archived: first.product_archived,
          },
          colors: Array.from(colorsMap.values()),
          sizes: Array.from(sizesMap.values()).sort((a, b) =>
            a.size_code.localeCompare(b.size_code)
          ),
          variants: rows.map((row) => ({
            id: row.id,
            color_id: row.color_id,
            color_code: row.color_code,
            color_name: row.color_name,
            color_hex: row.color_hex || '#cccccc',
            size: row.size,
            size_code: row.size_code,
            barcode: row.barcode,
            quantity: num(row.quantity),
            is_active: row.is_active,
            is_archived: row.is_archived,
          })),
        },
      };
    },
    enabled: !!productId,
  });
}

export function useCategories() {
  const supabase = supabaseClient;

  return useQuery({
    queryKey: ['categories'],
    retry: 2,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase.from('categories').select('*').order('sort_order', { ascending: true })
      );
      if (error) throw error;
      return data || [];
    },
  });
}

export function useColors() {
  const supabase = supabaseClient;

  return useQuery({
    queryKey: ['colors'],
    retry: 2,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('colors')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      );
      if (error) throw error;
      return data || [];
    },
  });
}

export function useBrands() {
  const supabase = supabaseClient;

  return useQuery({
    queryKey: ['brands'],
    retry: 2,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase.from('brands').select('*').order('name', { ascending: true })
      );
      if (error) throw error;
      return data || [];
    },
  });
}

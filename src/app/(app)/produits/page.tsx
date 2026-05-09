'use client';

import { useState } from 'react';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PackageSearch, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { useMounted } from '@/hooks/useMounted';

export default function ProductsPage() {
  const mounted = useMounted();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useProducts(
    debouncedSearch,
    categoryId === 'all' ? undefined : categoryId,
    page
  );
  const { data: categories } = useCategories();

  // Pre‑mounted skeleton
  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-5">
        <div className="h-11 rounded-xl bg-rose-light/30 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-2xl bg-rose-light/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-5">
      {/* Filters & action bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-10 h-11 rounded-xl bg-white/70 backdrop-blur-sm border-rose-soft/20 focus:border-primary/40 focus:ring-2 focus:ring-rose-glow/20 text-sm"
          />
        </div>

        {/* Category select */}
        <Select
          value={categoryId}
          onValueChange={(v) => {
            setCategoryId(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl bg-white/70 backdrop-blur-sm border-rose-soft/20 text-sm">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-rose-soft/20 bg-white/90 backdrop-blur-md">
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name_fr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* New product – desktop */}
        <Link href="/produits/nouveau/" className="hidden sm:block">
          <Button className="gap-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium">
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        </Link>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-2xl bg-rose-light/20" />
          ))}
        </div>
      ) : !data?.products || data.products.length === 0 ? (
        /* Empty state */
        <div className="rose-empty-state">
          <div className="rose-empty-state-icon">
            <PackageSearch className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium text-foreground">Aucun produit trouvé</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectez Supabase pour voir les données
          </p>
        </div>
      ) : (
        <>
          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                categoryName={product.category_name}
                brandName={product.brand_name}
                priceTtc={product.price_ttc}
                imageUrl={product.image_url}
                totalStock={product.total_stock}
                totalVariants={product.total_variants}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.total > data.limit && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-9 px-4 rounded-xl border-rose-soft/20 bg-white/60 hover:bg-white/80 text-sm"
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {page + 1} / {Math.ceil(data.total / data.limit)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * data.limit >= data.total}
                className="h-9 px-4 rounded-xl border-rose-soft/20 bg-white/60 hover:bg-white/80 text-sm"
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      {/* Mobile FAB – new product */}
      <Link
        href="/produits/nouveau/"
        className="sm:hidden fixed bottom-24 right-4 z-40"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-2xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
          aria-label="Nouveau produit"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
'use client';

import { useState, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useVariants } from '@/hooks/useVariants';
import { useSettings } from '@/hooks/useSettings';
import { QuickStockIn } from '@/components/stock/QuickStockIn';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

// ─── Sub-components ────────────────────────────────────────────────────────────

function StockSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function StockPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useProducts(search);
  const { addStock } = useVariants();
  const { settings } = useSettings();

  const handleAddStock = useCallback(
    async (variantId: string, quantity: number) => {
      await addStock.mutateAsync({ variantId, quantity });
      toast.success(`${quantity} unité${quantity > 1 ? 's' : ''} ajoutée${quantity > 1 ? 's' : ''}`);
    },
    [addStock]
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
        <Input
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 rounded-xl bg-card border-border/40 text-sm"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <StockSkeleton />
      ) : (
        <QuickStockIn
          products={data?.products ?? []}
          onAddStock={handleAddStock}
          lowStockThreshold={settings?.low_stock_threshold}
        />
      )}
    </div>
  );
}
'use client';

import { useState, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useVariants } from '@/hooks/useVariants';
import { useSettings } from '@/hooks/useSettings';
import { QuickStockIn } from '@/components/stock/QuickStockIn';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

function StockSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-soft/20 bg-white/80 p-12 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-light/40 text-primary">
        <WifiOff className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Connexion interrompue</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Impossible de charger les produits. Réessayez.
        </p>
      </div>
      <Button onClick={onRetry} variant="outline" className="rounded-xl">
        <RefreshCw className="h-4 w-4 mr-2" />
        Réessayer
      </Button>
    </div>
  );
}

export default function StockPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useProducts(search);
  const { addStock, removeStock } = useVariants();
  const { settings } = useSettings();

  const handleAddStock = useCallback(
    async (variantId: string, quantity: number) => {
      await addStock.mutateAsync({ variantId, quantity });
      toast.success(`${quantity} unité${quantity > 1 ? 's' : ''} ajoutée${quantity > 1 ? 's' : ''}`);
    },
    [addStock]
  );

  const handleRemoveStock = useCallback(
    async (variantId: string, quantity: number) => {
      const result = await removeStock.mutateAsync({ variantId, quantity });
      const removed = result.quantity_removed;
      toast.success(`${removed} unité${removed > 1 ? 's' : ''} retirée${removed > 1 ? 's' : ''}`);
    },
    [removeStock]
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
        <Input
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 rounded-xl bg-card border-border/40 text-sm"
        />
      </div>

      {isLoading ? (
        <StockSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <QuickStockIn
          products={data?.products ?? []}
          onAddStock={handleAddStock}
          onRemoveStock={handleRemoveStock}
          lowStockThreshold={settings?.low_stock_threshold}
        />
      )}
    </div>
  );
}

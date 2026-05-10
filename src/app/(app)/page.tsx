'use client';

import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';
import { useVariants } from '@/hooks/useVariants';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Package, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

type ArchivedProduct = {
  id: string;
  name: string;
  category_name: string;
  total_variants: number;
};

export default function ArchivesPage() {
const supabase = supabaseClient;
  const { unarchiveVariant } = useVariants();

  const { data: archivedProducts = [], isLoading } = useQuery({
    queryKey: ['archives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_variant_full')
        .select('product_id, product_name, category_name, product_archived, is_archived')
        .or('product_archived.eq.true,is_archived.eq.true')
        .order('product_name', { ascending: true });

      if (error) throw error;

      const map = new Map<string, ArchivedProduct>();
      (data || []).forEach((row) => {
        const existing = map.get(row.product_id);
        if (existing) {
          existing.total_variants += 1;
        } else {
          map.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            category_name: row.category_name,
            total_variants: 1,
          });
        }
      });

      return Array.from(map.values());
    },
  });

  const handleUnarchive = async (productId: string) => {
    await unarchiveVariant.mutateAsync(productId);
    toast.success('Produit désarchivé');
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-3">
        <Skeleton className="h-10 w-full rounded-2xl bg-rose-light/20" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl bg-rose-light/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
      {/* Info banner */}
      <div className="rounded-2xl border border-rose-soft/20 bg-white/70 backdrop-blur-sm px-4 py-3 text-sm text-muted-foreground">
        Les produits archivés depuis plus de 365 jours seront automatiquement supprimés.
      </div>

      {/* Empty state */}
      {archivedProducts.length === 0 ? (
        <div className="rose-empty-state">
          <div className="rose-empty-state-icon">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium text-foreground">Aucun produit archivé</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les produits que vous archivez apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {archivedProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-4 shadow-sm transition-all hover:bg-white hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-light/40 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.category_name} — {product.total_variants} variant(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="destructive" className="rounded-full px-3 py-1 text-xs font-medium">
                  Archivé
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnarchive(product.id)}
                  disabled={unarchiveVariant.isPending}
                  className="rounded-xl border-rose-soft/20 bg-white/60 hover:bg-white/80 text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Désarchiver
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
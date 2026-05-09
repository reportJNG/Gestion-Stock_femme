'use client';

import { Crown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TopProduct {
  product_name: string;
  total_sold: number;
  total_revenue_ttc: number;
}

interface TopProductsProps {
  products: TopProduct[];
  maxSold: number;
}

export function TopProducts({ products, maxSold }: TopProductsProps) {
  return (
    <div className="rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Top produits vendus</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Les pièces qui font vivre la boutique
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Crown className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rose-soft/20 bg-rose-light/10 p-6 text-center">
          <Crown className="mx-auto h-6 w-6 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium">Aucune vente enregistrée</p>
          <p className="text-xs text-muted-foreground mt-1">
            Les favoris apparaîtront ici dès que les ventes commencent.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.slice(0, 5).map((product, index) => (
            <div
              key={index}
              className="rounded-xl border border-rose-soft/20 bg-white/60 p-3 hover:bg-rose-light/20 transition-colors"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium truncate">{product.product_name}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {product.total_sold} vendus
                </span>
              </div>
              <Progress
                value={maxSold > 0 ? (product.total_sold / maxSold) * 100 : 0}
                className="h-2 bg-rose-light/30"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
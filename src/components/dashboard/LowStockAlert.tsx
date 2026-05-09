'use client';

import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface LowStockItem {
  id: string;
  product_name: string;
  color_name: string;
  size: string;
  quantity: number;
  barcode: string;
}

interface LowStockAlertProps {
  items: LowStockItem[];
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  return (
    <div className="rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Stock faible</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {items.length} article(s) à surveiller
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-center">
          <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 mb-2" />
          <p className="text-sm font-medium">Tout est bien rempli</p>
          <p className="text-xs text-muted-foreground mt-1">
            Aucun article en stock faible pour le moment.
          </p>
        </div>
      ) : (
        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
          {items.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-rose-soft/20 bg-white/60 p-3 hover:bg-rose-light/20 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.color_name} · Taille {item.size}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                  {item.quantity}
                </span>
                <Link
                  href={`/produits?search=${item.barcode}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                  aria-label="Voir le produit"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
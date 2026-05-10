'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Package, ImageOff } from 'lucide-react';
import { cn, formatDZD } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  categoryName: string;
  brandName?: string;
  priceTtc: number;
  imageUrl?: string;
  totalStock: number;
  totalVariants: number;
  lowStockThreshold?: number;
}

export function ProductCard({ id, name, categoryName, brandName, priceTtc, imageUrl, totalStock, totalVariants, lowStockThreshold = 5 }: ProductCardProps) {
  const stockStatus = totalStock === 0 ? 'out' : totalStock <= lowStockThreshold ? 'low' : 'ok';
  const statusConfig = {
    out: { dot: 'bg-red-400', text: 'text-red-600', badge: 'Rupture' },
    low: { dot: 'bg-amber-400', text: 'text-amber-600', badge: `${totalStock} stk` },
    ok: { dot: 'bg-emerald-400', text: 'text-emerald-600', badge: `${totalStock} stk` },
  }[stockStatus];

  return (
    <Link href={`/produits/${id}`} className="group block h-full">
      <Card className="h-full border-rose-soft/20 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="p-4">
          <div className="relative aspect-square mb-3 rounded-2xl bg-gradient-to-br from-rose-light to-brand-muted/30 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="(max-width: 768px) 50vw, 220px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <ImageOff className="h-10 w-10 text-muted-foreground/30" />
            )}
          </div>
          <h3 className="font-semibold text-sm truncate">{name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{categoryName}{brandName ? ` · ${brandName}` : ''}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="font-bold text-lg tabular-nums">{formatDZD(priceTtc)}</span>
            <span className={cn('flex items-center gap-1 text-xs font-medium', statusConfig.text)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
              {statusConfig.badge}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            {totalVariants} variante{totalVariants>1?'s':''}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

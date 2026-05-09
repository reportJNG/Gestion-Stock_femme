'use client';

import { cn } from '@/lib/utils';

interface StockBadgeProps {
  quantity: number;
  lowThreshold?: number;
  className?: string;
}

export function StockBadge({ quantity, lowThreshold = 5, className }: StockBadgeProps) {
  const status = quantity === 0 ? 'out' : quantity <= lowThreshold ? 'low' : 'ok';
  const colors = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    low: 'bg-amber-50 text-amber-700 border-amber-200',
    out: 'bg-red-50 text-red-700 border-red-200',
  }[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', colors, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', status==='ok'?'bg-emerald-400':status==='low'?'bg-amber-400':'bg-red-400')} />
      {quantity}
    </span>
  );
}
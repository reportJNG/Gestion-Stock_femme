'use client';

import { cn, formatDZD, formatNumber } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  isCurrency?: boolean;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, isCurrency, className }: StatsCardProps) {
  const formatted = isCurrency ? formatDZD(value) : formatNumber(value);

  return (
    <div
      className={cn(
        'rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-5 shadow-sm',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{formatted}</p>
      </div>
    </div>
  );
}
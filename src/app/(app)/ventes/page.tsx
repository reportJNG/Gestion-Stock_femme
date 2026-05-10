'use client';

import { useState } from 'react';
import { useSales } from '@/hooks/useSales';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDZD, formatShortDate, cn } from '@/lib/utils';
import Link from 'next/link';
import { Receipt, ChevronRight, RefreshCw, WifiOff } from 'lucide-react';

const PERIODS = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week',  label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'all',   label: 'Tout' },
] as const;

type Period = typeof PERIODS[number]['key'];

function getDateRange(period: Period): { from?: string; to?: string } {
  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  if (period === 'today') return { from: today, to: today };
  if (period === 'week') {
    const from = new Date(now.getTime() - 7 * 86_400_000).toISOString().split('T')[0];
    return { from, to: today };
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      .toISOString().split('T')[0];
    return { from, to: today };
  }
  return {};
}

function SalesSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <Skeleton className="h-9 w-72 rounded-xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/40 bg-card p-12 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Connexion interrompue</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Impossible de charger les ventes. Réessayez.
        </p>
      </div>
      <Button onClick={onRetry} variant="outline" className="rounded-xl">
        <RefreshCw className="h-4 w-4 mr-2" />
        Réessayer
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Receipt className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-foreground">Aucune vente</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Les ventes apparaîtront ici une fois enregistrées.
      </p>
    </div>
  );
}

function SaleRow({ sale, isLast }: {
  sale: { id: string; sale_number: string; items_count: number; created_at: string; customer_name?: string; total_ttc: number };
  isLast: boolean;
}) {
  return (
    <Link href={`/ventes/${sale.id}`}>
      <div className={cn(
        'flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40',
        !isLast && 'border-b border-border/30'
      )}>
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">{sale.sale_number}</p>
              {sale.items_count > 1 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {sale.items_count} art.
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatShortDate(sale.created_at)}
              {sale.customer_name && (
                <span className="before:content-['·'] before:mx-1.5">{sale.customer_name}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatDZD(sale.total_ttc)}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>
    </Link>
  );
}

function Pagination({ page, totalPages, hasNext, onPrev, onNext }: {
  page: number; totalPages: number; hasNext: boolean;
  onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-1">
      <Button variant="outline" size="sm" onClick={onPrev} disabled={page === 0}
        className="rounded-xl border-border/40 text-xs h-8">
        Précédent
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">
        {page + 1} / {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}
        className="rounded-xl border-border/40 text-xs h-8">
        Suivant
      </Button>
    </div>
  );
}

export default function SalesPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [page, setPage]     = useState(0);

  const { from, to } = getDateRange(period);
  const { data, isLoading, isError, refetch } = useSales(from, to, page);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;
  const hasNext    = data ? (page + 1) * data.limit < data.total : false;

  const handlePeriodChange = (key: Period) => {
    setPeriod(key);
    setPage(0);
  };

  if (isLoading) return <SalesSkeleton />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-1 bg-muted/60 border border-border/40 rounded-xl p-1 w-fit">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePeriodChange(key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-xs font-medium transition-all',
              period === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.sales.length ? (
        <EmptyState />
      ) : (
        <>
          <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
            {data.sales.map((sale, i) => (
              <SaleRow key={sale.id} sale={sale} isLast={i === data.sales.length - 1} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              hasNext={hasNext}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          )}
        </>
      )}
    </div>
  );
}
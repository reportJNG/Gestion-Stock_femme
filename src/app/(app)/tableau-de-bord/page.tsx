'use client';

import { useDashboardStats, useLowStockItems, useTopProducts } from '@/hooks/useDashboard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDZD, formatNumber } from '@/lib/utils';
import {
  DollarSign,
  Package,
  AlertTriangle,
  Trophy,
  Warehouse,
  TrendingUp,
  ShoppingBag,
  HeartHandshake,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: lowStockItems = [] } = useLowStockItems();
  const { data: topProducts = [] } = useTopProducts();

  const chartData = [
    { date: 'Lun', revenue: 12500 },
    { date: 'Mar', revenue: 18200 },
    { date: 'Mer', revenue: 9800 },
    { date: 'Jeu', revenue: 22400 },
    { date: 'Ven', revenue: 15600 },
    { date: 'Sam', revenue: 28700 },
    { date: 'Dim', revenue: stats?.revenue_today || 0 },
  ];

  const maxSold = Math.max(...topProducts.map((p) => p.total_sold), 1);

  if (statsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Skeleton className="h-32 rounded-2xl bg-rose-light/20" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-rose-light/20" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl bg-rose-light/20" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Hero welcome card */}
      <div className="rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
              Tableau de bord
            </p>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Bonjour
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Voici un aperçu de votre boutique aujourd'hui.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end gap-0.5 rounded-xl border border-rose-soft/20 bg-rose-light/20 px-4 py-3 min-w-[120px]">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-medium text-primary uppercase tracking-wide">
                  CA du jour
                </span>
              </div>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {formatDZD(stats?.revenue_today || 0)}
              </span>
            </div>

            <div className="flex flex-col items-end gap-0.5 rounded-xl border border-rose-soft/20 bg-white/60 px-4 py-3 min-w-[110px]">
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Articles
                </span>
              </div>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {formatNumber(stats?.units_sold_today || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatsCard
          title="CA Aujourd'hui"
          value={stats?.revenue_today || 0}
          icon={DollarSign}
          isCurrency
        />
        <StatsCard
          title="Articles vendus"
          value={stats?.units_sold_today || 0}
          icon={Package}
        />
        <StatsCard
          title="Stock faible"
          value={stats?.low_stock_count || 0}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Meilleur produit"
          value={stats?.best_product_qty || 0}
          icon={Trophy}
        />
        <StatsCard
          title="Valeur stock"
          value={stats?.total_stock_value || 0}
          icon={Warehouse}
          isCurrency
        />
      </div>

      {/* Chart + Low stock */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <SalesChart data={chartData} />
        <LowStockAlert items={lowStockItems} />
      </div>

      {/* Top products + Pulse */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <TopProducts products={topProducts} maxSold={maxSold} />
        <div className="rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-light/40 text-primary mb-4">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Rythme boutique</p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Gardez un œil sur les articles faibles et remettez les favoris en stock avant le prochain rush.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px rounded-xl overflow-hidden border border-rose-soft/20">
            <div className="flex flex-col gap-0.5 bg-rose-light/10 px-4 py-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Alertes
              </span>
              <span className="text-xl font-bold tabular-nums text-primary">
                {stats?.low_stock_count || 0}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 bg-white/60 px-4 py-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Vendus
              </span>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {formatNumber(stats?.units_sold_today || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
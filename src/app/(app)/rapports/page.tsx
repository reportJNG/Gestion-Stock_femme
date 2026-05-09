'use client';

import { useState } from 'react';
import { useReport } from '@/hooks/useReport';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDZD, formatNumber, cn } from '@/lib/utils';
// REMOVE these static imports:
// import { exportToPDF, exportToExcel } from '@/lib/export/export-reports';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui",
  week: 'Semaine',
  month: 'Mois',
};

const CATEGORY_COLORS = [
  'hsl(var(--rose))',
  'hsl(var(--rose-soft))',
  'hsl(var(--rose-glow))',
  'hsl(var(--rose-ink))',
  'hsl(var(--primary))',
];

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '0.5px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: '12px',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden',
      className
    )}>
      {children}
    </div>
  );
}

function CardHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-4 border-b border-border/30">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="px-4 py-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-[240px] rounded-2xl" />;
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const { data: report, isLoading } = useReport(period);

  const statCards = [
    { label: 'Revenus période',  value: formatDZD(report?.revenue ?? 0) },
    { label: 'Bénéfice',         value: formatDZD(report?.profit ?? 0) },
    { label: 'Transactions',     value: formatNumber(report?.transactions ?? 0) },
    { label: 'Valeur stock',     value: formatDZD(report?.stockValue ?? 0) },
  ];

  const handleExportPDF = async () => {
    if (!report) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    setExportingPDF(true);
    try {
      // Dynamically import the PDF export function only when needed
      const { exportToPDF } = await import('@/lib/export/export-reports');
      await exportToPDF(report, PERIOD_LABELS[period]);
      toast.success('PDF exporté avec succès');
    } catch (error) {
      console.error('PDF export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de l'export PDF: ${errorMessage}`);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (!report) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    setExportingExcel(true);
    try {
      // Dynamically import the Excel export function only when needed
      const { exportToExcel } = await import('@/lib/export/export-reports');
      await exportToExcel(report, PERIOD_LABELS[period]);
      toast.success('Excel exporté avec succès');
    } catch (error) {
      console.error('Excel export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de l'export Excel: ${errorMessage}`);
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-5">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Period picker */}
        <div className="flex gap-1 bg-muted/60 border border-border/40 rounded-xl p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-lg text-xs h-7 px-3 transition-all',
                period === p
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border/40 bg-card text-xs h-8 gap-1.5"
            onClick={handleExportPDF}
            disabled={exportingPDF || !report}
          >
            {exportingPDF ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            {exportingPDF ? 'Export...' : 'PDF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border/40 bg-card text-xs h-8 gap-1.5"
            onClick={handleExportExcel}
            disabled={exportingExcel || !report}
          >
            {exportingExcel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {exportingExcel ? 'Export...' : 'Excel'}
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Bar chart */}
        <Card>
          <CardHeader title="Revenus vs Bénéfices" />
          <div className="px-5 py-4">
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={report?.chart ?? []} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                  <Bar dataKey="revenue" name="Revenus" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit"  name="Bénéfice" fill="hsl(var(--rose-soft))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Pie chart - static for now, add real hook later */}
        <Card>
          <CardHeader title="Répartition par catégorie" />
          <div className="px-5 py-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'T-shirts', value: 35 },
                    { name: 'Chaussures', value: 25 },
                    { name: 'Pantalons', value: 20 },
                    { name: 'Vestes', value: 15 },
                    { name: 'Accessoires', value: 5 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {CATEGORY_COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-3">
              {['T-shirts', 'Chaussures', 'Pantalons', 'Vestes', 'Accessoires'].map((name, i) => (
                <div key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i] }} />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top products */}
      <Card>
        <CardHeader title="Top produits" />
        {isLoading ? (
          <div className="px-5 py-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {(report?.topProducts ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Aucune vente sur cette période
              </div>
            ) : (
              (report?.topProducts ?? []).map((product, i) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-xs tabular-nums text-muted-foreground font-medium">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(product.sold)} vendus
                    </span>
                    <span className="text-sm tabular-nums font-medium">
                      {formatDZD(product.revenue)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useWorkerSales,
  useWorkerSalesSummary,
  type WorkerSale,
} from "@/hooks/useWorkers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  TrendingUp,
  CalendarDays,
  CalendarRange,
  ShoppingBag,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface WorkerSalesPanelProps {
  workerId: string;
}

type DateRange = "today" | "week" | "month" | "all";

function getDateRange(range: DateRange): { from?: string; to?: string } {
  const now = new Date();
  switch (range) {
    case "today": {
      const startOfToday = format(now, "yyyy-MM-dd") + "T00:00:00";
      const endOfToday = format(now, "yyyy-MM-dd") + "T23:59:59";
      return { from: startOfToday, to: endOfToday };
    }
    case "week": return { from: format(subDays(now, 7), "yyyy-MM-dd") + "T00:00:00", to: format(now, "yyyy-MM-dd") + "T23:59:59" };
    case "month": return { from: format(subDays(now, 30), "yyyy-MM-dd") + "T00:00:00", to: format(now, "yyyy-MM-dd") + "T23:59:59" };
    default: return {};
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "dd MMM yyyy, HH:mm", { locale: fr });
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  isLoading: boolean;
}) {
  return (
    <Card className="boutique-stat">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </>
            )}
          </div>
          <div className="rose-glow-icon h-10 w-10 shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SaleRow({ sale, index }: { sale: WorkerSale; index: number }) {
  return (
    <TableRow className="group hover:bg-muted/40 transition-colors">
      <TableCell className="font-medium text-xs tabular-nums">#{index + 1}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-mono text-xs font-medium">{sale.sale_number}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatDate(sale.created_at)}</TableCell>
      <TableCell>
        {sale.customer_name ? (
          <span className="text-sm">{sale.customer_name}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">Client anonyme</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary" className="rounded-lg text-xs">
          {sale.items_count || 1} article{(sale.items_count || 1) > 1 ? "s" : ""}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-semibold tabular-nums">
        {formatCurrency(sale.total_ttc)}
      </TableCell>
    </TableRow>
  );
}

export function WorkerSalesPanel({ workerId }: WorkerSalesPanelProps) {
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { from, to } = getDateRange(dateRange);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useWorkerSalesSummary(workerId);

  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
  } = useWorkerSales(workerId, { from, to, limit: pageSize, offset: page * pageSize });

  const sales = salesData?.sales || [];
  const totalCount = salesData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const isLoading = summaryLoading || salesLoading;
  const hasError = summaryError || salesError;

  if (hasError) {
    return (
      <div className="rose-empty-state">
        <div className="rose-empty-state-icon">
          <FileText className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">Impossible de charger les données de vente</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Ventes totales" value={summary?.total_sales || 0} subtitle="Depuis le début" icon={ShoppingBag} isLoading={summaryLoading} />
        <StatCard title="Revenus TTC" value={formatCurrency(summary?.revenue_ttc || 0)} subtitle="Total des ventes" icon={TrendingUp} isLoading={summaryLoading} />
        <StatCard title="Aujourd'hui" value={summary?.today_sales || 0} subtitle={formatCurrency(summary?.today_revenue || 0)} icon={CalendarDays} isLoading={summaryLoading} />
        <StatCard title="Cette semaine" value={summary?.week_sales || 0} subtitle={`${summary?.month_sales || 0} ce mois`} icon={CalendarRange} isLoading={summaryLoading} />
      </div>

      <Card className="luxe-card overflow-hidden">
        <CardHeader className="p-4 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Historique des ventes
              {!isLoading && (
                <Badge variant="outline" className="rounded-lg text-xs ml-1">
                  {totalCount} vente{totalCount > 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
            <Select value={dateRange} onValueChange={(v) => { setDateRange(v as DateRange); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-[160px] glass-input h-8 text-xs">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout l&apos;historique</SelectItem>
                <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-3">
          <Separator className="mb-3" />
          <div className="table-surface overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] text-xs">#</TableHead>
                  <TableHead className="text-xs">N° Vente</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs text-center">Articles</TableHead>
                  <TableHead className="text-xs text-right">Total TTC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-8 w-8 opacity-30" />
                        <p className="text-sm">Aucune vente trouvée pour cette période</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale, idx) => (
                    <SaleRow key={sale.id} sale={sale} index={page * pageSize + idx} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 px-1">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} sur {totalPages} ({totalCount} résultats)
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || isLoading}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || isLoading}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
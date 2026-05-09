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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Receipt, TrendingUp, CalendarDays, CalendarRange,
  ShoppingBag, FileText, ChevronLeft, ChevronRight, User,
} from "lucide-react";

interface WorkerSalesPanelProps {
  workerId: string;
}

type DateRange = "today" | "week" | "month" | "all";

function getDateRange(range: DateRange): { from?: string; to?: string } {
  const now = new Date();
  const pad = (d: Date) => format(d, "yyyy-MM-dd");
  switch (range) {
    case "today": return { from: `${pad(now)}T00:00:00`, to: `${pad(now)}T23:59:59` };
    case "week": return { from: `${pad(subDays(now, 7))}T00:00:00`, to: `${pad(now)}T23:59:59` };
    case "month": return { from: `${pad(subDays(now, 30))}T00:00:00`, to: `${pad(now)}T23:59:59` };
    default: return {};
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency", currency: "DZD", minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr), "dd MMM yyyy, HH:mm", { locale: fr });
}

function formatDateShort(dateStr: string) {
  return format(new Date(dateStr), "dd MMM, HH:mm", { locale: fr });
}

// Stat card
function StatCard({
  title, value, subtitle, icon: Icon, isLoading,
}: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; isLoading: boolean;
}) {
  return (
    <Card className="border border-border/50 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 truncate">{title}</p>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight leading-none mb-1">{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              </>
            )}
          </div>
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mobile sale card
function SaleMobileCard({ sale, index }: { sale: WorkerSale; index: number }) {
  return (
    <div className="p-4 border-b last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <Receipt className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-mono font-semibold truncate">{sale.sale_number}</p>
            <p className="text-xs text-muted-foreground">{formatDateShort(sale.created_at)}</p>
          </div>
        </div>
        <p className="text-sm font-bold tabular-nums shrink-0">{formatCurrency(sale.total_ttc)}</p>
      </div>
      <div className="flex items-center justify-between gap-2 pl-9">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          <User className="h-3 w-3 shrink-0" />
          {sale.customer_name || <span className="italic">Client anonyme</span>}
        </span>
        <Badge variant="secondary" className="rounded-lg text-xs shrink-0 px-2 py-0.5">
          {sale.items_count || 1} art.
        </Badge>
      </div>
    </div>
  );
}

export function WorkerSalesPanel({ workerId }: WorkerSalesPanelProps) {
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { from, to } = getDateRange(dateRange);

  const { data: summary, isLoading: summaryLoading, error: summaryError } =
    useWorkerSalesSummary(workerId);

  const { data: salesData, isLoading: salesLoading, error: salesError } =
    useWorkerSales(workerId, { from, to, limit: pageSize, offset: page * pageSize });

  const sales = salesData?.sales || [];
  const totalCount = salesData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const isLoading = summaryLoading || salesLoading;

  if (summaryError || salesError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium mb-1">Erreur de chargement</p>
        <p className="text-xs text-muted-foreground">Impossible de charger les données de vente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Ventes totales"
          value={summary?.total_sales ?? 0}
          subtitle="Depuis le début"
          icon={ShoppingBag}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Revenus TTC"
          value={formatCurrency(summary?.revenue_ttc ?? 0)}
          subtitle="Total des ventes"
          icon={TrendingUp}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Aujourd'hui"
          value={summary?.today_sales ?? 0}
          subtitle={formatCurrency(summary?.today_revenue ?? 0)}
          icon={CalendarDays}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Cette semaine"
          value={summary?.week_sales ?? 0}
          subtitle={`${summary?.month_sales ?? 0} ce mois`}
          icon={CalendarRange}
          isLoading={summaryLoading}
        />
      </div>

      {/* Sales history */}
      <Card className="overflow-hidden border border-border/60 shadow-sm">
        <CardHeader className="px-4 pt-4 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Historique des ventes
              {!isLoading && (
                <Badge variant="outline" className="rounded-lg text-xs ml-1 border-border/60">
                  {totalCount} vente{totalCount > 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
            <Select
              value={dateRange}
              onValueChange={(v) => { setDateRange(v as DateRange); setPage(0); }}
            >
              <SelectTrigger className="h-8 w-full sm:w-[160px] text-xs rounded-xl bg-muted/50 border-muted-foreground/10">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-sm">Tout l&apos;historique</SelectItem>
                <SelectItem value="today" className="text-sm">Aujourd&apos;hui</SelectItem>
                <SelectItem value="week" className="text-sm">7 derniers jours</SelectItem>
                <SelectItem value="month" className="text-sm">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <Separator />

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <TableHead className="pl-4 py-2.5 text-xs w-12">#</TableHead>
                <TableHead className="py-2.5 text-xs">N° Vente</TableHead>
                <TableHead className="py-2.5 text-xs">Date</TableHead>
                <TableHead className="py-2.5 text-xs">Client</TableHead>
                <TableHead className="py-2.5 text-xs text-center">Articles</TableHead>
                <TableHead className="py-2.5 text-xs text-right pr-4">Total TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell className="pl-4"><Skeleton className="h-3.5 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-14 mx-auto rounded-full" /></TableCell>
                    <TableCell className="pr-4"><Skeleton className="h-3.5 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-8 w-8 opacity-20" />
                      <p className="text-sm">Aucune vente pour cette période</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale, idx) => (
                  <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-b-0">
                    <TableCell className="pl-4 py-3 text-xs text-muted-foreground tabular-nums">
                      {page * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-mono text-xs font-medium">{sale.sale_number}</span>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{formatDate(sale.created_at)}</TableCell>
                    <TableCell className="py-3 text-sm">
                      {sale.customer_name
                        ? sale.customer_name
                        : <span className="text-muted-foreground italic text-xs">Client anonyme</span>}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Badge variant="secondary" className="rounded-lg text-xs">
                        {sale.items_count || 1} art.
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right pr-4 font-semibold text-sm tabular-nums">
                      {formatCurrency(sale.total_ttc)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 border-b last:border-b-0 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-36" />
              </div>
            ))
          ) : sales.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-center px-4">
              <Receipt className="h-8 w-8 opacity-20" />
              <p className="text-sm text-muted-foreground">Aucune vente pour cette période</p>
            </div>
          ) : (
            sales.map((sale, idx) => (
              <SaleMobileCard key={sale.id} sale={sale} index={page * pageSize + idx} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} / {totalPages}
                <span className="hidden sm:inline"> · {totalCount} résultats</span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
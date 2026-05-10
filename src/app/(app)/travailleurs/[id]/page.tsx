"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorker, useWorkerSalesSummary } from "@/hooks/useWorkers";
import { WorkerSalesPanel } from "@/components/workers/WorkerSalesPanel";
import { WorkerFormDialog } from "@/components/workers/WorkerFormDialog";
import { DeleteWorkerDialog } from "@/components/workers/DeleteWorkerDialog";
import { InfoRow } from "@/components/workers/InfowRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Users, Mail, Phone, CalendarDays, Percent,
  Pencil, Trash2, Receipt, BarChart3, UserX, CircleUser,
} from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency", currency: "DZD", minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-DZ", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function WorkerInitialsAvatar({ name, email, isLoading }: { name?: string | null; email?: string; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-muted flex items-center justify-center shrink-0">
        <CircleUser className="h-7 w-7 text-muted-foreground/40" />
      </div>
    );
  }
  const initials = name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    || email?.[0].toUpperCase()
    || "?";
  return (
    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-base sm:text-lg font-bold text-primary shrink-0 select-none">
      {initials}
    </div>
  );
}

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workerId = params.id as string;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: worker, isLoading: workerLoading, error: workerError } = useWorker(workerId);
  const { data: summary, isLoading: summaryLoading } = useWorkerSalesSummary(workerId);
  const isLoading = workerLoading || summaryLoading;

  if (workerError) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl gap-2 mb-6 -ml-2 text-sm"
          onClick={() => router.push("/travailleurs")}
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux travailleurs
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <UserX className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold mb-1">Travailleur introuvable</p>
          <p className="text-sm text-muted-foreground">Ce travailleur n&apos;existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-xl gap-2 -ml-2 text-sm h-8"
        onClick={() => router.push("/travailleurs")}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Travailleurs</span>
      </Button>

      {/* Worker hero card */}
      <Card className="border border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <WorkerInitialsAvatar
              name={worker?.full_name}
              email={worker?.email}
              isLoading={workerLoading}
            />

            <div className="flex-1 min-w-0">
              {workerLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-tight">
                      {worker?.full_name || "—"}
                    </h1>
                    {worker?.is_active ? (
                      <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 border-0 gap-1.5 font-medium text-xs px-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" /> Actif
                      </Badge>
                    ) : (
                      <Badge className="rounded-full bg-rose-500/10 text-rose-500 border-0 gap-1.5 font-medium text-xs px-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" /> Inactif
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {worker?.email}
                    {worker && (
                      <span className="hidden sm:inline"> · Travailleur depuis {formatDate(worker.created_at)}</span>
                    )}
                  </p>
                  {worker && (
                    <p className="sm:hidden text-xs text-muted-foreground mt-0.5">
                      Depuis {formatDate(worker.created_at)}
                    </p>
                  )}
                </>
              )}
            </div>

            {!workerLoading && worker && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 h-9 text-sm flex-1 sm:flex-none"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Modifier</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 h-9 text-sm text-destructive hover:bg-destructive/8 hover:text-destructive border-destructive/20 flex-1 sm:flex-none"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Supprimer</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="h-9 bg-muted/60 p-1 rounded-xl w-full sm:w-auto">
          <TabsTrigger
            value="sales"
            className="flex-1 sm:flex-none rounded-lg gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Receipt className="h-3.5 w-3.5" /> Ventes
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="flex-1 sm:flex-none rounded-lg gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Informations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-0">
          <WorkerSalesPanel workerId={workerId} />
        </TabsContent>

        <TabsContent value="info" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Personal info */}
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/8 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">Informations personnelles</h3>
                </div>
                <Separator className="mb-1" />
                <InfoRow icon={Users} label="Nom complet" value={worker?.full_name} isLoading={workerLoading} />
                <InfoRow icon={Mail} label="Adresse email" value={worker?.email} isLoading={workerLoading} />
                <InfoRow icon={Phone} label="Téléphone" value={worker?.phone} isLoading={workerLoading} />
                <InfoRow icon={CalendarDays} label="Date d'ajout" value={worker ? formatDate(worker.created_at) : undefined} isLoading={workerLoading} />
                <InfoRow icon={Percent} label="Taux de commission" value={worker?.commission_rate ? `${worker.commission_rate}%` : null} isLoading={workerLoading} />
              </CardContent>
            </Card>

            {/* Sales stats */}
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/8 flex items-center justify-center">
                    <Receipt className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">Statistiques de vente</h3>
                </div>
                <Separator className="mb-2" />
                <div className="space-y-1">
                  {[
                    { label: "Ventes totales", value: summary?.total_sales ?? 0, currency: false },
                    { label: "Revenus TTC", value: summary?.revenue_ttc ?? 0, currency: true },
                    { label: "Aujourd'hui (ventes)", value: summary?.today_sales ?? 0, currency: false },
                    { label: "Aujourd'hui (revenus)", value: summary?.today_revenue ?? 0, currency: true },
                    { label: "Cette semaine", value: summary?.week_sales ?? 0, currency: false },
                    { label: "Ce mois", value: summary?.month_sales ?? 0, currency: false },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      {isLoading
                        ? <Skeleton className="h-4 w-20" />
                        : <span className="text-sm font-semibold tabular-nums">
                            {stat.currency ? formatCurrency(stat.value as number) : stat.value}
                          </span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {worker && (
        <>
          <WorkerFormDialog
            mode="edit"
            worker={worker}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <DeleteWorkerDialog
            worker={worker}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onSuccess={() => router.push("/travailleurs")}
          />
        </>
      )}
    </div>
  );
}

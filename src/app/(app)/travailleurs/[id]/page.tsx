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
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", minimumFractionDigits: 0 }).format(amount);
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-DZ", { day: "numeric", month: "long", year: "numeric" });
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
      <div className="page-shell max-w-5xl mx-auto">
        <Button variant="ghost" size="sm" className="rounded-lg gap-2 mb-4" onClick={() => router.push("/travailleurs")}>
          <ArrowLeft className="h-4 w-4" /> Retour aux travailleurs
        </Button>
        <div className="rose-empty-state">
          <div className="rose-empty-state-icon"><UserX className="h-6 w-6" /></div>
          <p className="text-base font-medium">Travailleur introuvable</p>
          <p className="text-sm text-muted-foreground">Ce travailleur n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  const initials = worker?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || worker?.email[0].toUpperCase() || "?";

  return (
    <div className="page-shell max-w-6xl mx-auto">
      <Button variant="ghost" size="sm" className="rounded-lg gap-2 -ml-2" onClick={() => router.push("/travailleurs")}>
        <ArrowLeft className="h-4 w-4" /> Travailleurs
      </Button>

      <div className="rose-page-hero">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0 border-2 border-primary/20">
            {isLoading ? <CircleUser className="h-8 w-8 opacity-50" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold tracking-tight">{worker?.full_name || "—"}</h1>
                  {worker?.is_active ? (
                    <Badge variant="default" className="rounded-full bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 gap-1 font-medium text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/15 gap-1 font-medium text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Inactif
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {worker?.email} · Travailleur depuis {worker ? formatDate(worker.created_at) : "—"}
                </p>
              </>
            )}
          </div>
          {!isLoading && worker && (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Supprimer
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="rounded-xl h-10 bg-muted/60 p-1 w-full sm:w-auto">
          <TabsTrigger value="sales" className="rounded-lg gap-2 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Receipt className="h-3.5 w-3.5" /> Ventes
          </TabsTrigger>
          <TabsTrigger value="info" className="rounded-lg gap-2 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <BarChart3 className="h-3.5 w-3.5" /> Informations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4 space-y-4">
          <WorkerSalesPanel workerId={workerId} />
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="luxe-card">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Informations personnelles</h3>
                <Separator className="mb-3" />
                <div className="space-y-1">
                  <InfoRow icon={Users} label="Nom complet" value={worker?.full_name} isLoading={workerLoading} />
                  <InfoRow icon={Mail} label="Adresse email" value={worker?.email} isLoading={workerLoading} />
                  <InfoRow icon={Phone} label="Téléphone" value={worker?.phone} isLoading={workerLoading} />
                  <InfoRow icon={CalendarDays} label="Date d'ajout" value={worker ? formatDate(worker.created_at) : undefined} isLoading={workerLoading} />
                  <InfoRow icon={Percent} label="Taux de commission" value={worker?.commission_rate ? `${worker.commission_rate}%` : null} isLoading={workerLoading} />
                </div>
              </CardContent>
            </Card>
            <Card className="luxe-card">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Statistiques de vente</h3>
                <Separator className="mb-3" />
                <div className="space-y-4">
                  {[
                    { label: "Ventes totales", value: summary?.total_sales ?? 0, currency: false },
                    { label: "Revenus TTC", value: summary?.revenue_ttc ?? 0, currency: true },
                    { label: "Aujourd'hui (ventes)", value: summary?.today_sales ?? 0, currency: false },
                    { label: "Aujourd'hui (revenus)", value: summary?.today_revenue ?? 0, currency: true },
                    { label: "Cette semaine", value: summary?.week_sales ?? 0, currency: false },
                    { label: "Ce mois", value: summary?.month_sales ?? 0, currency: false },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      {isLoading ? <Skeleton className="h-5 w-20" /> : (
                        <span className="text-sm font-semibold tabular-nums">
                          {stat.currency ? formatCurrency(stat.value as number) : stat.value}
                        </span>
                      )}
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
          <WorkerFormDialog mode="edit" worker={worker} open={editOpen} onOpenChange={setEditOpen} />
          <DeleteWorkerDialog worker={worker} open={deleteOpen} onOpenChange={setDeleteOpen} onSuccess={() => router.push("/travailleurs")} />
        </>
      )}
    </div>
  );
}
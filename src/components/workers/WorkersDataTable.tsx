"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWorkers, useToggleWorkerActive, type Worker } from "@/hooks/useWorkers";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Users, MoreHorizontal, Pencil, Trash2,
  Power, PowerOff, Eye, UserCheck, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsUpDown, Phone, Percent,
} from "lucide-react";
import { WorkerFormDialog } from "./WorkerFormDialog";
import { DeleteWorkerDialog } from "./DeleteWorkerDialog";

type SortField = "full_name" | "email" | "created_at" | "is_active";
type SortDirection = "asc" | "desc";

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-0 gap-1.5 font-medium text-xs px-2.5 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
      Actif
    </Badge>
  ) : (
    <Badge className="rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500/15 border-0 gap-1.5 font-medium text-xs px-2.5 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
      Inactif
    </Badge>
  );
}

function WorkerAvatar({ worker }: { worker: Worker }) {
  const initials = worker.full_name
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    || worker.email[0].toUpperCase();
  return (
    <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0 select-none">
      {initials}
    </div>
  );
}

function SortButton({
  field, sortField, sortDir, onClick, children,
}: {
  field: SortField; sortField: SortField; sortDir: SortDirection;
  onClick: () => void; children: React.ReactNode;
}) {
  const active = sortField === field;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-xs font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
      {active
        ? sortDir === "asc"
          ? <ChevronUp className="h-3 w-3" />
          : <ChevronDown className="h-3 w-3" />
        : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        {search ? <Search className="h-6 w-6 text-muted-foreground" /> : <Users className="h-6 w-6 text-muted-foreground" />}
      </div>
      <p className="text-sm font-semibold mb-1">
        {search ? "Aucun résultat" : "Aucun travailleur"}
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        {search ? `Aucun travailleur ne correspond à « ${search} »` : "Ajoutez votre premier travailleur pour commencer."}
      </p>
    </div>
  );
}

// Mobile card view for each worker
function WorkerCard({
  worker,
  onEdit,
  onDelete,
  onToggle,
  isToggling,
}: {
  worker: Worker;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  isToggling: boolean;
}) {
  const router = useRouter();
  return (
    <div
      className="p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => router.push(`/travailleurs/${worker.id}`)}
    >
      <div className="flex items-start gap-3">
        <WorkerAvatar worker={worker} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold truncate">{worker.full_name || "—"}</p>
            <StatusBadge isActive={worker.is_active} />
          </div>
          <p className="text-xs text-muted-foreground truncate mb-2">{worker.email}</p>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
            {worker.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />{worker.phone}
              </span>
            )}
            {worker.commission_rate ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Percent className="h-3 w-3" />{worker.commission_rate}%
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={worker.is_active}
            onCheckedChange={onToggle}
            disabled={isToggling}
            className="scale-90"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={() => router.push(`/travailleurs/${worker.id}`)} className="gap-2 rounded-lg cursor-pointer text-sm">
                <Eye className="h-4 w-4" /> Voir les détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit} className="gap-2 rounded-lg cursor-pointer text-sm">
                <Pencil className="h-4 w-4" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggle} className="gap-2 rounded-lg cursor-pointer text-sm">
                {worker.is_active
                  ? <><PowerOff className="h-4 w-4 text-orange-500" /> Désactiver</>
                  : <><Power className="h-4 w-4 text-emerald-500" /> Activer</>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="gap-2 rounded-lg cursor-pointer text-sm text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export function WorkersDataTable() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteWorker, setDeleteWorker] = useState<Worker | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: workers,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useWorkers({ search: search || undefined });
  const toggleActive = useToggleWorkerActive();

  const sortedWorkers = useMemo(() => {
    if (!workers) return [];
    return [...workers].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "full_name": cmp = (a.full_name || "").localeCompare(b.full_name || ""); break;
        case "email": cmp = a.email.localeCompare(b.email); break;
        case "created_at": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case "is_active": cmp = Number(a.is_active) - Number(b.is_active); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [workers, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  const activeCount = workers?.filter((w) => w.is_active).length ?? 0;
  const totalCount = workers?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-xl bg-muted/50 border-muted-foreground/10 focus:bg-background"
          />
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && totalCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{activeCount}/{totalCount} actif{activeCount > 1 ? "s" : ""}</span>
            </div>
          )}
          <WorkerFormDialog
            mode="create"
            trigger={
              <Button size="sm" className="rounded-xl gap-2 text-xs h-9 shrink-0">
                <Users className="h-3.5 w-3.5" />
                <span>Ajouter</span>
              </Button>
            }
          />
        </div>
      </div>

      <Card className="overflow-hidden border border-border/60 shadow-sm">
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="pl-5 py-3 w-[220px]">
                    <SortButton field="full_name" sortField={sortField} sortDir={sortDir} onClick={() => handleSort("full_name")}>
                      Travailleur
                    </SortButton>
                  </TableHead>
                  <TableHead className="py-3">
                    <SortButton field="email" sortField={sortField} sortDir={sortDir} onClick={() => handleSort("email")}>
                      Email
                    </SortButton>
                  </TableHead>
                  <TableHead className="py-3 text-center text-xs font-medium text-muted-foreground">Téléphone</TableHead>
                  <TableHead className="py-3 text-center text-xs font-medium text-muted-foreground">Commission</TableHead>
                  <TableHead className="py-3 text-center">
                    <SortButton field="is_active" sortField={sortField} sortDir={sortDir} onClick={() => handleSort("is_active")}>
                      Statut
                    </SortButton>
                  </TableHead>
                  <TableHead className="py-3 text-right pr-5 text-xs font-medium text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell className="pl-5 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-3.5 w-40" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-3.5 w-24 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto rounded-full" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-14 mx-auto rounded-full" /></TableCell>
                      <TableCell className="pr-5"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertTriangle className="h-8 w-8 text-destructive/60" />
                        <Alert variant="destructive" className="rounded-xl max-w-xs">
                          <AlertDescription>Impossible de charger les travailleurs.</AlertDescription>
                        </Alert>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => refetch()}
                          disabled={isFetching}
                        >
                          Réessayer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedWorkers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState search={search} />
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedWorkers.map((worker) => (
                    <TableRow
                      key={worker.id}
                      className="group cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/40 last:border-b-0"
                      onClick={() => router.push(`/travailleurs/${worker.id}`)}
                    >
                      <TableCell className="pl-5 py-3">
                        <div className="flex items-center gap-3">
                          <WorkerAvatar worker={worker} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate leading-tight">{worker.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(worker.created_at).toLocaleDateString("fr-DZ")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{worker.email}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {worker.phone
                          ? <span className="text-sm font-mono text-muted-foreground">{worker.phone}</span>
                          : <span className="text-xs text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {worker.commission_rate
                          ? <Badge variant="outline" className="rounded-full text-xs font-mono border-primary/20 text-primary bg-primary/5">{worker.commission_rate}%</Badge>
                          : <span className="text-xs text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={worker.is_active}
                            onCheckedChange={(checked) => toggleActive.mutate({ id: worker.id, isActive: checked })}
                            disabled={toggleActive.isPending}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                              <DropdownMenuItem onClick={() => router.push(`/travailleurs/${worker.id}`)} className="gap-2 rounded-lg cursor-pointer text-sm">
                                <Eye className="h-4 w-4" /> Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditWorker(worker); setEditOpen(true); }} className="gap-2 rounded-lg cursor-pointer text-sm">
                                <Pencil className="h-4 w-4" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => toggleActive.mutate({ id: worker.id, isActive: !worker.is_active })}
                                className="gap-2 rounded-lg cursor-pointer text-sm"
                              >
                                {worker.is_active
                                  ? <><PowerOff className="h-4 w-4 text-orange-500" /> Désactiver</>
                                  : <><Power className="h-4 w-4 text-emerald-500" /> Activer</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => { setDeleteWorker(worker); setDeleteOpen(true); }}
                                className="gap-2 rounded-lg cursor-pointer text-sm text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive/60 mx-auto mb-3" />
                <p className="text-sm text-destructive">Impossible de charger les travailleurs.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg mt-3"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  Réessayer
                </Button>
              </div>
            ) : sortedWorkers.length === 0 ? (
              <EmptyState search={search} />
            ) : (
              sortedWorkers.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onEdit={() => { setEditWorker(worker); setEditOpen(true); }}
                  onDelete={() => { setDeleteWorker(worker); setDeleteOpen(true); }}
                  onToggle={() => toggleActive.mutate({ id: worker.id, isActive: !worker.is_active })}
                  isToggling={toggleActive.isPending}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {editWorker && (
        <WorkerFormDialog
          mode="edit"
          worker={editWorker}
          open={editOpen}
          onOpenChange={(open) => { setEditOpen(open); if (!open) setEditWorker(null); }}
        />
      )}
      {deleteWorker && (
        <DeleteWorkerDialog
          worker={deleteWorker}
          open={deleteOpen}
          onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteWorker(null); }}
        />
      )}
    </div>
  );
}

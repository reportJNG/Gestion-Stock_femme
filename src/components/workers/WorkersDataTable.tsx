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
  Power, PowerOff, Eye, UserCheck, AlertTriangle, ArrowUpDown,
} from "lucide-react";
import { WorkerFormDialog } from "./WorkerFormDialog";
import { DeleteWorkerDialog } from "./DeleteWorkerDialog";

type SortField = "full_name" | "email" | "created_at" | "is_active";
type SortDirection = "asc" | "desc";

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant="default" className="rounded-full bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 gap-1 font-medium text-xs px-2.5 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Actif
    </Badge>
  ) : (
    <Badge variant="secondary" className="rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/15 gap-1 font-medium text-xs px-2.5 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Inactif
    </Badge>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="rose-empty-state my-8">
      <div className="rose-empty-state-icon">
        {search ? <Search className="h-6 w-6" /> : <Users className="h-6 w-6" />}
      </div>
      <p className="text-base font-medium mb-1">
        {search ? "Aucun travailleur trouvé" : "Aucun travailleur enregistré"}
      </p>
      <p className="text-sm text-muted-foreground">
        {search ? "Essayez un autre terme de recherche" : "Ajoutez votre premier travailleur pour commencer"}
      </p>
    </div>
  );
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDirection }) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />;
  return <ArrowUpDown className={`h-3.5 w-3.5 text-primary ${sortDir === "desc" ? "rotate-180" : ""} transition-transform`} />;
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

  const { data: workers, isLoading, error } = useWorkers({ search: search || undefined });
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

  const activeCount = workers?.filter((w) => w.is_active).length || 0;
  const totalCount = workers?.length || 0;

  return (
    <div className="space-y-4">
      <div className="rose-toolbar">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 glass-input h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{activeCount} / {totalCount} actif{activeCount > 1 ? "s" : ""}</span>
            </div>
            <WorkerFormDialog
              mode="create"
              trigger={
                <Button size="sm" className="rounded-xl gap-2 text-xs h-9">
                  <Users className="h-3.5 w-3.5" /> Ajouter
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <Card className="luxe-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">
                    <button onClick={() => handleSort("full_name")} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      Travailleur <SortIcon field="full_name" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("email")} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      Email <SortIcon field="email" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Téléphone</TableHead>
                  <TableHead className="text-center">Commission</TableHead>
                  <TableHead className="text-center">
                    <button onClick={() => handleSort("is_active")} className="flex items-center gap-1.5 mx-auto hover:text-primary transition-colors">
                      Statut <SortIcon field="is_active" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-14 mx-auto rounded-full" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 py-8">
                        <AlertTriangle className="h-8 w-8 text-destructive/70" />
                        <Alert variant="destructive" className="rounded-xl max-w-xs mx-auto">
                          <AlertDescription>Impossible de charger la liste des travailleurs.</AlertDescription>
                        </Alert>
                        <Button variant="outline" size="sm" className="rounded-lg mt-2" onClick={() => window.location.reload()}>
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
                      className="group cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => router.push(`/travailleurs/${worker.id}`)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {worker.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || worker.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{worker.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              Ajouté {new Date(worker.created_at).toLocaleDateString("fr-DZ")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{worker.email}</span></TableCell>
                      <TableCell className="text-center">
                        {worker.phone ? (
                          <span className="text-sm font-mono text-muted-foreground">{worker.phone}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">Non renseigné</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {worker.commission_rate ? (
                          <Badge variant="outline" className="rounded-full text-xs font-mono">{worker.commission_rate}%</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={worker.is_active}
                            onCheckedChange={(checked) => toggleActive.mutate({ id: worker.id, isActive: checked })}
                            disabled={toggleActive.isPending}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                              <DropdownMenuItem onClick={() => router.push(`/travailleurs/${worker.id}`)} className="gap-2 rounded-lg cursor-pointer">
                                <Eye className="h-4 w-4" /> Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditWorker(worker); setEditOpen(true); }} className="gap-2 rounded-lg cursor-pointer">
                                <Pencil className="h-4 w-4" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleActive.mutate({ id: worker.id, isActive: !worker.is_active })} className="gap-2 rounded-lg cursor-pointer">
                                {worker.is_active ? (
                                  <><PowerOff className="h-4 w-4 text-orange-500" /> Désactiver</>
                                ) : (
                                  <><Power className="h-4 w-4 text-emerald-500" /> Activer</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setDeleteWorker(worker); setDeleteOpen(true); }} className="gap-2 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
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
        </CardContent>
      </Card>

      {editWorker && (
        <WorkerFormDialog
          mode="edit"
          worker={editWorker}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditWorker(null);
          }}
        />
      )}
      {deleteWorker && (
        <DeleteWorkerDialog
          worker={deleteWorker}
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) setDeleteWorker(null);
          }}
        />
      )}
    </div>
  );
}
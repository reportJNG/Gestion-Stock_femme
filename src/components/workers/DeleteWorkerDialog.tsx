"use client";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import { useDeleteWorker } from "@/hooks/useWorkers";
import type { Worker } from "@/hooks/useWorkers";
import { useState } from "react";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression";
}

interface DeleteWorkerDialogProps {
  worker: Worker;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteWorkerDialog({
  worker, trigger, open, onOpenChange, onSuccess,
}: DeleteWorkerDialogProps) {
  const deleteWorker = useDeleteWorker();
  const [error, setError] = useState<string | null>(null);
  const isPending = deleteWorker.isPending;
  const workerName = worker.full_name || worker.email;

  async function handleDelete() {
    try {
      setError(null);
      await deleteWorker.mutateAsync(worker.id);
      onOpenChange?.(false);
      onSuccess?.();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isPending) { setError(null); onOpenChange?.(newOpen); }
      }}
    >
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}

      <AlertDialogContent className="w-full max-w-md rounded-2xl gap-0 p-0 overflow-hidden">
        {/* Header */}
        <AlertDialogHeader className="p-5 pb-4">
          <AlertDialogTitle className="flex items-center gap-2.5 text-base font-semibold text-destructive">
            <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            Supprimer le travailleur
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
            Êtes-vous sûr de vouloir supprimer définitivement{" "}
            <span className="font-semibold text-foreground">«&nbsp;{workerName}&nbsp;»</span>
            &nbsp;? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="px-5 space-y-3 pb-5">
          {/* Error */}
          {error && (
            <div className="rounded-xl bg-destructive/8 border border-destructive/20 p-3 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive leading-relaxed">{error}</p>
            </div>
          )}

          {/* Consequences */}
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-500">Conséquences de cette action</p>
            </div>
            <ul className="space-y-1.5">
              {[
                "Le compte d'accès sera définitivement supprimé",
                "L'historique des ventes associées sera conservé",
                "L'historique des commissions restera intact",
                "Cette action ne peut pas être annulée",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <AlertDialogFooter className="px-5 pb-5 flex-row gap-2 sm:justify-end border-t border-border/40 pt-4">
          <AlertDialogCancel
            disabled={isPending}
            className="flex-1 sm:flex-none rounded-xl h-10 text-sm"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleDelete(); }}
            disabled={isPending}
            className="flex-1 sm:flex-none rounded-xl h-10 text-sm gap-2 bg-destructive hover:bg-destructive/90 text-white"
          >
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Suppression...</>
              : <><Trash2 className="h-4 w-4" /> Supprimer définitivement</>}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useDeleteWorker } from "@/hooks/useWorkers";
import type { Worker } from "@/hooks/useWorkers";
import { useState } from "react";

interface DeleteWorkerDialogProps {
  worker: Worker;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteWorkerDialog({
  worker,
  trigger,
  open,
  onOpenChange,
  onSuccess,
}: DeleteWorkerDialogProps) {
  const deleteWorker = useDeleteWorker();
  const [error, setError] = useState<string | null>(null);
  const isPending = deleteWorker.isPending;

  async function handleDelete() {
    try {
      setError(null);
      await deleteWorker.mutateAsync(worker.id);
      onOpenChange?.(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors de la suppression");
    }
  }

  const workerName = worker.full_name || worker.email;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isPending) {
          setError(null);
          onOpenChange?.(newOpen);
        }
      }}
    >
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Supprimer le travailleur
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer définitivement{" "}
            <span className="font-semibold text-foreground">{workerName}</span>
            ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="rounded-xl bg-destructive/5 border border-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive mb-2">⚠️ Conséquences :</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
            <li>Toutes les données de vente associées seront conservées</li>
            <li>Le compte d'accès sera définitivement supprimé</li>
            <li>L'historique des commissions restera intact</li>
            <li>Cette action ne peut pas être annulée</li>
          </ul>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={isPending} className="rounded-xl">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-white rounded-xl gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Supprimer définitivement
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
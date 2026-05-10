"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserPlus, Pencil, Loader2, Eye, EyeOff, AlertTriangle,
} from "lucide-react";
import type { Worker, WorkerFormData, WorkerUpdateData } from "@/hooks/useWorkers";
import { useCreateWorker, useUpdateWorker } from "@/hooks/useWorkers";

const createSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
  full_name: z.string().min(2, "Le nom complet est requis"),
  phone: z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100).default(0),
  is_active: z.boolean().default(true),
});

const editSchema = z.object({
  full_name: z.string().min(2, "Le nom complet est requis"),
  phone: z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100),
  is_active: z.boolean().default(true),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Une erreur est survenue";
}

interface WorkerFormDialogProps {
  mode: "create" | "edit";
  worker?: Worker | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WorkerFormDialog({
  mode, worker, trigger, open: controlledOpen, onOpenChange, onSuccess,
}: WorkerFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEdit = mode === "edit";
  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker();

  const form = useForm<CreateFormValues | EditFormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: isEdit
      ? {
          full_name: worker?.full_name || "",
          phone: worker?.phone || "",
          commission_rate: worker?.commission_rate || 0,
          is_active: worker?.is_active ?? true,
        }
      : { email: "", password: "", full_name: "", phone: "", commission_rate: 0, is_active: true },
  });

  useEffect(() => {
    if (isEdit && worker) {
      form.reset({
        full_name: worker.full_name || "",
        phone: worker.phone || "",
        commission_rate: worker.commission_rate || 0,
        is_active: worker.is_active ?? true,
      });
      setError(null);
    }
  }, [worker, isEdit, form]);

  const isPending = createWorker.isPending || updateWorker.isPending;

  async function onSubmit(values: CreateFormValues | EditFormValues) {
    try {
      setError(null);
      if (isEdit && worker) {
        await updateWorker.mutateAsync({
          id: worker.id,
          full_name: values.full_name,
          phone: values.phone,
          commission_rate: values.commission_rate,
          is_active: values.is_active,
        } satisfies WorkerUpdateData);
      } else {
        const createValues = values as CreateFormValues;
        await createWorker.mutateAsync({
          email: createValues.email,
          password: createValues.password,
          full_name: createValues.full_name,
          phone: createValues.phone || undefined,
          commission_rate: createValues.commission_rate,
          is_active: createValues.is_active,
        } satisfies WorkerFormData);
        form.reset();
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isPending) { setError(null); setOpen(newOpen); }
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="w-full max-w-lg mx-auto max-h-[92dvh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {isEdit
              ? <><Pencil className="h-4 w-4 text-primary" /> Modifier le travailleur</>
              : <><UserPlus className="h-4 w-4 text-primary" /> Nouveau travailleur</>}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {isEdit
              ? "Modifiez les informations du travailleur ci-dessous."
              : "Créez un nouveau compte travailleur avec accès au scanner de vente."}
          </DialogDescription>
        </DialogHeader>

        <Separator className="shrink-0" />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="worker-form" className="px-5 py-5 space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-xl py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Full name */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nom complet <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Ahmed Benali"
                        {...field}
                        className="h-10 rounded-xl bg-muted/40 border-muted-foreground/15 focus:bg-background text-sm"
                        autoComplete="name"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Email + Password (create only) */}
              {!isEdit && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Adresse email <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="worker@example.com"
                            {...field}
                            className="h-10 rounded-xl bg-muted/40 border-muted-foreground/15 focus:bg-background text-sm"
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Mot de passe temporaire <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Min. 6 caractères"
                              {...field}
                              className="h-10 rounded-xl bg-muted/40 border-muted-foreground/15 focus:bg-background text-sm pr-10"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground">
                          Le travailleur devra changer ce mot de passe lors de sa première connexion.
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Téléphone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+213 5XX XXX XXX"
                        {...field}
                        value={field.value || ""}
                        className="h-10 rounded-xl bg-muted/40 border-muted-foreground/15 focus:bg-background text-sm"
                        autoComplete="tel"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Commission rate */}
              <FormField
                control={form.control}
                name="commission_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Taux de commission (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        placeholder="0"
                        {...field}
                        className="h-10 rounded-xl bg-muted/40 border-muted-foreground/15 focus:bg-background text-sm"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">
                      Pourcentage appliqué sur les ventes réalisées (0–100 %).
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Active toggle */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3.5 gap-4">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <FormLabel className="text-sm font-medium leading-none">Compte actif</FormLabel>
                      <FormDescription className="text-xs text-muted-foreground leading-relaxed">
                        Désactivez pour bloquer l&apos;accès sans supprimer le compte.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <Separator className="shrink-0" />

        {/* Footer */}
        <DialogFooter className="px-5 py-4 flex-row gap-2 shrink-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="flex-1 sm:flex-none rounded-xl h-10 text-sm"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="worker-form"
            disabled={isPending || (isEdit && !form.formState.isDirty)}
            className="flex-1 sm:flex-none rounded-xl h-10 text-sm gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending
              ? "Enregistrement..."
              : isEdit ? "Enregistrer" : "Créer le travailleur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

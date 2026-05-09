"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Pencil, Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react";
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

interface WorkerFormDialogProps {
  mode: "create" | "edit";
  worker?: Worker | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WorkerFormDialog({
  mode,
  worker,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
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
      : {
          email: "",
          password: "",
          full_name: "",
          phone: "",
          commission_rate: 0,
          is_active: true,
        },
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
          ...values,
        } as WorkerUpdateData);
      } else {
        await createWorker.mutateAsync({
          ...values,
          phone: (values as CreateFormValues).phone || undefined,
        } as WorkerFormData);
        form.reset();
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Une erreur est survenue"
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isPending) {
          setError(null);
          setOpen(newOpen);
        }
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            {isEdit ? (
              <>
                <Pencil className="h-5 w-5 text-primary" />
                Modifier le travailleur
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-primary" />
                Nouveau travailleur
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit
              ? "Modifiez les informations du travailleur ci-dessous."
              : "Créez un nouveau compte travailleur avec accès au scanner de vente."}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-6">
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ahmed Benali" {...field} className="glass-input" autoComplete="name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="worker@example.com" {...field} className="glass-input" autoComplete="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe temporaire *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 6 caractères"
                            {...field}
                            className="glass-input pr-10"
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Le travailleur devra changer ce mot de passe lors de sa première connexion.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+213 5XX XXX XXX" {...field} value={field.value || ""} className="glass-input" autoComplete="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taux de commission (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} step={0.5} placeholder="0" {...field} className="glass-input" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Pourcentage de commission sur les ventes réalisées (0-100%).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/30">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Compte actif</FormLabel>
                    <FormDescription className="text-xs">
                      Désactivez pour empêcher l'accès sans supprimer le compte.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending} className="rounded-xl">
                Annuler
              </Button>
              <Button type="submit" disabled={isPending || (isEdit && !form.formState.isDirty)} className="rounded-xl gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer le travailleur"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createLabelStyles, generateLabelsGridHTML, type LabelData } from '@/lib/print/labelTemplate';
import { printThermalLabel } from '@/lib/print/printService';
import { DEFAULT_LABEL_SIZE_MM } from '@/lib/print/xprinter';
import { cn } from '@/lib/utils';
import { Barcode, Minus, Plus, Printer, Tag } from 'lucide-react';
import { toast } from 'sonner';

type ProductForLabels = {
  name: string;
  brand?: { name?: string };
  sale_price: number;
  price_ttc?: number;
};

type VariantForLabels = {
  id: string;
  barcode: string;
  color_name?: string;
  color_hex?: string | null;
  size: string;
  quantity: number;
  is_archived: boolean;
};

interface ProductLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductForLabels;
  variants: VariantForLabels[];
}

function isValidQuantity(value: string) {
  return /^[1-9]\d*$/.test(value.trim());
}

export function ProductLabelsDialog({
  open,
  onOpenChange,
  product,
  variants,
}: ProductLabelsDialogProps) {
  const printableVariants = useMemo(
    () => variants.filter((variant) => !variant.is_archived),
    [variants]
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const selectedVariants = printableVariants.filter((variant) => selectedIds.has(variant.id));
  const hasInvalidQuantity = selectedVariants.some(
    (variant) => !isValidQuantity(quantities[variant.id] ?? '1')
  );
  const totalLabels = selectedVariants.reduce((total, variant) => {
    const value = quantities[variant.id] ?? '1';
    return isValidQuantity(value) ? total + Number(value) : total;
  }, 0);
  const canPrint = selectedVariants.length > 0 && !hasInvalidQuantity;

  const toggleVariant = (variantId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(variantId);
      } else {
        next.delete(variantId);
      }
      return next;
    });
    setQuantities((current) => ({ ...current, [variantId]: current[variantId] ?? '1' }));
  };

  const updateQuantity = (variantId: string, value: string) => {
    setQuantities((current) => ({ ...current, [variantId]: value }));
  };

  const stepQuantity = (variantId: string, direction: -1 | 1) => {
    setQuantities((current) => {
      const parsed = isValidQuantity(current[variantId] ?? '1')
        ? Number(current[variantId] ?? '1')
        : 1;
      return { ...current, [variantId]: String(Math.max(1, parsed + direction)) };
    });
  };

  const handlePrint = async () => {
    if (printableVariants.length === 0) {
      toast.warning('Aucun variant actif a imprimer');
      return;
    }

    if (!canPrint) {
      toast.warning('Selectionnez un variant et une quantite valide');
      return;
    }

    const labels: LabelData[] = selectedVariants.flatMap((variant) => {
      const count = Number(quantities[variant.id] ?? '1');
      const label: LabelData = {
        barcode: variant.barcode,
        productName: product.name,
        brandName: product.brand?.name,
        colorName: variant.color_name,
        size: variant.size,
        priceTTC: product.price_ttc ?? product.sale_price,
      };

      return Array.from({ length: count }, () => label);
    });

    const result = await printThermalLabel({
      title: `Etiquettes - ${product.name}`,
      html: generateLabelsGridHTML(labels),
      widthMm: DEFAULT_LABEL_SIZE_MM.width,
      heightMm: DEFAULT_LABEL_SIZE_MM.height,
      styles: createLabelStyles(DEFAULT_LABEL_SIZE_MM),
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`${labels.length} etiquette(s) prete(s) a imprimer`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)]">
        <DialogHeader className="px-4 pb-3 pt-4 pr-11 sm:px-6 sm:pb-4 sm:pt-6 sm:pr-12">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-muted text-primary sm:h-10 sm:w-10">
              <Tag className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-base sm:text-lg">Imprimer les etiquettes</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed sm:text-sm">
                Choisissez les tailles et couleurs de ce produit, puis indiquez combien d etiquettes imprimer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {printableVariants.length === 0 ? (
          <div className="mx-4 min-h-0 rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center sm:mx-6 sm:p-8">
            <Barcode className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Aucun variant actif</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les variants archives ne sont pas disponibles pour l impression.
            </p>
          </div>
        ) : (
          <ScrollArea className="mx-4 min-h-0 rounded-2xl border border-border/50 sm:mx-6">
            <div className="divide-y divide-border/50">
              {printableVariants.map((variant) => {
                const selected = selectedIds.has(variant.id);
                const quantity = quantities[variant.id] ?? '1';
                const invalid = selected && !isValidQuantity(quantity);

                return (
                  <div
                    key={variant.id}
                    className={cn(
                      'grid gap-3 p-3 transition-colors sm:grid-cols-[minmax(0,1fr)_180px] sm:p-4',
                      selected ? 'bg-brand-muted/50' : 'bg-card/40 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) => toggleVariant(variant.id, checked === true)}
                        aria-label={`Selectionner ${variant.color_name ?? 'couleur'} ${variant.size}`}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-border shadow-sm"
                            style={{ backgroundColor: variant.color_hex || '#cccccc' }}
                          />
                          <p className="max-w-full break-words font-medium leading-snug text-foreground">
                            {variant.color_name || 'Couleur'} / {variant.size}
                          </p>
                          <Badge variant="secondary">Stock {variant.quantity}</Badge>
                        </div>
                        <div className="mt-2 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                          <Barcode className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate font-mono">{variant.barcode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 rounded-xl bg-background/40 p-2 sm:bg-transparent sm:p-0">
                      <Label htmlFor={`label-qty-${variant.id}`} className="text-xs text-muted-foreground">
                        Quantite a imprimer
                      </Label>
                      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          disabled={!selected}
                          onClick={() => stepQuantity(variant.id, -1)}
                          aria-label="Diminuer"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          id={`label-qty-${variant.id}`}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={quantity}
                          disabled={!selected}
                          onChange={(event) => updateQuantity(variant.id, event.target.value)}
                          className={cn('h-9 text-center font-mono', invalid && 'border-destructive focus-visible:ring-destructive/40')}
                          aria-invalid={invalid}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          disabled={!selected}
                          onClick={() => stepQuantity(variant.id, 1)}
                          aria-label="Augmenter"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {invalid && <p className="text-xs text-destructive">Minimum 1 etiquette.</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="grid grid-cols-2 gap-2 border-t border-border/50 bg-card/95 px-4 py-3 sm:flex sm:justify-end sm:px-6 sm:py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handlePrint} disabled={!canPrint} className="min-w-0">
            <Printer className="h-4 w-4" />
            <span className="truncate">
              Imprimer {totalLabels} etiquette{totalLabels > 1 ? 's' : ''}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

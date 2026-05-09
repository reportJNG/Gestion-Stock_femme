'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Minus, CornerDownLeft } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Variant {
  id: string;
  color_name: string;
  size: string;
  barcode: string;
  quantity: number;
}

interface AddStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: Variant | null;
  onAddStock: (variantId: string, quantity: number) => Promise<void>;
}

export function AddStockModal({ open, onOpenChange, variant, onAddStock }: AddStockModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setQuantity('1'); setError(null); }
  }, [open]);

  const adjustQuantity = (delta: number) => {
    const qty = Math.max(1, (parseInt(quantity) || 0) + delta);
    setQuantity(qty.toString());
    setError(null);
  };

  const handleSubmit = async () => {
    const qtyNum = parseInt(quantity);
    if (!variant || !qtyNum || qtyNum <= 0) return setError('Quantité invalide');
    if (qtyNum > 10000) return setError('Maximum 10 000');
    setIsSubmitting(true);
    try {
      await onAddStock(variant.id, qtyNum);
      onOpenChange(false);
    } catch {
      setError("Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const newStock = variant ? variant.quantity + (parseInt(quantity) || 0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white border-rose-soft/20">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Ajouter du stock</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">Augmenter la quantité</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {variant && (
          <div className="space-y-5">
            <div className="rounded-xl border border-rose-soft/20 bg-rose-light/20 p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-xs text-muted-foreground">Couleur</span> <p className="font-medium">{variant.color_name}</p></div>
                <div><span className="text-xs text-muted-foreground">Taille</span> <p className="font-medium">{variant.size}</p></div>
                <div className="col-span-2"><span className="text-xs text-muted-foreground">Code</span> <p className="font-mono text-xs">{variant.barcode}</p></div>
              </div>
              <div className="mt-2 pt-2 border-t border-rose-soft/20 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Stock actuel</span>
                <span className="font-bold">{variant.quantity}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qty" className="text-sm">Quantité à ajouter</Label>
              <div className="flex gap-2">
                {[1,5,10,20,50].map(p => (
                  <button key={p} type="button" onClick={() => { setQuantity(p.toString()); setError(null); }}
                    className={cn('px-3 py-1 text-xs rounded-lg border transition-colors',
                      parseInt(quantity)===p ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-rose-soft/20 bg-white/60 text-muted-foreground hover:bg-white')}
                  >+{p}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => adjustQuantity(-1)}><Minus className="h-4 w-4" /></Button>
                <Input id="qty" type="number" min="1" max="10000" value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key==='Enter' && handleSubmit()}
                  className="h-9 text-center font-bold bg-white/80 border-rose-soft/20 flex-1" autoFocus />
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => adjustQuantity(1)}><Plus className="h-4 w-4" /></Button>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="flex justify-between items-center px-4 py-2 bg-emerald-50/50 rounded-xl">
              <span className="text-sm text-muted-foreground">Nouveau stock</span>
              <span className="font-bold text-emerald-700">{newStock}</span>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10 rounded-xl">Annuler</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || parseInt(quantity) <= 0}
                className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
                {isSubmitting ? 'Ajout...' : <><CornerDownLeft className="w-4 h-4" /> Ajouter +{quantity}</>}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
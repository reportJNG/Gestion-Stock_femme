'use client';

import { StockBadge } from './StockBadge';
import { Button } from '@/components/ui/button';
import { Plus, Archive } from 'lucide-react';
import { useState } from 'react';
import { AddStockModal } from './AddStockModal';

interface Variant { id: string; color_id: string; color_code: string; color_name: string; size: string; size_code: string; barcode: string; quantity: number; is_active: boolean; is_archived: boolean; }
interface Color { id: string; code: string; name_fr: string; hex: string; }
interface Size { size: string; size_code: string; }

interface VariantGridProps {
  colors: Color[];
  sizes: Size[];
  variants: Variant[];
  lowStockThreshold?: number;
  onAddStock: (variantId: string, quantity: number) => Promise<void>;
  onArchiveVariant: (variantId: string) => Promise<void>;
}

export function VariantGrid({ colors, sizes, variants, lowStockThreshold, onAddStock, onArchiveVariant }: VariantGridProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const getVariant = (colorId: string, sizeCode: string) => variants.find(v => v.color_id === colorId && v.size_code === sizeCode);

  return (
    <div className="rounded-2xl border border-rose-soft/20 overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-rose-light/20 border-b border-rose-soft/10">
              <th className="text-left p-3 font-medium text-muted-foreground">Couleur</th>
              {sizes.map(s => <th key={s.size_code} className="p-3 text-center font-medium text-muted-foreground min-w-[80px]">{s.size}</th>)}
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {colors.map(color => (
              <tr key={color.id} className="border-b border-rose-soft/10 hover:bg-rose-light/10 transition-colors group">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border shadow-sm" style={{ backgroundColor: color.hex || '#ccc' }} />
                    <span className="font-medium text-xs">{color.name_fr}</span>
                  </div>
                </td>
                {sizes.map(size => {
                  const v = getVariant(color.id, size.size_code);
                  return (
                    <td key={size.size_code} className="p-3 text-center">
                      {v ? (
                        <div className="flex flex-col items-center gap-1">
                          <StockBadge quantity={v.quantity} lowThreshold={lowStockThreshold} />
                          <span className="text-[10px] text-muted-foreground/50 font-mono">{v.barcode}</span>
                        </div>
                      ) : <span className="text-muted-foreground/30">-</span>}
                    </td>
                  );
                })}
                <td className="p-3">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { const v = getVariant(color.id, sizes[0]?.size_code); if(v) { setSelectedVariant(v); setModalOpen(true); }}}><Plus className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => { const v = getVariant(color.id, sizes[0]?.size_code); if(v) onArchiveVariant(v.id); }}><Archive className="h-3 w-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddStockModal open={modalOpen} onOpenChange={setModalOpen} variant={selectedVariant} onAddStock={onAddStock} />
    </div>
  );
}
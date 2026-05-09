'use client';

import { cn } from '@/lib/utils';
import { SIZES_MAP } from '@/lib/constants';

interface SizeSelectorProps {
  sizeType: 'clothing' | 'shoes' | 'waist' | 'free';
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function SizeSelector({ sizeType, selected, onChange }: SizeSelectorProps) {
  const sizes = SIZES_MAP[sizeType] || [];
  const toggle = (size: string) => {
    onChange(selected.includes(size) ? selected.filter(s => s !== size) : [...selected, size]);
  };
  const selectAll = () => onChange(selected.length === sizes.length ? [] : [...sizes]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{selected.length} sélectionnée{selected.length>1?'s':''}</span>
        <button onClick={selectAll} className="text-primary text-xs hover:underline">
          {selected.length === sizes.length ? 'Désélectionner' : 'Tout sélectionner'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map(size => (
          <button
            key={size}
            onClick={() => toggle(size)}
            className={cn(
              'min-h-[42px] min-w-[56px] px-4 rounded-2xl border-2 text-sm font-medium transition-all',
              selected.includes(size)
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-rose-soft/20 bg-white/60 text-muted-foreground hover:border-primary/30'
            )}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorOption {
  id: string;
  code: string;
  name_fr: string;
  hex: string;
}

interface ColorPickerProps {
  colors: ColorOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ColorPicker({ colors, selected, onChange }: ColorPickerProps) {
  const toggleColor = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };
  const selectAll = () => onChange(selected.length === colors.length ? [] : colors.map(c => c.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{selected.length} sélectionnée{selected.length>1?'s':''}</span>
        <button onClick={selectAll} className="text-primary text-xs hover:underline">
          {selected.length === colors.length ? 'Désélectionner tout' : 'Tout sélectionner'}
        </button>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
        {colors.map(color => {
          const isSelected = selected.includes(color.id);
          return (
            <button
              key={color.id}
              onClick={() => toggleColor(color.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all',
                isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent bg-white/60 hover:border-rose-soft/30'
              )}
              title={color.name_fr}
            >
              <div className="relative w-8 h-8 rounded-full border shadow-sm" style={{ backgroundColor: color.hex || '#ccc' }}>
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground truncate max-w-[64px]">{color.name_fr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
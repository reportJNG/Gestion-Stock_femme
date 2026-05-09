'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Keyboard, Barcode } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

interface ManualBarcodeInputProps {
  onSubmit: (barcode: string) => void;
}

export function ManualBarcodeInput({ onSubmit }: ManualBarcodeInputProps) {
  const [barcode, setBarcode] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setBarcode('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onSubmit(barcode.trim().toUpperCase());
      setBarcode('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 h-11 text-sm font-medium rounded-xl border-rose-soft/20 bg-white/60 hover:bg-white/80">
          <Keyboard className="h-4 w-4 text-muted-foreground" />
          Saisie manuelle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-white border-rose-soft/20">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Code-barres manuel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="relative">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              ref={inputRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Ex: PROD-2024-001"
              className="pl-10 h-12 text-base font-mono rounded-xl bg-white/80 border-rose-soft/20 focus:border-primary/40"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white" disabled={!barcode.trim()}>
            Valider
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
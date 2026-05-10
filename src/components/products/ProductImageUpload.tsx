'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import {  X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

interface ProductImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ProductImageUpload({ value, onChange, className }: ProductImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        setPreview(res);
        onChange(res);
      };
      reader.readAsDataURL(compressed);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        setPreview(res);
        onChange(res);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const remove = () => { setPreview(null); onChange(''); if (inputRef.current) inputRef.current.value = ''; };

  return (
    <div className={cn('space-y-2', className)}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {preview ? (
        <div className="relative aspect-square max-w-[200px] rounded-2xl overflow-hidden border border-rose-soft/20 shadow-sm">
          <Image src={preview} alt="Preview" fill sizes="200px" className="object-cover" />
          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-lg" onClick={remove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex flex-col items-center justify-center aspect-square max-w-[200px] w-full rounded-2xl border-2 border-dashed border-rose-soft/30 bg-white/60 hover:bg-white/80 transition-colors text-muted-foreground"
        >
          {isUploading ? (
            <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 mb-2" />
              <span className="text-xs">Ajouter une image</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

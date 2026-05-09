'use client';

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeLabelProps {
  barcode: string;
  productName?: string;
  price?: string;
  sku?: string;
  variant?: 'minimal' | 'retail' | 'luxe';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BarcodeLabel({
  barcode,
  productName,
  price,
  sku,
  variant = 'luxe',
  size = 'md',
  className = '',
}: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState(false);

  const sizeMap = {
    sm: { width: 1.5, height: 30, fontSize: 10, padding: 'p-3', maxW: 'max-w-[200px]' },
    md: { width: 2, height: 40, fontSize: 13, padding: 'p-4', maxW: 'max-w-[260px]' },
    lg: { width: 3, height: 55, fontSize: 15, padding: 'p-5', maxW: 'max-w-[320px]' },
  };

  const s = sizeMap[size];

  useEffect(() => {
    if (svgRef.current && !error) {
      try {
        JsBarcode(svgRef.current, barcode, {
          format: 'CODE128',
          width: s.width,
          height: s.height,
          displayValue: variant === 'minimal',
          fontSize: s.fontSize,
          margin: variant === 'minimal' ? 4 : 8,
          background: '#ffffff',
          lineColor: '#1a1a1a',
        });
      } catch {
        setError(true);
      }
    }
  }, [barcode, s, variant, error]);

  if (error) {
    return (
      <div
        className={`${s.padding} ${s.maxW} bg-red-50 border border-red-200 rounded-2xl text-red-600 text-center ${className}`}
      >
        <p className="text-sm">Code-barres invalide</p>
      </div>
    );
  }

  return (
    <div className={`${s.padding} ${s.maxW} ${className}`}>
      <div className="bg-white/80 backdrop-blur-sm border border-rose-soft/20 rounded-2xl shadow-sm overflow-hidden">
        {variant !== 'minimal' && (
          <div className="px-4 pt-4 pb-2">
            {productName && (
              <h3 className="font-semibold text-foreground truncate">{productName}</h3>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              {sku && <span className="font-mono">{sku}</span>}
              {price && <span className="font-bold text-primary">{price}</span>}
            </div>
            <div className="soft-divider mt-2" />
          </div>
        )}
        <div className="p-3">
          <svg ref={svgRef} className="w-full" />
        </div>
        {variant === 'luxe' && (
          <p className="text-center text-[10px] text-muted-foreground/60 pb-2 font-mono tracking-widest">
            {barcode}
          </p>
        )}
      </div>
    </div>
  );
}
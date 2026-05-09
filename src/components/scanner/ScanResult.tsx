'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X, ShoppingCart, WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn, formatDZD } from '@/lib/utils';

interface ScanResultProps {
  result: {
    success: boolean;
    error?: string;
    message?: string;
    product_name?: string;
    color?: string;
    size?: string;
    price_ttc?: number;
    quantity?: number;
    remaining_stock?: number;
    offline?: boolean;
    timestamp?: string;
  } | null;
  onDismiss: () => void;
  onViewCart?: () => void;
  cartItemCount?: number;
}

export function ScanResult({ result, onDismiss, onViewCart, cartItemCount }: ScanResultProps) {
  const dismissTimeoutRef = useRef<NodeJS.Timeout>();
  const isStockEmpty = result?.error === 'STOCK_EPUISE';

  useEffect(() => {
    if (result?.success) {
      dismissTimeoutRef.current = setTimeout(onDismiss, 4000);
      return () => clearTimeout(dismissTimeoutRef.current);
    }
  }, [result, onDismiss]);

  if (!result) return null;

  const state = result.success ? 'success' : isStockEmpty ? 'stockEmpty' : 'error';
  const config = {
    success: { icon: CheckCircle2, bg: 'bg-emerald-50/90', border: 'border-emerald-200', text: 'text-emerald-800', subtext: 'text-emerald-700', bar: 'bg-emerald-400', actionBg: 'bg-emerald-500 hover:bg-emerald-600' },
    stockEmpty: { icon: AlertTriangle, bg: 'bg-amber-50/90', border: 'border-amber-200', text: 'text-amber-800', subtext: 'text-amber-700', bar: 'bg-amber-400', actionBg: 'bg-amber-500 hover:bg-amber-600' },
    error: { icon: XCircle, bg: 'bg-red-50/90', border: 'border-red-200', text: 'text-red-800', subtext: 'text-red-700', bar: 'bg-red-400', actionBg: 'bg-red-500 hover:bg-red-600' },
  }[state];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96, transition: { duration: 0.2 } }}
        className="fixed inset-x-4 bottom-24 z-50 md:inset-x-auto md:right-4 md:left-auto md:w-[380px]"
      >
        <div className={cn('rounded-2xl border backdrop-blur-md shadow-xl p-4', config.bg, config.border)}>
          {result.success && (
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: 'linear' }}
              className={cn('h-1 origin-left -mx-4 -mt-4 mb-3 rounded-t-2xl', config.bar)}
            />
          )}
          <div className="flex gap-3">
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={cn('font-semibold text-sm', config.text)}>
                    {state === 'success' ? 'Ajouté au panier' : state === 'stockEmpty' ? 'Stock épuisé' : 'Erreur'}
                  </h4>
                  {result.product_name && <p className={cn('text-sm mt-0.5', config.subtext)}>{result.product_name}</p>}
                </div>
                <button onClick={onDismiss} className="p-1.5 rounded-lg hover:bg-black/5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.color && <span className="px-2 py-0.5 text-[11px] rounded-full bg-white/60 border">{result.color}</span>}
                {result.size && <span className="px-2 py-0.5 text-[11px] rounded-full bg-white/60 border">{result.size}</span>}
                {result.quantity && result.quantity > 1 && <span className="px-2 py-0.5 text-[11px] rounded-full bg-white/60 border">x{result.quantity}</span>}
              </div>

              <div className="flex items-center justify-between mt-3">
                {result.price_ttc && <p className="text-lg font-bold">{formatDZD(result.price_ttc)}</p>}
                {result.offline !== undefined && (
                  <span className={cn('text-xs flex items-center gap-1', result.offline ? 'text-amber-600' : 'text-emerald-600')}>
                    {result.offline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                    {result.offline ? 'Hors-ligne' : 'Connecté'}
                  </span>
                )}
              </div>

              {!result.success && (
                <p className={cn('text-sm mt-1', config.subtext)}>{result.message || result.error}</p>
              )}

              <div className="flex gap-2 mt-3 pt-3 border-t border-black/5">
                {result.success ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={onDismiss} className="flex-1 h-8 text-xs">Continuer</Button>
                    {onViewCart && (
                      <Button size="sm" onClick={onViewCart} className={cn('flex-1 h-8 text-xs text-white', config.actionBg)}>
                        <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                        Panier{cartItemCount ? ` (${cartItemCount})` : ''}
                      </Button>
                    )}
                  </>
                ) : (
                  <Button variant="ghost" size="sm" onClick={onDismiss} className="flex-1 h-8 text-xs">Fermer</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
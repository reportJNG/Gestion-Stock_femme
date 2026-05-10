'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { StockBadge } from '@/components/products/StockBadge';
import { Plus, Package, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProductItem {
  id: string;
  name: string;
  category_name: string;
  image_url?: string;
  price_ttc: number;
  total_stock: number;
  variants: Array<{
    id: string;
    color_name: string;
    size: string;
    barcode: string;
    quantity: number;
  }>;
}

interface QuickStockInProps {
  products: ProductItem[];
  onAddStock: (variantId: string, quantity: number) => Promise<void>;
  lowStockThreshold?: number;
}

export function QuickStockIn({ products, onAddStock, lowStockThreshold }: QuickStockInProps) {
  const { isAdmin } = useAuth(); // ✅ Only check if admin
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [successVariant, setSuccessVariant] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAddStock = async (variantId: string) => {
    const qty = parseInt(quantities[variantId] || '0');
    if (qty <= 0) return;

    setSubmitting(variantId);
    try {
      await onAddStock(variantId, qty);
      setQuantities((prev) => ({ ...prev, [variantId]: '' }));
      setSuccessVariant(variantId);
      setTimeout(() => setSuccessVariant(null), 1800);
    } finally {
      setSubmitting(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, variantId: string) => {
    if (e.key === 'Enter') handleAddStock(variantId);
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)',
            boxShadow: '0 4px 24px rgba(244,114,182,0.12)',
          }}
        >
          <Package className="h-7 w-7" style={{ color: '#ec4899' }} />
        </div>
        <p className="text-[15px] font-semibold tracking-tight text-gray-800">
          Aucun produit trouvé
        </p>
        <p className="mt-1.5 text-sm text-gray-400 max-w-xs leading-relaxed">
          Ajustez la recherche ou ajoutez des produits pour gérer le stock.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {products.map((product, productIndex) => {
        const isExpanded = expandedProduct === product.id;

        return (
          <div
            key={product.id}
            className="group overflow-hidden rounded-2xl transition-all duration-300"
            style={{
              background: isExpanded
                ? 'linear-gradient(145deg, #ffffff 0%, #fdf2f8 100%)'
                : 'white',
              border: isExpanded ? '1.5px solid #fbcfe8' : '1.5px solid #f3f4f6',
              boxShadow: isExpanded
                ? '0 8px 32px rgba(244,114,182,0.10), 0 2px 8px rgba(0,0,0,0.04)'
                : '0 1px 4px rgba(0,0,0,0.04)',
              animationDelay: `${productIndex * 40}ms`,
            }}
          >
            {/* ── Product Header ─────────────────────────────────────── */}
            <button
              onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors duration-200"
              style={{
                background: isExpanded ? 'transparent' : undefined,
              }}
            >
              {/* Thumbnail */}
              <div
                className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #fce7f3 0%, #f5d0fe 100%)',
                  boxShadow: '0 2px 8px rgba(244,114,182,0.15)',
                }}
              >
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-4.5 w-4.5 opacity-30" />
                  </div>
                )}
              </div>

              {/* Name + category */}
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[13.5px] font-semibold tracking-tight text-gray-800 leading-snug">
                  {product.name}
                </p>
                <p className="truncate text-xs text-gray-400 mt-0.5 font-medium">
                  {product.category_name}
                </p>
              </div>

              {/* Total stock badge */}
              <StockBadge quantity={product.total_stock} lowThreshold={lowStockThreshold} />

              {/* Chevron */}
              <div
                className="ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                style={{
                  background: isExpanded ? '#fce7f3' : 'transparent',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <ChevronDown
                  className="h-3.5 w-3.5 transition-colors"
                  style={{ color: isExpanded ? '#ec4899' : '#9ca3af' }}
                />
              </div>
            </button>

            {/* ── Variant Panel ───────────────────────────────────────── */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: isExpanded ? `${product.variants.length * 68 + 24}px` : '0px',
                opacity: isExpanded ? 1 : 0,
              }}
            >
              <div
                className="mx-3 mb-3 rounded-xl p-2 space-y-1.5"
                style={{
                  background: 'rgba(253,242,248,0.6)',
                  border: '1px solid rgba(251,207,232,0.4)',
                }}
              >
                {product.variants.map((variant, vIdx) => {
                  const isSubmitting = submitting === variant.id;
                  const isSuccess = successVariant === variant.id;
                  const qty = quantities[variant.id] || '';
                  const isValid = parseInt(qty) > 0;

                  return (
                    <div
                      key={variant.id}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200"
                      style={{
                        background: isSuccess
                          ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
                          : 'white',
                        border: isSuccess
                          ? '1px solid #86efac'
                          : '1px solid rgba(243,244,246,0.8)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        animationDelay: `${vIdx * 30}ms`,
                      }}
                    >
                      {/* Color dot */}
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: 'linear-gradient(135deg, #f9a8d4, #c084fc)' }}
                      />

                      {/* Variant info */}
                      <div className="flex flex-1 min-w-0 items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-gray-700 truncate min-w-0 max-w-[90px]">
                          {variant.color_name}
                        </span>
                        <span
                          className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-wide"
                          style={{
                            background: '#f3f4f6',
                            color: '#6b7280',
                          }}
                        >
                          {variant.size}
                        </span>
                        <div className="ml-auto">
                          <StockBadge quantity={variant.quantity} lowThreshold={lowStockThreshold} />
                        </div>
                      </div>

                      {/* ✅ Only show stock INPUT and ADD BUTTON for admins */}
                      {isAdmin && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Input
                            ref={(el) => { inputRefs.current[variant.id] = el; }}
                            type="number"
                            min="1"
                            placeholder="Qté"
                            className="h-8 w-[68px] rounded-lg border text-center text-[13px] font-semibold transition-all duration-200 focus:ring-0"
                            style={{
                              borderColor: isValid ? '#fbcfe8' : '#e5e7eb',
                              background: isValid ? '#fff7fb' : 'white',
                              color: '#374151',
                            }}
                            value={qty}
                            onChange={(e) =>
                              setQuantities((prev) => ({ ...prev, [variant.id]: e.target.value }))
                            }
                            onKeyDown={(e) => handleKeyDown(e, variant.id)}
                            disabled={isSubmitting}
                          />

                          <button
                            onClick={() => handleAddStock(variant.id)}
                            disabled={isSubmitting || !isValid}
                            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              background:
                                isValid && !isSubmitting
                                  ? 'linear-gradient(135deg, #ec4899, #db2777)'
                                  : '#f3f4f6',
                              boxShadow:
                                isValid && !isSubmitting
                                  ? '0 2px 8px rgba(236,72,153,0.30)'
                                  : 'none',
                            }}
                          >
                            {isSubmitting ? (
                              <Loader2
                                className="h-3.5 w-3.5 animate-spin"
                                style={{ color: isValid ? 'white' : '#9ca3af' }}
                              />
                            ) : isSuccess ? (
                              <Sparkles className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Plus
                                className="h-3.5 w-3.5 transition-colors"
                                style={{ color: isValid ? 'white' : '#9ca3af' }}
                                strokeWidth={2.5}
                              />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

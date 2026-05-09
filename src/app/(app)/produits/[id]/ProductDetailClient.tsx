'use client';

import { useParams } from 'next/navigation';
import { useProductDetail } from '@/hooks/useProducts';
import { useVariants } from '@/hooks/useVariants';
import { useSettings } from '@/hooks/useSettings';
import { VariantGrid } from '@/components/products/VariantGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Pencil,
  ArrowLeft,
  ImageOff,
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDZD } from '@/lib/utils';

// ─── lib/print ───────────────────────────────────────────────────────────────
import { openPrintWindow } from '@/lib/print/printService';
import { generateLabelsGridHTML, LABEL_STYLES, type LabelData } from '@/lib/print/labelTemplate';
// ─────────────────────────────────────────────────────────────────────────────

export function ProductDetailClient() {
  const params = useParams();
  const productId = params.id as string;

  const { data, isLoading } = useProductDetail(productId);
  const { addStock, archiveVariant } = useVariants();
  const { settings } = useSettings();

  const handleAddStock = async (variantId: string, quantity: number) => {
    await addStock.mutateAsync({ variantId, quantity });
    toast.success('Stock ajoute');
  };

  const handleArchiveVariant = async (variantId: string) => {
    await archiveVariant.mutateAsync(variantId);
    toast.success('Variant archive');
  };

  // ─── PRINT ÉTIQUETTES ─────────────────────────────────────────────────────
  const handlePrintEtiquettes = () => {
    if (!data?.data) return;

    const { product, variants } = data.data;

    // Variants actifs uniquement
    const printableVariants = variants.filter((v: any) => !v.is_archived);

    if (printableVariants.length === 0) {
      toast.warning('Aucun variant actif à imprimer');
      return;
    }

    // Construire un LabelData par variant
    // barcode vient de la DB (product_variants.barcode = generate_sku() du schéma SQL)
    const labels: LabelData[] = printableVariants.map((variant: any) => ({
      barcode:     variant.barcode,
      productName: product.name,
      brandName:   product.brand?.name,
      colorName:   variant.color?.name_fr,
      size:        variant.size,
      priceTTC:    product.price_ttc ?? product.sale_price,
    }));

    const html = generateLabelsGridHTML(labels);

    openPrintWindow(html, {
      title:        `Étiquettes — ${product.name}`,
      withBarcodes: true,   // injecte JsBarcode → Code128 sur chaque SVG bc-*
      extraStyles:  LABEL_STYLES,
    });
  };
  // ──────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Package className="h-6 w-6 stroke-[1.8]" />
        </div>
        <p className="font-medium">Produit introuvable</p>
        <Link href="/produits">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 stroke-[1.8]" />
            Retour aux produits
          </Button>
        </Link>
      </div>
    );
  }

  const { product, colors, sizes, variants } = data.data;

  return (
    <div className="page-shell">
      <div className="flex items-center justify-between">
        <Link href="/produits">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 stroke-[1.8]" />
            Retour
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/produits/${productId}/modifier`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 stroke-[1.8]" />
              Modifier
            </Button>
          </Link>

          <Button variant="outline" size="sm" onClick={handlePrintEtiquettes}>
            <Printer className="h-4 w-4 stroke-[1.8]" />
            Etiquettes
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted sm:w-40">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <ImageOff className="h-10 w-10 text-muted-foreground stroke-[1.8]" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold">{product.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {product.category?.name_fr}{product.brand?.name ? ` — ${product.brand.name}` : ''}
                  </p>
                </div>
                <Badge variant={product.is_archived ? 'destructive' : 'secondary'}>
                  {product.is_archived ? 'Archive' : 'Actif'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Prix achat HT</p>
                  <p className="font-medium">{formatDZD(product.cost_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prix vente HT</p>
                  <p className="font-medium">{formatDZD(product.sale_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prix TTC</p>
                  <p className="font-semibold">{formatDZD(product.price_ttc)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Marge</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-300">{product.margin_pct}%</p>
                </div>
              </div>

              {product.seq_number && (
                <p className="text-xs text-muted-foreground mt-2">
                  Seq: {String(product.seq_number).padStart(4, '0')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grille des variants ({variants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <VariantGrid
            colors={colors}
            sizes={sizes}
            variants={variants}
            lowStockThreshold={settings?.low_stock_threshold}
            onAddStock={handleAddStock}
            onArchiveVariant={handleArchiveVariant}
          />
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProductLabelsDialog } from '@/components/products/ProductLabelsDialog';
import { VariantGrid } from '@/components/products/VariantGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductDetail } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { useVariants } from '@/hooks/useVariants';
import { formatDZD } from '@/lib/utils';
import {
  ArrowLeft,
  ImageOff,
  Package,
  Pencil,
  Printer,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/40 bg-card p-12 text-center shadow-sm">
      <WifiOff className="h-7 w-7 text-muted-foreground" />
      <div>
        <p className="font-semibold text-foreground">Connexion interrompue</p>
        <p className="mt-1 text-sm text-muted-foreground">Reessayez.</p>
      </div>
      <Button onClick={onRetry} variant="outline" className="rounded-xl">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reessayer
      </Button>
    </div>
  );
}

export function ProductDetailClient() {
  const params = useParams();
  const productId = params.id as string;

  const { data, isLoading, isError, refetch } = useProductDetail(productId);
  const { addStock, archiveVariant } = useVariants();
  const { settings } = useSettings();
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);

  const handleAddStock = async (variantId: string, quantity: number) => {
    await addStock.mutateAsync({ variantId, quantity });
    toast.success('Stock ajoute');
  };

  const handleArchiveVariant = async (variantId: string) => {
    await archiveVariant.mutateAsync(variantId);
    toast.success('Variant archive');
  };

  const handleOpenLabelsDialog = () => {
    if (!data?.data) return;

    if (!data.data.variants.some((variant) => !variant.is_archived)) {
      toast.warning('Aucun variant actif a imprimer');
      return;
    }

    setLabelsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
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

          <Button variant="outline" size="sm" onClick={handleOpenLabelsDialog}>
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
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageOff className="h-10 w-10 text-muted-foreground stroke-[1.8]" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold">{product.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {product.category?.name_fr}
                    {product.brand?.name ? ` - ${product.brand.name}` : ''}
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
                  <p className="font-medium text-emerald-600 dark:text-emerald-300">
                    {product.margin_pct}%
                  </p>
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

      <ProductLabelsDialog
        open={labelsDialogOpen}
        onOpenChange={setLabelsDialogOpen}
        product={product}
        variants={variants}
      />
    </div>
  );
}

'use client';

import { useParams } from 'next/navigation';
import { useSaleDetail } from '@/hooks/useSales';
import { useSettings } from '@/hooks/useSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDZD, formatDate, cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Receipt, Printer, User, UserCheck, Lock } from 'lucide-react'; // Add Lock
import { openPrintWindow } from '@/lib/print/printService';
import { generateReceiptHTML } from '@/lib/print/receiptTemplate';

// ─── Sub-components ────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <Skeleton className="h-8 w-28 rounded-xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Receipt className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="font-medium text-foreground">Vente introuvable</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Cette vente n&apos;existe pas ou a été supprimée.
      </p>
      <Button asChild className="mt-6 gap-2 rounded-xl">
        <Link href="/ventes">
          <ArrowLeft className="h-4 w-4" />
          Retour aux ventes
        </Link>
      </Button>
    </div>
  );
}

// Add AccessDenied component
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <Lock className="h-6 w-6 text-red-500" />
      </div>
      <p className="font-medium text-foreground">Accès refusé</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Vous n&apos;avez pas la permission de consulter cette vente.
      </p>
      <Button asChild className="mt-6 gap-2 rounded-xl">
        <Link href="/ventes">
          <ArrowLeft className="h-4 w-4" />
          Retour aux ventes
        </Link>
      </Button>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden', className)}>
      {children}
    </div>
  );
}

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function PersonBadge({
  label,
  name,
  icon: Icon,
}: {
  label: string;
  name?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <MetaLabel>{label}</MetaLabel>
        <p className="mt-0.5 text-sm font-medium text-foreground">
          {name || <span className="text-muted-foreground italic">Inconnu</span>}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function SaleDetailClient() {
  const params = useParams();
  const saleId = params.id as string;
  const { data, isLoading, error } = useSaleDetail(saleId); // Add error
  const { settings } = useSettings();
  const shopName = settings?.shop_name ?? 'Ma Boutique';

  if (isLoading) return <DetailSkeleton />;
  
  // Handle errors (including permission denied)
  if (error) {
    console.error('Sale detail error:', error);
    if (error.message === 'You do not have permission to view this sale') {
      return <AccessDenied />;
    }
    return <NotFound />;
  }
  
  if (!data?.data) return <NotFound />;

  const { sale, items } = data.data;

  function handlePrint() {
    const receiptItems = items.map((item) => ({
      ...item,
      sale_id: saleId,
    }));
    const html = generateReceiptHTML(
      { ...sale, items: receiptItems },
      shopName,
    );
    openPrintWindow(html, {
      title: `Ticket ${sale.sale_number}`,
      withBarcodes: false,
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
          <Link href="/ventes">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl border-border/40 h-8 text-xs"
          onClick={handlePrint}
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimer
        </Button>
      </div>

      {/* Sale header */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Receipt className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                {sale.sale_number}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(sale.created_at)}</p>
            </div>
          </div>
          {sale.synced_from_offline && (
            <span className="rounded-full border border-border/40 bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Sync offline
            </span>
          )}
        </div>

        <Separator className="my-4 opacity-50" />
        <div className="grid grid-cols-2 gap-4">
          <PersonBadge label="Vendeur" name={sale.sold_by_name} icon={UserCheck} />
          <PersonBadge label="Client"  name={sale.customer_name} icon={User} />
        </div>
      </Card>

      {/* Items table */}
      <Card>
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border/30">
          {(['Produit', 'Qté', 'Prix unit.', 'Total'] as const).map((h, i) => (
            <MetaLabel key={h}>
              <span className={cn('block', i > 0 && 'text-right')}>{h}</span>
            </MetaLabel>
          ))}
        </div>

        {items.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              'grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5',
              i < items.length - 1 && 'border-b border-border/20'
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {[item.color_name, item.size].filter(Boolean).join(' / ')}
              </p>
              {item.barcode && (
                <p className="mt-0.5 text-[10px] font-mono text-muted-foreground/50">{item.barcode}</p>
              )}
            </div>
            <span className="text-sm text-foreground text-right">{item.quantity}</span>
            <span className="text-sm text-muted-foreground text-right tabular-nums">
              {formatDZD(item.unit_price_ttc)}
            </span>
            <span className="text-sm font-semibold text-foreground text-right tabular-nums">
              {formatDZD(item.subtotal_ttc)}
            </span>
          </div>
        ))}
      </Card>

      {/* Totals */}
      <Card>
        <div className="grid grid-cols-2 divide-x divide-border/30 border-b border-border/30">
          {[
            { label: 'Total HT', value: formatDZD(sale.total_ht) },
            { label: 'TVA',      value: formatDZD(sale.tva_amount) },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 px-5 py-3.5">
              <MetaLabel>{label}</MetaLabel>
              <span className="text-sm font-medium tabular-nums text-foreground">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <MetaLabel>Total TTC</MetaLabel>
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {formatDZD(sale.total_ttc)}
          </span>
        </div>
      </Card>

    </div>
  );
}
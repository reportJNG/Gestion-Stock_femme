'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useScanner, type ScanResult } from '@/hooks/useScanner';
import { ManualBarcodeInput } from '@/components/scanner/ManualBarcodeInput';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, History, ScanLine, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getTotalPendingCount } from '@/lib/offline/db';
import { syncAllPending } from '@/lib/offline/syncManager';

// ─── Dynamic import ────────────────────────────────────────────────────────────

const BarcodeScanner = dynamic(
  () => import('@/components/scanner/BarcodeScanner').then((mod) => mod.BarcodeScanner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-[4/3] rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Chargement du scanner…</p>
      </div>
    ),
  }
);

// ─── Sub-components ────────────────────────────────────────────────────────────

function OfflineBadge({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:border-amber-700/40 dark:text-amber-400">
        <CloudOff className="h-3 w-3" />
        Hors‑ligne
      </span>
      {pendingCount > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:border-red-700/40 dark:text-red-400">
          {pendingCount}
        </span>
      )}
    </div>
  );
}

function ScannerPrompt({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-8 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <ScanLine className="h-7 w-7 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto leading-relaxed">
        Utilisez la caméra pour scanner un code‑barres et enregistrer une vente instantanément.
      </p>
      <Button
        onClick={onStart}
        className="w-full h-10 rounded-xl text-sm font-medium gap-2"
      >
        <Camera className="h-4 w-4" />
        Démarrer le scanner
      </Button>
    </div>
  );
}

function ActiveScanner({ onScan, onStop }: { onScan: (code: string) => void; onStop: () => void }) {
  return (
    <div className="space-y-3">
      <BarcodeScanner onScan={onScan} />
      <Button
        variant="outline"
        className="w-full rounded-xl border-border/40 text-sm h-10"
        onClick={onStop}
      >
        Arrêter le scanner
      </Button>
    </div>
  );
}

function ScanResultCard({ result, onDismiss }: { result: ScanResult; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const duration = 4000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  const isSuccess = result.success;
  const isOffline = result.offline;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-md relative overflow-hidden animate-in slide-in-from-bottom-2 ${
        isSuccess
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
          : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      }`}
    >
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
      <div className="flex gap-3 items-start">
        {isSuccess ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">
              {isSuccess ? 'Vente enregistrée' : 'Erreur'}
            </h4>
            {isOffline && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-medium">
                Hors‑ligne
              </span>
            )}
          </div>
          {isSuccess && result.product_name ? (
            <div className="mt-1 text-sm space-y-0.5">
              <p className="font-medium truncate">{result.product_name}</p>
              {result.color && result.size && (
                <p className="text-muted-foreground text-xs">
                  {result.color} • {result.size}
                </p>
              )}
              {result.price_ttc && (
                <p className="font-semibold text-green-700 dark:text-green-400">
                  {result.price_ttc.toFixed(2)} €
                </p>
              )}
              {result.sale_number && (
                <p className="text-xs text-muted-foreground">
                  Vente #{result.sale_number}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-sm">
              {result.message || result.error || 'Une erreur est survenue'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ScannerPage() {
  const isOnline = useNetworkStatus();
  const { scan, isScanning, scanResult, reset } = useScanner();
  const [showScanner, setShowScanner] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get current user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Track pending offline items count
  useEffect(() => {
    getTotalPendingCount().then(setPendingCount);
    const interval = setInterval(() => {
      getTotalPendingCount().then(setPendingCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [scanResult]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync();
    }
  }, [isOnline]);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncAllPending();
      const totalSynced = result.sales.success + result.stockIns.success;
      const totalErrors = result.sales.errors + result.stockIns.errors;

      if (totalSynced > 0) {
        toast.success(`${totalSynced} élément(s) synchronisé(s) avec succès`);
      }
      if (totalErrors > 0) {
        toast.error(`${totalErrors} erreur(s) lors de la synchronisation`);
      }
      await getTotalPendingCount().then(setPendingCount);
    } catch (err) {
      console.error('[Sync] Error:', err);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleScan = useCallback(
    async (barcode: string) => {
      if (isScanning) {
        toast.info('Scan en cours, veuillez patienter...');
        return;
      }
      try {
        const result = await scan({
          barcode,
          soldBy: userId ?? undefined,
        });
        if (result.success) {
          setShowScanner(false);
          if (result.offline) {
            toast.success('Vente enregistrée hors‑ligne');
            getTotalPendingCount().then(setPendingCount);
          } else {
            toast.success(
              result.product_name
                ? `Vendu : ${result.product_name}`
                : 'Vente enregistrée'
            );
          }
        } else {
          toast.error(result.message || result.error || 'Erreur lors du scan');
        }
      } catch (err) {
        console.error('[Scan] Error:', err);
        toast.error('Erreur inattendue lors du scan');
      }
    },
    [scan, isScanning, userId]
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Scanner un code‑barres
        </h2>
        {!isOnline ? (
          <OfflineBadge pendingCount={pendingCount} />
        ) : (
          pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:border-blue-700/40 dark:text-blue-400">
              {pendingCount} en attente
            </span>
          )
        )}
      </div>

      {/* Online sync banner */}
      {isOnline && pendingCount > 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-center justify-between dark:bg-blue-900/20 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 flex-1">
            {pendingCount} élément(s) en attente de synchronisation
          </p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg text-xs h-8 gap-1.5 border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900/40"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Synchro...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Synchroniser
              </>
            )}
          </Button>
        </div>
      )}

      {/* Scanner area */}
      {showScanner ? (
        <ActiveScanner onScan={handleScan} onStop={() => setShowScanner(false)} />
      ) : (
        <ScannerPrompt onStart={() => setShowScanner(true)} />
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <ManualBarcodeInput onSubmit={handleScan} />
        <Button
          variant="outline"
          className="rounded-xl border-border/40 text-sm h-10 gap-2"
          asChild
        >
          <Link href="/ventes">
            <History className="h-4 w-4" />
            Historique
          </Link>
        </Button>
      </div>

      {/* Scan result */}
      {scanResult && (
        <ScanResultCard result={scanResult} onDismiss={reset} />
      )}
    </div>
  );
}
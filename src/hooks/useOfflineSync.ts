'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncAllPending } from '@/lib/offline/syncManager';
import { getTotalPendingCount } from '@/lib/offline/db';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'sonner';

export function useOfflineSync() {
  const isOnline = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await getTotalPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

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
      const totalSuccess = result.sales.success + result.stockIns.success;
      const totalErrors = result.sales.errors + result.stockIns.errors;

      if (totalSuccess > 0) {
        toast.success(`${totalSuccess} operation(s) synchronisee(s)`);
      }
      if (totalErrors > 0) {
        toast.error(`${totalErrors} erreur(s) de synchronisation`);
      }
    } catch {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }
  };

  return {
    pendingCount,
    isSyncing,
    isOnline,
    sync: handleSync,
    refreshPendingCount,
  };
}

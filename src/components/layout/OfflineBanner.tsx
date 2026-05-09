'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-center gap-2.5 bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-700 shadow-sm">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        Mode hors‑ligne — les données seront synchronisées automatiquement
      </span>
    </div>
  );
}
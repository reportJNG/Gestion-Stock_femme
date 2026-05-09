import { create } from 'zustand';

interface OfflineState {
  pendingOpsCount: number;
  lastSyncAt: Date | null;
  setPendingOpsCount: (count: number) => void;
  setLastSyncAt: (date: Date) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  pendingOpsCount: 0,
  lastSyncAt: null,
  setPendingOpsCount: (count) => set({ pendingOpsCount: count }),
  setLastSyncAt: (date) => set({ lastSyncAt: date }),
}));

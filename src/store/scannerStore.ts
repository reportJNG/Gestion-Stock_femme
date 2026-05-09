import { create } from 'zustand';

interface ScannerState {
  isScanning: boolean;
  lastResult: {
    success: boolean;
    productName?: string;
    color?: string;
    size?: string;
    priceTTC?: number;
    error?: string;
    message?: string;
    offline?: boolean;
  } | null;
  scanHistory: Array<{
    barcode: string;
    timestamp: Date;
    result: string;
  }>;
  setScanning: (scanning: boolean) => void;
  setLastResult: (result: ScannerState['lastResult']) => void;
  addToHistory: (barcode: string, result: string) => void;
  clearResult: () => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  isScanning: false,
  lastResult: null,
  scanHistory: [],
  setScanning: (scanning) => set({ isScanning: scanning }),
  setLastResult: (result) => set({ lastResult: result }),
  addToHistory: (barcode, result) =>
    set((state) => ({
      scanHistory: [{ barcode, timestamp: new Date(), result }, ...state.scanHistory].slice(0, 50),
    })),
  clearResult: () => set({ lastResult: null }),
}));

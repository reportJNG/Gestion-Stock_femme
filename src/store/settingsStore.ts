import { create } from 'zustand';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  lowStockThreshold: number;
  tvaRate: number;
  shopName: string;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLowStockThreshold: (threshold: number) => void;
  setTvaRate: (rate: number) => void;
  setShopName: (name: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  lowStockThreshold: 5,
  tvaRate: 19,
  shopName: 'Ma Boutique',
  setTheme: (theme) => set({ theme }),
  setLowStockThreshold: (threshold) => set({ lowStockThreshold: threshold }),
  setTvaRate: (rate) => set({ tvaRate: rate }),
  setShopName: (name) => set({ shopName: name }),
}));

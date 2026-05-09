import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isActive: boolean;
  setUser: (user: User | null) => void;
  setAdminStatus: (isAdmin: boolean, isActive: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isActive: false,
  setUser: (user) => set({ user }),
  setAdminStatus: (isAdmin, isActive) => set({ isAdmin, isActive }),
  clear: () => set({ user: null, isAdmin: false, isActive: false }),
}));

'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { User, Session } from '@supabase/supabase-js';

type Role = 'admin' | 'worker' | null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  role: Role;
  isAdmin: boolean;
  isWorker: boolean;
  isActive: boolean;
  login: (email: string, password: string) => Promise<unknown>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const supabase = createClient();

// ─── Provider — runs auth logic ONCE for the whole tree ───────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [session, setSession]   = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole]         = useState<Role>(null);
  const [isActive, setIsActive] = useState(false);
  const isMounted               = useRef(true);
  const queryClient             = useQueryClient();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', userId)
      .single();

    if (!isMounted.current) return;
    setRole((profile?.role as Role) ?? null);
    setIsActive(profile?.is_active === true);
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!isMounted.current) return;

      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await fetchProfile(s.user.id);
      if (isMounted.current) setIsLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (!isMounted.current) return;

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await fetchProfile(s.user.id);
          if (event === 'SIGNED_IN') {
            // Small delay to let cookies propagate before refetching
            setTimeout(() => queryClient.invalidateQueries(), 100);
          }
        } else {
          setRole(null);
          setIsActive(false);
          queryClient.clear();
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setIsActive(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, role,
      isAdmin: role === 'admin',
      isWorker: role === 'worker',
      isActive, login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook — just reads from context, no duplicated logic ─────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
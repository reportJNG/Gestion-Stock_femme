'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [session, setSession]     = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole]           = useState<Role>(null);
  const [isActive, setIsActive]   = useState(false);
  const isMounted                 = useRef(true);
  const queryClient               = useQueryClient();
  const supabase                  = supabaseClient;

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', userId)
      .single();

    if (!isMounted.current) return;
    setRole((profile?.role as Role) ?? null);
    setIsActive(profile?.is_active === true);
  }, [supabase]);

  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!isMounted.current) return;

      if (u) {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        setUser(u);
        await fetchProfile(u.id);
      } else {
        setSession(null);
        setUser(null);
      }

      if (isMounted.current) setIsLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (!isMounted.current) return;

        if (event === 'TOKEN_REFRESHED') {
          setSession(s);
          setUser(s?.user ?? null);
          if (s?.user) await fetchProfile(s.user.id);

          // ✅ FIXED: Don't cancelQueries + immediately invalidateQueries.
          // The old code killed all in-flight requests then re-fired them
          // instantly against a still-waking Supabase free-tier instance,
          // causing the silent infinite loading on tab return.
          //
          // Instead: mark queries as stale so they refetch lazily on next
          // user interaction, giving Supabase time to fully wake up first.
          queryClient.invalidateQueries();

          if (isMounted.current) setIsLoading(false);
          return;
        }

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await fetchProfile(s.user.id);
          if (event === 'SIGNED_IN') {
            setTimeout(() => queryClient.invalidateQueries(), 100);
          }
        } else {
          setRole(null);
          setIsActive(false);
          queryClient.clear();
        }

        if (isMounted.current) setIsLoading(false);
      }
    );

    // ✅ On tab return: wait 2 seconds for Supabase free-tier to wake up,
    // THEN invalidate queries so they refetch against a live connection.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          if (isMounted.current) {
            queryClient.invalidateQueries();
          }
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile, queryClient, supabase]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, [supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setIsActive(false);
  }, [supabase]);

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session, User } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase/client';

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

const AUTH_SCOPED_QUERY_KEYS = new Set([
  'dashboard-stats',
  'low-stock-items',
  'top-products',
  'products',
  'product',
  'categories',
  'colors',
  'brands',
  'sales',
  'sale',
  'report',
  'settings',
  'notifications',
  'notifications-unread',
  'workers',
]);

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [isActive, setIsActive] = useState(false);
  const isMounted = useRef(false);
  const queryClient = useQueryClient();
  const supabase = supabaseClient;

  const resetProfile = useCallback(() => {
    setRole(null);
    setIsActive(false);
  }, []);

  const removeAuthScopedQueries = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) => AUTH_SCOPED_QUERY_KEYS.has(String(query.queryKey[0])),
    });
  }, [queryClient]);

  const applySession = useCallback(
    (nextSession: Session | null) => {
      if (!isMounted.current) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        resetProfile();
      }
    },
    [resetProfile]
  );

  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      applySession(currentSession);

      if (isMounted.current) {
        setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted.current) return;

      if (event === 'SIGNED_OUT') {
        applySession(null);
        removeAuthScopedQueries();
      } else {
        applySession(nextSession);
      }

      if (isMounted.current) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [applySession, removeAuthScopedQueries, supabase]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const fetchProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single();

      if (cancelled || !isMounted.current) return;

      setRole((profile?.role as Role) ?? null);
      setIsActive(profile?.is_active === true);
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();

    if (!isMounted.current) return;

    setSession(null);
    setUser(null);
    resetProfile();
    removeAuthScopedQueries();
  }, [removeAuthScopedQueries, resetProfile, supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        role,
        isAdmin: role === 'admin',
        isWorker: role === 'worker',
        isActive,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

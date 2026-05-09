'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { User, Session } from '@supabase/supabase-js';

type Role = 'admin' | 'worker' | null;

const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [isActive, setIsActive] = useState(false);
  const isMounted = useRef(true);
  const queryClient = useQueryClient();

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

      if (s?.user) {
        await fetchProfile(s.user.id);
      }

      if (isMounted.current) setIsLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (!isMounted.current) return;

        const previousUser = user;
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await fetchProfile(s.user.id);

          // ✅ On sign-in (or token refresh with a new user), invalidate all
          // queries so every hook refetches with the authenticated session
          if (event === 'SIGNED_IN' || (!previousUser && s.user)) {
            queryClient.invalidateQueries();
          }
        } else {
          setRole(null);
          setIsActive(false);
          // ✅ On sign-out, wipe the cache entirely so no stale
          // authenticated data leaks to the next user/session
          queryClient.clear();
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile, queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange fires SIGNED_IN and handles invalidation automatically
    return data;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange fires SIGNED_OUT and calls queryClient.clear()
    setUser(null);
    setSession(null);
    setRole(null);
    setIsActive(false);
  }, []);

  return {
    user,
    session,
    isLoading,
    role,
    isAdmin: role === 'admin',
    isWorker: role === 'worker',
    isActive,
    login,
    logout,
  };
}
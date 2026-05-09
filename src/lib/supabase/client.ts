'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

const DEMO_URL = 'https://demo.supabase.co';
const DEMO_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo';

export function getSupabaseBrowserClient(): SupabaseClient {
  if (clientInstance) return clientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('VOTRE_ID_PROJET')) {
    console.warn('[Supabase] Environment variables not configured. App will run in demo mode.');
    clientInstance = createBrowserClient(DEMO_URL, DEMO_KEY);
  } else {
    clientInstance = createBrowserClient(url, key);
  }

  return clientInstance;
}

export const createClient = getSupabaseBrowserClient;

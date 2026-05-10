import { createBrowserClient } from '@supabase/ssr';

function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('VOTRE_ID_PROJET')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  }

  return createBrowserClient(url, key);
}

export const supabaseClient = createBrowserSupabaseClient();

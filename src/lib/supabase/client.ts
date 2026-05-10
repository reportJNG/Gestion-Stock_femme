import { createBrowserClient } from '@supabase/ssr';

function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('VOTRE_ID_PROJET')) {
    console.warn('[Supabase] Env vars not configured.');
    return createBrowserClient(
      'https://demo.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo'
    );
  }

  return createBrowserClient(url, key);
}

export const supabaseClient = createClient();

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      supabaseClient.auth.refreshSession().catch(() => {
      });
    }
  });
}

export { createClient };
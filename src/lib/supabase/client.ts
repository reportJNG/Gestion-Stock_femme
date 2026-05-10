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

// ─── Tab visibility wake-up ───────────────────────────────────────────────────
//
// Problem: Supabase free tier pauses after ~5min inactivity. When the user
// switches back to the tab, queries fire immediately against a sleeping DB,
// hang until withTimeout kills them at 10s, then show ErrorState.
//
// Fix: on visibility, kick off a lightweight "ping" query to wake Supabase,
// and export a Promise that resolves when the ping succeeds (or after 12s max).
// withTimeout reads this promise and waits for it before racing the real query.
// This way queries don't start until Supabase is actually awake.
//
// refreshSession() alone is NOT enough — it only hits the Auth API (always
// warm), not the database. We need an actual DB round-trip to confirm the
// Postgres replica is awake.

let wakeUpPromise: Promise<void> | null = null;
let lastVisible = 0;

export function getWakeUpPromise(): Promise<void> {
  return wakeUpPromise ?? Promise.resolve();
}

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;

    const now = Date.now();
    // Only trigger if hidden for more than 60 seconds (avoids rapid tab switches)
    if (now - lastVisible < 60_000) {
      lastVisible = now;
      return;
    }
    lastVisible = now;

    // Kick auth refresh (warms Auth API, may renew expired JWT)
    supabaseClient.auth.refreshSession().catch(() => {});

    // Kick a real DB ping — this is what actually wakes the Postgres replica.
    // We use a tiny, fast query on a system table (no user data needed).
    wakeUpPromise = (async () => {
      try {
        // settings is always present and tiny; any small table works
        await supabaseClient.from('settings').select('key').limit(1).maybeSingle();
      } catch {
        // Even if this fails, we don't want queries to wait forever
      }
    })();

    // Cap the wake-up wait at 12s regardless — queries will then attempt
    // normally and withTimeout will handle any remaining hang
    const fallback = new Promise<void>((resolve) => setTimeout(resolve, 12_000));
    wakeUpPromise = Promise.race([wakeUpPromise, fallback]);

    // Clear after resolution so subsequent queries don't wait unnecessarily
    wakeUpPromise.finally(() => {
      wakeUpPromise = null;
    });
  });

  // Record the initial "visible" timestamp so the first tab-switch is measured correctly
  lastVisible = Date.now();
}

export { createClient };
'use client';

/**
 * Wraps a Supabase query builder promise with a hard timeout.
 * On free-tier Supabase, cold starts can hang indefinitely.
 * This makes them fail fast with a real error instead.
 *
 * Usage:
 *   const { data, error } = await withTimeout(
 *     supabase.from('table').select('*')
 *   );
 */
export async function withTimeout<T>(
  queryPromise: PromiseLike<T>,
  ms = 10000
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`La requête a expiré (${ms / 1000}s). Réessayez.`)),
      ms
    )
  );
  return Promise.race([Promise.resolve(queryPromise), timeout]);
}
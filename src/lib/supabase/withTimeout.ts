'use client';

/**
 * Wraps a Supabase query builder promise with a hard timeout.
 * This prevents a hung request from leaving the UI in a permanent loading state.
 */
export async function withTimeout<T>(
  queryPromise: PromiseLike<T>,
  ms = 10000
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`La requete a expire (${ms / 1000}s). Reessayez.`)),
      ms
    );
  });

  try {
    return await Promise.race([Promise.resolve(queryPromise), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

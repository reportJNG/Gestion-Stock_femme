import { createClient } from '@/lib/supabase/client';
import { getPendingSales, getPendingStockIns, markSaleSynced, markStockInSynced, ensureDBConnection } from './db';

// ✅ NEW: Helper to check online status
function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

// ✅ NEW: Retry wrapper with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`[Sync] Attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

export async function syncPendingSales(): Promise<{ success: number; errors: number }> {
  // ✅ Check if online first
  if (!isOnline()) {
    console.log('[Sync] Offline mode, skipping sync');
    return { success: 0, errors: 0 };
  }

  // ✅ Ensure database is connected
  const dbConnected = await ensureDBConnection();
  if (!dbConnected) {
    console.error('[Sync] Database not available');
    return { success: 0, errors: 0 };
  }

  const supabase = createClient();
  const pending = await getPendingSales();
  let success = 0;
  let errors = 0;

  for (const sale of pending) {
    try {
      // ✅ Retry each operation
      const result = await retryOperation(async () => {
        const { data, error } = await supabase.rpc('sell_by_barcode', {
          p_barcode: sale.barcode,
          p_customer_name: sale.customerName || null,
          p_sold_by: sale.soldBy || null,
        });

        if (error) throw error;
        return data as { success?: boolean };
      });

      if (result?.success) {
        if (sale.id) await markSaleSynced(sale.id);
        success++;
        console.log(`[Sync] Sale synced successfully: ${sale.barcode}`);
      } else {
        errors++;
      }
    } catch (err) {
      console.error('[Sync] Sale sync error after retries:', err);
      errors++;
    }
  }

  return { success, errors };
}

export async function syncPendingStockIns(): Promise<{ success: number; errors: number }> {
  // ✅ Check if online first
  if (!isOnline()) {
    console.log('[Sync] Offline mode, skipping sync');
    return { success: 0, errors: 0 };
  }

  // ✅ Ensure database is connected
  const dbConnected = await ensureDBConnection();
  if (!dbConnected) {
    console.error('[Sync] Database not available');
    return { success: 0, errors: 0 };
  }

  const supabase = createClient();
  const pending = await getPendingStockIns();
  let success = 0;
  let errors = 0;

  for (const stockIn of pending) {
    try {
      // ✅ Retry each operation
      const result = await retryOperation(async () => {
        const { data, error } = await supabase.rpc('add_stock_to_variant', {
          p_variant_id: stockIn.variantId,
          p_quantity_add: stockIn.quantityAdd,
          p_notes: stockIn.notes || null,
          p_created_by: stockIn.createdBy || null,
        });

        if (error) throw error;
        return data as { success?: boolean };
      });

      if (result?.success) {
        if (stockIn.id) await markStockInSynced(stockIn.id);
        success++;
        console.log(`[Sync] Stock in synced successfully: ${stockIn.variantId}`);
      } else {
        errors++;
      }
    } catch (err) {
      console.error('[Sync] Stock in sync error after retries:', err);
      errors++;
    }
  }

  return { success, errors };
}

export async function syncAllPending(): Promise<{ sales: { success: number; errors: number }; stockIns: { success: number; errors: number } }> {
  // ✅ Check online status first
  if (!isOnline()) {
    console.log('[Sync] Offline mode, skipping all sync');
    return {
      sales: { success: 0, errors: 0 },
      stockIns: { success: 0, errors: 0 },
    };
  }

  // ✅ Ensure database is connected before syncing
  const dbConnected = await ensureDBConnection();
  if (!dbConnected) {
    console.error('[Sync] Cannot sync: database unavailable');
    return {
      sales: { success: 0, errors: 0 },
      stockIns: { success: 0, errors: 0 },
    };
  }

  const [salesResult, stockInsResult] = await Promise.all([
    syncPendingSales(),
    syncPendingStockIns(),
  ]);

  return {
    sales: salesResult,
    stockIns: stockInsResult,
  };
}
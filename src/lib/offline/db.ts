import Dexie, { Table } from 'dexie';
import type { OfflineSale, OfflineStockIn, CachedVariant, CachedProduct } from '@/types/offline';

class StockDB extends Dexie {
  offlineSales!: Table<OfflineSale>;
  offlineStockIns!: Table<OfflineStockIn>;
  variantsCache!: Table<CachedVariant>;
  productsCache!: Table<CachedProduct>;

  constructor() {
    super('GestionStockDB');
    this.version(1).stores({
      offlineSales: '++id, barcode, synced, createdAt',
      offlineStockIns: '++id, variantId, synced, createdAt',
      variantsCache: 'barcode, variantId, updatedAt',
      productsCache: 'id, categoryId, updatedAt',
    });
  }
}

export const db = new StockDB();

// Check and ensure database connection is alive
export async function ensureDBConnection(): Promise<boolean> {
  try {
    if (db.isOpen()) {
      await db.offlineSales.count();
      return true;
    }
    await db.open();
    return true;
  } catch (error) {
    console.error('[DB] Connection lost, attempting to recover...', error);
    try {
      await db.close();
      await db.open();
      return true;
    } catch (reconnectError) {
      console.error('[DB] Failed to reconnect:', reconnectError);
      return false;
    }
  }
}

// Wrapper for all database operations
async function withDB<T>(operation: () => Promise<T>): Promise<T> {
  const isConnected = await ensureDBConnection();
  if (!isConnected) {
    throw new Error('Database connection failed');
  }
  return operation();
}

export async function getPendingSalesCount(): Promise<number> {
  return withDB(() => db.offlineSales.where('synced').equals(0).count());
}

export async function getPendingStockInsCount(): Promise<number> {
  return withDB(() => db.offlineStockIns.where('synced').equals(0).count());
}

export async function getTotalPendingCount(): Promise<number> {
  const [sales, stockIns] = await Promise.all([
    getPendingSalesCount(),
    getPendingStockInsCount(),
  ]);
  return sales + stockIns;
}

export async function addOfflineSale(sale: Omit<OfflineSale, 'id' | 'synced'>): Promise<number> {
  return withDB(() => db.offlineSales.add({ ...sale, synced: false }));
}

export async function addOfflineStockIn(stockIn: Omit<OfflineStockIn, 'id' | 'synced'>): Promise<number> {
  return withDB(() => db.offlineStockIns.add({ ...stockIn, synced: false }));
}

export async function markSaleSynced(id: number): Promise<void> {
  return withDB(async () => {
    await db.offlineSales.update(id, { synced: true });
  });
}

export async function markStockInSynced(id: number): Promise<void> {
  return withDB(async () => {
    await db.offlineStockIns.update(id, { synced: true });
  });
}

export async function getPendingSales(): Promise<OfflineSale[]> {
  return withDB(() => db.offlineSales.where('synced').equals(0).toArray());
}

export async function getPendingStockIns(): Promise<OfflineStockIn[]> {
  return withDB(() => db.offlineStockIns.where('synced').equals(0).toArray());
}

export async function updateVariantCache(variants: CachedVariant[]): Promise<void> {
  return withDB(async () => {
    await db.variantsCache.bulkPut(variants);
  });
}

export async function updateProductsCache(products: CachedProduct[]): Promise<void> {
  return withDB(async () => {
    await db.productsCache.bulkPut(products);
  });
}

export async function getCachedVariantByBarcode(barcode: string): Promise<CachedVariant | undefined> {
  return withDB(() => db.variantsCache.get(barcode));
}

export async function decrementCachedVariantStock(barcode: string, amount: number = 1): Promise<void> {
  return withDB(async () => {
    const variant = await db.variantsCache.get(barcode);
    if (variant && variant.quantity >= amount) {
      await db.variantsCache.update(barcode, { quantity: variant.quantity - amount });
    }
  });
}
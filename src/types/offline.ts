export interface OfflineSale {
  id?: number;
  barcode: string;
  customerName?: string;
  soldBy?: string;
  createdAt: Date;
  synced: boolean;
  syncError?: string;
}

export interface OfflineStockIn {
  id?: number;
  variantId: string;
  quantityAdd: number;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  synced: boolean;
  syncError?: string;
}

export interface CachedVariant {
  barcode: string;
  variantId: string;
  productId: string;
  productName: string;
  colorName: string;
  size: string;
  categoryName: string;
  salePrice: number;
  tvaRate: number;
  quantity: number;
  updatedAt: Date;
}

export interface CachedProduct {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  brandName?: string;
  imageUrl?: string;
  salePrice: number;
  updatedAt: Date;
}

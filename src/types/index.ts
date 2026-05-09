export type Category = {
  id: string;
  code: 'TS' | 'SH' | 'PT' | 'JK' | 'AC' | 'OT';
  name_fr: string;
  size_type: 'clothing' | 'shoes' | 'waist' | 'free';
  icon?: string;
  sort_order?: number;
};

export type Color = {
  id: string;
  code: string;
  name_fr: string;
  hex?: string;
};

export type Brand = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  brand_id?: string;
  cost_price: number;
  sale_price: number;
  tva_rate: number;
  image_url?: string;
  seq_number: number;
  is_archived: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  brand?: Brand;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  color_id: string;
  size: string;
  size_code: string;
  barcode: string;
  quantity: number;
  is_active: boolean;
  is_archived: boolean;
  archived_at?: string;
  color?: Color;
  product?: Product;
};

export type Sale = {
  id: string;
  sale_number: string;
  total_ht: number;
  tva_amount: number;
  total_ttc: number;
  customer_name?: string;
  sold_by?: string;
  sold_by_name?: string;
  synced_from_offline: boolean;
  created_at: string;
  items?: SaleItem[];
};

export type SaleItem = {
  id: string;
  sale_id: string;
  variant_id?: string;
  barcode: string;
  product_name: string;
  category_name: string;
  size: string;
  color_name: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  unit_price_ttc: number;
  subtotal_ttc: number;
};

export type Notification = {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'sale_success' | 'sync_complete' | 'error' | 'info';
  title: string;
  message: string;
  is_read: boolean;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
};

export type DashboardStats = {
  revenue_today: number;
  units_sold_today: number;
  low_stock_count: number;
  best_product: string;
  best_product_qty: number;
  total_stock_value: number;
  profit_today: number;
  date: string;
};

export type ProductMatrix = {
  product: Product & {
    category: Category;
    brand?: Brand;
    price_ttc: number;
    margin_ht: number;
    margin_pct: number;
  };
  colors: Color[];
  sizes: { size: string; size_code: string }[];
  variants: (ProductVariant & { color_code: string; color_name: string })[];
};

export type SizePreset = {
  id: string;
  size_type: string;
  size_value: string;
  size_code: string;
  sort_order: number;
};

export type StockMovement = {
  id: string;
  variant_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'ARCHIVE' | 'UNARCHIVE';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_at: string;
};

export type SettingsMap = {
  low_stock_threshold: number;
  tva_rate: number;
  shop_name: string;
  currency: string;
  archive_retention_days: number;
  label_width_mm: number;
  label_height_mm: number;
  offline_sync_max_retry: number;
};

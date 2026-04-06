export interface ProductListModel {
  id?: string;
  name?: string;
  sku?: string;
  categories?: string;
  brand?: string;
  price?: number;
  salePrice?: number | null;
  published?: boolean;
  featured?: boolean;
  image?: string;
  status?: string;
}

export interface CouponListModel {
  id?: string;
  code?: string;
  name?: string;
  discount?: number;
  type?: string;
  displayType?: string;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  startDate?: string;
  expiryDate?: string;
  status?: string;
  displayStatus?: string;
  isValid?: boolean;
  isExpired?: boolean;
  isOutOfUses?: boolean;
}

export interface InventoryListModel {
  id?: string;
  productId?: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  reserved?: number;
  available?: number;
  locationId?: string;
  location?: string;
  status?: string;
  lastUpdated?: string;
}


/**
 * Global Type Definitions - Strict TypeScript Types
 * @module types
 */

import type { ReactNode, CSSProperties } from "react";
export * from "./api";
export * from "./booking";
export * from "./admin";

// ==================== Common Types ====================

export type Status = "idle" | "loading" | "success" | "error";

export interface PaginationParams {
  pageIndex?: number;
  pageSize?: number;
  filter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ==================== Theme Types ====================

export type SkinMode = "default" | "bordered";
export type ContentWidth = "full" | "boxed";
export type MenuLayoutType = "vertical" | "horizontal";
export type NavbarType = "sticky" | "static" | "floating" | "hidden";
export type FooterType = "sticky" | "static" | "hidden";

// ==================== Auth Types ====================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: UserRole;
  username: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = "admin" | "user" | "guest" | string;

export interface AuthState {
  isAuth: boolean;
  user: UserInfo | null;
  token: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserRoleVm {
  type: number;
  id: string;
  name: string;
}

export interface UserDepartmentVm {
  id: string;
  name: string;
  positionId: string | null;
  positionName: string | null;
}

/** User info returned from GET /api/auth/me — matches backend UserInfoVm */
export interface UserInfo {
  id: string;
  username: string | null;
  fullName: string | null;
  email: string | null;
  avatar: string | null;
  forcePasswordChange: boolean;
  roles: UserRoleVm[];
  departments: UserDepartmentVm[];
  portal: string | null;
  defaultPath: string | null;
}

/** Generic wrapper for all backend ResultSharedResponse<T> payloads */
export interface ApiSharedResponse<T> {
  data: T | null;
  message: string | null;
  statusCode: number;
  instance: string | null;
  errors: { errorMessage: string; code: string }[] | null;
}

// ==================== Layout Types ====================

export interface LayoutState {
  isRTL: boolean;
  isCollapsed: boolean;
  customizer: boolean;
  skin: SkinMode;
  contentWidth: ContentWidth;
  type: MenuLayoutType;
  menuHidden: boolean;
  navBarType: NavbarType;
  footerType: FooterType;
  mobileMenu: boolean;
  isMonochrome: boolean;
}

// ==================== Product Types ====================

export type ProductStatus = "draft" | "published" | "unpublished" | "archived";

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice?: number;
  shortDescription?: string;
  longDescription?: string;
  status: ProductStatus;
  isPublished: boolean;
  isFeatured: boolean;
  stock: number;
  barcode?: string;
  unit?: string;
  weight?: number;
  categoryId: string;
  brandId?: string;
  categoryIds: string[];
  images: ProductImage[];
  thumbnail?: ProductThumbnail;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
  order: number;
}

export interface ProductThumbnail {
  publicURL?: string;
  fileKey?: string;
}

export interface ProductFilterParams extends PaginationParams {
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  shortDescription?: string;
  longDescription?: string;
  categoryId: string;
  brandId?: string;
  stock: number;
  barcode?: string;
  unit?: string;
  weight?: number;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string;
  isFeatured?: boolean;
  isPublished?: boolean;
}

// ==================== Category Types ====================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId: string | null;
  parentName?: string | null;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  children: Category[];
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  id: string;
}

// ==================== Brand Types ====================

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface CreateBrandDto {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
}

export interface UpdateBrandDto extends Partial<CreateBrandDto> {
  id: string;
}

// ==================== Order Types ====================

export type OrderStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
  couponId?: string;
  couponCode?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderFilterParams extends PaginationParams {
  status?: OrderStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface CreateOrderDto {
  customerId: string;
  items: CreateOrderItemDto[];
  shippingAddress: Address;
  billingAddress?: Address;
  couponCode?: string;
  notes?: string;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  reason?: string;
}

export interface CreateOrUpdateOrderDto {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress:
    | string
    | {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
      };
  paymentMethod?: string;
  notes?: string;
  items: CreateOrderItemDto[];
  basketId?: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  couponCode?: string;
}

export interface UpdateOrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// ==================== Inventory Types ====================

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  locationId: string;
  locationName?: string;
  reorderLevel: number;
  reorderQuantity: number;
  lastRestockedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface InventoryHistory {
  id: string;
  inventoryItemId: string;
  productName?: string;
  type: "in" | "out" | "adjustment" | "reservation" | "release";
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceId?: string;
  referenceType?: string;
  createdBy: string;
  createdAt: string;
}

export interface InventoryReservation {
  id: string;
  productId: string;
  productName: string;
  referenceId: string;
  quantity: number;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateInventoryItemDto {
  productId: string;
  locationId: string;
  quantity: number;
  reorderLevel?: number;
  reorderQuantity?: number;
}

export interface UpdateInventoryDto extends Partial<CreateInventoryItemDto> {
  id: string;
}

export interface AdjustInventoryDto {
  quantity: number;
  reason?: string;
  type: "increase" | "decrease";
}

export interface IncreaseStockRequest {
  quantity: number;
  reason?: string;
}

export interface DecreaseStockRequest {
  quantity: number;
  reason?: string;
}

export interface CreateLocationDto {
  name: string;
  code: string;
  description?: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> {
  id: string;
}

// ==================== Coupon Types ====================

export type DiscountType = "percentage" | "fixed";
export type CouponStatus = "active" | "inactive" | "expired" | "used_up";

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  validFrom: string;
  validTo: string;
  status: CouponStatus;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface CreateCouponDto {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  startDate?: string;
  endDate?: string;
  validFrom?: string;
  validTo?: string;
}

export interface UpdateCouponDto extends Partial<CreateCouponDto> {
  id: string;
}

export interface ValidateCouponDto {
  code: string;
  orderTotal: number;
  productIds?: string[];
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  message?: string;
}

export interface UpdateValidityPeriodDto {
  validFrom: string;
  validTo: string;
}

export interface ApplyCouponDto {
  code: string;
  orderId: string;
  orderTotal: number;
}

// ==================== Notification Types ====================

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  userId: string;
  createdAt: string;
  readAt?: string;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  link?: string;
}

// ==================== Dashboard/Report Types ====================

export interface DashboardStatistics {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  orderGrowth: number;
  totalProducts: number;
  productGrowth: number;
  totalCustomers: number;
  customerGrowth: number;
  lowStockProducts: number;
  pendingOrders: number;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  revenue: number;
}

export interface OrderGrowthStatistics {
  data: RevenueChartPoint[];
}

export interface TopProductStatistics {
  data: TopProduct[];
}

export interface SalesByCategory {
  categoryId: string;
  categoryName: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

// ==================== Component Props Types ====================

export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  isLoading: boolean;
  loadingText?: string;
  size?: "sm" | "md" | "lg";
}

export interface ErrorProps extends BaseComponentProps {
  error: string | null;
  onRetry?: () => void;
}

export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ==================== Form Types ====================

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

// ==================== Table Types ====================

export interface TableColumn<T> {
  id: keyof T | string;
  header: string;
  accessor?: keyof T | ((row: T) => unknown);
  cell?: (value: unknown, row: T) => ReactNode;
  sortable?: boolean;
  width?: number | string;
  align?: "left" | "center" | "right";
}

export interface TableProps<T> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

// ==================== Utility Types ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Required<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: T[P] };

// ==================== SignalR Types ====================

export type SignalRNotification = {
  id?: string;
  title?: string;
  message?: string;
  type?: number | string;
  timestamp?: string;
  entity?: string;
  action?: string;
  data?: unknown;
};

export type NotificationCallback = (notification: SignalRNotification) => void;

export interface KeycloakInitOptions {
  [key: string]: unknown;
}

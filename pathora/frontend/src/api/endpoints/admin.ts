// Admin & Internal Service Endpoints (Catalog, Inventory, Discount, Order, Report, Notification, SiteContent, Communication)

export type EndpointWithId = (id: string) => string;
export type EndpointWithOrderNo = (orderNo: string) => string;

export interface CatalogEndpoints {
  GET_PRODUCTS: string;
  GET_ALL_PRODUCTS: string;
  GET_PRODUCT_DETAIL: EndpointWithId;
  CREATE_PRODUCT: string;
  UPDATE_PRODUCT: EndpointWithId;
  DELETE_PRODUCT: EndpointWithId;
  PUBLISH_PRODUCT: EndpointWithId;
  UNPUBLISH_PRODUCT: EndpointWithId;
  GET_CATEGORIES: string;
  GET_CATEGORY_TREE: string;
  GET_CATEGORY_DETAIL: EndpointWithId;
  CREATE_CATEGORY: string;
  UPDATE_CATEGORY: EndpointWithId;
  DELETE_CATEGORY: EndpointWithId;
  GET_BRANDS: string;
  GET_BRAND_DETAIL: EndpointWithId;
  CREATE_BRAND: string;
  UPDATE_BRAND: EndpointWithId;
  DELETE_BRAND: EndpointWithId;
}

export interface InventoryEndpoints {
  GET_LIST: string;
  GET_ALL: string;
  GET_DETAIL: EndpointWithId;
  CREATE: string;
  UPDATE: EndpointWithId;
  DELETE: EndpointWithId;
  INCREASE_STOCK: EndpointWithId;
  DECREASE_STOCK: EndpointWithId;
  GET_LOCATIONS: string;
  GET_LOCATION: EndpointWithId;
  CREATE_LOCATION: string;
  UPDATE_LOCATION: EndpointWithId;
  DELETE_LOCATION: EndpointWithId;
  GET_HISTORIES: string;
  GET_ALL_RESERVATIONS: string;
}

export interface DiscountEndpoints {
  GET_LIST: string;
  GET_ALL_COUPONS: string;
  GET_DETAIL: EndpointWithId;
  CREATE: string;
  UPDATE: EndpointWithId;
  DELETE: EndpointWithId;
  APPROVE_COUPON: EndpointWithId;
  REJECT_COUPON: EndpointWithId;
  UPDATE_VALIDITY_PERIOD: EndpointWithId;
  VALIDATE: string;
  APPLY: string;
}

export interface OrderEndpoints {
  GET_LIST: string;
  GET_ALL: string;
  GET_DETAIL: EndpointWithId;
  CREATE: string;
  UPDATE: EndpointWithId;
  UPDATE_STATUS: EndpointWithId;
  GET_BY_ORDER_NO: EndpointWithOrderNo;
  GET_BY_CURRENT_USER: string;
}

export interface ReportEndpoints {
  DASHBOARD_STATISTICS: string;
  ORDER_GROWTH_LINE_CHART: string;
  TOP_PRODUCT_PIE_CHART: string;
}

export interface NotificationEndpoints {
  GET_LIST: string;
  MARK_AS_READ: string;
  GET_ALL: string;
  GET_COUNT_UNREAD: string;
  GET_TOP_10_UNREAD: string;
}

export interface AdminEndpoints {
  GET_OVERVIEW: string;
  GET_DASHBOARD: string;
  GET_ALL_USERS: string;
  GET_USER_DETAIL: EndpointWithId;
  GET_TRANSPORT_PROVIDERS: string;
  GET_HOTEL_PROVIDERS: string;
  GET_TOUR_MANAGER_STAFF: EndpointWithId;
  REASSIGN_STAFF: (managerId: string, staffId: string) => string;
  GET_DASHBOARD_OVERVIEW: string;
  CREATE_STAFF_UNDER_MANAGER: (managerId: string) => string;
}

export interface SiteContentEndpoints {
  GET_BY_PAGE: (pageKey: string, lang?: string) => string;
  GET_BY_KEY: (pageKey: string, contentKey: string) => string;
  UPSERT: (pageKey: string, contentKey: string) => string;
  ADMIN_LIST: (pageKey?: string, search?: string) => string;
  ADMIN_DETAIL: (id: string) => string;
  ADMIN_UPSERT: (id: string) => string;
}

export interface CommunicationEndpoints {
  NOTIFICATION_HUB: string;
}

export interface TourManagerAssignmentEndpoints {
  GET_ALL: string;
  GET_BY_ID: EndpointWithId;
  ASSIGN: string;
  BULK_ASSIGN: string;
  REMOVE: EndpointWithId;
}

// --- Implementations ---

export const CATALOG: CatalogEndpoints = {
  GET_PRODUCTS: "/api/products",
  GET_ALL_PRODUCTS: "/api/products/all",
  GET_PRODUCT_DETAIL: (id: string): string => `/api/products/${id}`,
  CREATE_PRODUCT: "/api/products",
  UPDATE_PRODUCT: (id: string): string => `/api/products/${id}`,
  DELETE_PRODUCT: (id: string): string => `/api/products/${id}`,
  PUBLISH_PRODUCT: (id: string): string => `/api/products/${id}/publish`,
  UNPUBLISH_PRODUCT: (id: string): string => `/api/products/${id}/unpublish`,
  GET_CATEGORIES: "/api/categories",
  GET_CATEGORY_TREE: "/api/categories/tree",
  GET_CATEGORY_DETAIL: (id: string): string => `/api/categories/${id}`,
  CREATE_CATEGORY: "/api/categories",
  UPDATE_CATEGORY: (id: string): string => `/api/categories/${id}`,
  DELETE_CATEGORY: (id: string): string => `/api/categories/${id}`,
  GET_BRANDS: "/api/brands",
  GET_BRAND_DETAIL: (id: string): string => `/api/brands/${id}`,
  CREATE_BRAND: "/api/brands",
  UPDATE_BRAND: (id: string): string => `/api/brands/${id}`,
  DELETE_BRAND: (id: string): string => `/api/brands/${id}`,
};

export const INVENTORY: InventoryEndpoints = {
  GET_LIST: "/api/inventory-items",
  GET_ALL: "/api/inventory-items/all",
  GET_DETAIL: (id: string): string => `/api/inventory-items/${id}`,
  CREATE: "/api/inventory-items",
  UPDATE: (id: string): string => `/api/inventory-items/${id}`,
  DELETE: (id: string): string => `/api/inventory-items/${id}`,
  INCREASE_STOCK: (id: string): string => `/api/inventory-items/${id}/stock/increase`,
  DECREASE_STOCK: (id: string): string => `/api/inventory-items/${id}/stock/decrease`,
  GET_LOCATIONS: "/api/locations",
  GET_LOCATION: (id: string): string => `/api/locations/${id}`,
  CREATE_LOCATION: "/api/locations",
  UPDATE_LOCATION: (id: string): string => `/api/locations/${id}`,
  DELETE_LOCATION: (id: string): string => `/api/locations/${id}`,
  GET_HISTORIES: "/api/histories",
  GET_ALL_RESERVATIONS: "/api/reservations/all",
};

export const DISCOUNT: DiscountEndpoints = {
  GET_LIST: "/api/coupons",
  GET_ALL_COUPONS: "/api/coupons/all",
  GET_DETAIL: (id: string): string => `/api/coupons/${id}`,
  CREATE: "/api/coupons",
  UPDATE: (id: string): string => `/api/coupons/${id}`,
  DELETE: (id: string): string => `/api/coupons/${id}`,
  APPROVE_COUPON: (id: string): string => `/api/coupons/${id}/approve`,
  REJECT_COUPON: (id: string): string => `/api/coupons/${id}/reject`,
  UPDATE_VALIDITY_PERIOD: (id: string): string => `/api/coupons/${id}/validity-period`,
  VALIDATE: "/api/coupons/validate",
  APPLY: "/api/coupons/apply",
};

export const ORDER: OrderEndpoints = {
  GET_LIST: "/api/orders",
  GET_ALL: "/api/orders/all",
  GET_DETAIL: (id: string): string => `/api/orders/${id}`,
  CREATE: "/api/orders",
  UPDATE: (id: string): string => `/api/orders/${id}`,
  UPDATE_STATUS: (id: string): string => `/api/orders/${id}/status`,
  GET_BY_ORDER_NO: (orderNo: string): string => `/api/orders/order-no/${orderNo}`,
  GET_BY_CURRENT_USER: "/api/orders/me",
};

export const REPORT: ReportEndpoints = {
  DASHBOARD_STATISTICS: "/api/dashboard/statistics",
  ORDER_GROWTH_LINE_CHART: "/api/dashboard/revenue-chart",
  TOP_PRODUCT_PIE_CHART: "/api/dashboard/top-products",
};

export const NOTIFICATION: NotificationEndpoints = {
  GET_LIST: "/api/notifications",
  MARK_AS_READ: "/api/notifications/read",
  GET_ALL: "/api/notifications/all",
  GET_COUNT_UNREAD: "/api/notifications/unread/count",
  GET_TOP_10_UNREAD: "/api/notifications/unread/top10",
};

export const ADMIN: AdminEndpoints = {
  GET_OVERVIEW: "/api/admin/overview",
  GET_DASHBOARD: "/api/admin/dashboard",
  GET_ALL_USERS: "/api/admin/users",
  GET_USER_DETAIL: (id: string): string => `/api/admin/users/${id}`,
  GET_TRANSPORT_PROVIDERS: "/api/admin/transport-providers",
  GET_HOTEL_PROVIDERS: "/api/admin/hotel-providers",
  GET_TOUR_MANAGER_STAFF: (id: string): string => `/api/admin/tour-managers/${id}/staff`,
  REASSIGN_STAFF: (managerId: string, staffId: string): string =>
    `/api/admin/tour-managers/${managerId}/staff/${staffId}/reassign`,
  GET_DASHBOARD_OVERVIEW: "/api/admin/dashboard/overview",
  CREATE_STAFF_UNDER_MANAGER: (managerId: string): string =>
    `/api/admin/tour-managers/${managerId}/staff`,
};

export const SITE_CONTENT: SiteContentEndpoints = {
  GET_BY_PAGE: (pageKey: string, lang?: string): string => {
    const query = new URLSearchParams();
    query.set("pageKey", pageKey);
    if (lang) query.set("lang", lang);
    return `/api/site-content?${query.toString()}`;
  },
  GET_BY_KEY: (pageKey: string, contentKey: string): string =>
    `/api/site-content/${pageKey}/${contentKey}`,
  UPSERT: (pageKey: string, contentKey: string): string =>
    `/api/site-content/${pageKey}/${contentKey}`,
  ADMIN_LIST: (pageKey?: string, search?: string): string => {
    const query = new URLSearchParams();
    if (pageKey?.trim().length) query.set("pageKey", pageKey.trim());
    if (search?.trim().length) query.set("search", search.trim());
    const q = query.toString();
    return q.length > 0 ? `/api/site-content/admin?${q}` : "/api/site-content/admin";
  },
  ADMIN_DETAIL: (id: string): string => `/api/site-content/admin/${id}`,
  ADMIN_UPSERT: (id: string): string => `/api/site-content/admin/${id}`,
};

export const COMMUNICATION: CommunicationEndpoints = {
  NOTIFICATION_HUB: "/hubs/notifications",
};

export const TOUR_MANAGER_ASSIGNMENT: TourManagerAssignmentEndpoints = {
  GET_ALL: "/api/tour-manager-assignment",
  GET_BY_ID: (id: string): string => `/api/tour-manager-assignment/${id}`,
  ASSIGN: "/api/tour-manager-assignment",
  BULK_ASSIGN: "/api/tour-manager-assignment/bulk",
  REMOVE: (id: string): string => `/api/tour-manager-assignment/${id}`,
};

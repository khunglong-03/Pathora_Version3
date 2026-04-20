/**
 * API Endpoints Configuration
 * All endpoints are relative to NEXT_PUBLIC_API_GATEWAY base URL
 *
 * Split across multiple domain files:
 * - endpoints/auth.ts      — Auth, PublicHome
 * - endpoints/tour.ts     — Tour, TourInstance, PublicTourInstance
 * - endpoints/booking.ts  — Booking, TourRequests, Payment
 * - endpoints/policy.ts   — Pricing, Deposit, Cancellation, Tax
 * - endpoints/admin.ts    — Catalog, Inventory, Discount, Order, Report, Notification, Admin, SiteContent, Communication
 */

// Import types for use in ApiEndpoints interface
import type {
  CatalogEndpoints,
  InventoryEndpoints,
  DiscountEndpoints,
  OrderEndpoints,
  ReportEndpoints,
  NotificationEndpoints,
  AdminEndpoints,
  SiteContentEndpoints,
  CommunicationEndpoints,
  TourManagerAssignmentEndpoints,
} from "./admin";
import type {
  AuthEndpoints,
  PublicHomeEndpoints,
  SearchToursParams,
} from "./auth";
import type {
  TourEndpoints,
  TourInstanceEndpoints,
  PublicTourInstanceEndpoints,
} from "./tour";
import type {
  PublicBookingEndpoints,
  BookingEndpoints,
  TourRequestEndpoints,
  PaymentEndpoints,
} from "./booking";
import type {
  PricingPolicyEndpoints,
  DepositPolicyEndpoints,
  CancellationPolicyEndpoints,
  TaxConfigEndpoints,
} from "./policy";
import type { UserEndpoints } from "./user";
import { USER } from "./user";
import type { ManagerEndpoints } from "./manager";
import { MANAGER } from "./manager";
import type { RoleEndpoints } from "./role";
import type { AdminHotelEndpoints } from "./adminHotel";
import { ADMIN_HOTEL } from "./adminHotel";
import { ROLE } from "./role";

import type { HotelProviderEndpoints } from "./hotelProvider";

// Re-export types for external consumers
export type {
  EndpointWithId,
} from "./tour";
export type {
  HotelProviderEndpoints,
} from "./hotelProvider";
export type {
  EndpointWithOrderNo,
} from "./admin";
export type {
  AuthEndpoints,
  PublicHomeEndpoints,
  SearchToursParams,
} from "./auth";
export type {
  TourEndpoints,
  TourInstanceEndpoints,
  PublicTourInstanceEndpoints,
} from "./tour";
export type {
  PublicBookingEndpoints,
  BookingEndpoints,
  TourRequestEndpoints,
  PaymentEndpoints,
} from "./booking";
export type {
  PricingPolicyEndpoints,
  DepositPolicyEndpoints,
  CancellationPolicyEndpoints,
  TaxConfigEndpoints,
} from "./policy";
export type {
  CatalogEndpoints,
  InventoryEndpoints,
  DiscountEndpoints,
  OrderEndpoints,
  ReportEndpoints,
  NotificationEndpoints,
  AdminEndpoints,
  SiteContentEndpoints,
  CommunicationEndpoints,
  TourManagerAssignmentEndpoints,
} from "./admin";

export type { ManagerEndpoints } from "./manager";
export type { RoleEndpoints } from "./role";
export type { AdminHotelEndpoints } from "./adminHotel";

// Import constants for use in API_ENDPOINTS object
import {
  AUTH,
  PUBLIC_HOME,
} from "./auth";
import {
  TOUR,
  TOUR_INSTANCE,
  PUBLIC_TOUR_INSTANCE,
} from "./tour";
import {
  PUBLIC_BOOKING,
  BOOKING,
  TOUR_REQUESTS,
  PAYMENT,
} from "./booking";
import {
  PRICING_POLICY,
  DEPOSIT_POLICY,
  CANCELLATION_POLICY,
  TAX_CONFIG,
} from "./policy";
import {
  CATALOG,
  INVENTORY,
  DISCOUNT,
  ORDER,
  REPORT,
  NOTIFICATION,
  ADMIN,
  SITE_CONTENT,
  COMMUNICATION,
  TOUR_MANAGER_ASSIGNMENT,
} from "./admin";

// Re-export constants for external consumers
export {
  AUTH,
  PUBLIC_HOME,
} from "./auth";
export {
  TOUR,
  TOUR_INSTANCE,
  PUBLIC_TOUR_INSTANCE,
} from "./tour";
export {
  PUBLIC_BOOKING,
  BOOKING,
  TOUR_REQUESTS,
  PAYMENT,
} from "./booking";
export {
  PRICING_POLICY,
  DEPOSIT_POLICY,
  CANCELLATION_POLICY,
  TAX_CONFIG,
} from "./policy";
export {
  CATALOG,
  INVENTORY,
  DISCOUNT,
  ORDER,
  REPORT,
  NOTIFICATION,
  ADMIN,
  SITE_CONTENT,
  COMMUNICATION,
  TOUR_MANAGER_ASSIGNMENT,
} from "./admin";
export { USER } from "./user";
export { ROLE } from "./role";
export { ADMIN_HOTEL } from "./adminHotel";
export { MANAGER } from "./manager";

import { HOTEL_PROVIDER } from "./hotelProvider";
export { HOTEL_PROVIDER };

// Composite interface
export interface ApiEndpoints {
  CATALOG: CatalogEndpoints;
  INVENTORY: InventoryEndpoints;
  DISCOUNT: DiscountEndpoints;
  ORDER: OrderEndpoints;
  REPORT: ReportEndpoints;
  NOTIFICATION: NotificationEndpoints;
  PAYMENT: PaymentEndpoints;
  COMMUNICATION: CommunicationEndpoints;
  AUTH: AuthEndpoints;
  PUBLIC_HOME: PublicHomeEndpoints;
  TOUR: TourEndpoints;
  TOUR_INSTANCE: TourInstanceEndpoints;
  PUBLIC_TOUR_INSTANCE: PublicTourInstanceEndpoints;
  ADMIN: AdminEndpoints;
  TOUR_REQUESTS: TourRequestEndpoints;
  PUBLIC_BOOKING: PublicBookingEndpoints;
  BOOKING: BookingEndpoints;
  SITE_CONTENT: SiteContentEndpoints;
  PRICING_POLICY: PricingPolicyEndpoints;
  DEPOSIT_POLICY: DepositPolicyEndpoints;
  CANCELLATION_POLICY: CancellationPolicyEndpoints;
  TAX_CONFIG: TaxConfigEndpoints;
  USER: UserEndpoints;
  ROLE: RoleEndpoints;
  HOTEL: AdminHotelEndpoints;
  TOUR_MANAGER_ASSIGNMENT: TourManagerAssignmentEndpoints;
  MANAGER: ManagerEndpoints;
  HOTEL_PROVIDER: HotelProviderEndpoints;
}

// Main endpoint object
export const API_ENDPOINTS: ApiEndpoints = {
  AUTH,
  PUBLIC_HOME,
  TOUR,
  TOUR_INSTANCE,
  PUBLIC_TOUR_INSTANCE,
  PUBLIC_BOOKING,
  BOOKING,
  TOUR_REQUESTS,
  PAYMENT,
  PRICING_POLICY,
  DEPOSIT_POLICY,
  CANCELLATION_POLICY,
  TAX_CONFIG,
  CATALOG,
  INVENTORY,
  DISCOUNT,
  ORDER,
  REPORT,
  NOTIFICATION,
  ADMIN,
  SITE_CONTENT,
  COMMUNICATION,
  USER,
  ROLE,
  HOTEL: ADMIN_HOTEL,
  HOTEL_PROVIDER,
  TOUR_MANAGER_ASSIGNMENT,
  MANAGER,
};

// Backwards-compatible default export
export default API_ENDPOINTS;

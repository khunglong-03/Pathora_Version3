// Booking-related types matching backend DTOs

export type TourTier = "standard" | "luxury" | "premium";

// Enums matching C# enums
export enum GenderTypeEnum {
  Male = 0,
  Female = 1,
  Other = 2,
}

export enum ReservationStatusEnum {
  Pending = 1,
  Confirmed = 2,
  Cancelled = 3,
  Completed = 4,
}

export enum PaymentStatusEnum {
  Pending = 1,
  Partial = 2,
  Paid = 3,
  Overdue = 4,
  Cancelled = 5,
}

export enum BookingStatusEnum {
  Pending = 1,
  Confirmed = 2,
  Cancelled = 3,
  Completed = 4,
}

export enum SupplierTypeEnum {
  Hotel = 1,
  Restaurant = 2,
  Transport = 3,
  Activity = 4,
  Other = 5,
}

export enum TransportTypeEnum {
  Bus = 1,
  Train = 2,
  Flight = 3,
  Boat = 4,
  Car = 5,
  Other = 6,
}

// String types for frontend convenience
export type GenderTypeString = "Male" | "Female" | "Other";
export type ReservationStatusString = "Pending" | "Confirmed" | "Cancelled" | "Completed";
export type PaymentStatusString = "Pending" | "Partial" | "Paid" | "Overdue" | "Cancelled";
export type BookingStatusString = "Pending" | "Confirmed" | "Cancelled" | "Completed";
export type SupplierTypeString = "Hotel" | "Restaurant" | "Transport" | "Activity" | "Other";
export type TransportTypeString = "Bus" | "Train" | "Flight" | "Boat" | "Car" | "Other";
export type RefundStatusString = "Pending" | "Contacted" | "Refunded" | "NotApplicable";

// Sub-DTOs
export interface PassportDto {
  id?: string;
  passportNumber: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  issuedPlace: string | null;
  countryCode: string | null;
  fileUrl?: string | null;
}

export interface VisaApplicationDto {
  visaApplicationId: string;
  country: string | null;
  visaType: string | null;
  entryType: string | null;
  expiryDate: string | null;
  status: string | null;
}

// Participant types
export interface ParticipantDto {
  participantId: string;
  bookingId: string;
  participantType: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: GenderTypeEnum | null;
  nationality: string | null;
  status: ReservationStatusEnum;
  passport: PassportDto | null;
  visaApplications: VisaApplicationDto[];
  infoReviewStatus: "NotReviewed" | "Approved" | "Rejected";
  infoRejectionReason: string | null;
  infoReviewedAt: string | null;
  infoReviewedBy: string | null;
  infoReviewedByName: string | null;
}

export interface CreateParticipantDto {
  bookingId: string;
  participantType: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: GenderTypeEnum | null;
  nationality: string | null;
}

// Supplier types
export interface SupplierDto {
  supplierId: string;
  supplierCode: string;
  supplierType: SupplierTypeEnum;
  name: string;
  taxCode: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
}

export interface SupplierReceiptDto {
  supplierReceiptId: string;
  supplierPayableId: string;
  amount: number;
  paidAt: string;
  paymentMethod: number;
  transactionRef: string | null;
  note: string | null;
}

export interface SupplierPayableDto {
  supplierPayableId: string;
  bookingId: string;
  supplierId: string;
  expectedAmount: number;
  paidAmount: number;
  dueAt: string | null;
  status: PaymentStatusEnum;
  note: string | null;
  receipts: SupplierReceiptDto[];
}

// Activity and Transport types
export interface BookingActivityReservationDto {
  bookingActivityReservationId: string;
  bookingId: string;
  supplierId: string | null;
  order: number;
  activityType: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  totalServicePrice: number;
  totalServicePriceAfterTax: number;
  status: ReservationStatusEnum;
  note: string | null;
}

export interface TransportDetailDto {
  bookingTransportDetailId: string;
  bookingActivityReservationId: string;
  bookingParticipantId: string | null;
  passengerName: string | null;
  supplierId: string | null;
  transportType: TransportTypeEnum;
  departureAt: string | null;
  arrivalAt: string | null;
  ticketNumber: string | null;
  eTicketNumber: string | null;
  seatNumber: string | null;
  seatCapacity: number;
  seatClass: string | null;
  vehicleNumber: string | null;
  buyPrice: number;
  taxRate: number;
  totalBuyPrice: number;
  isTaxable: boolean;
  fileUrl: string | null;
  specialRequest: string | null;
  status: ReservationStatusEnum;
  note: string | null;
}

export interface AccommodationDetailDto {
  bookingAccommodationDetailId: string;
  bookingActivityReservationId: string;
  supplierId: string | null;
  accommodationName: string;
  checkIn: string | null;
  checkOut: string | null;
  roomType: string | null;
  numberOfRooms: number;
  numberOfNights: number;
  buyPrice: number;
  taxRate: number;
  totalBuyPrice: number;
  isTaxable: boolean;
  fileUrl: string | null;
  status: ReservationStatusEnum;
  note: string | null;
}

export interface TourGuideDto {
  tourGuideId: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface BookingTourGuideDto {
  bookingId: string;
  tourGuide: TourGuideDto;
  assignedAt: string;
}

export interface TourDayActivityStatusDto {
  tourDayId: string;
  tourDayActivityId: string;
  status: ReservationStatusEnum;
  note: string | null;
}

// Main booking detail response
// Schema matches BE BookingDetailDto (customer GET /api/customer/bookings/{id}) — primary key is `id`.
export interface BookingDetailResponse {
  id: string;
  /** Alias of `id` after bookingService normalization (legacy callers). */
  bookingId?: string;
  tourInstanceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  adults: number;
  children: number;
  infants: number;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  adultSubtotal: number;
  childSubtotal: number;
  infantSubtotal: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  visaServiceFeeTotal: number;
  isVisaFeePending?: boolean;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  bookingType: string;
  tourStatus: string;
  isVisaRequired?: boolean;
  pendingTransactions?: BookingPendingTransaction[];
  activityReservations?: BookingActivityReservationDto[];
  transportDetails?: TransportDetailDto[];
  accommodationDetails?: AccommodationDetailDto[];
  participants?: ParticipantDto[];
  supplierPayables?: SupplierPayableDto[];
  assignedTourGuides?: BookingTourGuideDto[];
  activityStatuses?: TourDayActivityStatusDto[];
  cancellationRequest?: BookingCancellationRequestSummaryDto;
  cancellationRequests: BookingCancellationRequestSummaryDto[];
  /** Customer booking detail — camelCase from BookingDetailDto */
  id?: string;
  tourName?: string;
  reference?: string;
  tier?: string;
  status?: string;
  tourStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  location?: string;
  duration?: string;
  bookingDate?: string;
  departureDate?: string;
  returnDate?: string;
  pricePerPerson?: number;
  totalAmount?: number;
  paidAmount?: number;
  remainingBalance?: number;
  image?: string;
  description?: string;
  highlights?: string[];
  importantInfo?: string[];
  pendingTransactionCode?: string;
}

export interface CustomerTicketDto {
  id: string;
  tourInstanceDayActivityId: string;
  flightNumber: string | null;
  departureAt: string | null;
  arrivalAt: string | null;
  seatNumbers: string | null;
  eTicketNumbers: string | null;
  seatClass: string | null;
  note: string | null;
}

export interface CustomerRoomAssignmentDto {
  id: string;
  tourInstanceDayActivityId: string;
  roomType: string;
  roomCount: number;
  roomNumbers: string | null;
  note: string | null;
}

export interface CustomerDayStatusDto {
  id: string;
  tourDayId: string;
  activityStatus: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  completedAt: string | null;
  cancellationReason: string | null;
  note: string | null;
}

export interface CustomerTicketImageDto {
  id: string;
  tourInstanceDayActivityId: string;
  publicUrl: string;
  bookingReference: string | null;
  note: string | null;
}

export interface BookingCancellationRequestSummaryDto {
  requestId: string;
  status: string;
  feePercent: number;
  paidAmountSnapshot: number;
  refundAmount: number;
  managerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  refundConfirmedAt: string | null;
}

// Helper functions to convert string to enum
export const toGenderType = (value: string | null | undefined): GenderTypeEnum | null => {
  if (!value) return null;
  const key = value as keyof typeof GenderTypeEnum;
  return GenderTypeEnum[key] ?? null;
};

export const toReservationStatus = (value: number): ReservationStatusEnum => {
  return value as ReservationStatusEnum;
};

export const toPaymentStatus = (value: number): PaymentStatusEnum => {
  return value as PaymentStatusEnum;
};

export const toBookingStatus = (value: number): BookingStatusEnum => {
  return value as BookingStatusEnum;
};

// --- Visa Types ---
export enum VisaCategory {
  Tourist = "Tourist",
  Business = "Business",
  FamilyVisit = "FamilyVisit",
  Student = "Student",
  Transit = "Transit",
  Other = "Other",
}

export enum VisaFormat {
  Sticker = "Sticker",
  EVisa = "EVisa",
  VisaOnArrival = "VisaOnArrival",
}

export interface VisaRequirementParticipant {
  participantId: string;
  fullName: string;
  requiresVisa: boolean;
  missingDateOfBirth: boolean;
  passport: PassportDto | null;
  latestVisaApplication: VisaApplicationSummaryDto | null;
  availableActions: string[];
}

export interface VisaApplicationSummaryDto {
  id: string;
  status: string;
  destinationCountry: string;
  minReturnDate: string | null;
  refusalReason: string | null;
  visaFileUrl: string | null;
  isSystemAssisted: boolean;
  serviceFee: number | null;
  /** Backend sends `serviceFeePaid` (bool); legacy alias `serviceFeePaidAt` for display */
  serviceFeePaid?: boolean;
  serviceFeePaidAt?: string | null;
  hasPendingServiceFee: boolean;
  category: string | null;
  format: string | null;
  maxStayDays: number | null;
  issuingAuthority: string | null;
  visaNumber: string | null;
  entryType: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
}

export interface VisaRequirementResponse {
  bookingId: string;
  tourInstanceId: string;
  tourStatus: string;
  isVisaRequired: boolean;
  visaServiceFeeTotal: number;
  participants: VisaRequirementParticipant[];
}

export interface CustomerPassportPayload {
  passportNumber: string;
  nationality: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
}

export interface SubmitVisaApplicationPayload {
  bookingParticipantId: string;
  passportId: string;
  destinationCountry: string;
  minReturnDate?: string;
  visaFileUrl?: string;
  category?: number;
  format?: number;
  maxStayDays?: number;
  issuingAuthority?: string;
  visaNumber?: string;
  entryType?: number;
  issuedAt?: string;
  expiresAt?: string;
}

export interface UpdateVisaApplicationPayload {
  destinationCountry?: string;
  minReturnDate?: string;
  visaFileUrl?: string;
  isResubmitting?: boolean;
  category?: number;
  format?: number;
  maxStayDays?: number;
  issuingAuthority?: string;
  visaNumber?: string;
  entryType?: number;
  issuedAt?: string;
  expiresAt?: string;
}

export interface RequestVisaSupportResponse {
  applicationId: string;
  serviceFeeQuoted: boolean;
  message: string;
}

export interface BookingPendingTransaction {
  transactionCode: string;
  amount: number;
  type: string;
  purpose: string;
  createdAt: string;
  expiresAt: string | null;
}

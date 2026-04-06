// Booking-related types matching backend DTOs

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

// Sub-DTOs
export interface PassportDto {
  passportNumber: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  issuedPlace: string | null;
  countryCode: string | null;
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
export interface BookingDetailResponse {
  bookingId: string;
  tourInstanceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  numberAdult: number;
  numberChild: number;
  numberInfant: number;
  totalPrice: number;
  status: BookingStatusEnum;
  activityReservations: BookingActivityReservationDto[];
  transportDetails: TransportDetailDto[];
  accommodationDetails: AccommodationDetailDto[];
  participants: ParticipantDto[];
  supplierPayables: SupplierPayableDto[];
  assignedTourGuides: BookingTourGuideDto[];
  activityStatuses: TourDayActivityStatusDto[];
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

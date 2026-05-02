import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ServiceResponse } from "@/types/api";
import { extractResult } from "@/utils/apiResponse";
import { normalizeCheckoutPriceResponse } from "@/utils/checkoutPriceResponse";

export interface GetQrPayload {
  note: string;
  amount: number;
}

// Backend enums (matching C# enums)
export enum TransactionTypeEnum {
  Deposit = 1,
  FullPayment = 2,
  Refund = 3,
}

export enum PaymentMethodEnum {
  Cash = 1,
  BankTransfer = 2,
  Card = 3,
  Momo = 4,
  VnPay = 5,
}

export enum TransactionStatusEnum {
  Pending = 1,
  Processing = 2,
  Completed = 3,
  Failed = 4,
  Refunded = 5,
  Cancelled = 6,
}

// Frontend-facing string types for developer convenience
export type TransactionTypeString = "Deposit" | "FullPayment" | "Refund";
export type PaymentMethodString = "Cash" | "BankTransfer" | "Card" | "Momo" | "VnPay";
export type NormalizedPaymentStatus = "pending" | "paid" | "cancelled" | "expired" | "failed";

// Convert string to enum integer for API
const toTransactionType = (type: TransactionTypeString): number => TransactionTypeEnum[type as keyof typeof TransactionTypeEnum];
const toPaymentMethod = (method: PaymentMethodString): number => PaymentMethodEnum[method as keyof typeof PaymentMethodEnum];

// Payment gateway enum — PayOS removed; only Sepay remains
export enum PaymentGatewayEnum {
  Sepay = 2,
}

export type PaymentGatewayString = "Sepay";

export interface CreateTransactionPayload {
  bookingId: string;
  type: TransactionTypeString;
  amount: number;
  paymentMethod: PaymentMethodString;
  paymentNote: string;
  createdBy: string;
  expirationMinutes?: number;
  paymentGateway?: PaymentGatewayString; // Deprecated: always "Sepay"
}

export interface PaymentTransaction {
  id: string;
  transactionCode: string;
  bookingId: string;
  type: "Deposit" | "FullPayment" | "Refund";
  status: "Pending" | "Processing" | "Completed" | "Failed" | "Refunded" | "Cancelled";
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentMethod: string;
  createdAt: string;
  expiredAt?: string;
  paidAt?: string;
  completedAt?: string;
  checkoutUrl?: string;
  paymentNote?: string;
  senderName?: string;
  senderAccountNumber?: string;
  beneficiaryBank?: string;
  managerBankCode?: string;
  managerAccountNumber?: string;
  managerAccountName?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface PaymentStatusSnapshot {
  transactionCode: string;
  normalizedStatus: NormalizedPaymentStatus;
  rawStatus: string;
  source: string;
  verifiedWithProvider: boolean;
  isTerminal: boolean;
  checkedAt: string;
  providerTransactionId?: string;
}

export interface CheckoutPriceResponse {
  bookingId: string;
  tourInstanceId: string;
  tourName: string;
  tourCode: string;
  thumbnailUrl?: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  location?: string;
  numberAdult: number;
  numberChild: number;
  numberInfant: number;
  // Base prices from TourInstance
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  // Calculated prices with tiers
  adultSubtotal: number;
  childSubtotal: number;
  infantSubtotal: number;
  subtotal: number;
  // Tax
  taxRate: number;
  taxAmount: number;
  // Final
  totalPrice: number;
  // Deposit info
  depositPercentage: number;
  depositAmount: number;
  remainingBalance: number;
}

export const paymentService = {
  getQr: async (payload: GetQrPayload) => {
    const response = await api.post<ServiceResponse<string>>(
      API_ENDPOINTS.PAYMENT.GET_QR,
      payload,
    );

    return extractResult<string>(response.data);
  },

  createTransaction: async (payload: CreateTransactionPayload) => {
    // Convert string enums to integers for backend
    const apiPayload = {
      ...payload,
      type: toTransactionType(payload.type),
      paymentMethod: toPaymentMethod(payload.paymentMethod),
      // paymentGateway is already a string ("PayOS" or "Sepay"), pass as-is
      // Backend will handle the conversion
    };

    const response = await api.post<ServiceResponse<PaymentTransaction>>(
      API_ENDPOINTS.PAYMENT.CREATE_TRANSACTION,
      apiPayload,
    );

    return extractResult<PaymentTransaction>(response.data);
  },

  createPrivateCustomInitial: async (bookingId: string) => {
    const response = await api.post<ServiceResponse<PaymentTransaction>>(
      API_ENDPOINTS.PAYMENT.CREATE_PRIVATE_CUSTOM_INITIAL,
      { bookingId },
    );

    return extractResult<PaymentTransaction>(response.data);
  },

  getTransaction: async (transactionCode: string) => {
    const response = await api.get<ServiceResponse<PaymentTransaction>>(
      API_ENDPOINTS.PAYMENT.GET_TRANSACTION(transactionCode),
    );

    return extractResult<PaymentTransaction>(response.data);
  },

  getNormalizedStatus: async (transactionCode: string) => {
    const response = await api.get<ServiceResponse<PaymentStatusSnapshot>>(
      API_ENDPOINTS.PAYMENT.GET_TRANSACTION_STATUS(transactionCode),
    );

    return extractResult<PaymentStatusSnapshot>(response.data);
  },

  checkPayment: async (transactionCode: string) => {
    const response = await api.get<ServiceResponse<PaymentStatusSnapshot>>(
      API_ENDPOINTS.PAYMENT.CHECK_PAYMENT(transactionCode),
    );

    return extractResult<PaymentStatusSnapshot>(response.data);
  },

  reconcileReturn: async (transactionCode: string) => {
    const response = await api.get<ServiceResponse<PaymentStatusSnapshot>>(
      API_ENDPOINTS.PAYMENT.RECONCILE_RETURN,
      {
        params: { transactionCode },
      },
    );

    return extractResult<PaymentStatusSnapshot>(response.data);
  },

  reconcileCancel: async (transactionCode: string) => {
    const response = await api.get<ServiceResponse<PaymentStatusSnapshot>>(
      API_ENDPOINTS.PAYMENT.RECONCILE_CANCEL,
      {
        params: { transactionCode },
      },
    );

    return extractResult<PaymentStatusSnapshot>(response.data);
  },

  expireTransaction: async (transactionCode: string) => {
    const response = await api.post<ServiceResponse<PaymentTransaction>>(
      API_ENDPOINTS.PAYMENT.EXPIRE_TRANSACTION(transactionCode),
    );

    return extractResult<PaymentTransaction>(response.data);
  },

  getPendingByBookingId: async (bookingId: string) => {
    const response = await api.get<ServiceResponse<PaymentTransaction>>(
      `/api/payment/pending-by-booking/${bookingId}`,
    );

    return extractResult<PaymentTransaction>(response.data);
  },

  getCheckoutPrice: async (
    bookingId: string,
    opts?: { usePublicBookingEndpoint?: boolean },
  ): Promise<CheckoutPriceResponse | null> => {
    const url = opts?.usePublicBookingEndpoint
      ? API_ENDPOINTS.PUBLIC_BOOKING.GET_CHECKOUT_PRICE(bookingId)
      : API_ENDPOINTS.BOOKING.GET_CUSTOMER_CHECKOUT_PRICE(bookingId);
    const response = await api.get<ServiceResponse<unknown>>(url);
    const raw = extractResult<unknown>(response.data);
    return normalizeCheckoutPriceResponse(raw);
  },
};

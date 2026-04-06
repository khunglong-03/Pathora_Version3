/* ── Types ─────────────────────────────────────────────────── */
export type BookingStatus =
  | "confirmed"
  | "completed"
  | "pending"
  | "pending_approval"
  | "approved"
  | "cancelled"
  | "rejected";

export type TourTier = "standard" | "luxury" | "premium";
export type PaymentStatus = "paid" | "partial" | "unpaid";
export type PaymentMethod = "qr_code" | "cash" | "bank_transfer";

export interface BookingDetail {
  id: string;
  tourName: string;
  reference: string;
  tier: TourTier;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  location: string;
  duration: string;
  bookingDate: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  pricePerPerson: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  image: string;
  description: string;
  highlights: string[];
  importantInfo: string[];
}

/* ── Sample Data ───────────────────────────────────────────── */
export const SAMPLE_BOOKINGS: Record<string, BookingDetail> = {
  "1": {
    id: "1",
    tourName: "Bali Island Hopping Adventure",
    reference: "PATH-2026-001",
    tier: "standard",
    status: "confirmed",
    paymentStatus: "partial",
    paymentMethod: "qr_code",
    location: "Bali, Indonesia",
    duration: "5 Days",
    bookingDate: "February 15, 2026",
    departureDate: "March 12, 2026",
    returnDate: "March 16, 2026",
    adults: 2,
    children: 1,
    pricePerPerson: 1425,
    totalAmount: 2850,
    paidAmount: 1425,
    remainingBalance: 1425,
    image: "/assets/images/tours/bali.jpg",
    description:
      "Experience the magic of Bali, Indonesia with our carefully curated standard package. This 5 days journey takes you through the most iconic landmarks and hidden gems, providing an unforgettable adventure with professional guides and comfortable accommodations.",
    highlights: [
      "Visit iconic landmarks and attractions",
      "Experience local culture and traditions",
      "Enjoy authentic local cuisine",
      "Professional English-speaking guide",
      "Comfortable accommodation included",
      "All entrance fees covered",
    ],
    importantInfo: [
      "Please arrive at meeting point 15 minutes before departure",
      "Bring valid ID/passport for verification",
      "Cancellation must be made 48 hours in advance for full refund",
      "Contact us immediately if you need to reschedule",
    ],
  },
};

/* ── Status config ─────────────────────────────────────────── */
export const STATUS_CONFIG: Record<
  BookingStatus,
  { bg: string; text: string; icon: string }
> = {
  confirmed: {
    bg: "bg-green-500",
    text: "text-white",
    icon: "heroicons:check-circle",
  },
  completed: {
    bg: "bg-blue-500",
    text: "text-white",
    icon: "heroicons:check-circle",
  },
  pending: {
    bg: "bg-amber-500",
    text: "text-white",
    icon: "heroicons:clock",
  },
  pending_approval: {
    bg: "bg-orange-500",
    text: "text-white",
    icon: "heroicons:clock",
  },
  approved: {
    bg: "bg-emerald-500",
    text: "text-white",
    icon: "heroicons:check-circle",
  },
  cancelled: {
    bg: "bg-red-500",
    text: "text-white",
    icon: "heroicons:x-circle",
  },
  rejected: {
    bg: "bg-red-600",
    text: "text-white",
    icon: "heroicons:x-circle",
  },
};

export const TIER_CONFIG: Record<TourTier, { bg: string; text: string }> = {
  standard: { bg: "bg-orange-50", text: "text-[#fa8b02]" },
  luxury: { bg: "bg-amber-50", text: "text-amber-700" },
  premium: { bg: "bg-purple-50", text: "text-purple-700" },
};

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  paid: "text-green-600",
  partial: "text-[#f54900]",
  unpaid: "text-red-600",
};

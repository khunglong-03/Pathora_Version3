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

export interface Booking {
  id: string;
  tourName: string;
  reference: string;
  tier: TourTier;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  location: string;
  duration: string;
  departure: string;
  guests: number;
  totalAmount: number;
  remainingAmount?: number;
  image: string;
}

/* ── Sample Data ───────────────────────────────────────────── */
export const SAMPLE_BOOKINGS: Booking[] = [
  {
    id: "1",
    tourName: "Bali Island Hopping Adventure",
    reference: "PATH-2026-001",
    tier: "standard",
    status: "confirmed",
    paymentStatus: "partial",
    paymentMethod: "qr_code",
    location: "Bali, Indonesia",
    duration: "5 Days",
    departure: "Mar 12",
    guests: 3,
    totalAmount: 2850,
    remainingAmount: 1425,
    image: "/assets/images/tours/bali.png",
  },
  {
    id: "2",
    tourName: "Singapore Urban Experience",
    reference: "PATH-2026-002",
    tier: "luxury",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "cash",
    location: "Singapore",
    duration: "4 Days",
    departure: "Feb 8",
    guests: 2,
    totalAmount: 3200,
    image: "/assets/images/tours/singapore.png",
  },
  {
    id: "3",
    tourName: "Phuket Beach Paradise",
    reference: "PATH-2026-003",
    tier: "standard",
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "qr_code",
    location: "Phuket, Thailand",
    duration: "5 Days",
    departure: "Apr 15",
    guests: 7,
    totalAmount: 4200,
    image: "/assets/images/tours/phuket.png",
  },
  {
    id: "4",
    tourName: "Tokyo Cultural Discovery",
    reference: "PATH-2026-004",
    tier: "premium",
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "qr_code",
    location: "Tokyo, Japan",
    duration: "7 Days",
    departure: "Mar 20",
    guests: 2,
    totalAmount: 5600,
    image: "/assets/images/tours/tokyo.png",
  },
  {
    id: "5",
    tourName: "Hanoi Heritage Tour",
    reference: "PATH-2025-045",
    tier: "standard",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "cash",
    location: "Hanoi, Vietnam",
    duration: "4 Days",
    departure: "Jan 5",
    guests: 1,
    totalAmount: 890,
    image: "/assets/images/tours/hanoi.png",
  },
  {
    id: "6",
    tourName: "Seoul Modern Culture",
    reference: "PATH-2026-005",
    tier: "premium",
    status: "cancelled",
    paymentStatus: "paid",
    paymentMethod: "qr_code",
    location: "Seoul, South Korea",
    duration: "6 Days",
    departure: "Feb 28",
    guests: 4,
    totalAmount: 4800,
    image: "/assets/images/tours/seoul.png",
  },
  {
    id: "7",
    tourName: "Da Nang Beach Retreat",
    reference: "PATH-2026-006",
    tier: "standard",
    status: "confirmed",
    paymentStatus: "partial",
    paymentMethod: "bank_transfer",
    location: "Da Nang, Vietnam",
    duration: "4 Days",
    departure: "Apr 20",
    guests: 2,
    totalAmount: 1600,
    remainingAmount: 1120,
    image: "/assets/images/tours/hanoi.png",
  },
  {
    id: "8",
    tourName: "Sapa Mountain Trekking",
    reference: "PATH-2026-007",
    tier: "standard",
    status: "pending_approval",
    paymentStatus: "unpaid",
    paymentMethod: "bank_transfer",
    location: "Sapa, Vietnam",
    duration: "3 Days",
    departure: "May 10",
    guests: 4,
    totalAmount: 2400,
    image: "/assets/images/tours/hanoi.png",
  },
  {
    id: "9",
    tourName: "Maldives Luxury Escape",
    reference: "PATH-2026-008",
    tier: "luxury",
    status: "approved",
    paymentStatus: "partial",
    paymentMethod: "bank_transfer",
    location: "Maldives",
    duration: "6 Days",
    departure: "Jun 5",
    guests: 2,
    totalAmount: 8500,
    remainingAmount: 4250,
    image: "/assets/images/tours/bali.png",
  },
  {
    id: "10",
    tourName: "Kyoto Cherry Blossom Special",
    reference: "PATH-2026-009",
    tier: "premium",
    status: "rejected",
    paymentStatus: "unpaid",
    paymentMethod: "qr_code",
    location: "Kyoto, Japan",
    duration: "5 Days",
    departure: "Apr 1",
    guests: 3,
    totalAmount: 6200,
    image: "/assets/images/tours/tokyo.png",
  },
];

/* ── Status config ─────────────────────────────────────────── */
export const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; icon: string; iconColor: string }
> = {
  confirmed: {
    bg: "bg-[#EDF3EC]",
    text: "text-[#346538]",
    icon: "heroicons:check-circle",
    iconColor: "text-[#346538]",
  },
  completed: {
    bg: "bg-[#E1F3FE]",
    text: "text-[#1F6C9F]",
    icon: "heroicons:check-circle",
    iconColor: "text-[#1F6C9F]",
  },
  paid: {
    bg: "bg-[#E1F3FE]",
    text: "text-[#1F6C9F]",
    icon: "heroicons:check-circle",
    iconColor: "text-[#1F6C9F]",
  },
  deposited: {
    bg: "bg-[#E1F3FE]",
    text: "text-[#1F6C9F]",
    icon: "heroicons:check-circle",
    iconColor: "text-[#1F6C9F]",
  },
  pending: {
    bg: "bg-[#FBF3DB]",
    text: "text-[#956400]",
    icon: "heroicons:clock",
    iconColor: "text-[#956400]",
  },
  pending_approval: {
    bg: "bg-[#FBF3DB]",
    text: "text-[#956400]",
    icon: "heroicons:clock",
    iconColor: "text-[#956400]",
  },
  pendingadjustment: {
    bg: "bg-[#FBF3DB]",
    text: "text-[#956400]",
    icon: "heroicons:clock",
    iconColor: "text-[#956400]",
  },
  approved: {
    bg: "bg-[#EDF3EC]",
    text: "text-[#346538]",
    icon: "heroicons:check-circle",
    iconColor: "text-[#346538]",
  },
  cancelled: {
    bg: "bg-[#FDEBEC]",
    text: "text-[#9F2F2D]",
    icon: "heroicons:x-circle",
    iconColor: "text-[#9F2F2D]",
  },
  rejected: {
    bg: "bg-[#FDEBEC]",
    text: "text-[#9F2F2D]",
    icon: "heroicons:x-circle",
    iconColor: "text-[#9F2F2D]",
  },
};

export const TIER_CONFIG: Record<TourTier, { bg: string; text: string }> = {
  standard: { bg: "bg-gray-100", text: "text-gray-700" },
  luxury: { bg: "bg-amber-50", text: "text-amber-700" },
  premium: { bg: "bg-purple-50", text: "text-purple-700" },
};

export type FilterKey = "all" | BookingStatus;

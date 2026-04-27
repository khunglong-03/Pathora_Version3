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
      "Experience the magic of Bali, Indonesia with our carefully curated package. This 5 days journey takes you through the most iconic landmarks and hidden gems, providing an unforgettable adventure with professional guides and comfortable accommodations.",
    highlights: [
      "Visit iconic temples like Uluwatu and Tanah Lot",
      "Experience the cultural heart of Ubud",
      "Relax on pristine white-sand beaches",
      "Professional English-speaking guide",
      "Premium coastal accommodation included",
      "All entrance fees covered",
    ],
    importantInfo: [
      "Please arrive at meeting point 15 minutes before departure",
      "Bring valid ID/passport for verification",
      "Cancellation must be made 48 hours in advance for full refund",
      "Contact us immediately if you need to reschedule",
    ],
  },
  "2": {
    id: "2",
    tourName: "Singapore Urban Experience",
    reference: "PATH-2026-002",
    tier: "luxury",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "cash",
    location: "Singapore",
    duration: "4 Days",
    bookingDate: "January 10, 2026",
    departureDate: "February 8, 2026",
    returnDate: "February 11, 2026",
    adults: 2,
    children: 0,
    pricePerPerson: 1600,
    totalAmount: 3200,
    paidAmount: 3200,
    remainingBalance: 0,
    image: "/assets/images/tours/singapore.jpg",
    description:
      "Discover the cutting-edge marvels of Singapore. This luxury escape includes stays at top-tier hotels, private transfers, and exclusive dining experiences overlooking Marina Bay.",
    highlights: [
      "Exclusive access to Marina Bay Sands SkyPark",
      "Private guided tour of Gardens by the Bay",
      "Fine dining experiences curated by Michelin chefs",
      "VIP airport transfers",
    ],
    importantInfo: [
      "Smart casual dress code required for included dinners",
      "Passports must be valid for at least 6 months",
    ],
  },
  "3": {
    id: "3",
    tourName: "Phuket Beach Paradise",
    reference: "PATH-2026-003",
    tier: "standard",
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "qr_code",
    location: "Phuket, Thailand",
    duration: "5 Days",
    bookingDate: "March 01, 2026",
    departureDate: "April 15, 2026",
    returnDate: "April 19, 2026",
    adults: 5,
    children: 2,
    pricePerPerson: 600,
    totalAmount: 4200,
    paidAmount: 4200,
    remainingBalance: 0,
    image: "/assets/images/tours/phuket.jpg",
    description:
      "Relax on the stunning beaches of Phuket. Includes island hopping to Phi Phi, snorkeling in crystal clear waters, and enjoying vibrant local night markets.",
    highlights: [
      "Full day speedboat tour to Phi Phi Islands",
      "Snorkeling equipment provided",
      "Beachfront resort accommodation",
      "Guided tour of Phuket Old Town",
    ],
    importantInfo: [
      "Sunscreen and swimwear are highly recommended",
      "Itinerary subject to change based on weather conditions",
    ],
  },
  "4": {
    id: "4",
    tourName: "Tokyo Cultural Discovery",
    reference: "PATH-2026-004",
    tier: "premium",
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "qr_code",
    location: "Tokyo, Japan",
    duration: "7 Days",
    bookingDate: "March 15, 2026",
    departureDate: "May 20, 2026",
    returnDate: "May 26, 2026",
    adults: 2,
    children: 0,
    pricePerPerson: 2800,
    totalAmount: 5600,
    paidAmount: 0,
    remainingBalance: 5600,
    image: "/assets/images/tours/tokyo.jpg",
    description:
      "A deep dive into Japan's bustling capital. From the neon-lit streets of Shinjuku to the serene temples of Asakusa, experience the perfect blend of tradition and hyper-modernity.",
    highlights: [
      "Traditional tea ceremony experience",
      "Tsukiji outer market sushi breakfast",
      "Guided tour of Meiji Shrine",
      "Bullet train day-trip to Mt. Fuji area",
    ],
    importantInfo: [
      "Comfortable walking shoes are essential",
      "Please respect local customs regarding photography in temples",
    ],
  },
  "5": {
    id: "5",
    tourName: "Hanoi Heritage Tour",
    reference: "PATH-2025-045",
    tier: "standard",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "cash",
    location: "Hanoi, Vietnam",
    duration: "4 Days",
    bookingDate: "December 10, 2025",
    departureDate: "January 5, 2026",
    returnDate: "January 8, 2026",
    adults: 1,
    children: 0,
    pricePerPerson: 890,
    totalAmount: 890,
    paidAmount: 890,
    remainingBalance: 0,
    image: "/assets/images/tours/hanoi.jpg",
    description:
      "Explore the 1000-year-old capital of Vietnam. Wander through the Old Quarter, savor world-famous street food, and learn about the city's rich history.",
    highlights: [
      "Cyclo tour of the Old Quarter",
      "Street food walking tour with local expert",
      "Water puppet show tickets included",
    ],
    importantInfo: [
      "Be cautious when crossing streets in the Old Quarter",
    ],
  },
  "6": {
    id: "6",
    tourName: "Seoul Modern Culture",
    reference: "PATH-2026-005",
    tier: "premium",
    status: "cancelled",
    paymentStatus: "paid",
    paymentMethod: "qr_code",
    location: "Seoul, South Korea",
    duration: "6 Days",
    bookingDate: "January 15, 2026",
    departureDate: "February 28, 2026",
    returnDate: "March 5, 2026",
    adults: 4,
    children: 0,
    pricePerPerson: 1200,
    totalAmount: 4800,
    paidAmount: 4800,
    remainingBalance: 0,
    image: "/assets/images/tours/seoul.jpg",
    description:
      "Experience the K-Wave directly at its source. Visit famous filming locations, shop in Myeongdong, and enjoy premium Korean BBQ.",
    highlights: [
      "Hanbok rental and palace entry",
      "K-Pop dance class",
      "Premium K-BBQ dining experience",
    ],
    importantInfo: [
      "Tour was cancelled by customer on February 10, 2026",
      "Refund has been processed",
    ],
  },
  "7": {
    id: "7",
    tourName: "Da Nang Beach Retreat",
    reference: "PATH-2026-006",
    tier: "standard",
    status: "confirmed",
    paymentStatus: "partial",
    paymentMethod: "bank_transfer",
    location: "Da Nang, Vietnam",
    duration: "4 Days",
    bookingDate: "April 01, 2026",
    departureDate: "April 20, 2026",
    returnDate: "April 23, 2026",
    adults: 2,
    children: 0,
    pricePerPerson: 800,
    totalAmount: 1600,
    paidAmount: 480,
    remainingBalance: 1120,
    image: "/assets/images/tours/hanoi.jpg",
    description:
      "A quick getaway to one of Vietnam's most livable cities. Enjoy the Golden Bridge at Ba Na Hills, relax on My Khe beach, and explore ancient Hoi An nearby.",
    highlights: [
      "Ba Na Hills day tour with cable car ticket",
      "Evening tour of Hoi An Ancient Town",
      "Seafood dinner by the beach",
    ],
    importantInfo: [
      "Please complete the remaining payment before April 15, 2026",
    ],
  },
};

/* ── Status config ─────────────────────────────────────────── */
export const STATUS_CONFIG: Record<
  BookingStatus,
  { bg: string; text: string }
> = {
  confirmed: { bg: "bg-emerald-500", text: "text-white" },
  completed: { bg: "bg-blue-500", text: "text-white" },
  pending: { bg: "bg-amber-500", text: "text-white" },
  pending_approval: { bg: "bg-orange-500", text: "text-white" },
  approved: { bg: "bg-emerald-500", text: "text-white" },
  cancelled: { bg: "bg-red-500", text: "text-white" },
  rejected: { bg: "bg-red-600", text: "text-white" },
};

export const TIER_CONFIG: Record<TourTier, { bg: string; text: string }> = {
  standard: { bg: "bg-slate-100", text: "text-slate-700" },
  luxury: { bg: "bg-amber-50", text: "text-amber-700" },
  premium: { bg: "bg-purple-50", text: "text-purple-700" },
};

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  paid: "text-emerald-600",
  partial: "text-orange-600",
  unpaid: "text-red-600",
};

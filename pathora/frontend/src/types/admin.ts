export interface AdminDashboardStats {
  totalRevenue: number;
  totalBookings: number;
  activeTours: number;
  totalCustomers: number;
  cancellationRate: number;
  visaApprovalRate: number;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  totalBookings: number;
  totalSpent: number;
  status: string;
  lastBooking: string;
}

export interface AdminPayment {
  id: string;
  booking: string;
  customer: string;
  method: string;
  amount: number;
  status: string;
  date: string;
}

export interface AdminInsurance {
  id: string;
  booking: string;
  customer: string;
  type: string;
  coverage: string;
  premium: number;
  status: string;
  startDate: string;
  endDate: string;
}

export interface AdminVisaApplication {
  id: string;
  booking: string;
  applicant: string;
  passport: string;
  country: string;
  type: string;
  status: string;
  submittedDate: string;
  decisionDate: string;
}

export interface AdminOverview {
  stats: AdminDashboardStats;
  customers: AdminCustomer[];
  payments: AdminPayment[];
  insurances: AdminInsurance[];
  visaApplications: AdminVisaApplication[];
}

export interface AdminDashboardMetricPoint {
  label: string;
  value: number;
}

export interface AdminDashboardCategoryMetric {
  label: string;
  value: number;
}

export interface AdminDashboardTopTour {
  name: string;
  bookings: number;
  revenue: number;
}

export interface AdminDashboardVisaStatus {
  label: string;
  count: number;
}

export interface AdminDashboardVisaDeadline {
  tour: string;
  date: string;
}

export interface AdminDashboardVisaSummary {
  totalApplications: number;
  approved: number;
  rejected: number;
  approvalRate: number;
}

export interface AdminDashboardAlert {
  text: string;
  severity: string;
}

// ─── Paginated list helper ───────────────────────────────────────
export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  roleCounts?: Record<string, number>;
  pendingCount?: number;
}

// ─── User Management ─────────────────────────────────────────────
export interface AdminUserListItem {
  id: string;
  username: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  verifyStatus: string;
  roles: string[];
  role?: string; // legacy, may be present for backwards compatibility
}

export interface AdminUserDetail {
  id: string;
  username: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: string; // UserStatus enum — "Active", "Inactive", "Suspended", "Banned"
  verifyStatus: string; // VerifyStatus enum
  roles: string[];
  recentBookings: BookingSummaryItem[];
}

export interface BookingSummaryItem {
  bookingId: string;
  tourName: string;
  totalAmount: number;
  createdOn: string;
  status: string;
}

// ─── Transport Provider ─────────────────────────────────────────
export interface TransportProviderListItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  bookingCount?: number;
  vehicleCount?: number;
  createdAt?: string;
  continents: string[];
}

// ─── Transport Provider Detail ──────────────────────────────────
export interface VehicleSummary {
  id: string;
  vehiclePlate: string;
  vehicleType: string;
  brand?: string;
  model?: string;
  seatCapacity: number;
  locationArea?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DriverSummary {
  id: string;
  fullName: string;
  licenseNumber: string;
  licenseType: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface TransportProviderDetail {
  id: string;
  supplierName: string;
  supplierCode: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  status: string;
  userCreatedAt?: string;
  vehicles: VehicleSummary[];
  drivers: DriverSummary[];
  bookingCount: number;
  activeBookingCount: number;
  completedBookingCount: number;
  continents: string[];
}

// ─── Hotel Provider ──────────────────────────────────────────────
export interface HotelProviderListItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  accommodationCount?: number;
  roomCount?: number;
  createdAt?: string;
  continents: string[];
}

export interface HotelAccommodationSummary {
  id: string;
  roomType: string;
  totalRooms: number;
  name: string | null;
  locationArea: string | null;
}

export interface HotelProviderDetail {
  id: string;
  supplierName: string;
  supplierCode: string;
  taxCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  status: string;
  createdOnUtc: string | null;
  accommodations: HotelAccommodationSummary[];
  accommodationCount: number;
  totalRooms: number;
  bookingCount: number;
  activeBookingCount: number;
  completedBookingCount: number;
  continents: string[];
}

// ─── TourManager Hierarchy ───────────────────────────────────────
export interface TourManagerStaffDto {
  manager: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  staff: StaffMemberDto[];
}

export interface StaffTourAssignment {
  tourInstanceId: string;
  tourName: string;
  tourInstanceCode: string;
  startDate: string;
  endDate: string;
  instanceStatus: string;
  roleInInstance: string;
}

export interface StaffMemberDto {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  roleInTeam: string;
  status: string;
  activeTours: StaffTourAssignment[];
}

export interface ManagerSummaryDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  designerCount?: number;
  guideCount?: number;
  tourCount?: number;
  status?: string;
}

// ─── Admin Dashboard ─────────────────────────────────────────────
export interface AdminDashboardOverview {
  totalUsers: number;
  activeUsers: number;
  totalManagers: number;
  totalTourDesigners: number;
  totalTourGuides: number;
  totalTransportProviders: number;
  activeTransportProviders: number;
  transportBookingCount: number;
  totalHotelProviders: number;
  activeHotelProviders: number;
  hotelRoomCount: number;
  recentActivities: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target?: string;
  timestamp: string;
  type?: string; // e.g. "booking", "user", "tour"
}

export interface AdminDashboard {
  stats: AdminDashboardStats;
  revenueOverTime: AdminDashboardMetricPoint[];
  revenueByTourType: AdminDashboardCategoryMetric[];
  revenueByRegion: AdminDashboardCategoryMetric[];
  bookingStatusDistribution: AdminDashboardCategoryMetric[];
  bookingTrend: AdminDashboardMetricPoint[];
  topTours: AdminDashboardTopTour[];
  topDestinations: AdminDashboardCategoryMetric[];
  customerGrowth: AdminDashboardMetricPoint[];
  customerNationalities: AdminDashboardCategoryMetric[];
  visaStatuses: AdminDashboardVisaStatus[];
  upcomingVisaDeadlines: AdminDashboardVisaDeadline[];
  visaSummary: AdminDashboardVisaSummary;
  alerts: AdminDashboardAlert[];
}

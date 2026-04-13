// Manager-specific data types
// Mirrors backend Domain.Reports.ManagerDashboardReport

export interface ManagerDashboardStats {
  totalTours: number;
  totalTourInstances: number;
  activeTourInstances: number;
  totalBookings: number;
  upcomingDepartures: number;
  totalStaff: number;
}

export interface ManagerCategoryMetric {
  label: string;
  value: number;
}

export interface ManagerMetricPoint {
  label: string;
  value: number;
}

export interface ManagerTopTour {
  name: string;
  bookings: number;
  revenue: number;
}

export interface ManagerUpcomingDeparture {
  tourInstanceId: string;
  title: string;
  startDate: string;
  currentParticipation: number;
  maxParticipation: number;
  status: string;
}

export interface ManagerRecentBooking {
  bookingId: string;
  customerName: string;
  tourName: string;
  amount: number;
  status: string;
  bookingDate: string;
}

export interface ManagerStaffMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  tourCount: number;
}

export interface ManagerDashboardReport {
  stats: ManagerDashboardStats;
  tourInstancesByStatus: ManagerCategoryMetric[];
  bookingTrend: ManagerMetricPoint[];
  bookingStatusDistribution: ManagerCategoryMetric[];
  topTours: ManagerTopTour[];
  upcomingDepartures: ManagerUpcomingDeparture[];
  recentBookings: ManagerRecentBooking[];
  staff: ManagerStaffMember[];
}

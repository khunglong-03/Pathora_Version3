export interface TransportOption {
  id: string;
  providerName: string;
  vehicleType: string;
  capacity: number;
  availableSeats: number;
  pricePerSeat: number;
  departureTime: string;
  arrivalTime: string;
  status: "available" | "holding" | "booked";
  rating: number;
}

export const SAMPLE_TRANSPORT_OPTIONS: TransportOption[] = [
  {
    id: "TRN-001",
    providerName: "Luxury Lines Bus Co.",
    vehicleType: "45-Seat Premium Coach",
    capacity: 45,
    availableSeats: 40,
    pricePerSeat: 500000,
    departureTime: "08:00 AM",
    arrivalTime: "02:00 PM",
    status: "available",
    rating: 4.8,
  },
  {
    id: "TRN-002",
    providerName: "Express Transit",
    vehicleType: "29-Seat Minibus",
    capacity: 29,
    availableSeats: 12,
    pricePerSeat: 400000,
    departureTime: "09:30 AM",
    arrivalTime: "03:00 PM",
    status: "holding",
    rating: 4.5,
  },
  {
    id: "TRN-003",
    providerName: "SkyHigh Airlines",
    vehicleType: "Commercial Flight (Economy)",
    capacity: 180,
    availableSeats: 55,
    pricePerSeat: 1500000,
    departureTime: "11:00 AM",
    arrivalTime: "12:15 PM",
    status: "available",
    rating: 4.9,
  },
];

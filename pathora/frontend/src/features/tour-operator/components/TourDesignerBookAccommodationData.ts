export interface AccommodationOption {
  id: string;
  hotelName: string;
  starRating: number;
  location: string;
  roomType: string;
  capacityPerRoom: number;
  availableRooms: number;
  pricePerNight: number;
  status: "available" | "holding" | "booked";
  features: string[];
}

export const SAMPLE_ACCOMMODATION_OPTIONS: AccommodationOption[] = [
  {
    id: "ACC-001",
    hotelName: "Grand Plaza Resort",
    starRating: 5,
    location: "City Center",
    roomType: "Deluxe Double",
    capacityPerRoom: 2,
    availableRooms: 15,
    pricePerNight: 2500000,
    status: "available",
    features: ["Pool", "Breakfast Included", "Ocean View"],
  },
  {
    id: "ACC-002",
    hotelName: "Cozy Boutique Hotel",
    starRating: 4,
    location: "Old Quarter",
    roomType: "Standard Twin",
    capacityPerRoom: 2,
    availableRooms: 5,
    pricePerNight: 1200000,
    status: "holding",
    features: ["Free WiFi", "City View"],
  },
  {
    id: "ACC-003",
    hotelName: "Riverside Lodge",
    starRating: 3,
    location: "Suburbs",
    roomType: "Family Suite",
    capacityPerRoom: 4,
    availableRooms: 2,
    pricePerNight: 1800000,
    status: "available",
    features: ["Kitchenette", "Free Parking"],
  },
];

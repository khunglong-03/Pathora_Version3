export interface ServiceOption {
  id: string;
  serviceType: "Guide" | "Photography" | "Insurance" | "Meals";
  providerName: string;
  description: string;
  pricePerUnit: number;
  unit: "per person" | "per group" | "per day";
  status: "available" | "assigned";
  rating: number;
}

export const SAMPLE_SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: "SRV-001",
    serviceType: "Guide",
    providerName: "Local Experts Team",
    description: "English-speaking certified local guide with 5+ years experience.",
    pricePerUnit: 1000000,
    unit: "per day",
    status: "available",
    rating: 4.9,
  },
  {
    id: "SRV-002",
    serviceType: "Photography",
    providerName: "CaptureMoments Studio",
    description: "Professional photographer accompanying the group for key locations.",
    pricePerUnit: 3500000,
    unit: "per group",
    status: "assigned",
    rating: 4.7,
  },
  {
    id: "SRV-003",
    serviceType: "Insurance",
    providerName: "SafeTravel Insure",
    description: "Comprehensive travel insurance covering medical and delays.",
    pricePerUnit: 250000,
    unit: "per person",
    status: "available",
    rating: 4.8,
  },
];

export interface Guest {
  id: string;
  bookingRef: string;
  fullName: string;
  passportNumber: string;
  dietaryRequirements: string;
  status: "pending" | "checked-in" | "checked-out";
}

export const SAMPLE_GUESTS: Guest[] = [
  {
    id: "GST-001",
    bookingRef: "BKG-2023-001",
    fullName: "John Doe",
    passportNumber: "P1234567",
    dietaryRequirements: "None",
    status: "checked-in",
  },
  {
    id: "GST-002",
    bookingRef: "BKG-2023-001",
    fullName: "Jane Doe",
    passportNumber: "P7654321",
    dietaryRequirements: "Vegetarian",
    status: "pending",
  },
  {
    id: "GST-003",
    bookingRef: "BKG-2023-002",
    fullName: "Michael Smith",
    passportNumber: "P9988776",
    dietaryRequirements: "Gluten-free",
    status: "pending",
  },
  {
    id: "GST-004",
    bookingRef: "BKG-2023-003",
    fullName: "Emily Johnson",
    passportNumber: "P5544332",
    dietaryRequirements: "None",
    status: "checked-in",
  },
];

import { TOUR_REQUEST_TRAVEL_INTERESTS, type TourRequestTravelInterest } from "@/types/tourRequest";

export type FormValues = {
  destination: string;
  startDate: string;
  endDate: string;
  numberOfParticipants: number;
  budgetPerPersonUsd: number | undefined;
  travelInterests: TourRequestTravelInterest[];
  preferredAccommodation: string;
  transportationPreference: string;
  specialRequests: string;
};

export const TRAVEL_INTEREST_LABEL_KEYS: Record<TourRequestTravelInterest, string> = {
  Adventure: "tourRequest.travelInterests.adventure",
  CultureAndHistory: "tourRequest.travelInterests.cultureAndHistory",
  NatureAndWildlife: "tourRequest.travelInterests.natureAndWildlife",
  FoodAndCulinary: "tourRequest.travelInterests.foodAndCulinary",
  RelaxationAndWellness: "tourRequest.travelInterests.relaxationAndWellness",
};

export const DEFAULT_VALUES: FormValues = {
  destination: "",
  startDate: "",
  endDate: "",
  numberOfParticipants: 1,
  budgetPerPersonUsd: undefined,
  travelInterests: [],
  preferredAccommodation: "",
  transportationPreference: "",
  specialRequests: "",
};

export { TOUR_REQUEST_TRAVEL_INTERESTS };

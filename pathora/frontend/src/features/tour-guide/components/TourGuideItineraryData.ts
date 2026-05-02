export interface ItineraryActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  type: "transport" | "activity" | "meal" | "accommodation";
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  title: string;
  activities: ItineraryActivity[];
}

export const SAMPLE_ITINERARY: ItineraryDay[] = [
  {
    dayNumber: 1,
    date: "Oct 15, 2026",
    title: "Arrival & City Tour",
    activities: [
      {
        id: "ACT-101",
        time: "08:00 AM",
        title: "Airport Pickup",
        description: "Meet the group at Terminal 2 Arrival Hall.",
        location: "Noi Bai International Airport",
        type: "transport",
      },
      {
        id: "ACT-102",
        time: "10:00 AM",
        title: "Check-in Hotel",
        description: "Group check-in and welcome drinks.",
        location: "Grand Plaza Resort",
        type: "accommodation",
      },
      {
        id: "ACT-103",
        time: "12:30 PM",
        title: "Welcome Lunch",
        description: "Traditional Vietnamese Pho.",
        location: "Pho Thin 13 Lo Duc",
        type: "meal",
      },
      {
        id: "ACT-104",
        time: "02:00 PM",
        title: "Temple of Literature",
        description: "Guided tour of the first national university of Vietnam.",
        location: "Temple of Literature",
        type: "activity",
      },
    ],
  },
  {
    dayNumber: 2,
    date: "Oct 16, 2026",
    title: "Halong Bay Cruise",
    activities: [
      {
        id: "ACT-201",
        time: "08:00 AM",
        title: "Bus to Halong Bay",
        description: "Luxury 45-seat coach.",
        location: "Grand Plaza Resort Lobby",
        type: "transport",
      },
      {
        id: "ACT-202",
        time: "11:30 AM",
        title: "Boarding Cruise",
        description: "Safety briefing and cabin allocation.",
        location: "Tuan Chau Marina",
        type: "activity",
      },
    ],
  },
];

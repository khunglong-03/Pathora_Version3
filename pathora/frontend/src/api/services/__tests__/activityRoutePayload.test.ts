import { describe, expect, it } from "vitest";
import { buildTourFormData } from "../tourCreatePayload";

// Helper: minimal required inputs for buildTourFormData
const minimalInputs = () => ({
  basicInfo: {
    tourName: "Tour",
    shortDescription: "Short",
    longDescription: "Long",
    seoTitle: "",
    seoDescription: "",
    status: "1",
    tourScope: "1",
    customerSegment: "1",
  },
  thumbnail: null,
  images: [],
  vietnameseTranslation: {
    tourName: "",
    shortDescription: "",
    longDescription: "",
    seoTitle: "",
    seoDescription: "",
  },
  englishTranslation: {
    tourName: "",
    shortDescription: "",
    longDescription: "",
    seoTitle: "",
    seoDescription: "",
  },
  classifications: [
    {
      name: "Standard",
      enName: "",
      description: "Desc VI",
      enDescription: "",
      basePrice: "1000",
      durationDays: "1",
    },
  ],
  dayPlans: [[]],
  insurances: [[]],
  accommodations: [],
  locations: [],
  transportations: [],
});

describe("activity route payload", () => {
  describe("activity with routes containing location references", () => {
    // TC-FE-R01: Route with location index references maps correctly
    it("maps activity route with location index references into payload", () => {
      const inputs = minimalInputs();
      inputs.locations = [
        {
          locationName: "Hanoi",
          enLocationName: "Hanoi EN",
          type: "City",
          enType: "",
          description: "Capital",
          enDescription: "",
          city: "Hanoi",
          enCity: "",
          country: "Vietnam",
          enCountry: "",
          entranceFee: "",
          address: "Hanoi",
          enAddress: "",
        },
        {
          locationName: "Ha Long",
          enLocationName: "Ha Long EN",
          type: "Bay",
          enType: "",
          description: "Wonder",
          enDescription: "",
          city: "Quang Ninh",
          enCity: "",
          country: "Vietnam",
          enCountry: "",
          entranceFee: "",
          address: "Ha Long",
          enAddress: "",
        },
      ];
      inputs.dayPlans = [
        [
          {
            dayNumber: "1",
            title: "Day 1",
            enTitle: "",
            description: "Day 1 desc",
            enDescription: "",
            activities: [
              {
                activityType: "0",
                title: "Transfer",
                enTitle: "",
                description: "Transfer desc",
                enDescription: "",
                note: "",
                enNote: "",
                estimatedCost: "50",
                isOptional: false,
                startTime: "08:00",
                endTime: "12:00",
                routes: [
                  {
                    id: "route-1",
                    fromLocationIndex: "0",
                    fromLocationCustom: "",
                    enFromLocationCustom: "",
                    toLocationIndex: "1",
                    toLocationCustom: "",
                    enToLocationCustom: "",
                    transportationType: "2",
                    enTransportationType: "",
                    transportationName: "Bus",
                    enTransportationName: "Bus EN",
                    durationMinutes: "240",
                    price: "30",
                    note: "AC bus",
                    enNote: "AC bus EN",
                  },
                ],
              },
            ],
          },
        ],
      ];

      const formData = buildTourFormData(inputs);
      const classifications = JSON.parse(String(formData.get("classifications")));
      const routes = classifications[0].plans[0].activities[0].routes;

      expect(routes).toHaveLength(1);
      expect(routes[0].fromLocationIndex).toBe(0);
      expect(routes[0].toLocationIndex).toBe(1);
      expect(routes[0].transportationType).toBe("2");
      expect(routes[0].transportationName).toBe("Bus");
      expect(routes[0].durationMinutes).toBe(240);
      expect(routes[0].price).toBe(30);
      expect(routes[0].note).toBe("AC bus");
    });

    // TC-FE-R02: Route with custom location maps custom text
    it("maps route with custom location text into payload", () => {
      const inputs = minimalInputs();
      inputs.dayPlans = [
        [
          {
            dayNumber: "1",
            title: "Day 1",
            enTitle: "",
            description: "Desc",
            enDescription: "",
            activities: [
              {
                activityType: "0",
                title: "Walk",
                enTitle: "",
                description: "Walking",
                enDescription: "",
                note: "",
                enNote: "",
                estimatedCost: "",
                isOptional: false,
                startTime: "10:00",
                endTime: "11:00",
                routes: [
                  {
                    id: "route-2",
                    fromLocationIndex: "",
                    fromLocationCustom: "Hotel Lobby",
                    enFromLocationCustom: "Hotel Lobby EN",
                    toLocationIndex: "",
                    toLocationCustom: "Old Town Gate",
                    enToLocationCustom: "Old Town Gate EN",
                    transportationType: "9",
                    enTransportationType: "",
                    transportationName: "Walking",
                    enTransportationName: "",
                    durationMinutes: "30",
                    price: "0",
                    note: "Guided walk",
                    enNote: "",
                  },
                ],
              },
            ],
          },
        ],
      ];

      const formData = buildTourFormData(inputs);
      const classifications = JSON.parse(String(formData.get("classifications")));
      const routes = classifications[0].plans[0].activities[0].routes;

      expect(routes).toHaveLength(1);
      expect(routes[0].fromLocationIndex).toBeNull();
      expect(routes[0].fromLocationCustom).toBe("Hotel Lobby");
      expect(routes[0].toLocationIndex).toBeNull();
      expect(routes[0].toLocationCustom).toBe("Old Town Gate");
      expect(routes[0].transportationType).toBe("9");
      expect(routes[0].transportationName).toBe("Walking");
      expect(routes[0].durationMinutes).toBe(30);
      expect(routes[0].price).toBe(0);
      expect(routes[0].note).toBe("Guided walk");
    });

    // TC-FE-R03: Activity without routes produces empty routes array
    it("sets routes to empty array when no routes are defined", () => {
      const inputs = minimalInputs();
      inputs.dayPlans = [
        [
          {
            dayNumber: "1",
            title: "Day 1",
            enTitle: "",
            description: "Desc",
            enDescription: "",
            activities: [
              {
                activityType: "0",
                title: "Sightsee",
                enTitle: "",
                description: "Atraction",
                enDescription: "",
                note: "",
                enNote: "",
                estimatedCost: "",
                isOptional: false,
                startTime: "",
                endTime: "",
                routes: [],
              },
            ],
          },
        ],
      ];

      const formData = buildTourFormData(inputs);
      const classifications = JSON.parse(String(formData.get("classifications")));
      const routes = classifications[0].plans[0].activities[0].routes;

      expect(routes).toHaveLength(0);
    });

    // TC-FE-R04: Multiple routes in single activity
    it("maps multiple routes in a single activity", () => {
      const inputs = minimalInputs();
      inputs.dayPlans = [
        [
          {
            dayNumber: "1",
            title: "Day 1",
            enTitle: "",
            description: "Desc",
            enDescription: "",
            activities: [
              {
                activityType: "0",
                title: "Multi-leg",
                enTitle: "",
                description: "Multi",
                enDescription: "",
                note: "",
                enNote: "",
                estimatedCost: "",
                isOptional: false,
                startTime: "",
                endTime: "",
                routes: [
                  {
                    id: "r1",
                    fromLocationIndex: "0",
                    fromLocationCustom: "",
                    enFromLocationCustom: "",
                    toLocationIndex: "1",
                    toLocationCustom: "",
                    enToLocationCustom: "",
                    transportationType: "2",
                    enTransportationType: "",
                    transportationName: "Bus",
                    enTransportationName: "",
                    durationMinutes: "60",
                    price: "10",
                    note: "",
                    enNote: "",
                  },
                  {
                    id: "r2",
                    fromLocationIndex: "1",
                    fromLocationCustom: "",
                    enFromLocationCustom: "",
                    toLocationIndex: "2",
                    toLocationCustom: "",
                    enToLocationCustom: "",
                    transportationType: "5",
                    enTransportationType: "",
                    transportationName: "Boat",
                    enTransportationName: "",
                    durationMinutes: "45",
                    price: "20",
                    note: "",
                    enNote: "",
                  },
                ],
              },
            ],
          },
        ],
      ];

      const formData = buildTourFormData(inputs);
      const classifications = JSON.parse(String(formData.get("classifications")));
      const routes = classifications[0].plans[0].activities[0].routes;

      expect(routes).toHaveLength(2);
      expect(routes[0].fromLocationIndex).toBe(0);
      expect(routes[0].toLocationIndex).toBe(1);
      expect(routes[1].fromLocationIndex).toBe(1);
      expect(routes[1].toLocationIndex).toBe(2);
    });

    // TC-FE-R05: Route bilingual note maps into translations
    it("maps route bilingual note into activity translations", () => {
      const inputs = minimalInputs();
      inputs.dayPlans = [
        [
          {
            dayNumber: "1",
            title: "Day 1",
            enTitle: "Day 1 EN",
            description: "Desc VI",
            enDescription: "Desc EN",
            activities: [
              {
                activityType: "0",
                title: "Act VI",
                enTitle: "Act EN",
                description: "Desc VI",
                enDescription: "Desc EN",
                note: "Note VI",
                enNote: "Note EN",
                estimatedCost: "",
                isOptional: false,
                startTime: "",
                endTime: "",
                routes: [
                  {
                    id: "r1",
                    fromLocationIndex: "",
                    fromLocationCustom: "From VI",
                    enFromLocationCustom: "From EN",
                    toLocationIndex: "",
                    toLocationCustom: "To VI",
                    enToLocationCustom: "To EN",
                    transportationType: "0",
                    enTransportationType: "",
                    transportationName: "Name VI",
                    enTransportationName: "Name EN",
                    durationMinutes: "30",
                    price: "0",
                    note: "Route Note VI",
                    enNote: "Route Note EN",
                  },
                ],
              },
            ],
          },
        ],
      ];

      const formData = buildTourFormData(inputs);
      const classifications = JSON.parse(String(formData.get("classifications")));
      const translations = classifications[0].plans[0].activities[0].translations;

      expect(translations.vi.note).toBe("Note VI");
      expect(translations.en.note).toBe("Note EN");
    });
  });
});

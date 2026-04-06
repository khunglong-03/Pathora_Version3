import { describe, expect, it } from "vitest";

import { buildTourFormData, buildServicesPayload } from "../tourCreatePayload";

describe("buildTourFormData", () => {
  // =========================================================================
  // Helper function edge cases
  // =========================================================================

  describe("base price parsing", () => {
    // TC-FE06: basePrice is mapped directly to payload basePrice
    it("maps classification basePrice into payload", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
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
            durationDays: "3",
          },
        ],
        dayPlans: [[]],
        insurances: [[]],
      });

      const classifications = JSON.parse(String(formData.get("classifications")));
      expect(classifications[0].basePrice).toBe(1000);
      expect(classifications[0].adultPrice).toBeUndefined();
      expect(classifications[0].childPrice).toBeUndefined();
      expect(classifications[0].infantPrice).toBeUndefined();
    });

    // TC-FE07: NumberOfDay must be at least 1
    it("defaults NumberOfDay to 1 when less than 1", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
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
            description: "",
            enDescription: "",
            basePrice: "500",
            durationDays: "0",
          },
        ],
        dayPlans: [[]],
        insurances: [[]],
      });

      const classifications = JSON.parse(String(formData.get("classifications")));
      expect(classifications[0].numberOfDay).toBe(1);
      expect(classifications[0].numberOfNight).toBe(0);
    });

    // TC-FE08: NumberOfNight equals NumberOfDay - 1
    it("calculates NumberOfNight as NumberOfDay minus 1", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
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
            description: "",
            enDescription: "",
            basePrice: "1000",
            durationDays: "5",
          },
        ],
        dayPlans: [[]],
        insurances: [[]],
      });

      const classifications = JSON.parse(String(formData.get("classifications")));
      expect(classifications[0].numberOfDay).toBe(5);
      expect(classifications[0].numberOfNight).toBe(4);
    });
  });

  // =========================================================================
  // Policy IDs
  // =========================================================================

  describe("policy IDs are appended when provided", () => {
    // TC-FE09: All four policy IDs appended to FormData
    it("appends all four policy IDs when provided", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
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
        classifications: [],
        dayPlans: [],
        insurances: [],
        selectedPricingPolicyId: "policy-pricing-1",
        selectedDepositPolicyId: "policy-deposit-1",
        selectedCancellationPolicyId: "policy-cancel-1",
        selectedVisaPolicyId: "policy-visa-1",
      });

      expect(formData.get("pricingPolicyId")).toBe("policy-pricing-1");
      expect(formData.get("depositPolicyId")).toBe("policy-deposit-1");
      expect(formData.get("cancellationPolicyId")).toBe("policy-cancel-1");
      expect(formData.get("visaPolicyId")).toBe("policy-visa-1");
    });

    // TC-FE10: Policy IDs omitted when not provided
    it("omits policy IDs from FormData when not provided", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
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
        classifications: [],
        dayPlans: [],
        insurances: [],
      });

      expect(formData.get("pricingPolicyId")).toBeNull();
      expect(formData.get("depositPolicyId")).toBeNull();
      expect(formData.get("cancellationPolicyId")).toBeNull();
      expect(formData.get("visaPolicyId")).toBeNull();
    });
  });

  // =========================================================================
  // Empty classifications
  // =========================================================================

  describe("empty classifications handling", () => {
    // TC-FE11: Empty classifications array omits classifications field
    it("omits classifications field when array is empty", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
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
        classifications: [],
        dayPlans: [],
        insurances: [],
      });

      expect(formData.get("classifications")).toBeNull();
    });

    // TC-FE12: Basic fields always appended as strings
    it("appends all basic string fields to FormData", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "My Tour",
          shortDescription: "Short desc",
          longDescription: "Long desc here",
          seoTitle: "SEO Title",
          seoDescription: "SEO Desc",
          status: "2",
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
        classifications: [],
        dayPlans: [],
        insurances: [],
      });

      expect(formData.get("tourName")).toBe("My Tour");
      expect(formData.get("shortDescription")).toBe("Short desc");
      expect(formData.get("longDescription")).toBe("Long desc here");
      expect(formData.get("seoTitle")).toBe("SEO Title");
      expect(formData.get("seoDescription")).toBe("SEO Desc");
      expect(formData.get("status")).toBe("2");
    });

    // TC-FE13: Images appended as individual files
    it("appends multiple images as separate fields", () => {
      const file1 = new File(["content1"], "img1.jpg", { type: "image/jpeg" });
      const file2 = new File(["content2"], "img2.jpg", { type: "image/jpeg" });

      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
        },
        thumbnail: null,
        images: [file1, file2],
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
        classifications: [],
        dayPlans: [],
        insurances: [],
      });

      const imageCount = formData.getAll("images").length;
      expect(imageCount).toBe(2);
    });
  });

  // =========================================================================
  // Activity-extracted locations and accommodations
  // =========================================================================

  describe("activity-extracted locations and accommodations", () => {
    it("extracts location from activity (type 0) into classification locations", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
        },
        thumbnail: null,
        images: [],
        vietnameseTranslation: {
          tourName: "", shortDescription: "", longDescription: "", seoTitle: "", seoDescription: "",
        },
        englishTranslation: {
          tourName: "", shortDescription: "", longDescription: "", seoTitle: "", seoDescription: "",
        },
        classifications: [
          {
            name: "Standard",
            enName: "",
            description: "",
            enDescription: "",
            basePrice: "1000",
            durationDays: "1",
          },
        ],
        dayPlans: [[{
          dayNumber: "1",
          title: "Day 1",
          enTitle: "",
          description: "",
          enDescription: "",
          activities: [{
            activityType: "0",
            title: "Visit Museum",
            enTitle: "",
            description: "",
            enDescription: "",
            note: "",
            enNote: "",
            estimatedCost: "",
            isOptional: false,
            startTime: "",
            endTime: "",
            routes: [],
            // Activity location fields
            locationName: "Hanoi Museum",
            enLocationName: "",
            locationCity: "Hanoi",
            enLocationCity: "",
            locationCountry: "Vietnam",
            enLocationCountry: "",
            locationAddress: "01 Phan Boi Chau",
            enLocationAddress: "",
            locationEntranceFee: "50",
            // Transportation fields (type 7)
            fromLocation: "", enFromLocation: "",
            toLocation: "", enToLocation: "",
            transportationType: "", enTransportationType: "",
            transportationName: "", enTransportationName: "",
            durationMinutes: "", price: "",
            // Accommodation fields (type 8)
            accommodationName: "", enAccommodationName: "",
            accommodationAddress: "", enAccommodationAddress: "",
            accommodationPhone: "", checkInTime: "", checkOutTime: "",
          }],
        }]],
        insurances: [[]],
      });

      const classifications = JSON.parse(String(formData.get("classifications")));
      expect(classifications[0].locations).toHaveLength(1);
      expect(classifications[0].locations[0].locationName).toBe("Hanoi Museum");
      expect(classifications[0].locations[0].city).toBe("Hanoi");
    });

    it("extracts accommodation from activity (type 8) into classification accommodations", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
        },
        thumbnail: null,
        images: [],
        vietnameseTranslation: {
          tourName: "", shortDescription: "", longDescription: "", seoTitle: "", seoDescription: "",
        },
        englishTranslation: {
          tourName: "", shortDescription: "", longDescription: "", seoTitle: "", seoDescription: "",
        },
        classifications: [
          {
            name: "Standard",
            enName: "",
            description: "",
            enDescription: "",
            basePrice: "1000",
            durationDays: "1",
          },
        ],
        dayPlans: [[{
          dayNumber: "1",
          title: "Day 1",
          enTitle: "",
          description: "",
          enDescription: "",
          activities: [{
            activityType: "8",
            title: "Hotel Check-in",
            enTitle: "",
            description: "",
            enDescription: "",
            note: "",
            enNote: "",
            estimatedCost: "",
            isOptional: false,
            startTime: "",
            endTime: "",
            routes: [],
            // Activity location fields
            locationName: "", enLocationName: "",
            locationCity: "", enLocationCity: "",
            locationCountry: "", enLocationCountry: "",
            locationAddress: "", enLocationAddress: "",
            locationEntranceFee: "",
            // Transportation fields (type 7)
            fromLocation: "", enFromLocation: "",
            toLocation: "", enToLocation: "",
            transportationType: "", enTransportationType: "",
            transportationName: "", enTransportationName: "",
            durationMinutes: "", price: "",
            // Accommodation fields (type 8)
            accommodationName: "Hotel Paradise",
            enAccommodationName: "",
            accommodationAddress: "123 Main St",
            enAccommodationAddress: "",
            accommodationPhone: "0909123456",
            checkInTime: "14:00",
            checkOutTime: "12:00",
          }],
        }]],
        insurances: [[]],
      });

      const classifications = JSON.parse(String(formData.get("classifications")));
      expect(classifications[0].accommodations).toHaveLength(1);
      expect(classifications[0].accommodations[0].accommodationName).toBe("Hotel Paradise");
      expect(classifications[0].accommodations[0].checkInTime).toBe("14:00");
    });

    it("deduplicates locations by name across multiple activities", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
        },
        thumbnail: null,
        images: [],
        vietnameseTranslation: {
          tourName: "", shortDescription: "", longDescription: "", seoTitle: "", seoDescription: "",
        },
        englishTranslation: {
          tourName: "", shortDescription: "", longDescription: "", seoTitle: "", seoDescription: "",
        },
        classifications: [
          {
            name: "Standard",
            enName: "",
            description: "",
            enDescription: "",
            basePrice: "1000",
            durationDays: "2",
          },
        ],
        dayPlans: [[{
          dayNumber: "1",
          title: "Day 1",
          enTitle: "",
          description: "",
          enDescription: "",
          activities: [{
            activityType: "0",
            title: "Visit Museum",
            enTitle: "",
            description: "",
            enDescription: "",
            note: "",
            enNote: "",
            estimatedCost: "",
            isOptional: false,
            startTime: "",
            endTime: "",
            routes: [],
            locationName: "Hanoi Museum",
            enLocationName: "",
            locationCity: "Hanoi",
            enLocationCity: "",
            locationCountry: "Vietnam",
            enLocationCountry: "",
            locationAddress: "",
            enLocationAddress: "",
            locationEntranceFee: "",
            fromLocation: "", enFromLocation: "",
            toLocation: "", enToLocation: "",
            transportationType: "", enTransportationType: "",
            transportationName: "", enTransportationName: "",
            durationMinutes: "", price: "",
            accommodationName: "", enAccommodationName: "",
            accommodationAddress: "", enAccommodationAddress: "",
            accommodationPhone: "", checkInTime: "", checkOutTime: "",
          }, {
            activityType: "0",
            title: "Back to Museum",
            enTitle: "",
            description: "",
            enDescription: "",
            note: "",
            enNote: "",
            estimatedCost: "",
            isOptional: false,
            startTime: "",
            endTime: "",
            routes: [],
            locationName: "Hanoi Museum", // duplicate name
            enLocationName: "",
            locationCity: "Hanoi",
            enLocationCity: "",
            locationCountry: "Vietnam",
            enLocationCountry: "",
            locationAddress: "",
            enLocationAddress: "",
            locationEntranceFee: "",
            fromLocation: "", enFromLocation: "",
            toLocation: "", enToLocation: "",
            transportationType: "", enTransportationType: "",
            transportationName: "", enTransportationName: "",
            durationMinutes: "", price: "",
            accommodationName: "", enAccommodationName: "",
            accommodationAddress: "", enAccommodationAddress: "",
            accommodationPhone: "", checkInTime: "", checkOutTime: "",
          }],
        }]],
        insurances: [[]],
      });

      const classifications = JSON.parse(String(formData.get("classifications")));
      // Should deduplicate — only one "Hanoi Museum" entry
      expect(classifications[0].locations).toHaveLength(1);
    });

    it("sends activity type-7 transportation fields in the payload", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
        },
        thumbnail: null,
        images: [],
        vietnameseTranslation: {
          tourName: "", shortDescription: "", longDescription: "", seoTitle: "", seoDescription: "",
        },
        englishTranslation: {
          tourName: "", shortDescription: "", longDescription: "", seoTitle: "", seoDescription: "",
        },
        classifications: [
          {
            name: "Standard",
            enName: "",
            description: "",
            enDescription: "",
            basePrice: "1000",
            durationDays: "1",
          },
        ],
        dayPlans: [[{
          dayNumber: "1",
          title: "Day 1",
          enTitle: "",
          description: "",
          enDescription: "",
          activities: [{
            activityType: "7",
            title: "Transfer",
            enTitle: "",
            description: "",
            enDescription: "",
            note: "",
            enNote: "",
            estimatedCost: "",
            isOptional: false,
            startTime: "",
            endTime: "",
            routes: [],
            locationName: "",
            enLocationName: "",
            locationCity: "",
            enLocationCity: "",
            locationCountry: "",
            enLocationCountry: "",
            locationAddress: "",
            enLocationAddress: "",
            locationEntranceFee: "",
            fromLocation: "Hanoi",
            enFromLocation: "",
            toLocation: "Hai Phong",
            enToLocation: "",
            transportationType: "1",
            enTransportationType: "",
            transportationName: "Train",
            enTransportationName: "",
            durationMinutes: "120",
            price: "50",
            accommodationName: "",
            enAccommodationName: "",
            accommodationAddress: "",
            enAccommodationAddress: "",
            accommodationPhone: "",
            checkInTime: "",
            checkOutTime: "",
          }],
        }]],
        insurances: [[]],
      });

      const classifications = JSON.parse(String(formData.get("classifications")));
      const act = classifications[0].plans[0].activities[0];
      expect(act.fromLocation).toBe("Hanoi");
      expect(act.toLocation).toBe("Hai Phong");
      expect(act.transportationType).toBe("1");
      expect(act.durationMinutes).toBe("120");
    });
  });

  // =========================================================================
  // Existing bilingual nested translations tests (TC-FE14 onwards)
  // =========================================================================

  describe("bilingual nested translations", () => {
    it("serializes bilingual classification and nested plan/activity/insurance translations", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Da Nang Explorer",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "SEO",
          seoDescription: "SEO Desc",
          status: "1",
        },
        thumbnail: null,
        images: [],
        vietnameseTranslation: {
          tourName: "Da Nang Explorer VI",
          shortDescription: "Mo ta VI",
          longDescription: "Mo ta dai VI",
          seoTitle: "SEO VI",
          seoDescription: "SEO Mo ta VI",
        },
        englishTranslation: {
          tourName: "Da Nang Explorer EN",
          shortDescription: "Short EN",
          longDescription: "Long EN",
          seoTitle: "SEO EN",
          seoDescription: "SEO Desc EN",
        },
        classifications: [
          {
            name: "Standard",
            enName: "Standard Package EN",
            description: "Package VI",
            enDescription: "Package EN",
            basePrice: "1000",
            durationDays: "3",
          },
        ],
        dayPlans: [
          [
            {
              dayNumber: "1",
              title: "Day 1 VI",
              enTitle: "Day 1 EN",
              description: "Desc VI",
              enDescription: "Desc EN",
              activities: [
                {
                  activityType: "0",
                  title: "Activity VI",
                  enTitle: "Activity EN",
                  description: "Act Desc VI",
                  enDescription: "Act Desc EN",
                  note: "Note VI",
                  enNote: "Note EN",
                  estimatedCost: "120",
                  isOptional: false,
                  startTime: "08:00",
                  endTime: "10:00",
                  routes: [],
                  locationName: "", enLocationName: "",
                  locationCity: "", enLocationCity: "",
                  locationCountry: "", enLocationCountry: "",
                  locationAddress: "", enLocationAddress: "",
                  locationEntranceFee: "",
                  fromLocation: "", enFromLocation: "",
                  toLocation: "", enToLocation: "",
                  transportationType: "", enTransportationType: "",
                  transportationName: "", enTransportationName: "",
                  durationMinutes: "", price: "",
                  accommodationName: "", enAccommodationName: "",
                  accommodationAddress: "", enAccommodationAddress: "",
                  accommodationPhone: "", checkInTime: "", checkOutTime: "",
                  roomType: "", roomCapacity: "", mealsIncluded: "",
                  roomPrice: "", numberOfRooms: "", numberOfNights: "",
                  specialRequest: "", latitude: "", longitude: "",
                },
              ],
            },
          ],
        ],
        insurances: [
          [
            {
              insuranceName: "Insurance VI",
              enInsuranceName: "Insurance EN",
              insuranceType: "1",
              insuranceProvider: "Provider",
              coverageDescription: "Cov VI",
              enCoverageDescription: "Cov EN",
              coverageAmount: "5000",
              coverageFee: "150",
              isOptional: false,
              note: "Note VI",
              enNote: "Note EN",
            },
          ],
        ],
      });

      const translations = JSON.parse(String(formData.get("translations")));
      expect(translations.vi.tourName).toBe("Da Nang Explorer VI");
      expect(translations.en.tourName).toBe("Da Nang Explorer EN");

      const classifications = JSON.parse(String(formData.get("classifications")));
      expect(classifications[0].name).toBe("Standard");
      expect(classifications[0].description).toBe("Package VI");
      expect(classifications[0].translations.vi).toEqual({ name: "Standard", description: "Package VI" });
      expect(classifications[0].translations.en).toEqual({ name: "Standard Package EN", description: "Package EN" });

      expect(classifications[0].plans[0].title).toBe("Day 1 VI");
      expect(classifications[0].plans[0].translations.vi).toEqual({ title: "Day 1 VI", description: "Desc VI" });
      expect(classifications[0].plans[0].translations.en).toEqual({ title: "Day 1 EN", description: "Desc EN" });

      expect(classifications[0].plans[0].activities[0].title).toBe("Activity VI");
      expect(classifications[0].plans[0].activities[0].translations.vi).toEqual({
        title: "Activity VI",
        description: "Act Desc VI",
        note: "Note VI",
      });
      expect(classifications[0].plans[0].activities[0].translations.en).toEqual({
        title: "Activity EN",
        description: "Act Desc EN",
        note: "Note EN",
      });

      expect(classifications[0].insurances[0].insuranceName).toBe("Insurance VI");
      expect(classifications[0].insurances[0].translations.vi).toEqual({
        name: "Insurance VI",
        description: "Cov VI",
      });
      expect(classifications[0].insurances[0].translations.en).toEqual({
        name: "Insurance EN",
        description: "Cov EN",
      });
    });

    it("omits English translation block when English fields are empty", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour VI",
          shortDescription: "Short VI",
          longDescription: "Long VI",
          seoTitle: "SEO VI",
          seoDescription: "SEO Desc VI",
          status: "1",
        },
        thumbnail: null,
        images: [],
        vietnameseTranslation: {
          tourName: "Tour VI",
          shortDescription: "Short VI",
          longDescription: "Long VI",
          seoTitle: "SEO VI",
          seoDescription: "SEO VI",
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
            name: "Cls VI",
            enName: "",
            description: "Desc VI",
            enDescription: "",
            basePrice: "500",
            durationDays: "2",
          },
        ],
        dayPlans: [[{
          dayNumber: "1",
          title: "Day VI",
          enTitle: "",
          description: "Day Desc VI",
          enDescription: "",
          activities: [{
            activityType: "0",
            title: "Act VI",
            enTitle: "",
            description: "Act Desc VI",
            enDescription: "",
            note: "",
            enNote: "",
            estimatedCost: "50",
            isOptional: false,
            startTime: "",
            endTime: "",
            routes: [],
            locationName: "", enLocationName: "",
            locationCity: "", enLocationCity: "",
            locationCountry: "", enLocationCountry: "",
            locationAddress: "", enLocationAddress: "",
            locationEntranceFee: "",
            fromLocation: "", enFromLocation: "",
            toLocation: "", enToLocation: "",
            transportationType: "", enTransportationType: "",
            transportationName: "", enTransportationName: "",
            durationMinutes: "", price: "",
            accommodationName: "", enAccommodationName: "",
            accommodationAddress: "", enAccommodationAddress: "",
            accommodationPhone: "", checkInTime: "", checkOutTime: "",
          }],
        }]],
        insurances: [[{
          insuranceName: "Ins VI",
          enInsuranceName: "",
          insuranceType: "1",
          insuranceProvider: "Prov",
          coverageDescription: "Cov VI",
          enCoverageDescription: "",
          coverageAmount: "1000",
          coverageFee: "50",
          isOptional: false,
          note: "",
          enNote: "",
        }]],
      });

      const translations = JSON.parse(String(formData.get("translations")));
      expect(translations.vi.tourName).toBe("Tour VI");
      expect(translations.en).toBeUndefined();

      const classifications = JSON.parse(String(formData.get("classifications")));
      expect(classifications[0].translations.vi).toEqual({ name: "Cls VI", description: "Desc VI" });
      expect(classifications[0].translations.en).toBeUndefined();

      expect(classifications[0].plans[0].translations.vi).toEqual({ title: "Day VI", description: "Day Desc VI" });
      expect(classifications[0].plans[0].translations.en).toBeUndefined();

      expect(classifications[0].plans[0].activities[0].translations.vi).toEqual({
        title: "Act VI",
        description: "Act Desc VI",
        note: "",
      });
      expect(classifications[0].plans[0].activities[0].translations.en).toBeUndefined();

      expect(classifications[0].insurances[0].translations.vi).toEqual({
        name: "Ins VI",
        description: "Cov VI",
      });
      expect(classifications[0].insurances[0].translations.en).toBeUndefined();
    });

    // NOTE: The old test "serializes accommodations, locations, and transportations
    // with translations" is replaced by activity-extracted tests above.
    // Accommodations and locations are no longer sent as top-level FormData fields —
    // they are derived from activity data and included inside the classifications payload.
  });

  describe("services payload", () => {
    // TC-FE15: Services are appended as JSON when provided
    it("appends services as JSON when services are provided", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
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
        classifications: [],
        dayPlans: [],
        insurances: [],
        services: [
          {
            serviceName: "Guide Service",
            enServiceName: "",
            pricingType: "0",
            price: "100",
            salePrice: "80",
            email: "guide@example.com",
            contactNumber: "123456",
          },
        ],
      });

      const services = JSON.parse(String(formData.get("services")));
      expect(services).toHaveLength(1);
      expect(services[0].serviceName).toBe("Guide Service");
      expect(services[0].pricingType).toBe("0");
      expect(services[0].price).toBe(100);
      expect(services[0].salePrice).toBe(80);
      expect(services[0].email).toBe("guide@example.com");
      expect(services[0].contactNumber).toBe("123456");
    });

    // TC-FE16: Services with empty serviceName are filtered out
    it("filters out services with empty serviceName", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
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
        classifications: [],
        dayPlans: [],
        insurances: [],
        services: [
          {
            serviceName: "",
            enServiceName: "",
            pricingType: "0",
            price: "100",
            salePrice: "",
            email: "",
            contactNumber: "",
          },
          {
            serviceName: "Valid Service",
            enServiceName: "",
            pricingType: "1",
            price: "50",
            salePrice: "",
            email: "",
            contactNumber: "",
          },
        ],
      });

      const services = JSON.parse(String(formData.get("services")));
      expect(services).toHaveLength(1);
      expect(services[0].serviceName).toBe("Valid Service");
    });

    // TC-FE17: Services omitted from FormData when array is empty
    it("omits services field when array is empty", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
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
        classifications: [],
        dayPlans: [],
        insurances: [],
        services: [],
      });

      expect(formData.get("services")).toBeNull();
    });

    // TC-FE18: Services omitted when all entries have empty serviceName
    it("omits services field when all services have empty serviceName", () => {
      const formData = buildTourFormData({
        basicInfo: {
          tourName: "Tour",
          shortDescription: "Short",
          longDescription: "Long",
          seoTitle: "",
          seoDescription: "",
          status: "1",
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
        classifications: [],
        dayPlans: [],
        insurances: [],
        services: [
          {
            serviceName: "",
            enServiceName: "",
            pricingType: "",
            price: "",
            salePrice: "",
            email: "",
            contactNumber: "",
          },
        ],
      });

      expect(formData.get("services")).toBeNull();
    });
  });

  // Direct unit tests for buildServicesPayload
  describe("buildServicesPayload", () => {
    // TC-FE19: Filters out empty services, maps optional fields correctly
    it("maps service fields and filters empty names", () => {
      const result = buildServicesPayload([
        {
          serviceName: "Guide",
          enServiceName: "",
          pricingType: "0",
          price: "200",
          salePrice: "150",
          email: "guide@test.com",
          contactNumber: "999",
        },
      ]);
      expect(result[0].serviceName).toBe("Guide");
      expect(result[0].pricingType).toBe("0");
      expect(result[0].price).toBe(200);
      expect(result[0].salePrice).toBe(150);
      expect(result[0].email).toBe("guide@test.com");
      expect(result[0].contactNumber).toBe("999");
    });

    // TC-FE20: Empty optional fields become null
    it("converts empty optional fields to null", () => {
      const result = buildServicesPayload([
        {
          serviceName: "Guide",
          enServiceName: "",
          pricingType: "",
          price: "",
          salePrice: "",
          email: "",
          contactNumber: "",
        },
      ]);
      expect(result[0].pricingType).toBeNull();
      expect(result[0].price).toBe(0);
      expect(result[0].salePrice).toBe(0);
      expect(result[0].email).toBeNull();
      expect(result[0].contactNumber).toBeNull();
    });
  });
});

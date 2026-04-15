/**
 * Tests verifying the TourInstanceDto, TourInstanceDayDto,
 * TourInstanceDayActivityDto, and TourInstancePlanRouteDto types
 * correctly support transport/vehicle/driver/provider fields.
 */
import { describe, expect, it } from "vitest";
import type {
  TourInstanceDto,
  TourInstanceDayDto,
  TourInstanceDayActivityDto,
  TourInstancePlanRouteDto,
  TourInstancePlanAccommodationDto,
} from "../tour";

describe("TourInstanceDto — provider fields", () => {
  it("supports hotelProvider fields", () => {
    const dto: TourInstanceDto = {
      id: "inst-001",
      tourId: "tour-001",
      tourInstanceCode: "TI-001",
      title: "Ha Long Bay Tour",
      tourName: "Ha Long",
      tourCode: "HL001",
      classificationId: "cls-001",
      classificationName: "Standard",
      location: "Quang Ninh",
      thumbnail: null,
      images: [],
      startDate: "2025-07-01T00:00:00Z",
      endDate: "2025-07-03T00:00:00Z",
      durationDays: 3,
      currentParticipation: 5,
      maxParticipation: 20,
      basePrice: 1500000,
      status: "Available",
      instanceType: "Public",
      cancellationReason: null,
      rating: 0,
      totalBookings: 0,
      revenue: 0,
      confirmationDeadline: null,
      managers: [],
      includedServices: ["shuttle"],
      hotelApprovalStatus: 1, // Pending
      transportApprovalStatus: 2, // Approved
      hotelApprovalNote: null,
      transportApprovalNote: null,
      hotelProviderId: "hp-001",
      hotelProviderName: "Grand Hotel Saigon",
      transportProviderId: "tp-001",
      transportProviderName: "Vietransport Co.",
      days: [],
    };

    expect(dto.hotelProviderId).toBe("hp-001");
    expect(dto.hotelProviderName).toBe("Grand Hotel Saigon");
    expect(dto.hotelApprovalStatus).toBe(1);
    expect(dto.transportProviderId).toBe("tp-001");
    expect(dto.transportProviderName).toBe("Vietransport Co.");
    expect(dto.transportApprovalStatus).toBe(2);
  });

  it("supports null provider fields when no provider assigned", () => {
    const dto: TourInstanceDto = {
      id: "inst-002",
      tourId: "tour-001",
      tourInstanceCode: "TI-002",
      title: "Private Tour",
      tourName: "Private",
      tourCode: "PR001",
      classificationId: "cls-001",
      classificationName: "Economy",
      location: null,
      thumbnail: null,
      images: [],
      startDate: "2025-07-01T00:00:00Z",
      endDate: "2025-07-02T00:00:00Z",
      durationDays: 2,
      currentParticipation: 0,
      maxParticipation: 10,
      basePrice: 500000,
      status: "Available",
      instanceType: "Private",
      managers: [],
      includedServices: [],
      hotelApprovalStatus: 2,
      transportApprovalStatus: 2,
      hotelProviderId: null,
      hotelProviderName: null,
      transportProviderId: null,
      transportProviderName: null,
      days: [],
    };

    expect(dto.hotelProviderId).toBeNull();
    expect(dto.hotelProviderName).toBeNull();
    expect(dto.transportProviderId).toBeNull();
    expect(dto.transportProviderName).toBeNull();
  });

  it("supports approval notes", () => {
    const dto: TourInstanceDto = {
      id: "inst-003",
      tourId: "tour-001",
      tourInstanceCode: "TI-003",
      title: "Rejected Provider Tour",
      tourName: "Test",
      tourCode: "TT001",
      classificationId: "cls-001",
      classificationName: "Standard",
      location: null,
      thumbnail: null,
      images: [],
      startDate: "2025-07-01T00:00:00Z",
      endDate: "2025-07-02T00:00:00Z",
      durationDays: 2,
      currentParticipation: 0,
      maxParticipation: 15,
      basePrice: 800000,
      status: "PendingApproval",
      instanceType: "Public",
      hotelApprovalStatus: 3, // Rejected
      transportApprovalStatus: 1, // Pending
      hotelApprovalNote: "Không đủ phòng cho ngày này",
      transportApprovalNote: null,
      hotelProviderId: "hp-002",
      hotelProviderName: "Budget Hotel",
      transportProviderId: "tp-002",
      transportProviderName: "Local Bus",
      managers: [],
      includedServices: [],
      days: [],
    };

    expect(dto.hotelApprovalStatus).toBe(3);
    expect(dto.hotelApprovalNote).toBe("Không đủ phòng cho ngày này");
    expect(dto.transportApprovalStatus).toBe(1);
  });
});

describe("TourInstanceDayDto — flat activity structure", () => {
  it("uses flat activities field (not nested tourDay.activities)", () => {
    const day: TourInstanceDayDto = {
      id: "day-001",
      instanceDayNumber: 1,
      actualDate: "2025-07-01T00:00:00Z",
      title: "Day 1: Hanoi - Ha Long",
      description: "Depart from Hanoi in the morning",
      startTime: "08:00",
      endTime: "12:00",
      note: "Bring sunscreen",
      activities: [
        {
          id: "act-001",
          order: 1,
          activityType: "Transportation",
          title: "Bus to Ha Long",
          description: null,
          startTime: "08:00",
          endTime: "12:00",
          isOptional: false,
          note: null,
          accommodation: null,
          routes: [
            {
              id: "route-001",
              vehicleId: "v-001",
              departureTime: "2025-07-01T08:00:00Z",
              arrivalTime: "2025-07-01T12:00:00Z",
              vehiclePlate: "30A-12345",
              vehicleType: "Bus",
              vehicleBrand: "Hyundai",
              vehicleModel: "County",
              seatCapacity: 45,
              driverName: "Nguyen Van A",
              driverPhone: "0909123456",
              pickupLocation: "Hanoi Old Quarter",
              dropoffLocation: "Ha Long Bay Pier",
            },
          ],
        },
      ],
    };

    expect(day.activities).toBeDefined();
    expect(day.activities.length).toBe(1);
    expect(day.activities[0].activityType).toBe("Transportation");
    expect(day.activities[0].routes.length).toBe(1);
  });

  it("supports custom day with no activities", () => {
    const day: TourInstanceDayDto = {
      id: "day-custom-001",
      instanceDayNumber: 5,
      actualDate: "2025-07-05T00:00:00Z",
      title: "Free Day",
      description: "Free time for shopping",
      startTime: null,
      endTime: null,
      note: null,
      activities: [],
    };

    expect(day.activities).toEqual([]);
  });
});

describe("TourInstancePlanRouteDto — vehicle and driver fields", () => {
  it("maps full vehicle info with driver", () => {
    const route: TourInstancePlanRouteDto = {
      id: "route-001",
      vehicleId: "v-001",
      departureTime: "2025-07-01T08:00:00Z",
      arrivalTime: "2025-07-01T12:00:00Z",
      vehiclePlate: "30A-12345",
      vehicleType: "Bus",
      vehicleBrand: "Hyundai",
      vehicleModel: "County",
      seatCapacity: 45,
      driverName: "Nguyen Van A",
      driverPhone: "0909123456",
      pickupLocation: "Hotel Lobby",
      dropoffLocation: "Ha Long Pier",
    };

    expect(route.vehiclePlate).toBe("30A-12345");
    expect(route.vehicleType).toBe("Bus");
    expect(route.vehicleBrand).toBe("Hyundai");
    expect(route.vehicleModel).toBe("County");
    expect(route.seatCapacity).toBe(45);
    expect(route.driverName).toBe("Nguyen Van A");
    expect(route.driverPhone).toBe("0909123456");
    expect(route.pickupLocation).toBe("Hotel Lobby");
    expect(route.dropoffLocation).toBe("Ha Long Pier");
    expect(route.departureTime).toBe("2025-07-01T08:00:00Z");
    expect(route.arrivalTime).toBe("2025-07-01T12:00:00Z");
  });

  it("supports route with vehicle only (no driver)", () => {
    const route: TourInstancePlanRouteDto = {
      id: "route-002",
      vehicleId: "v-002",
      departureTime: "2025-07-02T09:00:00Z",
      arrivalTime: null,
      vehiclePlate: "51B-88888",
      vehicleType: "Car",
      vehicleBrand: "Toyota",
      vehicleModel: "Camry",
      seatCapacity: 5,
      driverName: null,
      driverPhone: null,
      pickupLocation: "Airport",
      dropoffLocation: "City Center Hotel",
    };

    expect(route.driverName).toBeNull();
    expect(route.driverPhone).toBeNull();
    expect(route.seatCapacity).toBe(5);
  });

  it("supports route with driver only (no vehicle)", () => {
    const route: TourInstancePlanRouteDto = {
      id: "route-003",
      vehicleId: null,
      departureTime: null,
      arrivalTime: null,
      vehiclePlate: null,
      vehicleType: null,
      vehicleBrand: null,
      vehicleModel: null,
      seatCapacity: null,
      driverName: "Le Van B",
      driverPhone: "0933123456",
      pickupLocation: "Meeting Point",
      dropoffLocation: "Beach",
    };

    expect(route.vehicleId).toBeNull();
    expect(route.vehiclePlate).toBeNull();
    expect(route.driverName).toBe("Le Van B");
    expect(route.driverPhone).toBe("0933123456");
  });

  it("supports route with no vehicle or driver assigned yet", () => {
    const route: TourInstancePlanRouteDto = {
      id: "route-004",
      vehicleId: null,
      departureTime: null,
      arrivalTime: null,
      vehiclePlate: null,
      vehicleType: null,
      vehicleBrand: null,
      vehicleModel: null,
      seatCapacity: null,
      driverName: null,
      driverPhone: null,
      pickupLocation: null,
      dropoffLocation: null,
    };

    expect(route.vehiclePlate).toBeNull();
    expect(route.driverName).toBeNull();
    expect(route.pickupLocation).toBeNull();
    expect(route.dropoffLocation).toBeNull();
  });

  it("supports unassigned route with only timing", () => {
    const route: TourInstancePlanRouteDto = {
      id: "route-005",
      vehicleId: null,
      departureTime: "2025-07-03T14:00:00Z",
      arrivalTime: "2025-07-03T17:00:00Z",
      vehiclePlate: null,
      vehicleType: null,
      vehicleBrand: null,
      vehicleModel: null,
      seatCapacity: null,
      driverName: null,
      driverPhone: null,
      pickupLocation: "Airport",
      dropoffLocation: "Hotel",
    };

    expect(route.departureTime).toBe("2025-07-03T14:00:00Z");
    expect(route.arrivalTime).toBe("2025-07-03T17:00:00Z");
    expect(route.pickupLocation).toBe("Airport");
  });
});

describe("TourInstanceDayActivityDto — accommodation field", () => {
  it("maps accommodation with room type and quantity", () => {
    const activity: TourInstanceDayActivityDto = {
      id: "act-accommodation-001",
      order: 1,
      activityType: "Accommodation",
      title: "Hotel Stay",
      description: null,
      startTime: "14:00",
      endTime: "11:00",
      isOptional: false,
      note: "Early check-in requested",
      accommodation: {
        id: "acc-001",
        roomType: "Double",
        quantity: 5,
      },
      routes: [],
    };

    expect(activity.activityType).toBe("Accommodation");
    expect(activity.accommodation).not.toBeNull();
    expect(activity.accommodation!.roomType).toBe("Double");
    expect(activity.accommodation!.quantity).toBe(5);
  });

  it("supports null accommodation for non-accommodation activities", () => {
    const activity: TourInstanceDayActivityDto = {
      id: "act-sightseeing-001",
      order: 2,
      activityType: "Sightseeing",
      title: "Ha Long Bay Kayaking",
      description: null,
      startTime: "13:00",
      endTime: "16:00",
      isOptional: true,
      note: null,
      accommodation: null,
      routes: [],
    };

    expect(activity.accommodation).toBeNull();
    expect(activity.isOptional).toBe(true);
  });

  it("supports activity with both accommodation and routes", () => {
    const activity: TourInstanceDayActivityDto = {
      id: "act-mixed-001",
      order: 3,
      activityType: "Accommodation",
      title: "Transfer to Hotel",
      description: null,
      startTime: "17:00",
      endTime: "18:00",
      isOptional: false,
      note: null,
      accommodation: {
        id: "acc-002",
        roomType: "Suite",
        quantity: 2,
      },
      routes: [
        {
          id: "route-006",
          vehicleId: "v-003",
          departureTime: "2025-07-01T17:00:00Z",
          arrivalTime: "2025-07-01T18:00:00Z",
          vehiclePlate: "60A-11111",
          vehicleType: "Minibus",
          vehicleBrand: "Ford",
          vehicleModel: "Transit",
          seatCapacity: 15,
          driverName: "Tran Thi C",
          driverPhone: "0977123456",
          pickupLocation: "Ha Long Pier",
          dropoffLocation: "Grand Hotel Lobby",
        },
      ],
    };

    expect(activity.accommodation).not.toBeNull();
    expect(activity.routes.length).toBe(1);
    expect(activity.routes[0].vehiclePlate).toBe("60A-11111");
  });
});

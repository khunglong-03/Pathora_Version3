/**
 * Tests verifying the TourInstanceDto, TourInstanceDayDto,
 * and TourInstanceDayActivityDto types correctly support flattened
 * transport/vehicle/driver/provider fields (no nested routes).
 */
import { describe, expect, it } from "vitest";
import type {
  TourInstanceDto,
  TourInstanceDayDto,
  TourInstanceDayActivityDto,
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
  it("uses flat activities field with transport data directly on activity", () => {
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
          // Flattened transport fields
          vehicleId: "v-001",
          vehiclePlate: "30A-12345",
          vehicleType: "Bus",
          vehicleBrand: "Hyundai",
          vehicleModel: "County",
          seatCapacity: 45,
          driverId: "d-001",
          driverName: "Nguyen Van A",
          driverPhone: "0909123456",
          pickupLocation: "Hanoi Old Quarter",
          dropoffLocation: "Ha Long Bay Pier",
          departureTime: "2025-07-01T08:00:00Z",
          arrivalTime: "2025-07-01T12:00:00Z",
        },
      ],
    };

    expect(day.activities).toBeDefined();
    expect(day.activities.length).toBe(1);
    expect(day.activities[0].activityType).toBe("Transportation");
    // Transport fields are directly on activity — no nested routes
    expect(day.activities[0].vehiclePlate).toBe("30A-12345");
    expect(day.activities[0].driverName).toBe("Nguyen Van A");
    expect(day.activities[0].pickupLocation).toBe("Hanoi Old Quarter");
    expect(day.activities[0].dropoffLocation).toBe("Ha Long Bay Pier");
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

describe("TourInstanceDayActivityDto — flattened transport fields", () => {
  it("maps full vehicle info with driver directly on activity", () => {
    const activity: TourInstanceDayActivityDto = {
      id: "act-transport-001",
      order: 1,
      activityType: "Transportation",
      title: "Bus to Ha Long",
      description: null,
      startTime: "08:00",
      endTime: "12:00",
      isOptional: false,
      note: null,
      accommodation: null,
      vehicleId: "v-001",
      vehiclePlate: "30A-12345",
      vehicleType: "Bus",
      vehicleBrand: "Hyundai",
      vehicleModel: "County",
      seatCapacity: 45,
      driverId: "d-001",
      driverName: "Nguyen Van A",
      driverPhone: "0909123456",
      pickupLocation: "Hotel Lobby",
      dropoffLocation: "Ha Long Pier",
      departureTime: "2025-07-01T08:00:00Z",
      arrivalTime: "2025-07-01T12:00:00Z",
    };

    expect(activity.vehiclePlate).toBe("30A-12345");
    expect(activity.vehicleType).toBe("Bus");
    expect(activity.vehicleBrand).toBe("Hyundai");
    expect(activity.vehicleModel).toBe("County");
    expect(activity.seatCapacity).toBe(45);
    expect(activity.driverName).toBe("Nguyen Van A");
    expect(activity.driverPhone).toBe("0909123456");
    expect(activity.pickupLocation).toBe("Hotel Lobby");
    expect(activity.dropoffLocation).toBe("Ha Long Pier");
    expect(activity.departureTime).toBe("2025-07-01T08:00:00Z");
    expect(activity.arrivalTime).toBe("2025-07-01T12:00:00Z");
  });

  it("supports activity with vehicle only (no driver)", () => {
    const activity: TourInstanceDayActivityDto = {
      id: "act-transport-002",
      order: 2,
      activityType: "Transportation",
      title: "Airport Transfer",
      description: null,
      startTime: "09:00",
      endTime: "10:00",
      isOptional: false,
      note: null,
      accommodation: null,
      vehicleId: "v-002",
      vehiclePlate: "51B-88888",
      vehicleType: "Car",
      vehicleBrand: "Toyota",
      vehicleModel: "Camry",
      seatCapacity: 5,
      driverId: null,
      driverName: null,
      driverPhone: null,
      pickupLocation: "Airport",
      dropoffLocation: "City Center Hotel",
    };

    expect(activity.driverName).toBeNull();
    expect(activity.driverPhone).toBeNull();
    expect(activity.seatCapacity).toBe(5);
  });

  it("supports activity with no vehicle or driver assigned yet", () => {
    const activity: TourInstanceDayActivityDto = {
      id: "act-transport-003",
      order: 1,
      activityType: "Transportation",
      title: "Pending Transfer",
      description: null,
      startTime: "14:00",
      endTime: "17:00",
      isOptional: false,
      note: null,
      accommodation: null,
      vehicleId: null,
      vehiclePlate: null,
      vehicleType: null,
      vehicleBrand: null,
      vehicleModel: null,
      seatCapacity: null,
      driverId: null,
      driverName: null,
      driverPhone: null,
      pickupLocation: null,
      dropoffLocation: null,
    };

    expect(activity.vehiclePlate).toBeNull();
    expect(activity.driverName).toBeNull();
    expect(activity.pickupLocation).toBeNull();
    expect(activity.dropoffLocation).toBeNull();
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
    };

    expect(activity.accommodation).toBeNull();
    expect(activity.isOptional).toBe(true);
  });

  it("supports activity with both accommodation and transport fields", () => {
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
      vehicleId: "v-003",
      vehiclePlate: "60A-11111",
      vehicleType: "Minibus",
      vehicleBrand: "Ford",
      vehicleModel: "Transit",
      seatCapacity: 15,
      driverId: "d-003",
      driverName: "Tran Thi C",
      driverPhone: "0977123456",
      pickupLocation: "Ha Long Pier",
      dropoffLocation: "Grand Hotel Lobby",
      departureTime: "2025-07-01T17:00:00Z",
      arrivalTime: "2025-07-01T18:00:00Z",
    };

    expect(activity.accommodation).not.toBeNull();
    expect(activity.vehiclePlate).toBe("60A-11111");
    expect(activity.driverName).toBe("Tran Thi C");
  });
});

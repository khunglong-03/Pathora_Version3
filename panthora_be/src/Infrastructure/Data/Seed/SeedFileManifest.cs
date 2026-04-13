namespace Infrastructure.Data.Seed;

internal static class SeedFileManifest
{
    public static IReadOnlyList<SeedFileDefinition> Definitions { get; } =
    [
        // Base layer: Roles → Users → UserRoles
        new("RoleContextSeed", "role.json", ["Id", "Name", "Type", "Status"], "Id", null),
        new("UserContextSeed", "user.json", ["Id", "Username", "Email", "Status", "VerifyStatus"], "Id", null),
        new("UserRoleContextSeed", "user-role.json", ["UserId", "RoleId"], null, ["UserId", "RoleId"]),

        // Layer 1: Policies & Organization
        new("DepartmentSeed", "department.json", ["Id", "Name", "DepartmentCode"], "Id", null),
        new("PositionSeed", "position.json", ["Id", "Name", "PositionCode"], "Id", null),
        new("TaxConfigSeed", "tax-config.json", ["Id", "ConfigName"], "Id", null),
        new("PricingPolicySeed", "pricing-policy.json", ["Id", "Name"], "Id", null),
        new("CancellationPolicySeed", "cancellation-policy.json", ["Id"], "Id", null),
        new("DepositPolicySeed", "deposit-policy.json", ["Id"], "Id", null),
        new("VisaPolicySeed", "visa-policy.json", ["Id", "CountryCode"], "Id", null),

        // Layer 2: Suppliers
        new("SupplierSeed", "supplier-transport.json", ["Id", "SupplierName"], "Id", null),
        new("SupplierSeed", "supplier-hotel.json", ["Id", "SupplierName"], "Id", null),
        new("SupplierSeed", "supplier-activity.json", ["Id", "SupplierName"], "Id", null),

        // Layer 2: Vehicles, Drivers, Hotel Rooms
        new("VehicleSeed", "vehicle.json", ["Id", "VehiclePlate"], "Id", null),
        new("DriverSeed", "driver.json", ["Id", "FullName", "LicenseNumber"], "Id", null),
        new("HotelRoomInventorySeed", "hotel-room-inventory.json", ["Id", "Name"], "Id", null),

        // Layer 3: Tour content
        new("TourSeed", "tour.json", ["Id", "TourCode"], "Id", null),
        new("TourClassificationSeed", "tour-classification.json", ["Id", "TourId"], "Id", null),
        new("TourDaySeed", "tour-day.json", ["Id", "ClassificationId", "DayNumber"], "Id", null),
        new("TourDayActivitySeed", "tour-day-activity.json", ["Id", "TourDayId", "Order"], "Id", null),
        new("TourPlanLocationSeed", "tour-plan-location.json", ["Id", "TourId", "LocationName"], "Id", null),
        new("TourPlanAccommodationSeed", "tour-plan-accommodation.json", ["Id", "AccommodationName"], "Id", null),
        new("TourPlanRouteSeed", "tour-plan-route.json", ["Id", "Order"], "Id", null),

        // Layer 3b: Tour Manager Assignments
        new("TourManagerAssignmentSeed", "tour-manager-assignment.json", ["Id", "TourManagerId", "AssignedEntityType"], "Id", null),

        // Layer 4: Tour Instances
        new("TourInstanceSeed", "tour-instance.json", ["Id", "TourInstanceCode"], "Id", null),
        new("TourInstanceManagerSeed", "tour-instance-manager.json", ["Id", "TourInstanceId", "UserId"], "Id", null),
        new("TourInstanceDaySeed", "tour-instance-day.json", ["Id", "TourInstanceId", "TourDayId", "InstanceDayNumber"], "Id", null),

        // Layer 5: Bookings
        new("BookingSeed", "booking.json", ["Id", "TourInstanceId"], "Id", null),
        new("BookingParticipantSeed", "booking-participant.json", ["Id", "BookingId", "FullName"], "Id", null),
        new("BookingActivityReservationSeed", "booking-activity-reservation.json", ["Id", "BookingId"], "Id", null),
        new("BookingTransportDetailSeed", "booking-transport-detail.json", ["Id", "BookingActivityReservationId"], "Id", null),
        new("BookingAccommodationDetailSeed", "booking-accommodation-detail.json", ["Id", "BookingActivityReservationId"], "Id", null),
        new("BookingTourGuideSeed", "booking-tour-guide.json", ["Id", "BookingId", "UserId"], "Id", null),

        // Layer 6: Reviews
        new("ReviewSeed", "review.json", ["Id", "UserId", "TourId"], "Id", null),

        // Layer 7: Customer Deposits & Payments
        new("CustomerDepositSeed", "customer-deposit.json", ["Id", "BookingId"], "Id", null),
        new("CustomerPaymentSeed", "customer-payment.json", ["Id", "BookingId"], "Id", null),

        // Layer 8: Payment Transactions
        new("PaymentTransactionSeed", "payment-transaction.json", ["Id", "BookingId", "TransactionCode"], "Id", null),
    ];
}

internal sealed record SeedFileDefinition(
    string ContextSeedClass,
    string FileName,
    IReadOnlyList<string> RequiredFields,
    string? IdField = null,
    IReadOnlyList<string>? ReferenceFields = null);
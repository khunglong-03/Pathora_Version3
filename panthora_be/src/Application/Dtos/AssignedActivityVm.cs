using System.Text.Json.Serialization;
using Domain.Enums;

namespace Application.Dtos;

public sealed record AccommodationSnapshot(
    [property: JsonPropertyName("roomType")] RoomType? RoomType,
    [property: JsonPropertyName("quantity")] int Quantity,
    [property: JsonPropertyName("checkInTime")] DateTimeOffset? CheckInTime,
    [property: JsonPropertyName("checkOutTime")] DateTimeOffset? CheckOutTime
);

public sealed record TransportSnapshot(
    [property: JsonPropertyName("vehicleType")] VehicleType? VehicleType,
    [property: JsonPropertyName("seatCount")] int SeatCount,
    [property: JsonPropertyName("vehicleCount")] int? VehicleCount,
    [property: JsonPropertyName("fromLocationName")] string? FromLocationName,
    [property: JsonPropertyName("toLocationName")] string? ToLocationName
);

public sealed record AssignedActivityVm(
    [property: JsonPropertyName("activityId")] Guid ActivityId,
    [property: JsonPropertyName("tourInstanceDayId")] Guid TourInstanceDayId,
    [property: JsonPropertyName("dayNumber")] int DayNumber,
    [property: JsonPropertyName("actualDate")] DateTimeOffset ActualDate,
    [property: JsonPropertyName("activityType")] TourDayActivityType ActivityType,
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("supplierName")] string SupplierName,
    [property: JsonPropertyName("approvalStatus")] ProviderApprovalStatus ApprovalStatus,
    [property: JsonPropertyName("approvalNote")] string? ApprovalNote,
    [property: JsonPropertyName("accommodation")] AccommodationSnapshot? Accommodation,
    [property: JsonPropertyName("transport")] TransportSnapshot? Transport
);

using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public record CreateTourInstanceActivityAssignmentDto(
    [property: JsonPropertyName("originalActivityId")] Guid OriginalActivityId,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("roomType")] string? RoomType,
    [property: JsonPropertyName("accommodationQuantity")] int? AccommodationQuantity,
    [property: JsonPropertyName("vehicleId")] Guid? VehicleId,
    // Per-activity transport plan fields (new)
    [property: JsonPropertyName("transportSupplierId")] Guid? TransportSupplierId = null,
    [property: JsonPropertyName("requestedVehicleType")] VehicleType? RequestedVehicleType = null,
    [property: JsonPropertyName("requestedSeatCount")] int? RequestedSeatCount = null,
    // Scope addendum 2026-04-23 — manager-specified vehicle count (nullable for legacy rows).
    [property: JsonPropertyName("requestedVehicleCount")] int? RequestedVehicleCount = null
);

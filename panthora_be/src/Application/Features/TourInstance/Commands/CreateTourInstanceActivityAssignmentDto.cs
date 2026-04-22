using Domain.Enums;

namespace Application.Features.TourInstance.Commands;

public record CreateTourInstanceActivityAssignmentDto(
    Guid OriginalActivityId,
    Guid? SupplierId,
    string? RoomType,
    int? AccommodationQuantity,
    Guid? VehicleId,
    // Per-activity transport plan fields (new)
    Guid? TransportSupplierId = null,
    VehicleType? RequestedVehicleType = null,
    int? RequestedSeatCount = null,
    // Scope addendum 2026-04-23 — manager-specified vehicle count (nullable for legacy rows).
    int? RequestedVehicleCount = null
);

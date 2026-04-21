namespace Application.Features.TourInstance.Commands;

public record CreateTourInstanceActivityAssignmentDto(
    Guid OriginalActivityId,
    Guid? SupplierId,
    string? RoomType,
    int? AccommodationQuantity,
    Guid? VehicleId
);

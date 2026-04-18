namespace Application.Features.TourInstance.Commands;

public record CreateTourInstanceActivityAssignmentDto(
    Guid OriginalActivityId,
    string? RoomType,
    int? AccommodationQuantity,
    Guid? VehicleId
);

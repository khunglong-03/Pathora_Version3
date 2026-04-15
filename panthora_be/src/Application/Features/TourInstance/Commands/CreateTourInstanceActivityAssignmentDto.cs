using Domain.Enums;

namespace Application.Features.TourInstance.Commands;

public record CreateTourInstanceActivityAssignmentDto(
    Guid OriginalActivityId,
    RoomType? RoomType,
    int? AccommodationQuantity,
    Guid? VehicleId
);

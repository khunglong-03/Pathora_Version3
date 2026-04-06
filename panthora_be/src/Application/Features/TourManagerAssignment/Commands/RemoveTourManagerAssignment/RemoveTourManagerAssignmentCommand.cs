using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Features.TourManagerAssignment.Commands.RemoveTourManagerAssignment;

public sealed record RemoveTourManagerAssignmentCommand(
    Guid ManagerId,
    Guid? AssignedUserId,
    Guid? AssignedTourId,
    int AssignedEntityType) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourManagerAssignment];
}

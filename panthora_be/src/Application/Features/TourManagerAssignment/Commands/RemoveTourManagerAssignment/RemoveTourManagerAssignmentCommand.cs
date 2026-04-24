using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourManagerAssignment.Commands.RemoveTourManagerAssignment;

public sealed record RemoveTourManagerAssignmentCommand(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("assignedUserId")] Guid? AssignedUserId,
    [property: JsonPropertyName("assignedTourId")] Guid? AssignedTourId,
    [property: JsonPropertyName("assignedEntityType")] int AssignedEntityType) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourManagerAssignment];
}

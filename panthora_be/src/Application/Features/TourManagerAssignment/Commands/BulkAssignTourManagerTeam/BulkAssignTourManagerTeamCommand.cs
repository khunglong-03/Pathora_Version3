using Application.Contracts.TourManagerAssignment;
using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourManagerAssignment.Commands.BulkAssignTourManagerTeam;

public sealed record BulkAssignTourManagerTeamCommand(
    [property: JsonPropertyName("managerId")] string ManagerId,
    [property: JsonPropertyName("assignments")] List<AssignmentItem> Assignments) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourManagerAssignment];
}

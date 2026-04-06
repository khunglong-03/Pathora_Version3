using Application.Contracts.TourManagerAssignment;
using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Features.TourManagerAssignment.Commands.BulkAssignTourManagerTeam;

public sealed record BulkAssignTourManagerTeamCommand(
    string ManagerId,
    List<AssignmentItem> Assignments) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourManagerAssignment];
}

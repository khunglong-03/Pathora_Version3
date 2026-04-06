using Application.Contracts.TourManagerAssignment;
using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Features.TourManagerAssignment.Commands.AssignTourManagerTeam;

public sealed record AssignTourManagerTeamCommand(
    string TourManagerUserId,
    List<AssignmentItem> Assignments) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourManagerAssignment];
}

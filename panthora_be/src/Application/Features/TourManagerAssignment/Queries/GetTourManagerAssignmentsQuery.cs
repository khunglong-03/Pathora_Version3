using Application.Common;
using Application.Contracts.TourManagerAssignment;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.TourManagerAssignment.Queries;

public sealed record GetTourManagerAssignmentsQuery(Guid? ManagerId = null)
    : IQuery<ErrorOr<List<TourManagerSummaryVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourManagerAssignment}:all:{ManagerId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetTourManagerAssignmentsQueryHandler(
        Domain.Common.Repositories.ITourManagerAssignmentRepository repository)
    : IQueryHandler<GetTourManagerAssignmentsQuery, ErrorOr<List<TourManagerSummaryVm>>>
{
    public async Task<ErrorOr<List<TourManagerSummaryVm>>> Handle(
        GetTourManagerAssignmentsQuery request,
        CancellationToken cancellationToken)
    {
        var assignments = await repository.GetAllSummariesAsync(cancellationToken);

        var summaries = assignments
            .GroupBy(a => a.TourManagerId)
            .Select(g =>
            {
                var manager = g.First().TourManager;
                return new TourManagerSummaryVm(
                    g.Key,
                    manager.FullName ?? manager.Username,
                    manager.Email,
                    g.Count(a => a.AssignedEntityType == AssignedEntityType.TourDesigner),
                    g.Count(a => a.AssignedEntityType == AssignedEntityType.TourGuide),
                    g.Count(a => a.AssignedEntityType == AssignedEntityType.Tour));
            })
            .ToList();

        if (request.ManagerId.HasValue)
        {
            summaries = summaries.Where(s => s.ManagerId == request.ManagerId.Value).ToList();
        }

        return summaries;
    }
}

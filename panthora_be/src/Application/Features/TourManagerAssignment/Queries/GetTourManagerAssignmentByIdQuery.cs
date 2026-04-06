using Application.Contracts.TourManagerAssignment;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Features.TourManagerAssignment.Queries;

public sealed record GetTourManagerAssignmentByIdQuery(Guid ManagerId)
    : IQuery<ErrorOr<TourManagerAssignmentDetailVm>>;

public sealed class GetTourManagerAssignmentByIdQueryHandler(
        Domain.Common.Repositories.ITourManagerAssignmentRepository repository)
    : IQueryHandler<GetTourManagerAssignmentByIdQuery, ErrorOr<TourManagerAssignmentDetailVm>>
{
    public async Task<ErrorOr<TourManagerAssignmentDetailVm>> Handle(
        GetTourManagerAssignmentByIdQuery request,
        CancellationToken cancellationToken)
    {
        var assignments = await repository.GetByManagerIdAsync(request.ManagerId, cancellationToken);

        if (!assignments.Any())
        {
            return Error.NotFound(
                code: "TourManagerAssignment.NotFound",
                description: "Tour manager assignment not found.");
        }

        var manager = assignments.First().TourManager!;

        var items = assignments.Select(a => new AssignmentItemVm(
            Id: a.Id,
            UserId: a.AssignedUserId,
            UserName: a.AssignedUser != null ? (a.AssignedUser.FullName ?? a.AssignedUser.Username) : null,
            UserEmail: a.AssignedUser?.Email,
            TourId: a.AssignedTourId,
            TourName: a.AssignedTour?.TourName,
            EntityType: (int)a.AssignedEntityType,
            RoleInTeam: a.AssignedRoleInTeam.HasValue ? (int)a.AssignedRoleInTeam.Value : null,
            CreatedAt: a.CreatedOnUtc)).ToList();

        return new TourManagerAssignmentDetailVm(
            ManagerId: request.ManagerId,
            ManagerName: manager.FullName ?? manager.Username,
            ManagerEmail: manager.Email,
            Assignments: items);
    }
}

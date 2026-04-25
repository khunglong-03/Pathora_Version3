using Application.Contracts.TourManagerAssignment;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourManagerAssignment.Queries;
public sealed record GetTourManagerAssignmentByIdQuery([property: JsonPropertyName("managerId")] Guid ManagerId)
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
            a.Id,
            a.AssignedUserId,
            a.AssignedUser != null ? (a.AssignedUser.FullName ?? a.AssignedUser.Username) : null,
            a.AssignedUser?.Email,
            a.AssignedTourId,
            a.AssignedTour?.TourName,
            (int)a.AssignedEntityType,
            a.AssignedRoleInTeam.HasValue ? (int)a.AssignedRoleInTeam.Value : null,
            a.CreatedOnUtc)).ToList();

        return new TourManagerAssignmentDetailVm(
            ManagerId: request.ManagerId,
            ManagerName: manager.FullName ?? manager.Username,
            ManagerEmail: manager.Email,
            Assignments: items);
    }
}

using Application.Features.TourManagerAssignment.Commands.RemoveTourManagerAssignment;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.TourManagerAssignment.Commands.RemoveTourManagerAssignment;

public sealed class RemoveTourManagerAssignmentCommandHandler(
        ITourManagerAssignmentRepository repository)
    : ICommandHandler<RemoveTourManagerAssignmentCommand, ErrorOr<Success>>
{
    private readonly ITourManagerAssignmentRepository _repository = repository;

    public async Task<ErrorOr<Success>> Handle(
        RemoveTourManagerAssignmentCommand request,
        CancellationToken cancellationToken)
    {
        await _repository.RemoveAsync(
            request.ManagerId,
            request.AssignedUserId,
            request.AssignedTourId,
            (AssignedEntityType)request.AssignedEntityType,
            cancellationToken);

        return Result.Success;
    }
}

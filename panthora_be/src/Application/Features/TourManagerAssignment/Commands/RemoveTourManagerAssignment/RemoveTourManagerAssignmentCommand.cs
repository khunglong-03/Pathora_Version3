using Application.Common;
using Application.Features.TourManagerAssignment.Commands.RemoveTourManagerAssignment;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
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

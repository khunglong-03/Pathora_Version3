using Application.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.Tour.Commands;

public sealed record UpdateTourStatusCommand(
    Guid Id,
    TourStatus Status) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Tour];
}

public sealed class UpdateTourStatusCommandHandler(ITourService tourService)
    : ICommandHandler<UpdateTourStatusCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateTourStatusCommand request, CancellationToken cancellationToken)
    {
        return await tourService.UpdateStatus(request.Id, request.Status);
    }
}

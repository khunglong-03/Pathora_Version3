using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.TourInstance.Commands;

public sealed record DeleteTourInstanceCommand(Guid Id) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class DeleteTourInstanceCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<DeleteTourInstanceCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteTourInstanceCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.Delete(request.Id);
    }
}

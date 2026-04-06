using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.Tour.Commands;

public sealed record DeleteTourCommand(Guid Id) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Tour];
}

public sealed class DeleteTourCommandHandler(ITourService tourService)
    : ICommandHandler<DeleteTourCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteTourCommand request, CancellationToken cancellationToken)
    {
        return await tourService.Delete(request.Id);
    }
}




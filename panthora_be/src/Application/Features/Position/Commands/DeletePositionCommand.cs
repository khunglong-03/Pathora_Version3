using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.Position.Commands;

public sealed record DeletePositionCommand(Guid Id) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Position];
}

public sealed class DeletePositionCommandHandler(IPositionService positionService)
    : ICommandHandler<DeletePositionCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeletePositionCommand request, CancellationToken cancellationToken)
    {
        return await positionService.DeleteAsync(request.Id);
    }
}




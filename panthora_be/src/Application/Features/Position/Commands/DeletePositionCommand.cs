using Application.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Position.Commands;

public sealed record DeletePositionCommand([property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>, ICacheInvalidator
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




using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Contracts.Position;
using Application.Services;
using System.Text.Json.Serialization;

namespace Application.Features.Position.Commands;

public sealed record UpdatePositionCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("level")] int Level,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("type")] int? Type) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Position];
}

public sealed class UpdatePositionCommandHandler(IPositionService positionService)
    : ICommandHandler<UpdatePositionCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdatePositionCommand request, CancellationToken cancellationToken)
    {
        return await positionService.UpdateAsync(new UpdatePositionRequest(request.Id, request.Name, request.Level, request.Note, request.Type));
    }
}




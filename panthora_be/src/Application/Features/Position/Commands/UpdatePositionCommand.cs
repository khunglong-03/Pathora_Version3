using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Contracts.Position;
using Application.Services;

namespace Application.Features.Position.Commands;

public sealed record UpdatePositionCommand(Guid Id, string Name, int Level, string? Note, int? Type) : ICommand<ErrorOr<Success>>, ICacheInvalidator
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




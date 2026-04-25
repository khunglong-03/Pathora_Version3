using Application.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;
public sealed record DeleteTourInstanceCommand([property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>, ICacheInvalidator
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

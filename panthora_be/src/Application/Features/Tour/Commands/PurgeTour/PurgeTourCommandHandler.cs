using Application.Common.Constant;
using BuildingBlocks.CORS;
using ErrorOr;
using Microsoft.Extensions.Logging;

namespace Application.Features.Tour.Commands.PurgeTour;

public sealed class PurgeTourCommandHandler(
    ITourPurgeExecutor executor,
    ILogger<PurgeTourCommandHandler>? logger = null)
    : ICommandHandler<PurgeTourCommand, ErrorOr<Success>>
{
    private readonly ILogger<PurgeTourCommandHandler>? _logger = logger;

    public async Task<ErrorOr<Success>> Handle(
        PurgeTourCommand request,
        CancellationToken cancellationToken)
    {
        _logger?.LogInformation("Purging tour {TourId}", request.TourId);

        var result = await executor.ExecuteAsync(request.TourId, cancellationToken);

        if (result == PurgeResult.NotFound)
        {
            _logger?.LogWarning("Tour {TourId} not found for purge", request.TourId);
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.NotFoundDescription);
        }

        _logger?.LogInformation("Successfully purged tour {TourId}", request.TourId);
        return Result.Success;
    }
}

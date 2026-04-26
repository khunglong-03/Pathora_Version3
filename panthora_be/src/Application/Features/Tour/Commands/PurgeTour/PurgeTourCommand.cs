using Application.Common.Constant;
using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Application.Features.Tour.Commands.PurgeTour;

public sealed record PurgeTourCommand([property: JsonPropertyName("tourId")] Guid TourId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Tour];
}


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


public sealed class PurgeTourCommandValidator : AbstractValidator<PurgeTourCommand>
{
    public PurgeTourCommandValidator()
    {
        RuleFor(x => x.TourId)
            .NotEmpty().WithMessage(ValidationMessages.TourIdRequired);
    }
}

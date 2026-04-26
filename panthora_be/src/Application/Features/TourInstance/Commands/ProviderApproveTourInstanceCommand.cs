using Application.Common.Constant;
using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public sealed record ProviderApproveTourInstanceCommand(
    [property: JsonPropertyName("instanceId")] Guid InstanceId,
    [property: JsonPropertyName("isApproved")] bool IsApproved,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("providerType")] string ProviderType,
    [property: JsonPropertyName("accommodationActivityIds")] List<Guid>? AccommodationActivityIds = null,
    [property: JsonPropertyName("transportationActivityIds")] List<Guid>? TransportationActivityIds = null) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class ProviderApproveTourInstanceCommandValidator : AbstractValidator<ProviderApproveTourInstanceCommand>
{
    public ProviderApproveTourInstanceCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.Note).MaximumLength(1000);
        RuleFor(x => x.ProviderType).Must(x => x is "Hotel" or "Transport").WithMessage("ProviderType must be either 'Hotel' or 'Transport'.");
        RuleForEach(x => x.AccommodationActivityIds).NotEmpty();
    }
}

public sealed class ProviderApproveTourInstanceCommandHandler(
    ITourInstanceService tourInstanceService,
    ITourInstanceRepository tourInstanceRepository)
    : ICommandHandler<ProviderApproveTourInstanceCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ProviderApproveTourInstanceCommand request, CancellationToken cancellationToken)
    {
        if (request.ProviderType != "Transport" || !request.IsApproved)
            return await tourInstanceService.ProviderApprove(
                request.InstanceId,
                request.IsApproved,
                request.Note,
                request.ProviderType,
                request.AccommodationActivityIds,
                request.TransportationActivityIds,
                cancellationToken);

        var instance = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId, cancellationToken);
        if (instance == null)
            return Error.NotFound("TourInstance.NotFound", "Tour Instance not found.");

        var requestedTransportActivityIds = request.TransportationActivityIds?.ToHashSet();

        var unassignedActivityIds = instance.InstanceDays
            .SelectMany(d => d.Activities)
            .Where(a => a.ActivityType == TourDayActivityType.Transportation
                        && !a.HasCompleteVehicleAndDriverAssignment()
                        && (requestedTransportActivityIds is null || requestedTransportActivityIds.Contains(a.Id)))
            .Select(a => a.Id)
            .ToList();

        if (unassignedActivityIds.Count > 0)
        {
            return Error.Validation(
                "TourInstance.RoutesNotAssigned",
                $"Các hoạt động vận chuyển chưa được gán xe/tài xế: {string.Join(", ", unassignedActivityIds)}");
        }

        return await tourInstanceService.ProviderApprove(
            request.InstanceId,
            request.IsApproved,
            request.Note,
            request.ProviderType,
            request.AccommodationActivityIds,
            request.TransportationActivityIds,
            cancellationToken);
    }
}

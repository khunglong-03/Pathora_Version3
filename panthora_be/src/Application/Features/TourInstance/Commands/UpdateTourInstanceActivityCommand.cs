using Application.Common.Constant;
using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;
using Domain.Enums;

namespace Application.Features.TourInstance.Commands;

public sealed record UpdateTourInstanceActivityCommand(
    [property: JsonPropertyName("instanceId")] Guid InstanceId,
    [property: JsonPropertyName("dayId")] Guid DayId,
    [property: JsonPropertyName("activityId")] Guid ActivityId,
    [property: JsonPropertyName("note")] string? Note = null,
    [property: JsonPropertyName("startTime")] TimeOnly? StartTime = null,
    [property: JsonPropertyName("endTime")] TimeOnly? EndTime = null,
    [property: JsonPropertyName("price")] decimal? Price = null,
    [property: JsonPropertyName("isOptional")] bool? IsOptional = null,
    [property: JsonPropertyName("transportationType")] TransportationType? TransportationType = null,
    [property: JsonPropertyName("transportationName")] string? TransportationName = null,
    [property: JsonPropertyName("fromLocationId")] Guid? FromLocationId = null,
    [property: JsonPropertyName("toLocationId")] Guid? ToLocationId = null,
    [property: JsonPropertyName("departureTime")] DateTimeOffset? DepartureTime = null,
    [property: JsonPropertyName("arrivalTime")] DateTimeOffset? ArrivalTime = null,
    [property: JsonPropertyName("requestedVehicleType")] VehicleType? RequestedVehicleType = null,
    [property: JsonPropertyName("requestedSeatCount")] int? RequestedSeatCount = null,
    [property: JsonPropertyName("externalTransportReference")] string? ExternalTransportReference = null) : ICommand<ErrorOr<TourInstanceDayActivityDto>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance, $"{CacheKey.TourInstance}:detail:{InstanceId}"];
}

public sealed class UpdateTourInstanceActivityCommandValidator : AbstractValidator<UpdateTourInstanceActivityCommand>
{
    public UpdateTourInstanceActivityCommandValidator()
    {
        RuleFor(x => x.InstanceId)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceIdRequired);

        RuleFor(x => x.DayId)
            .NotEmpty().WithMessage("Day ID is required.");

        RuleFor(x => x.ActivityId)
            .NotEmpty().WithMessage("Activity ID is required.");

        When(x => x.TransportationType.HasValue && x.TransportationType.IsExternalOnly(), () =>
        {
            RuleFor(x => x.RequestedVehicleType)
                .Null()
                .WithErrorCode(TourInstanceTransportErrors.GroundFieldsNotAllowedForExternalCode)
                .WithMessage(TourInstanceTransportErrors.GroundFieldsNotAllowedForExternalDescription.En);

            RuleFor(x => x.RequestedSeatCount)
                .Null()
                .WithErrorCode(TourInstanceTransportErrors.GroundFieldsNotAllowedForExternalCode)
                .WithMessage(TourInstanceTransportErrors.GroundFieldsNotAllowedForExternalDescription.En);
        });

        When(x => x.TransportationType.HasValue && !x.TransportationType.IsExternalOnly(), () =>
        {
            RuleFor(x => x.DepartureTime)
                .Null()
                .WithErrorCode(TourInstanceTransportErrors.ExternalFieldsNotAllowedForGroundCode)
                .WithMessage(TourInstanceTransportErrors.ExternalFieldsNotAllowedForGroundDescription.En);

            RuleFor(x => x.ArrivalTime)
                .Null()
                .WithErrorCode(TourInstanceTransportErrors.ExternalFieldsNotAllowedForGroundCode)
                .WithMessage(TourInstanceTransportErrors.ExternalFieldsNotAllowedForGroundDescription.En);

            RuleFor(x => x.ExternalTransportReference)
                .Null()
                .WithErrorCode(TourInstanceTransportErrors.ExternalFieldsNotAllowedForGroundCode)
                .WithMessage(TourInstanceTransportErrors.ExternalFieldsNotAllowedForGroundDescription.En);
        });
    }
}

public sealed class UpdateTourInstanceActivityCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<UpdateTourInstanceActivityCommand, ErrorOr<TourInstanceDayActivityDto>>
{
    public async Task<ErrorOr<TourInstanceDayActivityDto>> Handle(UpdateTourInstanceActivityCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.UpdateActivity(request);
    }
}

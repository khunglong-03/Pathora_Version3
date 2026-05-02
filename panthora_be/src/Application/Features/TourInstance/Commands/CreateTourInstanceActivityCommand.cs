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

public sealed record CreateTourInstanceActivityCommand(
    [property: JsonIgnore] Guid InstanceId,
    [property: JsonIgnore] Guid DayId,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("activityType")] TourDayActivityType ActivityType,
    [property: JsonPropertyName("description")] string? Description = null,
    [property: JsonPropertyName("note")] string? Note = null,
    [property: JsonPropertyName("startTime")] TimeOnly? StartTime = null,
    [property: JsonPropertyName("endTime")] TimeOnly? EndTime = null,
    [property: JsonPropertyName("price")] decimal? Price = null,
    [property: JsonPropertyName("isOptional")] bool IsOptional = false,
    [property: JsonPropertyName("transportationType")] TransportationType? TransportationType = null,
    [property: JsonPropertyName("transportationName")] string? TransportationName = null,
    [property: JsonPropertyName("fromLocationId")] Guid? FromLocationId = null,
    [property: JsonPropertyName("toLocationId")] Guid? ToLocationId = null,
    [property: JsonPropertyName("departureTime")] DateTimeOffset? DepartureTime = null,
    [property: JsonPropertyName("arrivalTime")] DateTimeOffset? ArrivalTime = null,
    [property: JsonPropertyName("requestedVehicleType")] VehicleType? RequestedVehicleType = null,
    [property: JsonPropertyName("requestedSeatCount")] int? RequestedSeatCount = null,
    [property: JsonPropertyName("externalTransportReference")] string? ExternalTransportReference = null,
    [property: JsonPropertyName("roomType")] RoomType? RoomType = null,
    [property: JsonPropertyName("roomCount")] int? RoomCount = null) : ICommand<ErrorOr<TourInstanceDayActivityDto>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance, $"{CacheKey.TourInstance}:detail:{InstanceId}"];
}

public sealed class CreateTourInstanceActivityCommandValidator : AbstractValidator<CreateTourInstanceActivityCommand>
{
    public CreateTourInstanceActivityCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty().WithMessage(ValidationMessages.TourInstanceIdRequired);
        RuleFor(x => x.DayId).NotEmpty().WithMessage("Day ID is required.");
        RuleFor(x => x.Title).NotEmpty().WithMessage("Title is required.");
        When(x => x.StartTime.HasValue && x.EndTime.HasValue, () =>
        {
            RuleFor(x => x)
                .Must(x => x.StartTime!.Value < x.EndTime!.Value)
                .WithMessage("Giờ bắt đầu phải trước giờ kết thúc.");
        });

        // Rules for TransportationType
        When(x => x.ActivityType == TourDayActivityType.Transportation, () =>
        {
            RuleFor(x => x.TransportationType)
                .NotNull()
                .WithErrorCode(TourInstanceTransportErrors.TransportationTypeRequiredCode)
                .WithMessage(TourInstanceTransportErrors.TransportationTypeRequiredDescription.En);

            When(x => x.TransportationType.IsExternalOnly(), () =>
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
        }).Otherwise(() =>
        {
            RuleFor(x => x.TransportationType)
                .Null()
                .WithErrorCode(TourInstanceTransportErrors.TransportationTypeNotAllowedCode)
                .WithMessage(TourInstanceTransportErrors.TransportationTypeNotAllowedDescription.En);
        });

        When(x => x.ActivityType == TourDayActivityType.Accommodation, () =>
        {
            RuleFor(x => x.RoomType)
                .NotNull()
                .WithMessage("Room type is required for accommodation activity.");
            RuleFor(x => x.RoomCount)
                .NotNull()
                .GreaterThan(0)
                .LessThanOrEqualTo(1000)
                .WithMessage("Room count must be between 1 and 1000.");
        }).Otherwise(() =>
        {
            RuleFor(x => x.RoomType)
                .Null()
                .WithMessage("Room type is only allowed for accommodation activity.");
            RuleFor(x => x.RoomCount)
                .Null()
                .WithMessage("Room count is only allowed for accommodation activity.");
        });
    }
}

public sealed class CreateTourInstanceActivityCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<CreateTourInstanceActivityCommand, ErrorOr<TourInstanceDayActivityDto>>
{
    public async Task<ErrorOr<TourInstanceDayActivityDto>> Handle(CreateTourInstanceActivityCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.CreateActivity(request);
    }
}

using Application.Common.Constant;
using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public sealed record UpdateTourInstanceActivityCommand(
    [property: JsonPropertyName("instanceId")] Guid InstanceId,
    [property: JsonPropertyName("dayId")] Guid DayId,
    [property: JsonPropertyName("activityId")] Guid ActivityId,
    [property: JsonPropertyName("note")] string? Note = null,
    [property: JsonPropertyName("startTime")] TimeOnly? StartTime = null,
    [property: JsonPropertyName("endTime")] TimeOnly? EndTime = null,
    [property: JsonPropertyName("isOptional")] bool? IsOptional = null) : ICommand<ErrorOr<TourDayActivityDto>>, ICacheInvalidator
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
    }
}

public sealed class UpdateTourInstanceActivityCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<UpdateTourInstanceActivityCommand, ErrorOr<TourDayActivityDto>>
{
    public async Task<ErrorOr<TourDayActivityDto>> Handle(UpdateTourInstanceActivityCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.UpdateActivity(request);
    }
}

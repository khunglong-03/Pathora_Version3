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
    [property: JsonPropertyName("isOptional")] bool IsOptional = false) : ICommand<ErrorOr<TourInstanceDayActivityDto>>, ICacheInvalidator
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

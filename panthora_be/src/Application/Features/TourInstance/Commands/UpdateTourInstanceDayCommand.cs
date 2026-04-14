using Application.Common;
using Application.Common.Constant;
using Application.Dtos;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using FluentValidation;
using ErrorOr;
using Application.Services;

namespace Application.Features.TourInstance.Commands;

public sealed record UpdateTourInstanceDayCommand(
    Guid InstanceId,
    Guid DayId,
    string Title,
    DateOnly ActualDate,
    string? Description = null,
    TimeOnly? StartTime = null,
    TimeOnly? EndTime = null,
    string? Note = null) : ICommand<ErrorOr<TourInstanceDayDto>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance, $"{CacheKey.TourInstance}:detail:{InstanceId}"];
}

public sealed class UpdateTourInstanceDayCommandValidator : AbstractValidator<UpdateTourInstanceDayCommand>
{
    public UpdateTourInstanceDayCommandValidator()
    {
        RuleFor(x => x.InstanceId)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceIdRequired);

        RuleFor(x => x.DayId)
            .NotEmpty().WithMessage("Day ID is required.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.");

        RuleFor(x => x.ActualDate)
            .NotEmpty().WithMessage("Actual date is required.");

        When(x => x.StartTime.HasValue && x.EndTime.HasValue, () =>
        {
            RuleFor(x => x)
                .Must(x => x.StartTime!.Value < x.EndTime!.Value)
                .WithMessage("Giờ bắt đầu phải trước giờ kết thúc.");
        });
    }
}

public sealed class UpdateTourInstanceDayCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<UpdateTourInstanceDayCommand, ErrorOr<TourInstanceDayDto>>
{
    public async Task<ErrorOr<TourInstanceDayDto>> Handle(UpdateTourInstanceDayCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.UpdateDay(request);
    }
}

using Application.Common;
using Application.Common.Constant;
using Application.Dtos;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using FluentValidation;
using ErrorOr;
using Application.Services;

namespace Application.Features.TourInstance.Commands;

public sealed record UpdateTourInstanceActivityCommand(
    Guid InstanceId,
    Guid DayId,
    Guid ActivityId,
    string? Note = null,
    TimeOnly? StartTime = null,
    TimeOnly? EndTime = null,
    bool? IsOptional = null) : ICommand<ErrorOr<TourDayActivityDto>>, ICacheInvalidator
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

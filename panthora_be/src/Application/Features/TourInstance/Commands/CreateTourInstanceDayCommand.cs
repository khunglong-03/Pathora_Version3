using Application.Common;
using Application.Common.Constant;
using Application.Dtos;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using FluentValidation;
using ErrorOr;
using Application.Services;

namespace Application.Features.TourInstance.Commands;

public sealed record CreateTourInstanceDayCommand(
    Guid InstanceId,
    string Title,
    DateOnly ActualDate,
    string? Description = null) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance, $"{CacheKey.TourInstance}:detail:{InstanceId}"];
}

public sealed class CreateTourInstanceDayCommandValidator : AbstractValidator<CreateTourInstanceDayCommand>
{
    public CreateTourInstanceDayCommandValidator()
    {
        RuleFor(x => x.InstanceId)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceIdRequired);

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.");

        RuleFor(x => x.ActualDate)
            .NotEmpty().WithMessage("Actual date is required.");
    }
}

public sealed class CreateTourInstanceDayCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<CreateTourInstanceDayCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateTourInstanceDayCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.AddCustomDay(request);
    }
}

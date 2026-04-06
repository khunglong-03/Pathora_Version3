using Application.Common;
using Application.Common.Constant;
using Application.Dtos;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using Application.Services;

namespace Application.Features.TourInstance.Commands;

public sealed record UpdateTourInstanceCommand(
    Guid Id,
    string Title,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    int MaxParticipation,
    decimal BasePrice,
    string? Location = null,
    DateTimeOffset? ConfirmationDeadline = null,
    List<string>? IncludedServices = null,
    List<Guid>? GuideUserIds = null,
    List<Guid>? ManagerUserIds = null,
    ImageEntity? Thumbnail = null,
    List<ImageEntity>? Images = null) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class UpdateTourInstanceCommandValidator : AbstractValidator<UpdateTourInstanceCommand>
{
    public UpdateTourInstanceCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceIdRequired);

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceTitleRequired);

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceStartDateRequired);

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceEndDateRequired)
            .GreaterThan(x => x.StartDate).WithMessage(ValidationMessages.TourInstanceEndDateAfterStart);

        RuleFor(x => x.MaxParticipation)
            .GreaterThan(0).WithMessage(ValidationMessages.TourInstanceMaxParticipantsGreaterThanZero);

        RuleFor(x => x.BasePrice)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.TourInstanceBasePriceNonNegative);

        RuleFor(x => x.GuideUserIds)
            .Must(ids => ids == null || ids.Distinct().Count() == ids.Count)
            .WithMessage(ValidationMessages.TourInstanceGuideIdsNotDuplicate)
            .When(x => x.GuideUserIds is { Count: > 0 });

        RuleFor(x => x.ManagerUserIds)
            .Must(ids => ids == null || ids.Distinct().Count() == ids.Count)
            .WithMessage(ValidationMessages.TourInstanceManagerIdsNotDuplicate)
            .When(x => x.ManagerUserIds is { Count: > 0 });

        RuleFor(x => x)
            .Must(x => x.GuideUserIds == null || x.ManagerUserIds == null ||
                       !x.GuideUserIds.Any(g => x.ManagerUserIds.Contains(g)))
            .WithMessage(ValidationMessages.TourInstanceUserCannotBeBothGuideAndManager);
    }
}

public sealed class UpdateTourInstanceCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<UpdateTourInstanceCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateTourInstanceCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.Update(request);
    }
}

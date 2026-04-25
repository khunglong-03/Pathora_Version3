using Application.Common.Constant;
using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;
public sealed record UpdateTourInstanceCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("endDate")] DateTimeOffset EndDate,
    [property: JsonPropertyName("maxParticipation")] int MaxParticipation,
    [property: JsonPropertyName("basePrice")] decimal BasePrice,
    [property: JsonPropertyName("location")] string? Location = null,
    [property: JsonPropertyName("confirmationDeadline")] DateTimeOffset? ConfirmationDeadline = null,
    [property: JsonPropertyName("includedServices")] List<string>? IncludedServices = null,
    [property: JsonPropertyName("guideUserIds")] List<Guid>? GuideUserIds = null,
    [property: JsonPropertyName("managerUserIds")] List<Guid>? ManagerUserIds = null,
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
            .GreaterThanOrEqualTo(x => x.StartDate).WithMessage(ValidationMessages.TourInstanceEndDateAfterStart);

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

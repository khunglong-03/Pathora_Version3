using Application.Common.Constant;
using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.Behaviors;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Entities.Translations;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;
public sealed record CreateTourInstanceCommand(
    [property: JsonPropertyName("tourId")] Guid TourId,
    [property: JsonPropertyName("classificationId")] Guid ClassificationId,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("instanceType")] TourType InstanceType,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("endDate")] DateTimeOffset EndDate,
    [property: JsonPropertyName("maxParticipation")] int MaxParticipation,
    [property: JsonPropertyName("basePrice")] decimal BasePrice,
    [property: JsonPropertyName("includedServices")] List<string>? IncludedServices = null,
    [property: JsonPropertyName("location")] string? Location = null,
    [property: JsonPropertyName("guideUserIds")] List<Guid>? GuideUserIds = null,
    [property: JsonPropertyName("thumbnailUrl")] string? ThumbnailUrl = null,
    [property: JsonPropertyName("tourRequestId")] Guid? TourRequestId = null,
    [property: JsonPropertyName("imageUrls")] List<string>? ImageUrls = null,
    [property: JsonPropertyName("translations")] Dictionary<string, TourInstanceTranslationData>? Translations = null,
    [property: JsonPropertyName("activityAssignments")] List<CreateTourInstanceActivityAssignmentDto>? ActivityAssignments = null) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class CreateTourInstanceCommandValidator : AbstractValidator<CreateTourInstanceCommand>
{
    public CreateTourInstanceCommandValidator()
    {
        RuleFor(x => x.TourId)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceTourIdRequired);

        RuleFor(x => x.ClassificationId)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceClassificationIdRequired);

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceTitleRequired);

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceStartDateRequired)
            .Must(date => date.Date >= DateTimeOffset.UtcNow.Date)
            .WithMessage("Ngày bắt đầu không được nằm trong quá khứ.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceEndDateRequired)
            .GreaterThanOrEqualTo(x => x.StartDate).WithMessage(ValidationMessages.TourInstanceEndDateAfterStart);

        RuleFor(x => x.MaxParticipation)
            .GreaterThan(0).WithMessage(ValidationMessages.TourInstanceMaxParticipantsGreaterThanZero);

        RuleFor(x => x.BasePrice)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceBasePriceRequired)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.TourInstanceBasePriceNonNegative);

        RuleFor(x => x.InstanceType)
            .IsInEnum().WithMessage(ValidationMessages.TourInstanceInstanceTypeInvalid);

        RuleForEach(x => x.ActivityAssignments)
            .SetValidator(new CreateTourInstanceActivityAssignmentDtoValidator());

        // When a per-activity transport plan specifies seat count, it must cover the tour size (TC1.3)
        RuleFor(x => x)
            .Must(cmd => cmd.ActivityAssignments is null
                || !cmd.ActivityAssignments.Any(a =>
                    a.RequestedSeatCount.HasValue
                    && a.RequestedSeatCount.Value < cmd.MaxParticipation))
            .WithMessage("Số ghế yêu cầu (RequestedSeatCount) phải lớn hơn hoặc bằng MaxParticipation khi được chỉ định.");
    }
}

public sealed class CreateTourInstanceActivityAssignmentDtoValidator : AbstractValidator<CreateTourInstanceActivityAssignmentDto>
{
    public CreateTourInstanceActivityAssignmentDtoValidator()
    {
        RuleFor(x => x.OriginalActivityId).NotEmpty();

        RuleFor(x => x.RequestedSeatCount)
            .GreaterThan(0).When(x => x.RequestedSeatCount.HasValue)
            .WithMessage("Requested seat count must be greater than zero.");

        RuleFor(x => x.RequestedVehicleType)
            .IsInEnum().When(x => x.RequestedVehicleType.HasValue)
            .WithMessage("Invalid vehicle type requested.");

        RuleFor(x => x.RequestedVehicleType)
            .Must(vt => vt.HasValue)
            .When(x => x.TransportSupplierId.HasValue)
            .WithMessage("Phải chọn loại xe khi đã chọn nhà cung cấp vận chuyển.");
    }
}

public sealed class CreateTourInstanceCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<CreateTourInstanceCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateTourInstanceCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.Create(request);
    }
}

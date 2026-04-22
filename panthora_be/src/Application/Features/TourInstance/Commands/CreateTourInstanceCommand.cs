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

public sealed record CreateTourInstanceCommand(
    Guid TourId,
    Guid ClassificationId,
    string Title,
    TourType InstanceType,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    int MaxParticipation,
    decimal BasePrice,
    List<string>? IncludedServices = null,
    List<Guid>? GuideUserIds = null,
    string? ThumbnailUrl = null,
    Guid? TourRequestId = null,
    List<string>? ImageUrls = null,
    [property: Obsolete("Use per-activity TransportSupplierId in ActivityAssignments instead.")]
    Guid? TransportProviderId = null,
    List<CreateTourInstanceActivityAssignmentDto>? ActivityAssignments = null) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
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

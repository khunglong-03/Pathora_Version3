using Application.Common;
using Application.Common.Constant;
using Application.Dtos;
using Application.Features.Tour.Validators;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Entities.Translations;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using Application.Services;

namespace Application.Features.Tour.Commands;

public sealed record CreateTourCommand(
    string TourName,
    string ShortDescription,
    string LongDescription,
    string? SEOTitle,
    string? SEODescription,
    TourStatus Status,
    ImageInputDto? Thumbnail = null,
    List<ImageInputDto>? Images = null,
    Dictionary<string, TourTranslationData>? Translations = null,
    List<ClassificationDto>? Classifications = null,
    List<AccommodationDto>? Accommodations = null,
    List<LocationDto>? Locations = null,
    List<TransportationDto>? Transportations = null,
    List<ServiceDto>? Services = null,
    Guid? VisaPolicyId = null,
    Guid? DepositPolicyId = null,
    Guid? PricingPolicyId = null,
    Guid? CancellationPolicyId = null,
    TourScope TourScope = TourScope.Domestic,
    Continent? Continent = null,
    CustomerSegment CustomerSegment = CustomerSegment.Group) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Tour];
}

public sealed class CreateTourCommandValidator : AbstractValidator<CreateTourCommand>
{
    public CreateTourCommandValidator()
    {
        // TourName - Required, Max 500 chars
        RuleFor(x => x.TourName)
            .NotEmpty().WithMessage(ValidationMessages.TourNameRequired)
            .MaximumLength(500).WithMessage(ValidationMessages.TourNameMaxLength500);

        // ShortDescription - Required, Max 250 chars
        RuleFor(x => x.ShortDescription)
            .NotEmpty().WithMessage(ValidationMessages.ShortDescriptionRequired)
            .MaximumLength(250).WithMessage(ValidationMessages.ShortDescriptionMaxLength250);

        // LongDescription - Required, Max 5000 chars
        RuleFor(x => x.LongDescription)
            .NotEmpty().WithMessage(ValidationMessages.LongDescriptionRequired)
            .MaximumLength(5000).WithMessage(ValidationMessages.LongDescriptionMaxLength5000);

        // SEOTitle - Optional, Max 70 chars
        RuleFor(x => x.SEOTitle)
            .MaximumLength(70).WithMessage(ValidationMessages.SEOTitleMaxLength70)
            .When(x => x.SEOTitle != null);

        // SEODescription - Optional, Max 320 chars
        RuleFor(x => x.SEODescription)
            .MaximumLength(320).WithMessage(ValidationMessages.SEODescriptionMaxLength320)
            .When(x => x.SEODescription != null);

        // Status - Required
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage(ValidationMessages.TourStatusInvalid);

        // TourScope - Optional with default
        RuleFor(x => x.TourScope)
            .IsInEnum().WithMessage(ValidationMessages.TourScopeInvalid);

        // CustomerSegment - Optional with default
        RuleFor(x => x.CustomerSegment)
            .IsInEnum().WithMessage(ValidationMessages.CustomerSegmentInvalid);

        // Continent - Required when TourScope is International
        RuleFor(x => x.Continent)
            .NotNull().WithMessage("Châu lục là bắt buộc khi phạm vi tour là Quốc tế")
            .When(x => x.TourScope == TourScope.International);

        // Thumbnail - Required
        RuleFor(x => x.Thumbnail)
            .NotNull().WithMessage(ValidationMessages.ThumbnailRequired)
            .SetValidator(new ImageInputDtoValidator()!);

        // Classifications - Optional but if provided must have at least 1 item
        RuleFor(x => x.Classifications)
            .Must(cls => cls == null || cls.Count > 0)
            .WithMessage(ValidationMessages.TourClassificationsMinOne);

        RuleForEach(x => x.Classifications)
            .SetValidator(new ClassificationDtoValidator())
            .When(x => x.Classifications != null && x.Classifications.Any());

        // Images - Required, at least 1 image
        RuleFor(x => x.Images)
            .NotNull().WithMessage(ValidationMessages.ImagesRequired)
            .Must(images => images != null && images.Count > 0)
            .WithMessage(ValidationMessages.ImagesAtLeastOne);

        RuleForEach(x => x.Images)
            .SetValidator(new ImageInputDtoValidator()!)
            .When(x => x.Images != null);

        // Accommodations - Optional but if provided must have at least 1 item
        RuleFor(x => x.Accommodations)
            .Must(acc => acc == null || acc.Count > 0)
            .WithMessage(ValidationMessages.TourAccommodationsMinOne);

        RuleForEach(x => x.Accommodations)
            .SetValidator(new AccommodationDtoValidator())
            .When(x => x.Accommodations != null && x.Accommodations.Any());

        // Locations - Optional but if provided must have at least 1 item
        RuleFor(x => x.Locations)
            .Must(loc => loc == null || loc.Count > 0)
            .WithMessage(ValidationMessages.TourLocationsMinOne);

        RuleForEach(x => x.Locations)
            .SetValidator(new LocationDtoValidator())
            .When(x => x.Locations != null && x.Locations.Any());

        // Transportations - Optional but if provided must have at least 1 item
        RuleFor(x => x.Transportations)
            .Must(tr => tr == null || tr.Count > 0)
            .WithMessage(ValidationMessages.TourTransportationsMinOne);

        RuleForEach(x => x.Transportations)
            .SetValidator(new TransportationDtoValidator())
            .When(x => x.Transportations != null && x.Transportations.Any());

        // Services - Optional but if provided must have at least 1 item
        RuleFor(x => x.Services)
            .Must(svc => svc == null || svc.Count > 0)
            .WithMessage(ValidationMessages.TourServicesMinOne);

        RuleForEach(x => x.Services)
            .SetValidator(new ServiceDtoValidator())
            .When(x => x.Services != null && x.Services.Any());
    }
}

public sealed class CreateTourCommandHandler(ITourService tourService)
    : ICommandHandler<CreateTourCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateTourCommand request, CancellationToken cancellationToken)
    {
        return await tourService.Create(request, isManager: false);
    }
}




using Application.Common.Constant;
using Application.Common;
using Application.Dtos;
using Application.Features.Tour.Commands;
using Domain.Enums;
using FluentValidation;

namespace Application.Features.Tour.Validators;

public sealed class ImageInputDtoValidator : AbstractValidator<ImageInputDto>
{
    public ImageInputDtoValidator()
    {
        RuleFor(x => x.FileId)
            .NotEmpty().WithMessage(ValidationMessages.ImageFileIdRequired);

        RuleFor(x => x.OriginalFileName)
            .NotEmpty().WithMessage(ValidationMessages.ImageOriginalFileNameRequired);

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage(ValidationMessages.ImageFileNameRequired);

        RuleFor(x => x.PublicURL)
            .NotEmpty().WithMessage(ValidationMessages.ImagePublicUrlRequired)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage(ValidationMessages.ImagePublicUrlInvalid);
    }
}

public sealed class ClassificationDtoValidator : AbstractValidator<ClassificationDto>
{
    public ClassificationDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationMessages.ClassificationNameRequired)
            .MaximumLength(200).WithMessage(ValidationMessages.ClassificationNameMaxLength200);

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage(ValidationMessages.ClassificationDescriptionMaxLength1000);

        RuleFor(x => x.BasePrice)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.ClassificationBasePriceNonNegative);

        RuleFor(x => x.NumberOfDay)
            .GreaterThan(0).WithMessage(ValidationMessages.ClassificationNumberOfDaysPositive);

        RuleFor(x => x.NumberOfNight)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.ClassificationNumberOfNightsNonNegative);

        RuleForEach(x => x.Plans)
            .SetValidator(new DayPlanDtoValidator())
            .When(x => x.Plans != null && x.Plans.Any());

        RuleForEach(x => x.Insurances)
            .SetValidator(new InsuranceDtoValidator())
            .When(x => x.Insurances != null && x.Insurances.Any());
    }
}

public sealed class DayPlanDtoValidator : AbstractValidator<DayPlanDto>
{
    public DayPlanDtoValidator()
    {
        RuleFor(x => x.DayNumber)
            .GreaterThan(0).WithMessage(ValidationMessages.DayPlanDayNumberPositive);

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage(ValidationMessages.DayPlanTitleRequired)
            .MaximumLength(200).WithMessage(ValidationMessages.DayPlanTitleMaxLength200);

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage(ValidationMessages.DayPlanDescriptionMaxLength2000);

        RuleForEach(x => x.Activities)
            .SetValidator(new ActivityDtoValidator())
            .When(x => x.Activities != null && x.Activities.Any());
    }
}

public sealed class ActivityDtoValidator : AbstractValidator<ActivityDto>
{
    public ActivityDtoValidator()
    {
        RuleFor(x => x.ActivityType)
            .NotEmpty().WithMessage(ValidationMessages.ActivityTypeRequired);

        RuleFor(x => x.ActivityType)
            .Custom((value, context) =>
            {
                if (!EnumHelper.TryParseDefinedEnum<TourDayActivityType>(value, out _))
                {
                    context.AddFailure($"{context.PropertyPath} has invalid value '{value}'.");
                }
            });

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage(ValidationMessages.ActivityTitleRequired)
            .MaximumLength(200).WithMessage(ValidationMessages.ActivityTitleMaxLength200);

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage(ValidationMessages.ActivityDescriptionMaxLength1000);

        RuleFor(x => x.EstimatedCost)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.ActivityEstimatedCostNonNegative);

        RuleFor(x => x.DurationMinutes)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.RouteDurationNonNegative)
            .When(x => x.DurationMinutes.HasValue);

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.RoutePriceNonNegative)
            .When(x => x.Price.HasValue);

        When(x => x.ActivityType == "7", () =>
        {
            RuleFor(x => x.TransportationType)
                .NotEmpty().WithMessage(ValidationMessages.TransportationTypeRequired)
                .Custom((value, context) =>
                {
                    if (!string.IsNullOrEmpty(value) && !EnumHelper.TryParseDefinedEnum<TransportationType>(value, out _))
                    {
                        context.AddFailure($"{context.PropertyPath} has invalid value '{value}'.");
                    }
                });

            RuleFor(x => x).Must(x => x.FromLocationId.HasValue || !string.IsNullOrEmpty(x.Translations?.FirstOrDefault().Value.FromLocationName))
                .WithMessage(ValidationMessages.RouteFromLocationNameRequired);

            RuleFor(x => x).Must(x => x.ToLocationId.HasValue || !string.IsNullOrEmpty(x.Translations?.FirstOrDefault().Value.ToLocationName))
                .WithMessage(ValidationMessages.RouteToLocationNameRequired);
        });

        When(x => x.ActivityType != "7" && !string.IsNullOrEmpty(x.TransportationType), () =>
        {
            RuleFor(x => x.TransportationType)
                .Custom((value, context) =>
                {
                    if (!EnumHelper.TryParseDefinedEnum<TransportationType>(value, out _))
                    {
                        context.AddFailure($"{context.PropertyPath} has invalid value '{value}'.");
                    }
                });
        });

        RuleFor(x => x.Accommodation)
            .SetValidator(new AccommodationDtoValidator()!)
            .When(x => x.Accommodation != null);
    }
}


public sealed class TransportationDtoValidator : AbstractValidator<TransportationDto>
{
    public TransportationDtoValidator()
    {
        RuleFor(x => x.TransportationType)
            .NotEmpty().WithMessage(ValidationMessages.TransportationTypeRequired);

        RuleFor(x => x.TransportationType)
            .Custom((value, context) =>
            {
                if (!EnumHelper.TryParseDefinedEnum<TransportationType>(value, out _))
                {
                    context.AddFailure($"{context.PropertyPath} has invalid value '{value}'.");
                }
            });

        When(x => !x.FromLocationId.HasValue, () =>
        {
            RuleFor(x => x.FromLocationName)
                .NotEmpty().WithMessage(ValidationMessages.RouteFromLocationNameRequired);
        });

        When(x => !x.ToLocationId.HasValue, () =>
        {
            RuleFor(x => x.ToLocationName)
                .NotEmpty().WithMessage(ValidationMessages.RouteToLocationNameRequired);
        });

        RuleFor(x => x.DurationMinutes)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.RouteDurationNonNegative);

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.TransportationPriceNonNegative);

        RuleFor(x => x.TransportationName)
            .MaximumLength(300).WithMessage(ValidationMessages.TransportationNameMaxLength300)
            .When(x => x.TransportationName != null);

        RuleFor(x => x.TicketInfo)
            .MaximumLength(500).WithMessage(ValidationMessages.TransportationTicketInfoMaxLength500)
            .When(x => x.TicketInfo != null);

        RuleFor(x => x.Note)
            .MaximumLength(1000).WithMessage(ValidationMessages.TransportationNoteMaxLength1000)
            .When(x => x.Note != null);
    }
}

public sealed class AccommodationDtoValidator : AbstractValidator<AccommodationDto>
{
    public AccommodationDtoValidator()
    {
        RuleFor(x => x.AccommodationName)
            // Phase 3: AccommodationName is now optional (supplier details handled at instance time)
            .MaximumLength(200).WithMessage(ValidationMessages.AccommodationNameMaxLength200)
            .When(x => !string.IsNullOrEmpty(x.AccommodationName));

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage(ValidationMessages.AccommodationAddressMaxLength500);

        RuleFor(x => x.ContactPhone)
            .Matches(@"^[\d\s\-\+\(\)]+$").WithMessage(ValidationMessages.PhoneNumberInvalid)
            .When(x => !string.IsNullOrEmpty(x.ContactPhone));

        RuleFor(x => x.CheckInTime)
            .MaximumLength(50).WithMessage(ValidationMessages.AccommodationCheckInTimeMaxLength50);

        RuleFor(x => x.CheckOutTime)
            .MaximumLength(50).WithMessage(ValidationMessages.AccommodationCheckOutTimeMaxLength50);

        RuleFor(x => x.RoomType)
            .MaximumLength(50).WithMessage(ValidationMessages.AccommodationRoomTypeMaxLength50)
            .When(x => x.RoomType != null);

        RuleFor(x => x.RoomCapacity)
            .GreaterThan(0).WithMessage(ValidationMessages.AccommodationRoomCapacityPositive)
            .When(x => x.RoomCapacity.HasValue);

        RuleFor(x => x.NumberOfRooms)
            .InclusiveBetween(1, 999).WithMessage(ValidationMessages.AccommodationNumberOfRoomsRange)
            .When(x => x.NumberOfRooms.HasValue);

        RuleFor(x => x.NumberOfNights)
            .InclusiveBetween(1, 999).WithMessage(ValidationMessages.AccommodationNumberOfNightsRange)
            .When(x => x.NumberOfNights.HasValue);

        RuleFor(x => x.RoomPrice)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.AccommodationRoomPriceNonNegative)
            .When(x => x.RoomPrice.HasValue);

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90m, 90m).WithMessage(ValidationMessages.AccommodationLatitudeRange)
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180m, 180m).WithMessage(ValidationMessages.AccommodationLongitudeRange)
            .When(x => x.Longitude.HasValue);

        RuleFor(x => x.SpecialRequest)
            .MaximumLength(1000).WithMessage(ValidationMessages.AccommodationSpecialRequestMaxLength1000)
            .When(x => x.SpecialRequest != null);

        RuleFor(x => x.MealsIncluded)
            .MaximumLength(100).WithMessage(ValidationMessages.AccommodationMealsIncludedMaxLength100)
            .When(x => x.MealsIncluded != null);
    }
}

public sealed class InsuranceDtoValidator : AbstractValidator<InsuranceDto>
{
    public InsuranceDtoValidator()
    {
        RuleFor(x => x.InsuranceName)
            .NotEmpty().WithMessage(ValidationMessages.InsuranceNameRequired)
            .MaximumLength(200).WithMessage(ValidationMessages.InsuranceNameMaxLength200);

        RuleFor(x => x.InsuranceType)
            .NotEmpty().WithMessage(ValidationMessages.InsuranceTypeRequired);

        RuleFor(x => x.InsuranceType)
            .Custom((value, context) =>
            {
                if (!EnumHelper.TryParseDefinedEnum<InsuranceType>(value, out _))
                {
                    context.AddFailure($"{context.PropertyPath} has invalid value '{value}'.");
                }
            });

        RuleFor(x => x.InsuranceProvider)
            .MaximumLength(200).WithMessage(ValidationMessages.InsuranceProviderMaxLength200);

        RuleFor(x => x.CoverageDescription)
            .MaximumLength(1000).WithMessage(ValidationMessages.InsuranceCoverageDescriptionMaxLength1000);

        RuleFor(x => x.CoverageAmount)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.InsuranceCoverageAmountNonNegative);

        RuleFor(x => x.CoverageFee)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.InsuranceCoverageFeeNonNegative);
    }
}

public sealed class LocationDtoValidator : AbstractValidator<LocationDto>
{
    public LocationDtoValidator()
    {
        RuleFor(x => x.LocationName)
            .NotEmpty().WithMessage(ValidationMessages.LocationNameRequired)
            .MaximumLength(200).WithMessage(ValidationMessages.LocationNameMaxLength200);

        RuleFor(x => x.LocationType)
            .NotEmpty().WithMessage(ValidationMessages.LocationTypeRequired);

        RuleFor(x => x.LocationType)
            .Custom((value, context) =>
            {
                if (!EnumHelper.TryParseDefinedEnum<LocationType>(value, out _))
                {
                    context.AddFailure($"{context.PropertyPath} has invalid value '{value}'.");
                }
            });

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage(ValidationMessages.LocationDescriptionMaxLength1000)
            .When(x => x.Description != null);

        RuleFor(x => x.City)
            .MaximumLength(200).WithMessage(ValidationMessages.LocationCityMaxLength200)
            .When(x => x.City != null);

        RuleFor(x => x.Country)
            .MaximumLength(200).WithMessage(ValidationMessages.LocationCountryMaxLength200)
            .When(x => x.Country != null);

        RuleFor(x => x.EntranceFee)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.LocationEntranceFeeNonNegative)
            .When(x => x.EntranceFee.HasValue);

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage(ValidationMessages.LocationAddressMaxLength500)
            .When(x => x.Address != null);
    }
}

public sealed class ServiceDtoValidator : AbstractValidator<ServiceDto>
{
    public ServiceDtoValidator()
    {
        RuleFor(x => x.ServiceName)
            .NotEmpty().WithMessage(ValidationMessages.ServiceNameRequired)
            .MaximumLength(200).WithMessage(ValidationMessages.ServiceNameMaxLength200);

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.ServicePriceNonNegative)
            .When(x => x.Price.HasValue);

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage(ValidationMessages.ServiceEmailInvalid)
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.ContactNumber)
            .Matches(@"^[\d\s\-\+\(\)]+$").WithMessage(ValidationMessages.PhoneNumberInvalid)
            .When(x => !string.IsNullOrEmpty(x.ContactNumber));
    }
}

public sealed class UpdateTourCommandValidator : AbstractValidator<UpdateTourCommand>
{
    public UpdateTourCommandValidator()
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

        RuleFor(x => x.Continent)
            .Null().WithMessage("Tour trong nước không được chọn châu lục")
            .When(x => x.TourScope == TourScope.Domestic);

        RuleFor(x => x.IsVisa)
            .Equal(false).WithMessage("Tour trong nước không yêu cầu visa")
            .When(x => x.TourScope == TourScope.Domestic);

        // Thumbnail - Optional but must be valid if provided
        RuleFor(x => x.Thumbnail)
            .SetValidator(new ImageInputDtoValidator()!)
            .When(x => x.Thumbnail != null);

        // Classifications - Optional but if provided must have at least 1 item
        RuleFor(x => x.Classifications)
            .Must(cls => cls == null || cls.Count > 0)
            .WithMessage(ValidationMessages.TourClassificationsMinOne);

        RuleForEach(x => x.Classifications)
            .SetValidator(new ClassificationDtoValidator())
            .When(x => x.Classifications != null && x.Classifications.Any());

        // Images - Optional but if provided must have at least 1 item
        RuleFor(x => x.Images)
            .Must(images => images == null || images.Count > 0)
            .WithMessage(ValidationMessages.TourImagesMinOne);

        RuleForEach(x => x.Images)
            .SetValidator(new ImageInputDtoValidator()!)
            .When(x => x.Images != null && x.Images.Count > 0);

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

        // DeletedClassificationIds - optional list of IDs to soft-delete
        RuleForEach(x => x.DeletedClassificationIds)
            .NotEmpty().WithMessage(ValidationMessages.DeletedClassificationIdRequired)
            .When(x => x.DeletedClassificationIds != null && x.DeletedClassificationIds.Count > 0);

        // DeletedActivityIds - optional list of IDs to soft-delete
        RuleForEach(x => x.DeletedActivityIds)
            .NotEmpty().WithMessage(ValidationMessages.DeletedActivityIdRequired)
            .When(x => x.DeletedActivityIds != null && x.DeletedActivityIds.Count > 0);
    }
}


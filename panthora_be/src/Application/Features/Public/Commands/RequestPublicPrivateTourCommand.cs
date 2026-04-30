using Application.Common.Constant;
using Application.Contracts.Booking;
using Application.Features.TourInstance.Commands;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using Domain.ValueObjects;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.Public.Commands;

/// <summary>JSON body for <c>POST /api/public/tours/{{id}}/request-private</c>.</summary>
public sealed record RequestPublicPrivateTourRequestDto(
    [property: JsonPropertyName("classificationId")] Guid ClassificationId,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("endDate")] DateTimeOffset EndDate,
    [property: JsonPropertyName("maxParticipation")] int MaxParticipation,
    [property: JsonPropertyName("customerName")] string CustomerName,
    [property: JsonPropertyName("customerPhone")] string CustomerPhone,
    [property: JsonPropertyName("customerEmail")] string? CustomerEmail,
    [property: JsonPropertyName("numberAdult")] int NumberAdult,
    [property: JsonPropertyName("numberChild")] int NumberChild,
    [property: JsonPropertyName("numberInfant")] int NumberInfant,
    [property: JsonPropertyName("paymentMethod")] PaymentMethod PaymentMethod,
    [property: JsonPropertyName("isFullPay")] bool IsFullPay,
    [property: JsonPropertyName("wantsCustomization")] bool WantsCustomization,
    [property: JsonPropertyName("customizationNotes")] string? CustomizationNotes);

/// <summary>
/// Public: tạo tour instance loại Private (Draft), booking liên kết, trả về giá checkout (100% khi IsFullPay).
/// </summary>
public sealed record RequestPublicPrivateTourCommand(
    Guid TourId,
    Guid ClassificationId,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    int MaxParticipation,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    int NumberAdult,
    int NumberChild,
    int NumberInfant,
    PaymentMethod PaymentMethod,
    bool IsFullPay,
    bool WantsCustomization,
    string? CustomizationNotes) : ICommand<ErrorOr<CheckoutPriceResponse>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [Application.Common.CacheKey.TourInstance];
}

public sealed class RequestPublicPrivateTourCommandValidator : AbstractValidator<RequestPublicPrivateTourCommand>
{
    public RequestPublicPrivateTourCommandValidator()
    {
        RuleFor(x => x.TourId)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);

        RuleFor(x => x.ClassificationId)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceClassificationIdRequired);

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceStartDateRequired)
            .Must(date => date.Date >= DateTimeOffset.UtcNow.Date)
            .WithMessage("Ngày bắt đầu không được nằm trong quá khứ.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceEndDateRequired)
            .GreaterThanOrEqualTo(x => x.StartDate).WithMessage(ValidationMessages.TourInstanceEndDateAfterStart);

        RuleFor(x => x.MaxParticipation)
            .GreaterThan(0).WithMessage(ValidationMessages.TourInstanceMaxParticipantsGreaterThanZero);

        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage(ValidationMessages.PublicBookingCustomerNameRequired)
            .MaximumLength(200).WithMessage(ValidationMessages.PublicBookingCustomerNameMaxLength200);

        RuleFor(x => x.CustomerPhone)
            .NotEmpty().WithMessage(ValidationMessages.PublicBookingCustomerPhoneRequired)
            .Matches(@"^\+?[0-9\s\-]{8,20}$")
            .WithMessage(ValidationMessages.PublicBookingCustomerPhoneInvalid);

        RuleFor(x => x.CustomerEmail)
            .EmailAddress().WithMessage(ValidationMessages.PublicBookingCustomerEmailInvalid)
            .When(x => !string.IsNullOrWhiteSpace(x.CustomerEmail));

        RuleFor(x => x.NumberAdult)
            .GreaterThan(0).WithMessage(ValidationMessages.PublicBookingAdultsGreaterThanZero);

        RuleFor(x => x.NumberChild)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.PublicBookingChildNonNegative);

        RuleFor(x => x.NumberInfant)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.PublicBookingInfantNonNegative);

        RuleFor(x => x.PaymentMethod)
            .IsInEnum().WithMessage(ValidationMessages.PublicBookingPaymentMethodInvalid);
    }
}

public sealed class RequestPublicPrivateTourCommandHandler(
    ITourInstanceService tourInstanceService,
    IUser user,
    IBookingRepository bookingRepository,
    ITourInstanceRepository tourInstanceRepository,
    ITourRepository tourRepository,
    ITaxConfigRepository taxConfigRepository,
    IPricingPolicyRepository pricingPolicyRepository,
    IDepositPolicyRepository depositPolicyRepository,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<RequestPublicPrivateTourCommand, ErrorOr<CheckoutPriceResponse>>
{
    public async Task<ErrorOr<CheckoutPriceResponse>> Handle(
        RequestPublicPrivateTourCommand request,
        CancellationToken cancellationToken)
    {
        var tour = await tourRepository.FindById(request.TourId, true, cancellationToken);
        if (tour is null)
        {
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.NotFoundDescription);
        }

        if (tour.Status != TourStatus.Active)
        {
            return Error.Validation("Tour.NotActive", "Tour không khả dụng để đặt riêng.");
        }

        var classification = tour.Classifications.FirstOrDefault(c => c.Id == request.ClassificationId);
        if (classification is null)
        {
            return Error.NotFound(ErrorConstants.Classification.NotFoundCode, ErrorConstants.Classification.NotFoundDescription);
        }

        var thumbnailUrl = string.IsNullOrWhiteSpace(tour.Thumbnail?.PublicURL) ? null : tour.Thumbnail.PublicURL;

        var createInstance = new CreateTourInstanceCommand(
            TourId: request.TourId,
            ClassificationId: request.ClassificationId,
            Title: $"Private — {tour.TourName}",
            InstanceType: TourType.Private,
            StartDate: request.StartDate,
            EndDate: request.EndDate,
            MaxParticipation: request.MaxParticipation,
            BasePrice: classification.BasePrice,
            IncludedServices: null,
            Location: null,
            GuideUserIds: null,
            ThumbnailUrl: thumbnailUrl,
            TourRequestId: null,
            ImageUrls: null,
            Translations: null,
            ActivityAssignments: null,
            WantsCustomization: request.WantsCustomization,
            CustomizationNotes: request.CustomizationNotes);

        var instanceResult = await tourInstanceService.CreatePublicPrivateDraftAsync(createInstance);
        if (instanceResult.IsError)
        {
            return instanceResult.Errors;
        }

        var tourInstanceId = instanceResult.Value;

        var tourInstance = await tourInstanceRepository.FindById(tourInstanceId);
        if (tourInstance == null)
        {
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);
        }

        var totalParticipants = request.NumberAdult + request.NumberChild + request.NumberInfant;
        if (tourInstance.CurrentParticipation + totalParticipants > tourInstance.MaxParticipation)
        {
            return Error.Conflict(
                "TourInstance.NotEnoughCapacity",
                "Tour không còn đủ chỗ cho số lượng người yêu cầu.");
        }

        var taxConfigs = await taxConfigRepository.GetListAsync(t => t.IsActive);
        var activeTaxConfig = taxConfigs.FirstOrDefault();

        var pricingPolicy = await pricingPolicyRepository.GetActivePolicyByTourType(tourInstance.InstanceType)
            ?? await pricingPolicyRepository.GetDefaultPolicy();

        var adultUnitPrice = ApplyPricingTier(tourInstance.BasePrice, pricingPolicy?.Tiers, 18);
        var childUnitPrice = ApplyPricingTier(tourInstance.BasePrice, pricingPolicy?.Tiers, 5);
        var infantUnitPrice = ApplyPricingTier(tourInstance.BasePrice, pricingPolicy?.Tiers, 1);

        var adultSubtotal = adultUnitPrice * request.NumberAdult;
        var childSubtotal = childUnitPrice * request.NumberChild;
        var infantSubtotal = infantUnitPrice * request.NumberInfant;
        var subtotal = adultSubtotal + childSubtotal + infantSubtotal;

        var taxRate = activeTaxConfig?.TaxRate ?? 0m;
        var taxAmount = subtotal * taxRate / 100m;
        var totalPrice = subtotal + taxAmount;

        Guid? currentUserId = null;
        if (!string.IsNullOrWhiteSpace(user.Id) && Guid.TryParse(user.Id, out var parsedId))
        {
            currentUserId = parsedId;
        }

        if (currentUserId == null && !string.IsNullOrWhiteSpace(request.CustomerEmail))
        {
            var matchedByEmail = await userRepository.GetByEmailAsync(request.CustomerEmail, cancellationToken);
            if (matchedByEmail != null)
            {
                currentUserId = matchedByEmail.Id;
            }
        }

        var booking = BookingEntity.Create(
            tourInstanceId: tourInstance.Id,
            customerName: request.CustomerName,
            customerPhone: request.CustomerPhone,
            numberAdult: request.NumberAdult,
            totalPrice: totalPrice,
            paymentMethod: request.PaymentMethod,
            isFullPay: request.IsFullPay,
            performedBy: currentUserId?.ToString() ?? "PUBLIC_USER",
            userId: currentUserId,
            customerEmail: request.CustomerEmail,
            numberChild: request.NumberChild,
            numberInfant: request.NumberInfant,
            bookingType: BookingType.PrivateCustomTourRequest);

        await bookingRepository.AddAsync(booking);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        var tourScope = tour.TourScope;
        var depositPolicies = await depositPolicyRepository.GetAllActiveAsync(cancellationToken);
        var policy = depositPolicies.FirstOrDefault(p => p.TourScope == tourScope);

        var depositPercentage = 30m;
        if (policy != null)
        {
            if (policy.DepositType == DepositType.Percentage)
            {
                depositPercentage = policy.DepositValue;
            }
            else
            {
                depositPercentage = totalPrice > 0 ? (policy.DepositValue / totalPrice) * 100m : 0m;
            }
        }

        if (request.IsFullPay)
        {
            depositPercentage = 100m;
        }

        var depositAmount = totalPrice * depositPercentage / 100m;
        var remainingBalance = totalPrice - depositAmount;

        return new CheckoutPriceResponse(
            BookingId: booking.Id,
            TourInstanceId: tourInstance.Id,
            TourName: tourInstance.TourName,
            TourCode: tourInstance.TourCode,
            ThumbnailUrl: tourInstance.Thumbnail?.PublicURL,
            StartDate: tourInstance.StartDate,
            EndDate: tourInstance.EndDate,
            DurationDays: tourInstance.DurationDays,
            Location: tourInstance.Location,
            NumberAdult: request.NumberAdult,
            NumberChild: request.NumberChild,
            NumberInfant: request.NumberInfant,
            BasePrice: adultUnitPrice,
            ChildPrice: childUnitPrice,
            InfantPrice: infantUnitPrice,
            AdultSubtotal: adultSubtotal,
            ChildSubtotal: childSubtotal,
            InfantSubtotal: infantSubtotal,
            Subtotal: subtotal,
            TaxRate: taxRate,
            TaxAmount: taxAmount,
            TotalPrice: totalPrice,
            DepositPercentage: depositPercentage,
            DepositAmount: depositAmount,
            RemainingBalance: remainingBalance);
    }

    private static decimal ApplyPricingTier(decimal basePrice, List<PricingPolicyTier>? tiers, int age)
    {
        if (tiers == null || tiers.Count == 0)
        {
            return basePrice;
        }

        foreach (var tier in tiers)
        {
            if (age >= tier.AgeFrom && (!tier.AgeTo.HasValue || age <= tier.AgeTo.Value))
            {
                return basePrice * tier.PricePercentage / 100m;
            }
        }

        return basePrice;
    }
}

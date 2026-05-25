using Application.Common.Constant;
using Application.Common.Pricing;
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
            .Must(date => date.Date >= DateTimeOffset.UtcNow.AddDays(10).Date)
            .WithMessage("Ngày đặt tour phải cách ngày hiện tại ít nhất 10 ngày.");

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
    IBookingPriceCalculator priceCalculator,
    IUnitOfWork unitOfWork,
    ITourInstanceNotificationBroadcaster notificationBroadcaster)
    : ICommandHandler<RequestPublicPrivateTourCommand, ErrorOr<CheckoutPriceResponse>>
{
    public async Task<ErrorOr<CheckoutPriceResponse>> Handle(
        RequestPublicPrivateTourCommand request,
        CancellationToken cancellationToken)
    {
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

        var hasActiveRequest = await bookingRepository.HasActiveCustomTourRequestAsync(
            currentUserId,
            request.CustomerEmail,
            request.TourId,
            cancellationToken);

        if (hasActiveRequest)
        {
            return Error.Validation(
                "Booking.DuplicateCustomRequest",
                "Bạn đã có một tour như vậy đang được xét duyệt.");
        }

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

        var breakdown = await CalculateBreakdownAsync(
            tourInstance,
            request.NumberAdult,
            request.NumberChild,
            request.NumberInfant,
            cancellationToken);

        var totalPrice = breakdown.TotalAmount;

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

        tourInstance.SubmitForManagerReview(currentUserId?.ToString() ?? "PUBLIC_USER");

        await unitOfWork.SaveChangeAsync(cancellationToken);

        var assignedManagerId = tourInstance.Managers
            .FirstOrDefault(m => m.Role == TourInstanceManagerRole.Manager)?.UserId;

        if (assignedManagerId.HasValue)
        {
            await notificationBroadcaster.NotifyManagerNewCustomRequestAsync(
                tourInstance.Id,
                tourInstance.TourName,
                request.CustomerName,
                assignedManagerId.Value,
                cancellationToken);
        }

        return await BuildCheckoutPriceResponseAsync(booking, tourInstance, cancellationToken, breakdown, tour.TourScope);
    }

    private async Task<BookingPriceBreakdown> CalculateBreakdownAsync(
        TourInstanceEntity tourInstance,
        int numberAdult,
        int numberChild,
        int numberInfant,
        CancellationToken cancellationToken)
    {
        var taxConfigs = await taxConfigRepository.GetListAsync(t => t.IsActive);
        var activeTaxConfig = taxConfigs.FirstOrDefault();

        var pricingPolicy = await pricingPolicyRepository.GetActivePolicyByTourType(tourInstance.InstanceType)
            ?? await pricingPolicyRepository.GetDefaultPolicy();

        return priceCalculator.Calculate(
            numberAdult: numberAdult,
            numberChild: numberChild,
            numberInfant: numberInfant,
            basePrice: tourInstance.BasePrice,
            tiers: pricingPolicy?.Tiers,
            taxConfig: activeTaxConfig,
            visaServiceFeeTotal: 0m,
            paidAmount: 0m);
    }

    private async Task<CheckoutPriceResponse> BuildCheckoutPriceResponseAsync(
        BookingEntity booking,
        TourInstanceEntity tourInstance,
        CancellationToken cancellationToken,
        BookingPriceBreakdown? breakdown = null,
        TourScope? tourScopeOverride = null)
    {
        breakdown ??= await CalculateBreakdownAsync(
            tourInstance,
            booking.NumberAdult,
            booking.NumberChild,
            booking.NumberInfant,
            cancellationToken);

        var totalPrice = booking.TotalPrice > 0 ? booking.TotalPrice : breakdown.TotalAmount;
        var tourScope = tourScopeOverride ?? tourInstance.Tour?.TourScope ?? TourScope.Domestic;
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

        if (booking.IsFullPay)
        {
            depositPercentage = 100m;
        }

        var depositAmount = Math.Round(totalPrice * depositPercentage / 100m, 0, MidpointRounding.ToEven);
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
            NumberAdult: booking.NumberAdult,
            NumberChild: booking.NumberChild,
            NumberInfant: booking.NumberInfant,
            BasePrice: breakdown.AdultUnitPrice,
            ChildPrice: breakdown.ChildUnitPrice,
            InfantPrice: breakdown.InfantUnitPrice,
            AdultSubtotal: breakdown.AdultSubtotal,
            ChildSubtotal: breakdown.ChildSubtotal,
            InfantSubtotal: breakdown.InfantSubtotal,
            Subtotal: breakdown.Subtotal,
            TaxRate: breakdown.TaxRate,
            TaxAmount: breakdown.TaxAmount,
            TotalPrice: totalPrice,
            DepositPercentage: depositPercentage,
            DepositAmount: depositAmount,
            RemainingBalance: remainingBalance);
    }
}

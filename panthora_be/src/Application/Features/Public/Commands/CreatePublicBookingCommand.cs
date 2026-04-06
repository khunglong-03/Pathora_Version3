using System.Globalization;
using ErrorOr;
using FluentValidation;
using Application.Common.Constant;
using Application.Contracts.Booking;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using Domain.ValueObjects;

namespace Application.Features.Public.Commands;

public sealed record CreatePublicBookingCommand(
    Guid TourInstanceId,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    int NumberAdult,
    int NumberChild,
    int NumberInfant,
    PaymentMethod PaymentMethod,
    bool IsFullPay
) : ICommand<ErrorOr<CheckoutPriceResponse>>;

public sealed class CreatePublicBookingCommandValidator : AbstractValidator<CreatePublicBookingCommand>
{
    public CreatePublicBookingCommandValidator()
    {
        RuleFor(x => x.TourInstanceId)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);

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

public sealed class CreatePublicBookingCommandHandler(
    IBookingRepository bookingRepository,
    ITourInstanceRepository tourInstanceRepository,
    ITaxConfigRepository taxConfigRepository,
    IPricingPolicyRepository pricingPolicyRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<CreatePublicBookingCommand, ErrorOr<CheckoutPriceResponse>>
{
    public async Task<ErrorOr<CheckoutPriceResponse>> Handle(
        CreatePublicBookingCommand request,
        CancellationToken cancellationToken)
    {
        // Verify tour instance exists and is available
        var tourInstance = await tourInstanceRepository.FindById(request.TourInstanceId);
        if (tourInstance == null)
        {
            return Error.NotFound(
                ErrorConstants.TourInstance.NotFoundCode,
                ErrorConstants.TourInstance.NotFoundDescription);
        }

        if (tourInstance.Status != TourInstanceStatus.Available)
        {
            return Error.Conflict(
                "TourInstance.NotAvailable",
                "Tour hiện không có sẵn để đặt.");
        }

        // Check capacity
        var currentBookings = await bookingRepository.CountByTourInstanceIdAsync(request.TourInstanceId);
        var totalParticipants = request.NumberAdult + request.NumberChild + request.NumberInfant;

        if (currentBookings + totalParticipants > tourInstance.MaxParticipation)
        {
            return Error.Conflict(
                "TourInstance.NotEnoughCapacity",
                "Tour không còn đủ chỗ cho số lượng người yêu cầu.");
        }

        // Phase 5.1: Aligned pricing — fetch tax config and pricing policy
        var taxConfigs = await taxConfigRepository.GetListAsync(t => t.IsActive);
        var activeTaxConfig = taxConfigs.FirstOrDefault();

        var pricingPolicy = await pricingPolicyRepository.GetActivePolicyByTourType(tourInstance.InstanceType)
            ?? await pricingPolicyRepository.GetDefaultPolicy();

        // Phase 5.1.3: Apply pricing tiers for child/infant
        var adultUnitPrice = ApplyPricingTier(tourInstance.BasePrice, pricingPolicy?.Tiers, 18);
        var childUnitPrice = ApplyPricingTier(tourInstance.BasePrice, pricingPolicy?.Tiers, 5);
        var infantUnitPrice = ApplyPricingTier(tourInstance.BasePrice, pricingPolicy?.Tiers, 1);

        var adultSubtotal = adultUnitPrice * request.NumberAdult;
        var childSubtotal = childUnitPrice * request.NumberChild;
        var infantSubtotal = infantUnitPrice * request.NumberInfant;
        var subtotal = adultSubtotal + childSubtotal + infantSubtotal;

        // Phase 5.1.2: Apply active tax rate
        var taxRate = activeTaxConfig?.TaxRate ?? 0m;
        var taxAmount = subtotal * taxRate / 100m;
        var totalPrice = subtotal + taxAmount;

        // Create booking entity
        var booking = BookingEntity.Create(
            tourInstanceId: request.TourInstanceId,
            customerName: request.CustomerName,
            customerPhone: request.CustomerPhone,
            numberAdult: request.NumberAdult,
            totalPrice: totalPrice,
            paymentMethod: request.PaymentMethod,
            isFullPay: request.IsFullPay,
            performedBy: "PUBLIC_USER",
            customerEmail: request.CustomerEmail,
            numberChild: request.NumberChild,
            numberInfant: request.NumberInfant);

        await bookingRepository.AddAsync(booking);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        // Phase 5.1.4: Always use 30% deposit regardless of IsFullPay (aligned with GetCheckoutPrice)
        var depositPercentage = 30m;
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
            return basePrice;

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

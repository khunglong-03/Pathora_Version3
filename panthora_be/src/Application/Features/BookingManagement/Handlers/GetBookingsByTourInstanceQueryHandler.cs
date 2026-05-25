using Application.Common.Pricing;
using Application.Contracts.Booking;
using Application.Features.BookingManagement.Queries;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;

namespace Application.Features.BookingManagement.Handlers;

public sealed class GetBookingsByTourInstanceQueryHandler(
    IBookingRepository bookingRepository,
    ITourInstanceRepository tourInstanceRepository,
    ITourRepository tourRepository,
    IUser user,
    IPricingPolicyRepository pricingPolicyRepository,
    ITaxConfigRepository taxConfigRepository,
    IBookingPriceCalculator priceCalculator)
    : IQueryHandler<GetBookingsByTourInstanceQuery, ErrorOr<List<AdminBookingListResponse>>>
{
    public async Task<ErrorOr<List<AdminBookingListResponse>>> Handle(GetBookingsByTourInstanceQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(user.Id, out var currentUserId))
            return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");

        var isUnauthorized = !user.Roles.Any(r =>
        string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(r, "TourOperator", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(r, "TourGuide", StringComparison.OrdinalIgnoreCase));

        if (isUnauthorized)
            return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");

        var isTourOperator = user.Roles.Any(r => string.Equals(r, "TourOperator", StringComparison.OrdinalIgnoreCase));
        var isTourGuide = user.Roles.Any(r => string.Equals(r, "TourGuide", StringComparison.OrdinalIgnoreCase));

        var tourInstance = await tourInstanceRepository.FindById(request.TourInstanceId);
        if (tourInstance is null)
            return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");

        var bookings = new List<BookingEntity>();

        if (isTourOperator)
        {
            var tour = await tourRepository.FindById(tourInstance.TourId, asNoTracking: true, cancellationToken);
            if (tour is null) return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");
            if (tour.TourOperatorId != currentUserId) return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");
        }
        if (isTourGuide && !await tourInstanceRepository.HasGuideAssignmentAsync(request.TourInstanceId, currentUserId, cancellationToken))
            return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");

        // 3. Lấy cấu hình
        var pricingPolicy = await pricingPolicyRepository.GetDefaultPolicy(cancellationToken);
        var taxConfigs = await taxConfigRepository.GetListAsync(t => t.IsActive, cancellationToken: cancellationToken);
        var activeTaxConfig = taxConfigs.FirstOrDefault();

        bookings = await bookingRepository.GetByTourInstanceIdAsync(request.TourInstanceId, cancellationToken);

        // Filter: Nếu chỉ là TourOperator (không có quyền Admin/Manager), chỉ lấy Paid hoặc Deposited
        if (isTourOperator)
        {
            bookings = bookings.Where(b =>
                b.Status == Domain.Enums.BookingStatus.Paid ||
                b.Status == Domain.Enums.BookingStatus.Deposited
            ).ToList();
        }
        if (isTourGuide)
        {
            bookings = bookings.Where(b =>
                b.Status == Domain.Enums.BookingStatus.Paid
            ).ToList();
        }

        // 5. Tính toán và Map ra Response
        var result = bookings.Select(b =>
        {
            var paidAmount = b.PaymentTransactions?.Where(t => t.Status == Domain.Enums.TransactionStatus.Completed).Sum(t => t.PaidAmount ?? t.Amount) ?? 0m;
            var breakdown = priceCalculator.Calculate(b, b.TourInstance, pricingPolicy?.Tiers, activeTaxConfig, paidAmount);

            return new AdminBookingListResponse(
                b.Id,
                b.CustomerName,
                b.TourInstance.TourName,
                b.TourInstance.StartDate,
                breakdown.TotalAmount,
                b.Status.ToString(),
                b.NumberAdult,
                b.NumberChild,
                b.NumberInfant,
                Subtotal: breakdown.Subtotal,
                TaxAmount: breakdown.TaxAmount,
                TotalAmount: breakdown.TotalAmount, RemainingBalance: breakdown.RemainingBalance
            );
        }).ToList();

        return result;
    }
}

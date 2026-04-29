using Application.Common.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using MediatR;
using System.Linq;

namespace Application.Features.BookingManagement.Queries.GetMyBookings;

public sealed class GetMyBookingsQueryHandler(
    IBookingRepository bookingRepository,
    ICurrentUser currentUserService)
    : IRequestHandler<GetMyBookingsQuery, ErrorOr<MyBookingListResult>>
{
    public async Task<ErrorOr<MyBookingListResult>> Handle(
        GetMyBookingsQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = currentUserService.Id;
        if (currentUserId == null)
        {
            return Error.Unauthorized("User.Unauthorized", "User is not authenticated.");
        }

        // We use string match since Booking.CreatedBy and Booking.UserId can store the guid as string
        var userIdString = currentUserId.Value.ToString();

        // Convert the status filter to enum if provided
        BookingStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(request.StatusFilter) && 
            Enum.TryParse<BookingStatus>(request.StatusFilter, true, out var parsedStatus))
        {
            statusFilter = parsedStatus;
        }

        // Using AsQueryable to build the query - depending on repository capabilities
        // Often we need a dedicated method in the repo for this specific projection and pagination
        var result = await bookingRepository.GetPagedBookingsForUserAsync(
            userIdString,
            statusFilter,
            request.Page,
            request.PageSize,
            cancellationToken);

        var items = result.Items;
        var totalCount = result.TotalCount;

        var dtos = items.Select(b => {
            var paidAmount = b.PaymentTransactions?.Where(t => t.Status == TransactionStatus.Completed).Sum(t => t.PaidAmount ?? t.Amount) ?? 0m;
            var paymentStatus = paidAmount >= b.TotalPrice ? PaymentStatus.Paid : (paidAmount > 0 ? PaymentStatus.Partial : PaymentStatus.Unpaid);
            
            return new MyBookingDto(
                Id: b.Id,
                TourName: b.TourInstance?.TourName ?? string.Empty,
                TourInstanceId: b.TourInstanceId,
                Reference: b.Id.ToString().Substring(0, 8).ToUpper(),
                Status: b.Status,
                PaymentStatus: paymentStatus,
                TotalPrice: b.TotalPrice,
                PaidAmount: paidAmount,
                StartDate: b.TourInstance?.StartDate ?? DateTimeOffset.MinValue,
                EndDate: b.TourInstance?.EndDate ?? DateTimeOffset.MinValue,
                Location: b.TourInstance?.Location ?? string.Empty,
                ThumbnailUrl: b.TourInstance?.Thumbnail?.PublicURL,
                Adults: b.NumberAdult,
                Children: b.NumberChild,
                Infants: b.NumberInfant,
                CreatedAt: b.CreatedOnUtc
            );
        }).ToList();

        return new MyBookingListResult(
            Items: dtos,
            TotalCount: totalCount);
    }
}

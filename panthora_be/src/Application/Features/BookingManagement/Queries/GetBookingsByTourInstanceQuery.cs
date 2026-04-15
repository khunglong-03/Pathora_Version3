using Application.Common;
using Application.Contracts.Booking;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Features.BookingManagement.Queries;

public sealed record GetBookingsByTourInstanceQuery(Guid TourInstanceId) : IQuery<ErrorOr<List<AdminBookingListResponse>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:by-tour-instance:{TourInstanceId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

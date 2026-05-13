using Application.Contracts.Booking;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.BookingManagement.Queries;

public sealed record GetBookingsByTourInstanceQuery([property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId) : IQuery<ErrorOr<List<AdminBookingListResponse>>>;

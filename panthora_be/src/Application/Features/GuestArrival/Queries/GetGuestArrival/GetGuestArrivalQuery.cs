namespace Application.Features.GuestArrival.Queries.GetGuestArrival;

using Application.Features.GuestArrival.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetGuestArrivalQuery([property: JsonPropertyName("bookingAccommodationDetailId")] Guid BookingAccommodationDetailId)
    : IQuery<ErrorOr<GuestArrivalDto>>;

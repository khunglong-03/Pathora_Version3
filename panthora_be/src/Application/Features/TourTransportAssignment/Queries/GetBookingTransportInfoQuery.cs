namespace Application.Features.TourTransportAssignment.Queries;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TourTransportAssignment.DTOs;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetBookingTransportInfoQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("bookingId")] Guid BookingId) : IQuery<ErrorOr<BookingTransportInfoDto>>;

namespace Application.Features.TourTransportAssignment.Queries;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TourTransportAssignment.DTOs;
using ErrorOr;

public sealed record GetBookingTransportInfoQuery(
    Guid CurrentUserId,
    Guid BookingId
) : IQuery<ErrorOr<BookingTransportInfoDto>>;

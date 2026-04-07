namespace Application.Features.HotelServiceProvider.Accommodations.Queries;

using BuildingBlocks.CORS;
using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed record GetAccommodationByIdQuery(Guid Id) : IQuery<ErrorOr<AccommodationDto>>;

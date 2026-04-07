namespace Application.Features.HotelServiceProvider.Accommodations.Commands;

using BuildingBlocks.CORS;
using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed record CreateAccommodationCommand(
    CreateAccommodationRequestDto Request
) : ICommand<ErrorOr<AccommodationDto>>;

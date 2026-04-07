namespace Application.Features.HotelServiceProvider.Accommodations.Commands;

using BuildingBlocks.CORS;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed record DeleteAccommodationCommand(Guid Id) : ICommand<ErrorOr<Success>>;

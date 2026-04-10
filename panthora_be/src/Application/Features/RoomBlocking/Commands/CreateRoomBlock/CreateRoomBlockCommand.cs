namespace Application.Features.RoomBlocking.Commands.CreateRoomBlock;

using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;

public sealed record CreateRoomBlockCommand(
    Guid SupplierId,
    RoomType RoomType,
    Guid? BookingAccommodationDetailId,
    Guid? BookingId,
    DateOnly BlockedDate,
    int RoomCountBlocked
) : ICommand<ErrorOr<RoomBlockDto>>;

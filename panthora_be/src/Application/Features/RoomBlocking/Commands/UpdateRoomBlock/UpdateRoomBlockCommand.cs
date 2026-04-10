namespace Application.Features.RoomBlocking.Commands.UpdateRoomBlock;

using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record UpdateRoomBlockCommand(
    Guid Id,
    int RoomCountBlocked
) : ICommand<ErrorOr<RoomBlockDto>>;

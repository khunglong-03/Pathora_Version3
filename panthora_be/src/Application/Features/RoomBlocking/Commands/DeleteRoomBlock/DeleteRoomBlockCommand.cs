namespace Application.Features.RoomBlocking.Commands.DeleteRoomBlock;

using BuildingBlocks.CORS;
using ErrorOr;

public sealed record DeleteRoomBlockCommand(Guid Id) : ICommand<ErrorOr<Success>>;

namespace Application.Features.RoomBlocking.Commands.DeleteRoomBlock;

using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record DeleteRoomBlockCommand([property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>;

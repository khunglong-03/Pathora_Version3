namespace Application.Features.RoomBlocking.Commands.UpdateRoomBlock;

using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record UpdateRoomBlockCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("roomCountBlocked")] int RoomCountBlocked) : ICommand<ErrorOr<RoomBlockDto>>;

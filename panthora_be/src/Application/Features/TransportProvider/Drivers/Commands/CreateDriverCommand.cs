namespace Application.Features.TransportProvider.Drivers.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Drivers.DTOs;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record CreateDriverCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("request")] CreateDriverRequestDto Request) : ICommand<ErrorOr<DriverResponseDto>>;

namespace Application.Features.TransportProvider.Company.Commands;

using Application.Features.TransportProvider.Company.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;
using global::Contracts.ModelResponse;

public sealed record UpdateTransportCompanyCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("request")] UpdateTransportCompanyCommandDto Request) : ICommand<ErrorOr<TransportCompanyProfileDto>>;
namespace Application.Features.TransportProvider.Company.Queries;

using Application.Features.TransportProvider.Company.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;
using global::Contracts.ModelResponse;

public sealed record GetTransportCompanyQuery([property: JsonPropertyName("currentUserId")] Guid CurrentUserId)
    : IQuery<ErrorOr<TransportCompanyProfileDto>>;
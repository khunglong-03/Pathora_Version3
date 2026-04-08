namespace Application.Features.TransportProvider.Company.Queries;

using Application.Features.TransportProvider.Company.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using ErrorOr;
using global::Contracts.ModelResponse;

public sealed record GetTransportCompanyQuery(Guid CurrentUserId)
    : IQuery<ErrorOr<TransportCompanyProfileDto>>;
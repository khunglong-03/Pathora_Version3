namespace Application.Features.TransportProvider.Company.Commands;

using Application.Features.TransportProvider.Company.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using ErrorOr;
using global::Contracts.ModelResponse;

public sealed record UpdateTransportCompanyCommand(
    Guid CurrentUserId,
    UpdateTransportCompanyCommandDto Request
) : ICommand<ErrorOr<TransportCompanyProfileDto>>;
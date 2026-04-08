namespace Application.Features.TransportProvider.Revenue.Queries;

using Application.Features.TransportProvider.Revenue.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;

public sealed record GetRevenueSummaryQuery(
    Guid CurrentUserId,
    int Year,
    int? Quarter
) : IQuery<ErrorOr<RevenueSummaryDto>>;
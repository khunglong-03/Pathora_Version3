namespace Application.Features.Admin.Queries.GetTransportProviders;

using Application.Common.Interfaces;
using Application.Features.Admin.DTOs;
using Application.Features.Admin.Queries.GetTransportProviders;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using MediatR;
using System.Text.Json.Serialization;
using global::Contracts;



public sealed record GetTransportProvidersQuery(
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("search")] string? Search = null,
    [property: JsonPropertyName("status")] string? Status = null,
    [property: JsonPropertyName("continent")] Continent? Continent = null,
    [property: JsonPropertyName("continents")] List<Continent>? Continents = null)
    : IQuery<ErrorOr<PaginatedList<TransportProviderListItemDto>>>;


public sealed class GetTransportProvidersQueryHandler(
    IVehicleRepository vehicleRepository,
    IUserRepository userRepository,
    ISupplierRepository supplierRepository)
    : IRequestHandler<GetTransportProvidersQuery, ErrorOr<PaginatedList<TransportProviderListItemDto>>>
{
    private const int TransportProviderRoleId = (int)AssignedRole.TransportProvider;

    public async Task<ErrorOr<PaginatedList<TransportProviderListItemDto>>> Handle(
        GetTransportProvidersQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var requestedContinentStrings = request.Continents?.Count > 0
            ? request.Continents.Select(c => c.ToString()).Distinct().ToList()
            : request.Continent.HasValue
                ? [request.Continent.Value.ToString()]
                : null;

        var users = await userRepository.FindProvidersByRoleAsync(
            TransportProviderRoleId,
            request.Search,
            request.Status,
            requestedContinentStrings,
            pageNumber,
            pageSize,
            cancellationToken);

        var total = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId,
            request.Search,
            request.Status,
            requestedContinentStrings,
            cancellationToken);

        var userIds = users.Select(u => u.Id).ToList();

        // Fetch vehicle data, supplier address data, and pending count sequentially
        // Note: Cannot run in parallel as all repositories share the same DbContext instance (scoped)
        var vehicleData = await vehicleRepository.GetVehicleDataGroupedByOwnerAsync(userIds, cancellationToken);
        var supplierAddressData = await supplierRepository.GetTransportSupplierAddressByOwnerAsync(userIds, cancellationToken);
        var pendingCount = await userRepository.CountProvidersByRoleAsync(
            TransportProviderRoleId, request.Search, "Pending", requestedContinentStrings, cancellationToken);

        var items = users.Select(user =>
        {
            var hasData = vehicleData.TryGetValue(user.Id, out var data);
            supplierAddressData.TryGetValue(user.Id, out var addressInfo);
            var primaryContinent = addressInfo.PrimaryContinent;

            var continents = hasData && data.Continents.Count > 0
                ? data.Continents.Select(c => c.ToString()).ToList()
                : primaryContinent.HasValue ? [primaryContinent.Value.ToString()] : [];

            return new TransportProviderListItemDto(
                user.Id,
                user.FullName ?? string.Empty,
                user.Email,
                user.PhoneNumber,
                user.AvatarUrl,
                user.Status,
                hasData ? data.Count : 0,
                continents,
                primaryContinent?.ToString(),
                addressInfo.Address,
                0);
        }).ToList();

        return new PaginatedList<TransportProviderListItemDto>(total, items, pageNumber, pageSize, null, pendingCount);
    }
}


public sealed class GetTransportProvidersQueryValidator : AbstractValidator<GetTransportProvidersQuery>
{
    public GetTransportProvidersQueryValidator()
    {
        // No required fields for this query
    }
}
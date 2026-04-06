namespace Application.Features.Admin.Queries.GetTransportProviders;

using Application.Common.Interfaces;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using global::Contracts;
using MediatR;

public sealed class GetTransportProvidersQueryHandler(
        ISupplierRepository supplierRepository,
        IUserRepository userRepository)
    : IRequestHandler<GetTransportProvidersQuery, ErrorOr<PaginatedList<TransportProviderListItemDto>>>
{
    public async Task<ErrorOr<PaginatedList<TransportProviderListItemDto>>> Handle(
        GetTransportProvidersQuery request,
        CancellationToken cancellationToken)
    {
        var suppliers = await supplierRepository.FindAllTransportProvidersAsync(cancellationToken);
        var total = suppliers.Count;

        var allItems = new List<TransportProviderListItemDto>();
        foreach (var supplier in suppliers)
        {
            var user = await userRepository.FindById(supplier.Id);
            allItems.Add(new TransportProviderListItemDto(
                supplier.Id,
                supplier.Name,
                supplier.Email ?? string.Empty,
                supplier.Phone,
                user?.AvatarUrl,
                user?.Status ?? UserStatus.Inactive,
                0));
        }

        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;
        var skip = (pageNumber - 1) * pageSize;
        var pagedItems = allItems.Skip(skip).Take(pageSize).ToList();

        return new PaginatedList<TransportProviderListItemDto>(
            total, pagedItems, pageNumber, pageSize);
    }
}
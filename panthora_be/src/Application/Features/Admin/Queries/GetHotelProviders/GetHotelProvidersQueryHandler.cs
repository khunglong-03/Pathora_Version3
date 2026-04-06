namespace Application.Features.Admin.Queries.GetHotelProviders;

using Application.Common.Interfaces;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using global::Contracts;
using MediatR;

public sealed class GetHotelProvidersQueryHandler(
        ISupplierRepository supplierRepository,
        IUserRepository userRepository)
    : IRequestHandler<GetHotelProvidersQuery, ErrorOr<PaginatedList<HotelProviderListItemDto>>>
{
    public async Task<ErrorOr<PaginatedList<HotelProviderListItemDto>>> Handle(
        GetHotelProvidersQuery request,
        CancellationToken cancellationToken)
    {
        var suppliers = await supplierRepository.FindAllHotelProvidersAsync(cancellationToken);
        var total = suppliers.Count;

        var allItems = new List<HotelProviderListItemDto>();
        foreach (var supplier in suppliers)
        {
            var user = await userRepository.FindById(supplier.Id);
            allItems.Add(new HotelProviderListItemDto(
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

        return new PaginatedList<HotelProviderListItemDto>(
            total, pagedItems, pageNumber, pageSize);
    }
}
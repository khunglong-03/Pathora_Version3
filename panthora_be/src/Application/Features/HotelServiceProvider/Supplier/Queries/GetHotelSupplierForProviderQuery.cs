using Application.Common.Constant;
using Application.Features.HotelServiceProvider.Supplier.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using global::Contracts.Interfaces;

namespace Application.Features.HotelServiceProvider.Supplier.Queries;
public sealed record GetHotelSupplierForProviderQuery : IQuery<ErrorOr<List<HotelSupplierListItemDto>>>;


public sealed class GetHotelSupplierForProviderQueryHandler(
    ISupplierRepository supplierRepository,
    IUser user)
    : IQueryHandler<GetHotelSupplierForProviderQuery, ErrorOr<List<HotelSupplierListItemDto>>>
{
    public async Task<ErrorOr<List<HotelSupplierListItemDto>>> Handle(
        GetHotelSupplierForProviderQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = user.Id;
        if (currentUserId is null)
            return Error.Unauthorized();

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(Guid.Parse(currentUserId), cancellationToken);
        return suppliers
            .Where(supplier => supplier.SupplierType == SupplierType.Accommodation)
            .Select(supplier => new HotelSupplierListItemDto(
                supplier.Id,
                supplier.SupplierCode,
                supplier.Name,
                supplier.Phone,
                supplier.Email,
                supplier.Address,
                supplier.Note))
            .ToList();
    }
}

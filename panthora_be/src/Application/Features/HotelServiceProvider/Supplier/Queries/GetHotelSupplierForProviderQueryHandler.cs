namespace Application.Features.HotelServiceProvider.Supplier.Queries;

using Application.Common.Constant;
using Application.Features.HotelServiceProvider.Supplier.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed class GetHotelSupplierForProviderQueryHandler(
    ISupplierRepository supplierRepository,
    IUser user)
    : IQueryHandler<GetHotelSupplierForProviderQuery, ErrorOr<HotelSupplierInfoDto>>
{
    public async Task<ErrorOr<HotelSupplierInfoDto>> Handle(
        GetHotelSupplierForProviderQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = user.Id;
        if (currentUserId is null)
            return Error.Unauthorized();

        var supplier = await supplierRepository.FindByOwnerUserIdAsync(Guid.Parse(currentUserId), cancellationToken);
        if (supplier is null)
            return Error.NotFound(
                ErrorConstants.Supplier.NotFoundCode,
                "No accommodation supplier found for your account.");

        if (supplier.SupplierType != SupplierType.Accommodation)
            return Error.Forbidden("You do not have an accommodation supplier.");

        return new HotelSupplierInfoDto(
            supplier.Id,
            supplier.SupplierCode,
            supplier.Name,
            supplier.Phone,
            supplier.Email,
            supplier.Address,
            supplier.Note);
    }
}

namespace Application.Features.HotelServiceProvider.Accommodations.Commands;

using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed class DeleteAccommodationCommandHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    ISupplierRepository supplierRepository,
    IUser user,
    IUnitOfWork unitOfWork)
    : ICommandHandler<DeleteAccommodationCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        DeleteAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = user.Id;
        if (currentUserId is null)
            return Error.Unauthorized();

        var supplier = await supplierRepository.FindByOwnerUserIdAsync(Guid.Parse(currentUserId));
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "No accommodation supplier found for your account.");

        var entity = await inventoryRepository.FindByIdAsync(request.Id);
        if (entity is null || entity.SupplierId != supplier.Id)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Accommodation not found.");

        inventoryRepository.Remove(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

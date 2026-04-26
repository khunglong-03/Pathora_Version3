using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using global::Contracts.Interfaces;

namespace Application.Features.HotelServiceProvider.Accommodations.Commands;

public sealed record DeleteAccommodationCommand(Guid Id) : ICommand<ErrorOr<Success>>;


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

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(Guid.Parse(currentUserId), cancellationToken);
        var supplier = suppliers.FirstOrDefault();
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.AccommodationNotFoundCode, ErrorConstants.Supplier.AccommodationNotFoundDescription.En);

        var entity = await inventoryRepository.FindByIdAsync(request.Id);
        if (entity is null || entity.SupplierId != supplier.Id)
            return Error.NotFound(ErrorConstants.Accommodation.NotFoundCode, ErrorConstants.Accommodation.NotFoundDescription.En);

        inventoryRepository.Remove(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

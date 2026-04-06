namespace Application.Features.HotelRoomInventory.Commands.DeleteHotelRoomInventory;

using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;

public sealed class DeleteHotelRoomInventoryCommandHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<DeleteHotelRoomInventoryCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        DeleteHotelRoomInventoryCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await inventoryRepository.FindByIdAsync(request.Id);
        if (entity is null)
        {
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);
        }

        inventoryRepository.Remove(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
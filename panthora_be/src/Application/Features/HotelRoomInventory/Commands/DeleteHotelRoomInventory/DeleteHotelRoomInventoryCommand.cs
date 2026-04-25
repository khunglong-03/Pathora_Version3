using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.HotelRoomInventory.Commands.DeleteHotelRoomInventory;
public sealed record DeleteHotelRoomInventoryCommand([property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>;

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

public sealed class DeleteHotelRoomInventoryCommandValidator : AbstractValidator<DeleteHotelRoomInventoryCommand>
{
    public DeleteHotelRoomInventoryCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);
    }
}
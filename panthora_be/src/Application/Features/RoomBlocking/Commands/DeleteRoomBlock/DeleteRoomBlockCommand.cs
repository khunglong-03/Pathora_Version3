namespace Application.Features.RoomBlocking.Commands.DeleteRoomBlock;

using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using IRoomBlockRepository = Domain.Common.Repositories.IRoomBlockRepository;
using System.Text.Json.Serialization;



public sealed record DeleteRoomBlockCommand([property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>;


public sealed class DeleteRoomBlockCommandHandler(
    IRoomBlockRepository roomBlockRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<DeleteRoomBlockCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        DeleteRoomBlockCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await roomBlockRepository.FindByIdAsync(request.Id);
        if (entity is null)
        {
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);
        }

        roomBlockRepository.Remove(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}


public sealed class DeleteRoomBlockCommandValidator : AbstractValidator<DeleteRoomBlockCommand>
{
    public DeleteRoomBlockCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);
    }
}

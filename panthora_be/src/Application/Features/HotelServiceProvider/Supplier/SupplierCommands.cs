namespace Application.Features.HotelServiceProvider.Supplier;

using Application.Common.Constant;
using Application.Features.HotelServiceProvider.Supplier.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using global::Contracts.Interfaces;

public sealed record UpdateSupplierInfoCommand(
    UpdateSupplierInfoRequestDto Request
) : ICommand<ErrorOr<HotelSupplierInfoDto>>;

public sealed class UpdateSupplierInfoCommandValidator : AbstractValidator<UpdateSupplierInfoCommand>
{
    public UpdateSupplierInfoCommandValidator()
    {
        RuleFor(x => x.Request.Name)
            .NotEmpty()
            .MaximumLength(200);
    }
}

public sealed class UpdateSupplierInfoCommandHandler(
    ISupplierRepository supplierRepository,
    IUser user,
    IUnitOfWork unitOfWork)
    : ICommandHandler<UpdateSupplierInfoCommand, ErrorOr<HotelSupplierInfoDto>>
{
    public async Task<ErrorOr<HotelSupplierInfoDto>> Handle(
        UpdateSupplierInfoCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = user.Id;
        if (currentUserId is null)
            return Error.Unauthorized();

        var supplier = await supplierRepository.FindByOwnerUserIdAsync(Guid.Parse(currentUserId));
        if (supplier is null)
            return Error.NotFound(
                ErrorConstants.Supplier.NotFoundCode,
                "No accommodation supplier found for your account.");

        if (supplier.SupplierType != SupplierType.Accommodation)
            return Error.Forbidden("You do not have an accommodation supplier.");

        supplier.Update(
            supplierCode: supplier.SupplierCode,
            supplierType: supplier.SupplierType,
            name: request.Request.Name,
            performedBy: currentUserId,
            phone: request.Request.Phone,
            email: request.Request.Email,
            address: request.Request.Address,
            note: request.Request.Notes,
            continent: supplier.Continent);

        supplierRepository.Update(supplier);
        await unitOfWork.SaveChangeAsync(cancellationToken);

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

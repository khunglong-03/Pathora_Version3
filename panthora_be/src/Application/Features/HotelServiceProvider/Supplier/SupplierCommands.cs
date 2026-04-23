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

public sealed record CreateSupplierInfoCommand(
    CreateSupplierInfoRequestDto Request
) : ICommand<ErrorOr<HotelSupplierInfoDto>>;

public sealed class CreateSupplierInfoCommandValidator : AbstractValidator<CreateSupplierInfoCommand>
{
    public CreateSupplierInfoCommandValidator()
    {
        RuleFor(x => x.Request.Name)
            .NotEmpty()
            .MaximumLength(200);
    }
}

public sealed class CreateSupplierInfoCommandHandler(
    ISupplierRepository supplierRepository,
    IUser user,
    IUnitOfWork unitOfWork)
    : ICommandHandler<CreateSupplierInfoCommand, ErrorOr<HotelSupplierInfoDto>>
{
    public async Task<ErrorOr<HotelSupplierInfoDto>> Handle(
        CreateSupplierInfoCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = user.Id;
        if (currentUserId is null)
            return Error.Unauthorized();

        var ownerUserId = Guid.Parse(currentUserId);
        var supplierCode = await GenerateUniqueSupplierCodeAsync(supplierRepository, cancellationToken);

        var supplier = Domain.Entities.SupplierEntity.Create(
            supplierCode,
            SupplierType.Accommodation,
            request.Request.Name,
            performedBy: currentUserId,
            phone: request.Request.Phone,
            email: request.Request.Email,
            address: request.Request.Address,
            note: request.Request.Notes,
            ownerUserId: ownerUserId);

        await supplierRepository.AddAsync(supplier, cancellationToken);
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

    private static async Task<string> GenerateUniqueSupplierCodeAsync(
        ISupplierRepository supplierRepository,
        CancellationToken cancellationToken)
    {
        while (true)
        {
            var candidate = $"HOTEL-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
            var existing = await supplierRepository.GetByCodeAsync(candidate, cancellationToken);
            if (existing is null)
                return candidate;
        }
    }
}

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

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(Guid.Parse(currentUserId), cancellationToken);
        var supplier = request.Request.SupplierId.HasValue
            ? suppliers.FirstOrDefault(s => s.Id == request.Request.SupplierId.Value)
            : suppliers.FirstOrDefault();

        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.AccommodationNotFoundCode, ErrorConstants.Supplier.AccommodationNotFoundDescription.En);

        if (supplier.SupplierType != SupplierType.Accommodation)
            return Error.Forbidden(ErrorConstants.Supplier.NotAccommodationSupplierCode, ErrorConstants.Supplier.NotAccommodationSupplierDescription.En);

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

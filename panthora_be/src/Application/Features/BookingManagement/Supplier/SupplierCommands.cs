using Application.Common;
using Application.Common.Constant;
using Application.Contracts.Booking;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;

namespace Application.Features.BookingManagement.Supplier;

public sealed record CreateSupplierCommand(
    string SupplierCode,
    SupplierType SupplierType,
    string Name,
    string? TaxCode,
    string? Phone,
    string? Email,
    string? Address,
    string? Note) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Supplier];
}

public sealed class CreateSupplierCommandValidator : AbstractValidator<CreateSupplierCommand>
{
    public CreateSupplierCommandValidator()
    {
        RuleFor(x => x.SupplierCode)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);
    }
}

public sealed class CreateSupplierCommandHandler(
    ISupplierRepository supplierRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreateSupplierCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateSupplierCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var existing = await supplierRepository.GetByCodeAsync(request.SupplierCode);
        if (existing is not null)
        {
            return Error.Conflict(
                ErrorConstants.Supplier.CodeExistsCode,
                ErrorConstants.Supplier.CodeExistsDescription.Resolve(lang));
        }

        var entity = SupplierEntity.Create(
            request.SupplierCode,
            request.SupplierType,
            request.Name,
            performedBy: "system",
            request.TaxCode,
            request.Phone,
            request.Email,
            request.Address,
            request.Note);

        await supplierRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record UpdateSupplierCommand(
    Guid SupplierId,
    string SupplierCode,
    SupplierType SupplierType,
    string Name,
    string? TaxCode,
    string? Phone,
    string? Email,
    string? Address,
    string? Note,
    bool IsActive) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Supplier];
}

public sealed class UpdateSupplierCommandValidator : AbstractValidator<UpdateSupplierCommand>
{
    public UpdateSupplierCommandValidator()
    {
        RuleFor(x => x.SupplierId)
            .NotEmpty();

        RuleFor(x => x.SupplierCode)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);
    }
}

public sealed class UpdateSupplierCommandHandler(
    ISupplierRepository supplierRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateSupplierCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateSupplierCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var entity = await supplierRepository.GetByIdAsync(request.SupplierId);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.Supplier.NotFoundCode,
                ErrorConstants.Supplier.NotFoundDescription.Resolve(lang));
        }

        var existing = await supplierRepository.GetByCodeAsync(request.SupplierCode);
        if (existing is not null && existing.Id != request.SupplierId)
        {
            return Error.Conflict(
                ErrorConstants.Supplier.CodeExistsCode,
                ErrorConstants.Supplier.CodeExistsDescription.Resolve(lang));
        }

        entity.Update(
            request.SupplierCode,
            request.SupplierType,
            request.Name,
            performedBy: "system",
            request.TaxCode,
            request.Phone,
            request.Email,
            request.Address,
            request.Note,
            request.IsActive);

        supplierRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record DeleteSupplierCommand(Guid SupplierId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Supplier];
}

public sealed class DeleteSupplierCommandHandler(
    ISupplierRepository supplierRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<DeleteSupplierCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteSupplierCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var entity = await supplierRepository.GetByIdAsync(request.SupplierId);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.Supplier.NotFoundCode,
                ErrorConstants.Supplier.NotFoundDescription.Resolve(lang));
        }

        entity.SoftDelete("system");
        supplierRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

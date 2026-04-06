using Application.Common;
using Application.Common.Constant;
using Application.Contracts.Booking;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.BookingManagement.Supplier;

public sealed record GetSupplierByIdQuery(Guid SupplierId) : IQuery<ErrorOr<SupplierDto>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Supplier}:detail:{SupplierId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetSupplierByIdQueryHandler(
    ISupplierRepository supplierRepository,
    ILanguageContext? languageContext = null)
    : IQueryHandler<GetSupplierByIdQuery, ErrorOr<SupplierDto>>
{
    public async Task<ErrorOr<SupplierDto>> Handle(GetSupplierByIdQuery request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var entity = await supplierRepository.GetByIdAsync(request.SupplierId);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.Supplier.NotFoundCode,
                ErrorConstants.Supplier.NotFoundDescription.Resolve(lang));
        }

        return ToDto(entity);
    }

    private static SupplierDto ToDto(SupplierEntity entity)
    {
        return new SupplierDto(
            entity.Id,
            entity.SupplierCode,
            entity.SupplierType,
            entity.Name,
            entity.TaxCode,
            entity.Phone,
            entity.Email,
            entity.Address,
            entity.Note,
            entity.IsActive);
    }
}

public sealed record GetSuppliersQuery(SupplierType? SupplierType = null) : IQuery<ErrorOr<List<SupplierDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Supplier}:list:{SupplierType}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetSuppliersQueryHandler(ISupplierRepository supplierRepository)
    : IQueryHandler<GetSuppliersQuery, ErrorOr<List<SupplierDto>>>
{
    public async Task<ErrorOr<List<SupplierDto>>> Handle(GetSuppliersQuery request, CancellationToken cancellationToken)
    {
        var suppliers = await supplierRepository.GetListAsync(
            request.SupplierType.HasValue ? s => s.SupplierType == request.SupplierType.Value : null);

        return suppliers
            .Select(s => new SupplierDto(
                s.Id,
                s.SupplierCode,
                s.SupplierType,
                s.Name,
                s.TaxCode,
                s.Phone,
                s.Email,
                s.Address,
                s.Note,
                s.IsActive))
            .ToList();
    }
}

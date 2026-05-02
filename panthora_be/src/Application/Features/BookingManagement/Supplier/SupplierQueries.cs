using Application.Common.Constant;
using Application.Common;
using Application.Contracts.Booking;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.BookingManagement.Supplier;

public sealed record GetSupplierByIdQuery([property: JsonPropertyName("supplierId")] Guid SupplierId) : IQuery<ErrorOr<SupplierDto>>, ICacheable
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
            entity.Phone,
            entity.Email,
            entity.Address,
            entity.Note,
            entity.IsActive);
    }
}

public sealed record GetSuppliersQuery(
    [property: JsonPropertyName("supplierType")] SupplierType? SupplierType = null,
    [property: JsonPropertyName("continent")] Continent? Continent = null) : IQuery<ErrorOr<List<SupplierDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Supplier}:list:{SupplierType}:{Continent}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetSuppliersQueryHandler(ISupplierRepository supplierRepository)
    : IQueryHandler<GetSuppliersQuery, ErrorOr<List<SupplierDto>>>
{
    public async Task<ErrorOr<List<SupplierDto>>> Handle(GetSuppliersQuery request, CancellationToken cancellationToken)
    {
        var suppliers = await supplierRepository.GetListAsync(
            s => (!request.SupplierType.HasValue || s.SupplierType == request.SupplierType.Value) &&
                 (!request.Continent.HasValue || s.Continent == request.Continent.Value));

        return suppliers
            .Select(s => new SupplierDto(
                s.Id,
                s.SupplierCode,
                s.SupplierType,
                s.Name,
                s.Phone,
                s.Email,
                s.Address,
                s.Note,
                s.IsActive))
            .ToList();
    }
}


namespace Application.Features.HotelServiceProvider.Supplier.DTOs;

public sealed record HotelSupplierListItemDto(
    Guid Id,
    string SupplierCode,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? Notes);

public sealed record HotelSupplierInfoDto(
    Guid Id,
    string SupplierCode,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? Notes);

public sealed record CreateSupplierInfoRequestDto(
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? Notes);

public sealed record UpdateSupplierInfoRequestDto(
    Guid? SupplierId,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? Notes);

namespace Application.Features.HotelServiceProvider.Supplier.DTOs;

public sealed record HotelSupplierInfoDto(
    Guid Id,
    string SupplierCode,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? Notes);

public sealed record UpdateSupplierInfoRequestDto(
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? Notes);

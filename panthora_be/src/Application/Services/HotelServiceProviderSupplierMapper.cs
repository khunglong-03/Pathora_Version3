namespace Application.Services;

using Domain.Entities;
using Domain.Enums;
using Domain.Common.Repositories;
using Domain.UnitOfWork;

public sealed class HotelServiceProviderSupplierMapper
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUnitOfWork _unitOfWork;

    public HotelServiceProviderSupplierMapper(
        ISupplierRepository supplierRepository,
        IUnitOfWork unitOfWork)
    {
        _supplierRepository = supplierRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<SupplierEntity> MapAndCreateAsync(UserEntity user, string performedBy)
    {
        var supplierCode = $"KS-{user.Id.ToString()[..8].ToUpperInvariant()}";
        var name = string.IsNullOrWhiteSpace(user.FullName) ? user.Email : user.FullName;

        var supplier = SupplierEntity.Create(
            supplierCode: supplierCode,
            supplierType: SupplierType.Accommodation,
            name: name,
            performedBy: performedBy,
            ownerUserId: user.Id);

        await _supplierRepository.AddAsync(supplier);
        await _unitOfWork.SaveChangeAsync();

        return supplier;
    }
}

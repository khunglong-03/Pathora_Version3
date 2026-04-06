using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IDriverRepository : IRepository<DriverEntity>
{
    Task<List<DriverEntity>> FindAllByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<DriverEntity>> FindActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<DriverEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DriverEntity?> FindByIdAndUserIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByLicenseNumberAsync(string licenseNumber, CancellationToken cancellationToken = default);
    Task<bool> ExistsByLicenseNumberAndUserIdAsync(string licenseNumber, Guid userId, CancellationToken cancellationToken = default);
    Task CreateAsync(DriverEntity driver, CancellationToken cancellationToken = default);
    Task UpdateAsync(DriverEntity driver, CancellationToken cancellationToken = default);
    Task DeactivateAsync(Guid id, string performedBy, CancellationToken cancellationToken = default);
    Task<List<DriverEntity>> FindByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
}

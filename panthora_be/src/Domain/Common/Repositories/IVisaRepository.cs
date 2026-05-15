using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IVisaRepository : IRepository<VisaEntity>
{
    Task<VisaEntity?> GetByVisaApplicationIdAsync(Guid visaApplicationId, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, VisaEntity>> GetByVisaApplicationIdsAsync(IEnumerable<Guid> visaApplicationIds, CancellationToken cancellationToken = default);
}

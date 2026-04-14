using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IInsuranceRepository : IRepository<TourInsuranceEntity>
{
    Task<IReadOnlyList<TourInsuranceEntity>> GetByClassificationIdAsync(Guid classificationId, CancellationToken cancellationToken = default);
}

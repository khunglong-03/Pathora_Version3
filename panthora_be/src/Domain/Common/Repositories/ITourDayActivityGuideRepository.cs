using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ITourDayActivityGuideRepository : IRepository<TourDayActivityGuideEntity>
{
    Task<IReadOnlyList<TourDayActivityGuideEntity>> GetByActivityStatusIdAsync(Guid tourDayActivityStatusId);
    Task<IReadOnlyList<TourDayActivityGuideEntity>> GetByUserIdAsync(Guid userId);
}

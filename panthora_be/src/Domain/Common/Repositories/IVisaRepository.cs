using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IVisaRepository : IRepository<VisaEntity>
{
    Task<VisaEntity?> GetByVisaApplicationIdAsync(Guid visaApplicationId);
}

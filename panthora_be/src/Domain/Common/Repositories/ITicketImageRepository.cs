using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ITicketImageRepository : IRepository<TicketImageEntity>
{
    Task<TicketImageEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<List<TicketImageEntity>> FindByActivityAsync(Guid tourInstanceDayActivityId, CancellationToken cancellationToken = default);
}

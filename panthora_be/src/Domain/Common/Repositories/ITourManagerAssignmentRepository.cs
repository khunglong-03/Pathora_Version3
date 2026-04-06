using Domain.Entities;
using Contracts.ModelResponse;

namespace Domain.Common.Repositories;

public interface ITourManagerAssignmentRepository
{
    Task<List<TourManagerAssignmentEntity>> GetAllSummariesAsync(CancellationToken cancellationToken);
    Task<List<TourManagerAssignmentEntity>> GetByManagerIdAsync(Guid managerId, CancellationToken cancellationToken);
    Task AssignAsync(TourManagerAssignmentEntity assignment, CancellationToken cancellationToken);
    Task BulkUpsertAsync(Guid managerId, List<TourManagerAssignmentEntity> assignments, string performedBy, CancellationToken cancellationToken);
    Task RemoveAsync(Guid managerId, Guid? assignedUserId, Guid? assignedTourId, AssignedEntityType entityType, CancellationToken cancellationToken);
    Task RemoveByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<int> CountPendingTourRequestsAsync(CancellationToken cancellationToken);
    Task<List<ActivityItemDto>> GetRecentActivityAsync(int limit, CancellationToken cancellationToken);
}

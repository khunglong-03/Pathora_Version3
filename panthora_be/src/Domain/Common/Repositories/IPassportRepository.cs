using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IPassportRepository : IRepository<PassportEntity>
{
    Task<PassportEntity?> GetByBookingParticipantIdAsync(Guid bookingParticipantId, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, PassportEntity>> GetByBookingParticipantIdsAsync(IEnumerable<Guid> bookingParticipantIds, CancellationToken cancellationToken = default);
}

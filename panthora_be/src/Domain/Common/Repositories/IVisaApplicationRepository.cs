using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IVisaApplicationRepository : IRepository<VisaApplicationEntity>
{
    Task<IReadOnlyList<VisaApplicationEntity>> GetByBookingParticipantIdAsync(Guid bookingParticipantId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VisaApplicationEntity>> GetByBookingParticipantIdsAsync(IEnumerable<Guid> bookingParticipantIds, CancellationToken cancellationToken = default);
    Task<VisaApplicationEntity?> GetByIdWithGraphAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VisaApplicationEntity?> GetByServiceFeeTransactionIdAsync(Guid transactionId, CancellationToken cancellationToken = default);
    Task<VisaApplicationEntity?> GetByIdWithVisaAsync(Guid id, CancellationToken cancellationToken = default);
}

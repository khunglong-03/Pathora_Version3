using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IVisaApplicationRepository : IRepository<VisaApplicationEntity>
{
    Task<IReadOnlyList<VisaApplicationEntity>> GetByBookingParticipantIdAsync(Guid bookingParticipantId);
}

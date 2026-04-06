using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IPassportRepository : IRepository<PassportEntity>
{
    Task<PassportEntity?> GetByBookingParticipantIdAsync(Guid bookingParticipantId);
}

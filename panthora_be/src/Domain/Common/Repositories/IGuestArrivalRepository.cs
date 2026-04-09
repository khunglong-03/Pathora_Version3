namespace Domain.Common.Repositories;

using Domain.Entities;

public interface IGuestArrivalRepository
{
    Task<GuestArrivalEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<GuestArrivalEntity?> FindByAccommodationDetailIdAsync(Guid bookingAccommodationDetailId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GuestArrivalEntity>> GetByHotelAsync(Guid supplierId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GuestArrivalEntity>> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
    Task AddAsync(GuestArrivalEntity entity, CancellationToken cancellationToken = default);
    void Update(GuestArrivalEntity entity);
    Task AddParticipantAsync(GuestArrivalParticipantEntity entity, CancellationToken cancellationToken = default);
}

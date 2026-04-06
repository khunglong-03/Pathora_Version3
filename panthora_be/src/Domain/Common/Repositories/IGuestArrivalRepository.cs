namespace Domain.Common.Repositories;

using Domain.Entities;

public interface IGuestArrivalRepository
{
    Task<GuestArrivalEntity?> FindByIdAsync(Guid id);
    Task<GuestArrivalEntity?> FindByAccommodationDetailIdAsync(Guid bookingAccommodationDetailId);
    Task<IReadOnlyList<GuestArrivalEntity>> GetByHotelAsync(Guid supplierId);
    Task<IReadOnlyList<GuestArrivalEntity>> GetByBookingIdAsync(Guid bookingId);
    Task AddAsync(GuestArrivalEntity entity);
    void Update(GuestArrivalEntity entity);
    Task AddParticipantAsync(GuestArrivalParticipantEntity entity);
}

using Domain.Entities;

namespace Application.Services;

public interface IBookingPaidAmountResolver
{
    Task<decimal> ResolveAsync(BookingEntity booking, CancellationToken ct = default);
}

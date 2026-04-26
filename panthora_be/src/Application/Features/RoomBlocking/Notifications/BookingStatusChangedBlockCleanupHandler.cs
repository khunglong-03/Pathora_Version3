using Domain.Common.Repositories;
using Domain.Enums;
using Domain.Events;
using Domain.UnitOfWork;
using MediatR;

namespace Application.Features.RoomBlocking.Notifications;

public sealed class BookingStatusChangedBlockCleanupHandler(
    IRoomBlockRepository roomBlockRepository,
    IBookingRepository bookingRepository,
    IUnitOfWork unitOfWork)
    : INotificationHandler<BookingStatusChangedEvent>
{
    public async Task Handle(BookingStatusChangedEvent notification, CancellationToken cancellationToken)
    {
        if (notification.NewStatus != BookingStatus.Completed && notification.NewStatus != BookingStatus.Cancelled)
            return;

        var booking = await bookingRepository.GetByIdWithDetailsAsync(notification.BookingId);
        if (booking is null)
            return;

        foreach (var activity in booking.BookingActivityReservations)
        {
            foreach (var detail in activity.AccommodationDetails)
            {
                await roomBlockRepository.DeleteByBookingAccommodationDetailIdAsync(detail.Id);
            }
        }

        await unitOfWork.SaveChangeAsync(cancellationToken);
    }
}

using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.BookingManagement.Common;

public static class BookingCapacityValidation
{
    public static int CountActiveParticipants(IEnumerable<BookingParticipantEntity> participants)
    {
        return participants.Count(x => x.Status != ReservationStatus.Cancelled);
    }

    public static int CalculateRoomCapacity(RoomType roomType, int roomCount)
    {
        var capacityPerRoom = roomType switch
        {
            RoomType.Single => 1,
            RoomType.Double => 2,
            RoomType.Twin => 2,
            RoomType.Triple => 3,
            RoomType.Suite => 4,
            RoomType.Dormitory => 6,
            _ => 1
        };

        return roomCount * capacityPerRoom;
    }

    public static async Task<(int? SeatCapacityLimit, int? RoomCapacityLimit)> GetBookingCapacityLimitsAsync(
        Guid bookingId,
        IBookingActivityReservationRepository bookingActivityReservationRepository,
        IBookingTransportDetailRepository bookingTransportDetailRepository,
        IBookingAccommodationDetailRepository bookingAccommodationDetailRepository)
    {
        var activities = await bookingActivityReservationRepository.GetByBookingIdAsync(bookingId);
        var seatCapacities = new List<int>();
        var roomCapacities = new List<int>();

        foreach (var activity in activities)
        {
            var transportDetails = await bookingTransportDetailRepository.GetByBookingActivityReservationIdAsync(activity.Id);
            seatCapacities.AddRange(transportDetails
                .Where(x => x.Status != ReservationStatus.Cancelled && x.SeatCapacity > 0)
                .Select(x => x.SeatCapacity));

            var accommodationDetails = await bookingAccommodationDetailRepository.GetByBookingActivityReservationIdAsync(activity.Id);
            roomCapacities.AddRange(accommodationDetails
                .Where(x => x.Status != ReservationStatus.Cancelled && x.RoomCount > 0)
                .Select(x => CalculateRoomCapacity(x.RoomType, x.RoomCount)));
        }

        var seatCapacityLimit = seatCapacities.Count > 0 ? seatCapacities.Min() : (int?)null;
        var roomCapacityLimit = roomCapacities.Count > 0 ? roomCapacities.Min() : (int?)null;

        return (seatCapacityLimit, roomCapacityLimit);
    }
}

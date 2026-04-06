using System.ComponentModel;

namespace Domain.Enums;

public enum BookingType
{
    [Description("Tour Booking")]
    TourBooking = 1,
    [Description("Instance Join")]
    InstanceJoin = 2
}

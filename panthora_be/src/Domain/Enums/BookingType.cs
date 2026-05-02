using System.ComponentModel;

namespace Domain.Enums;

public enum BookingType
{
    [Description("Tour Booking")]
    TourBooking = 1,
    [Description("Instance Join")]
    InstanceJoin = 2,

    /// <summary>OpenSpec private-custom-tour: public request that spawned a private Draft instance.</summary>
    [Description("Private Custom Tour Request")]
    PrivateCustomTourRequest = 3
}

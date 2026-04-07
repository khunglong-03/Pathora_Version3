using System.ComponentModel;

namespace Domain.Enums;

public enum AssignedRole
{
    [Description("TourManager")]
    TourManager = 2,

    [Description("TourDesigner")]
    TourDesigner = 3,

    [Description("TourGuide")]
    TourGuide = 4,

    [Description("TransportProvider")]
    TransportProvider = 6,

    [Description("HotelServiceProvider")]
    HotelServiceProvider = 7
}